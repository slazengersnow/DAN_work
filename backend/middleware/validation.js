// 社員情報の検証
exports.validateEmployee = (req, res, next) => {
  const { name, gender, birth_date, hire_date } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      success: false, 
      message: '氏名は必須です' 
    });
  }
  
  if (!gender) {
    return res.status(400).json({ 
      success: false, 
      message: '性別は必須です' 
    });
  }
  
  if (!birth_date) {
    return res.status(400).json({ 
      success: false, 
      message: '生年月日は必須です' 
    });
  }
  
  if (!hire_date) {
    return res.status(400).json({ 
      success: false, 
      message: '雇用日は必須です' 
    });
  }
  
  next();
};

// ユーザー情報の検証
exports.validateUser = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username) {
    return res.status(400).json({ 
      success: false, 
      message: 'ユーザー名は必須です' 
    });
  }
  
  if (!password) {
    return res.status(400).json({ 
      success: false, 
      message: 'パスワードは必須です' 
    });
  }
  
  next();
};
