const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');
exports.authenticate = (req, res, next) => {
  // ヘッダーからトークンを取得
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '認証が必要です' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // トークンを検証
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'トークンが無効です' });
  }
};

exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '認証が必要です' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'この操作を行う権限がありません' });
    }
    
    next();
  };
};
