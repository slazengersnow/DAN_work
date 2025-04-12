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

// コントローラーのインポート
const employeeController = require('./controllers/employeeController');
const settingsController = require('./controllers/settingsController');

// ルーターのインポート
const employeeRoutes = require('./routes/employeeRoutes');
const monthlyReportRoutes = require('./routes/monthlyReportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentReportRoutes = require('./routes/paymentReportRoutes');

// 1. CORS設定
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 2. BodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 3. デバッグミドルウェア（オプション - 問題がある場合は一時的に無効化）
app.use((req, res, next) => {
  try {
    // デバッグ情報のログ出力
    if (req.body) {
      console.log('Request Body:', req.body);
    }
    next();
  } catch (error) {
    console.error('デバッグミドルウェアでエラー:', error);
    next();  // エラーがあっても処理を続行
  }
});

// 4. ルーティング設定
app.use('/api/payment-reports', paymentReportRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);
app.use('/api/monthlyReports', monthlyReportRoutes);
app.use('/api/settings', settingsRoutes);

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

// テスト用の直接エンドポイント
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working without auth' });
});

app.get('/api/test-direct', (req, res) => {
  res.status(200).json({ message: 'Direct test endpoint is working' });
});

app.post('/api/direct-test', (req, res) => {
  console.log('直接テスト - ボディ:', req.body);
  res.json({ 
    message: 'テスト成功',
    receivedData: req.body
  });
});

app.post('/api/test-employee', (req, res) => {
  console.log('テスト従業員作成リクエスト:', req.body);
  res.status(201).json({ 
    message: 'テスト従業員作成完了', 
    receivedData: req.body 
  });
});

app.put('/api/test-settings', (req, res) => {
  console.log('テスト設定更新リクエスト:', req.body);
  res.status(200).json({ 
    message: 'テスト設定更新完了', 
    receivedData: req.body 
  });
});

app.put('/api/test-update/:id', (req, res) => {
  console.log(`テスト更新リクエスト ID: ${req.params.id}`, req.body);
  res.status(200).json({ 
    message: 'テスト更新完了', 
    id: req.params.id,
    receivedData: req.body 
  });
});

app.put('/api/test-employee/:id', (req, res) => {
  console.log(`テスト従業員更新 ID: ${req.params.id}`, req.body);
  res.status(200).json({
    message: 'テスト更新成功',
    id: req.params.id,
    data: req.body
  });
});

// server.jsに追加
app.put('/api/simple-update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    console.log(`従業員ID ${id} の簡易更新:`, req.body);
    
    // 単純な更新操作（nameのみ）
    const result = await pool.query(
      `UPDATE employees 
       SET name = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [name, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '従業員が見つかりません' });
    }
    
    res.status(200).json({
      message: '従業員情報を更新しました',
      employee: result.rows[0]
    });
  } catch (error) {
    console.error('従業員情報の更新中にエラーが発生しました:', error);
    res.status(500).json({ error: '従業員情報の更新に失敗しました' });
  }
});

// 基本ルート
app.get('/', (req, res) => {
  res.send('障害者雇用管理システムAPI');
});

// ルート: ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'サーバーは正常に動作しています' });
});

// server.jsに追加
app.get('/api/test-get/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '従業員が見つかりません', id });
    }
    
    res.json({ message: 'テスト取得成功', employee: result.rows[0] });
  } catch (error) {
    console.error('テスト取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// 認証関連のルート
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

// CSVインポート/エクスポート
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
        results.push(data);
      } catch (error) {
        errors.push({ row: data, error: error.message });
      }
    })
    .on('end', async () => {
      try {
        let successCount = 0;
        
        for (const employee of results) {
          try {
            await pool.query(
              `INSERT INTO employees 
               (employee_id, name, gender, birth_date, department, position) 
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                employee.employee_id,
                employee.name,
                employee.gender,
                employee.birth_date,
                employee.department,
                employee.position
              ]
            );
            successCount++;
          } catch (error) {
            errors.push({ row: employee, error: error.message });
          }
        }
        
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

// server.jsに追加
app.post('/api/db-test', async (req, res) => {
  try {
    const { name, employee_id, department, position } = req.body;
    console.log('DB挿入テスト:', req.body);
    
    // データベース挿入
    const result = await pool.query(
      `INSERT INTO employees (
        employee_id, name, name_kana, gender, birth_date, hire_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [employee_id, name, 'テスト', '男', '2000-01-01', '2020-04-01', '在籍中']
    );
    
    res.status(201).json({
      message: 'DB挿入成功',
      employee: result.rows[0]
    });
  } catch (error) {
    console.error('DB挿入エラー:', error);
    res.status(500).json({
      error: 'DB挿入失敗',
      details: error.message,
      code: error.code
    });
  }
});

// server.js に追加
app.post('/api/direct-insert', async (req, res) => {
  try {
    const { employee_id, name, name_kana, gender, birth_date, hire_date, status } = req.body;
    console.log('直接挿入テスト:', req.body);
    
    // 直接SQLクエリを実行
    const result = await pool.query(`
      INSERT INTO employees (
        employee_id, name, name_kana, gender, birth_date, hire_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `, [
      employee_id,
      name,
      name_kana || 'テスト',
      gender || '男',
      birth_date || '2000-01-01',
      hire_date || '2020-01-01',
      status || '在籍中'
    ]);
    
    res.status(201).json({
      message: '直接挿入成功',
      employee: result.rows[0]
    });
  } catch (error) {
    console.error('直接挿入エラー:', error);
    res.status(500).json({
      error: '直接挿入失敗',
      details: error.message,
      code: error.code
    });
  }
});

app.get('/api/export/employees', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees');
    
    const csvData = [];
    const headers = ['employee_id', 'name', 'gender', 'birth_date', 'department', 'position'];
    
    csvData.push(headers.join(','));
    
    result.rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] ? row[header].toString() : '';
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

// server.js の適切な場所に追加
app.get('/api/db-test', async (req, res) => {
  try {
    const testResult = await pool.query('SELECT NOW() as time');
    res.json({ 
      message: 'データベース接続正常', 
      time: testResult.rows[0].time,
      connectionInfo: {
        database: process.env.DB_NAME || 'disability_employment',
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost'
      }
    });
  } catch (error) {
    console.error('DB接続テストエラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// 新しいテストエンドポイント
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'テストエンドポイントが正常に動作しています' });
});

// エラーハンドリングミドルウェア - すべてのルーティングの後に配置
app.use((err, req, res, next) => {
  console.error('アプリケーションエラー:', err);
  res.status(500).json({ error: '内部サーバーエラー' });
});

// サーバーの起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log('データベースに接続しました');
});

module.exports = app;