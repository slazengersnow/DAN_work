const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/auth');
exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'ユーザー名とパスワードを入力してください'
    });
  }
  
  try {
    // ユーザーを検索
    const query = 'SELECT * FROM users WHERE username = $1';
    const { rows } = await pool.query(query, [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'ユーザー名またはパスワードが無効です'
      });
    }
    
    const user = rows[0];
    
    // パスワードを検証
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'ユーザー名またはパスワードが無効です'
      });
    }
    
    // JWTトークンを生成
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );
    
    // パスワードを除外したユーザー情報
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({
      success: false,
      message: 'ログイン処理中にエラーが発生しました'
    });
  }
};

exports.register = async (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'ユーザー名とパスワードを入力してください'
    });
  }
  
  try {
    // 既存ユーザーをチェック
    const checkQuery = 'SELECT * FROM users WHERE username = $1';
    const checkResult = await pool.query(checkQuery, [username]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'そのユーザー名は既に使用されています'
      });
    }
    
    // パスワードをハッシュ化
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // ユーザーを作成
    const insertQuery = `
      INSERT INTO users (username, password, role)
      VALUES ($1, $2, $3)
      RETURNING id, username, role, created_at
    `;
    
    const insertValues = [
      username,
      hashedPassword,
      role || 'user'
    ];
    
    const { rows } = await pool.query(insertQuery, insertValues);
    
    res.status(201).json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザー登録中にエラーが発生しました'
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const query = 'SELECT id, username, role, created_at, updated_at FROM users WHERE id = $1';
    const { rows } = await pool.query(query, [req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'プロフィール取得中にエラーが発生しました'
    });
  }
};
