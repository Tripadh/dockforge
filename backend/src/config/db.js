import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "mysql",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.MYSQL_USER || "dockforge",
  password: process.env.MYSQL_PASSWORD || "securepass",
  database: process.env.MYSQL_DATABASE || "dockforge",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;