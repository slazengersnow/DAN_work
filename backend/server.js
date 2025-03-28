const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// ルートファイルのインポート
const employeeRoutes = require('./routes/employee');
const authRoutes = require('./routes/auth');
// 他のルートは順次追加予定
// const reportRoutes = require('./routes/report');
// const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// ルート設定
app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/settings', settingsRoutes);

// 基本ルート
app.get('/', (req, res) => {
  res.send('障害者雇用管理システム API');
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});