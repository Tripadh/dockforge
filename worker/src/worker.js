const { exec } = require('child_process');
const { promisify } = require('util');

const { createPool, query, closePool } = require('./config/db');
const { connectRedis, getRedisClient, disconnectRedis } = require('./config/redis');

require('dotenv').config();

const execAsync = promisify(exec);

// ============================================================================
// CONFIGURATION
// ============================================================================

const EXECUTION_TIMEOUT = parseInt(process.env.EXECUTION_TIMEOUT) || 10000;
const REDIS_QUEUE = 'execution_queue';
const RECOVERY_INTERVAL_MS = 60000; // 60 seconds
const STUCK_JOB_THRESHOLD_MINUTES = 5;

// ============================================================================
// LOGGING
// ============================================================================

const log = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, Object.keys(data).length ? data : ''),
  error: (msg, data = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, Object.keys(data).length ? data : ''),
  warn: (msg, data = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, Object.keys(data).length ? data : ''),
  debug: (msg, data = {}) => process.env.DEBUG && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, Object.keys(data).length ? data : '')
};

// ============================================================================
// RUNTIME CONFIGURATION
// ============================================================================

function getRuntimeConfig(language) {
  const runtimes = {
    python: {
      image: 'python:3.11-alpine',
      // Execute Python code via stdin using -c flag
      commandPrefix: 'python -c'
    },
    javascript: {
      image: 'node:20-alpine',
      // Execute Node.js code via stdin using -e flag
      commandPrefix: 'node -e'
    },
    node: {
      image: 'node:20-alpine',
      commandPrefix: 'node -e'
    }
  };

  const config = runtimes[language.toLowerCase()];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return config;
}

// ============================================================================
// JOB CLAIMING (ATOMIC)
// ============================================================================

async function claimJob(jobId) {
  const result = await query(
    `UPDATE executions 
     SET status = 'running', started_at = NOW() 
     WHERE id = UUID_TO_BIN(?) AND status = 'pending'`,
    [jobId]
  );

  return result.affectedRows === 1;
}

// ============================================================================
// FETCH JOB DETAILS
// ============================================================================

async function fetchJobDetails(jobId) {
  const rows = await query(
    `SELECT BIN_TO_UUID(id) as id, code, language 
     FROM executions 
     WHERE id = UUID_TO_BIN(?)`,
    [jobId]
  );

  if (rows.length === 0) {
    throw new Error(`Job not found: ${jobId}`);
  }

  return rows[0];
}

// ============================================================================
// UPDATE JOB RESULT
// ============================================================================

async function updateJobSuccess(jobId, stdout, stderr, executionMs) {
  await query(
    `UPDATE executions 
     SET status = 'completed', 
         stdout = ?, 
         stderr = ?, 
         execution_ms = ?,
         finished_at = NOW() 
     WHERE id = UUID_TO_BIN(?)`,
    [stdout, stderr, executionMs, jobId]
  );
}

async function updateJobFailure(jobId, errorMessage, executionMs = null) {
  await query(
    `UPDATE executions 
     SET status = 'failed', 
         stderr = ?, 
         execution_ms = ?,
         finished_at = NOW() 
     WHERE id = UUID_TO_BIN(?)`,
    [errorMessage, executionMs, jobId]
  );
}

// ============================================================================
// CODE EXECUTION
// ============================================================================

async function executeCode(jobId, code, language) {
  const runtime = getRuntimeConfig(language);

  // Encode code as base64 to safely pass through shell
  const base64Code = Buffer.from(code).toString('base64');

  // Build docker command with hardened security options
  // Decode base64 inside container and execute
  let execCommand;
  if (language.toLowerCase() === 'python') {
    // Python: decode base64 and exec
    execCommand = `echo '${base64Code}' | base64 -d | python`;
  } else {
    // Node.js: decode base64 and pipe to node
    execCommand = `echo '${base64Code}' | base64 -d | node`;
  }

  const dockerArgs = [
    'docker run --rm -i',
    '--network none',
    '--memory 128m',
    '--cpus 0.5',
    '--pids-limit 64',
    '--security-opt no-new-privileges',
    '--cap-drop ALL',
    `--stop-timeout ${Math.ceil(EXECUTION_TIMEOUT / 1000)}`,
    runtime.image,
    'sh', '-c',
    `"${execCommand}"`
  ].join(' ');

  log.debug(`Executing docker command for job ${jobId}`);

  let stdout = '';
  let stderr = '';

  try {
    const result = await execAsync(dockerArgs, {
      timeout: EXECUTION_TIMEOUT,
      maxBuffer: 1024 * 1024 // 1MB
    });
    stdout = result.stdout || '';
    stderr = result.stderr || '';
  } catch (execError) {
    stdout = execError.stdout || '';
    stderr = execError.stderr || execError.message || 'Execution failed';

    // Check for timeout
    if (execError.killed || execError.signal === 'SIGTERM') {
      stderr = `Execution timed out after ${EXECUTION_TIMEOUT}ms`;
    }
  }

  return { stdout, stderr };
}

// ============================================================================
// PROCESS SINGLE JOB
// ============================================================================

async function processJob(jobId) {
  log.info(`Processing job: ${jobId}`);

  // Step 1: Atomically claim the job
  const claimed = await claimJob(jobId);
  if (!claimed) {
    log.warn(`Job already claimed or not pending: ${jobId}`);
    return;
  }

  log.info(`Job claimed: ${jobId}`);

  const startTime = Date.now();

  try {
    // Step 2: Fetch job details
    const job = await fetchJobDetails(jobId);
    log.debug(`Job details fetched`, { language: job.language });

    // Step 3: Execute code
    const { stdout, stderr } = await executeCode(jobId, job.code, job.language);

    // Step 4: Update success with execution time
    const executionMs = Date.now() - startTime;
    await updateJobSuccess(jobId, stdout, stderr, executionMs);
    log.info(`Job completed: ${jobId}`, { executionMs });

  } catch (error) {
    // Step 4b: Update failure with execution time
    const executionMs = Date.now() - startTime;
    log.error(`Job failed: ${jobId}`, { error: error.message, executionMs });
    await updateJobFailure(jobId, error.message, executionMs);
  }
}

// ============================================================================
// MAIN WORKER LOOP
// ============================================================================

async function workerLoop() {
  const redis = getRedisClient();
  log.info(`Worker listening on queue: ${REDIS_QUEUE}`);

  while (true) {
    try {
      // Block and wait for job from queue (timeout 0 = wait forever)
      const result = await redis.brPop(REDIS_QUEUE, 0);

      if (result) {
        const message = JSON.parse(result.element);
        const jobId = message.jobId || message.id;

        if (!jobId) {
          log.warn('Received message without jobId', { message });
          continue;
        }

        await processJob(jobId);
      }
    } catch (error) {
      log.error('Error in worker loop', { error: error.message });

      // Wait before retrying to avoid tight error loop
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// ============================================================================
// STUCK JOB RECOVERY MONITOR
// ============================================================================

let recoveryIntervalId = null;

async function recoverStuckJobs() {
  try {
    const result = await query(
      `UPDATE executions
       SET status = 'failed',
           stderr = 'Execution timeout or worker crash',
           finished_at = NOW()
       WHERE status = 'running'
         AND started_at < NOW() - INTERVAL ? MINUTE`,
      [STUCK_JOB_THRESHOLD_MINUTES]
    );

    if (result.affectedRows > 0) {
      log.info(`Recovered ${result.affectedRows} stuck job(s)`);
    } else {
      log.debug('No stuck jobs found');
    }
  } catch (error) {
    // Log but don't crash - DB might be temporarily unavailable
    log.error('Failed to recover stuck jobs', { error: error.message });
  }
}

function startRecoveryMonitor() {
  log.info(`Starting stuck job recovery monitor (interval: ${RECOVERY_INTERVAL_MS / 1000}s, threshold: ${STUCK_JOB_THRESHOLD_MINUTES}min)`);

  // Run immediately on startup
  recoverStuckJobs();

  // Then run periodically
  recoveryIntervalId = setInterval(recoverStuckJobs, RECOVERY_INTERVAL_MS);
}

function stopRecoveryMonitor() {
  if (recoveryIntervalId) {
    clearInterval(recoveryIntervalId);
    recoveryIntervalId = null;
    log.debug('Recovery monitor stopped');
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function shutdown(signal) {
  log.info(`Received ${signal}, shutting down gracefully...`);

  try {
    stopRecoveryMonitor();
    await disconnectRedis();
    await closePool();
    log.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
  try {
    log.info('Starting DockForge Worker...');

    // Initialize connections
    createPool();
    log.info('MySQL pool created');

    await connectRedis();
    log.info('Redis connected');

    // Start recovery monitor (runs in background)
    startRecoveryMonitor();

    // Start processing (blocks)
    await workerLoop();

  } catch (error) {
    log.error('Worker failed to start', { error: error.message });
    process.exit(1);
  }
}

start();