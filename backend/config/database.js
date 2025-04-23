// backend/config/database.js
const { Pool } = require('pg');

// PostgreSQL接続設定
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'disability_system',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

// 単純化したインターフェース
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQLデータベースに接続しました');
    client.release();
    return pool;
  } catch (err) {
    console.error('PostgreSQLへの接続に失敗しました:', err);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };