require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

// 環境変数の設定
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Express アプリの初期化
const app = express();

const employeeRoutes = require('./routes/employeeRoutes');
const monthlyReportRoutes = require('./routes/monthlyReportRoutes');
const paymentReportRoutes = require('./routes/paymentReportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

app.use('/api/employees', employeeRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);
app.use('/api/payment-reports', paymentReportRoutes);
app.use('/api/settings', settingsRoutes);

// CORS設定を緩和
app.use(cors({
  origin: '*', // 開発中は全てのオリジンを許可
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 基本ルート（すでにあれば不要）
app.get('/', (req, res) => {
  res.send('障害者雇用管理システムAPI');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working without auth' });
});

app.get('/api/settings/public', (req, res) => {
  settingsController.getSettings(req, res);
});

app.get('/api/employees/public', (req, res) => {
  employeeController.getAllEmployees(req, res);
});

app.get('/api/test-monthly', (req, res) => {
  res.json({ message: 'Monthly reports test endpoint' });
});

app.get('/api/test-payment', (req, res) => {
  res.json({ message: 'Payment reports test endpoint' });
});

// ミドルウェアの設定
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL 接続設定
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'disability_employment',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// データベース接続テスト
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('PostgreSQL に接続しました');
  release();
});

// ファイルアップロード設定
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 認証ミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ルート: ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'サーバーは正常に動作しています' });
});

// ルート: ユーザー登録
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    
    // 既存ユーザーのチェック
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'ユーザー名またはメールアドレスは既に使用されています' });
    }
    
    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ユーザーの作成
    const newUser = await pool.query(
      'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, hashedPassword, email, role || 'user']
    );
    
    res.status(201).json({
      message: 'ユーザーが正常に登録されました',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// ルート: ログイン
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // ユーザーの検索
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'ユーザー名またはパスワードが無効です' });
    }
    
    const user = result.rows[0];
    
    // パスワードの検証
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'ユーザー名またはパスワードが無効です' });
    }
    
    // JWTトークンの生成
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'ログイン成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// ルート: 障害者従業員の取得
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employees ORDER BY id ASC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('従業員取得エラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// ルート: 障害者従業員の追加
app.post('/api/employees', authenticateToken, async (req, res) => {
  try {
    const {
      employee_id,
      full_name,
      disability_type,
      disability_level,
      start_date,
      department,
      position,
      contact_info,
      notes
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO employees 
       (employee_id, full_name, disability_type, disability_level, start_date, department, position, contact_info, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [employee_id, full_name, disability_type, disability_level, start_date, department, position, contact_info, notes]
    );
    
    res.status(201).json({
      message: '従業員が正常に追加されました',
      employee: result.rows[0]
    });
  } catch (error) {
    console.error('従業員追加エラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// ルート: 特定の障害者従業員の取得
app.get('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM employees WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '従業員が見つかりません' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('従業員取得エラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// ルート: 障害者従業員の更新
app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      full_name,
      disability_type,
      disability_level,
      start_date,
      department,
      position,
      contact_info,
      notes
    } = req.body;
    
    const result = await pool.query(
      `UPDATE employees 
       SET employee_id = $1, full_name = $2, disability_type = $3, disability_level = $4, 
           start_date = $5, department = $6, position = $7, contact_info = $8, notes = $9, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [employee_id, full_name, disability_type, disability_level, start_date, department, position, 
       contact_info, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '従業員が見つかりません' });
    }
    
    res.json({
      message: '従業員が正常に更新されました',
      employee: result.rows[0]
    });
  } catch (error) {
    console.error('従業員更新エラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// ルート: 障害者従業員の削除
app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM employees WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '従業員が見つかりません' });
    }
    
    res.json({
      message: '従業員が正常に削除されました',
      employee: result.rows[0]
    });
  } catch (error) {
    console.error('従業員削除エラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// ルート: 雇用率の計算
app.get('/api/employment-rate', authenticateToken, async (req, res) => {
  try {
    // 障害者従業員数を取得
    const disabilityEmployeesResult = await pool.query(
      'SELECT COUNT(*) as count, SUM(CASE WHEN disability_level = \'重度\' THEN 2 ELSE 1 END) as weighted_count FROM employees'
    );
    
    // 全従業員数を取得（別のテーブルから、または設定から）
    const totalEmployeesResult = await pool.query(
      'SELECT value FROM settings WHERE key = \'total_employees\''
    );
    
    const disabilityCount = parseInt(disabilityEmployeesResult.rows[0].count);
    const weightedCount = parseFloat(disabilityEmployeesResult.rows[0].weighted_count);
    const totalEmployees = parseInt(totalEmployeesResult.rows[0].value);
    
    // 法定雇用率（設定から取得または固定値）
    const legalRateResult = await pool.query(
      'SELECT value FROM settings WHERE key = \'legal_employment_rate\''
    );
    const legalRate = parseFloat(legalRateResult.rows[0].value);
    
    // 現在の雇用率を計算
    const currentRate = (weightedCount / totalEmployees) * 100;
    
    // 法定雇用率を満たすために必要な従業員数を計算
    const requiredCount = Math.ceil((totalEmployees * legalRate / 100) - weightedCount);
    
    res.json({
      total_employees: totalEmployees,
      disability_employees: {
        count: disabilityCount,
        weighted_count: weightedCount
      },
      legal_rate: legalRate,
      current_rate: currentRate.toFixed(2),
      required_additional: requiredCount > 0 ? requiredCount : 0,
      status: currentRate >= legalRate ? '達成' : '未達成'
    });
  } catch (error) {
    console.error('雇用率計算エラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// ルート: CSVインポート
app.post('/api/import/employees', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'ファイルがアップロードされていません' });
  }
  
  const results = [];
  const errors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on('data', async (data) => {
      try {
        // CSVデータの処理
        results.push(data);
      } catch (error) {
        errors.push({ row: data, error: error.message });
      }
    })
    .on('end', async () => {
      try {
        // インポートされたデータをデータベースに一括挿入
        let successCount = 0;
        
        for (const employee of results) {
          try {
            await pool.query(
              `INSERT INTO employees 
               (employee_id, full_name, disability_type, disability_level, start_date, department, position, contact_info, notes) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                employee.employee_id,
                employee.full_name,
                employee.disability_type,
                employee.disability_level,
                employee.start_date,
                employee.department,
                employee.position,
                employee.contact_info,
                employee.notes
              ]
            );
            successCount++;
          } catch (error) {
            errors.push({ row: employee, error: error.message });
          }
        }
        
        // 一時ファイルの削除
        fs.unlinkSync(req.file.path);
        
        res.json({
          message: 'CSVインポートが完了しました',
          total: results.length,
          success: successCount,
          errors: errors
        });
      } catch (error) {
        console.error('CSVインポートエラー:', error);
        res.status(500).json({ message: '内部サーバーエラー' });
      }
    });
});

// ルート: CSVエクスポート
app.get('/api/export/employees', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees');
    
    const csvData = [];
    const headers = ['employee_id', 'full_name', 'disability_type', 'disability_level', 'start_date', 'department', 'position', 'contact_info', 'notes'];
    
    csvData.push(headers.join(','));
    
    result.rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] ? row[header].toString() : '';
        // カンマやダブルクォートをエスケープ
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      
      csvData.push(values.join(','));
    });
    
    const csvContent = csvData.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
    
    res.send(csvContent);
  } catch (error) {
    console.error('CSVエクスポートエラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// ルート: 設定の取得
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings');
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    res.json(settings);
  } catch (error) {
    console.error('設定取得エラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// ルート: 設定の更新
app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
        [value, key]
      );
    }
    
    res.json({ message: '設定が正常に更新されました' });
  } catch (error) {
    console.error('設定更新エラー:', error);
    res.status(500).json({ message: '内部サーバーエラー' });
  }
});

// サーバーの起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

module.exports = app;