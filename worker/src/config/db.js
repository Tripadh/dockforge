const mysql = require('mysql2/promise');

let pool = null;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'mysql',
      port: process.env.DB_PORT || 3306,
      user: process.env.MYSQL_USER || 'dockforge',
      password: process.env.MYSQL_PASSWORD || 'securepass',
      database: process.env.MYSQL_DATABASE || 'dockforge',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });
  }
  return pool;
};

const query = async (sql, params) => {
  const pool = createPool();
  const [results] = await pool.execute(sql, params);
  return results;
};

const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('MySQL pool closed');
  }
};

module.exports = {
  createPool,
  query,
  closePool
};
