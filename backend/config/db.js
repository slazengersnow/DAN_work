// config/db.js

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// PostgreSQL接続設定
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'disability_employment',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// 接続テスト
pool.connect((err, client, done) => {
  if (err) {
    console.error('データベース接続エラー:', err);
  } else {
    console.log('データベースに接続しました');
    done();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};