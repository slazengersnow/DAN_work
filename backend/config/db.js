// config/db.js

// database.js からインポート
const { pool, connectDB } = require('./database');

// 単純に再エクスポートする
module.exports = { pool, connectDB };