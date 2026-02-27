import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
import redisClient from "../config/redis.js";

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUUID = (id) => {
  return UUID_REGEX.test(id);
};

export const getExecutionResult = async (jobId) => {
  const [rows] = await pool.execute(
    `SELECT
       BIN_TO_UUID(id) AS id,
       status,
       stdout,
       stderr,
       execution_ms,
       created_at,
       started_at,
       finished_at
     FROM executions
     WHERE id = UUID_TO_BIN(?)`,
    [jobId]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    jobId: row.id,
    status: row.status,
    stdout: row.stdout,
    stderr: row.stderr,
    executionMs: row.execution_ms,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at
  };
};

export const createExecutionJob = async (code, language) => {
  const jobId = uuidv4();

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Insert job into DB first (source of truth)
    await connection.execute(
      `INSERT INTO executions (id, code, language, status)
       VALUES (UUID_TO_BIN(?), ?, ?, 'pending')`,
      [jobId, code, language]
    );

    // Push minimal payload to Redis queue
    await redisClient.lPush(
      "execution_queue",
      JSON.stringify({ jobId })
    );

    await connection.commit();

    return jobId;

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};