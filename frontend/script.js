/**
 * DockForge Frontend
 * Simple code execution interface
 */

const API_BASE = '/api';
const POLL_INTERVAL = 1000;

// DOM Elements
const codeTextarea = document.getElementById('code');
const languageSelect = document.getElementById('language');
const runButton = document.getElementById('run-btn');
const statusElement = document.getElementById('status');
const stdoutElement = document.getElementById('stdout');
const stderrElement = document.getElementById('stderr');
const executionInfoElement = document.getElementById('execution-info');

// State
let pollIntervalId = null;

/**
 * Update language placeholder when selection changes
 */
languageSelect.addEventListener('change', () => {
    const lang = languageSelect.value;
    if (lang === 'python') {
        codeTextarea.placeholder = 'Enter your Python code here...';
        if (codeTextarea.value === 'console.log("Hello, DockForge!");') {
            codeTextarea.value = 'print("Hello, DockForge!")';
        }
    } else {
        codeTextarea.placeholder = 'Enter your Node.js code here...';
        if (codeTextarea.value === 'print("Hello, DockForge!")') {
            codeTextarea.value = 'console.log("Hello, DockForge!");';
        }
    }
});

/**
 * Set UI to running state
 */
function setRunningState() {
    runButton.disabled = true;
    runButton.textContent = 'Running...';
    statusElement.textContent = 'Submitting...';
    statusElement.className = 'status-value pending loading';
    stdoutElement.textContent = '';
    stderrElement.textContent = '';
    executionInfoElement.textContent = '';
}

/**
 * Set UI to ready state
 */
function setReadyState() {
    runButton.disabled = false;
    runButton.textContent = 'Run Code';
    statusElement.classList.remove('loading');
}

/**
 * Update status display
 */
function updateStatus(status) {
    statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusElement.className = `status-value ${status}`;
    
    if (status === 'pending' || status === 'running') {
        statusElement.classList.add('loading');
    } else {
        statusElement.classList.remove('loading');
    }
}

/**
 * Display execution result
 */
function displayResult(result) {
    updateStatus(result.status);
    stdoutElement.textContent = result.stdout || '(no output)';
    stderrElement.textContent = result.stderr || '(no errors)';
    
    if (result.executionMs !== null && result.executionMs !== undefined) {
        executionInfoElement.textContent = `Execution time: ${result.executionMs}ms`;
    }
}

/**
 * Stop polling for results
 */
function stopPolling() {
    if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
    }
}

/**
 * Poll for job result
 */
async function pollResult(jobId) {
    try {
        const response = await fetch(`${API_BASE}/result/${jobId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Update UI with current status
        displayResult(result);
        
        // Stop polling if job is complete
        if (result.status === 'completed' || result.status === 'failed') {
            stopPolling();
            setReadyState();
        }
    } catch (error) {
        console.error('Poll error:', error);
        stopPolling();
        setReadyState();
        stderrElement.textContent = `Error fetching result: ${error.message}`;
        updateStatus('failed');
    }
}

/**
 * Submit code for execution
 */
async function executeCode() {
    const code = codeTextarea.value.trim();
    const language = languageSelect.value;
    
    if (!code) {
        alert('Please enter some code to execute.');
        return;
    }
    
    // Stop any existing polling
    stopPolling();
    
    // Update UI
    setRunningState();
    
    try {
        // Submit code
        const response = await fetch(`${API_BASE}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, language })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const jobId = data.jobId;
        
        updateStatus('pending');
        
        // Start polling for results
        pollIntervalId = setInterval(() => pollResult(jobId), POLL_INTERVAL);
        
        // Do first poll immediately
        await pollResult(jobId);
        
    } catch (error) {
        console.error('Execute error:', error);
        setReadyState();
        stderrElement.textContent = `Error: ${error.message}`;
        updateStatus('failed');
    }
}

// Event Listeners
runButton.addEventListener('click', executeCode);

// Keyboard shortcut: Ctrl+Enter to run
codeTextarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!runButton.disabled) {
            executeCode();
        }
    }
});

// Initial focus
codeTextarea.focus();
