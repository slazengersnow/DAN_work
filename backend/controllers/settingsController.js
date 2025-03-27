// backend/controllers/settingsController.js
const Setting = require('../models/Setting');

exports.getCompanySettings = async (req, res) => {
  try {
    const settings = await Setting.getCompanySettings();
    
    if (!settings) {
      return res.status(200).json({ 
        success: true, 
        data: {
          company_name: '',
          company_code: '',
          company_address: '',
          legal_rate: 2.3,
          fiscal_year_start: new Date().toISOString().split('T')[0],
          fiscal_year_end: new Date().toISOString().split('T')[0],
          monthly_report_reminder: false,
          legal_rate_alert: true,
          employment_end_notice: false,
          theme: 'light'
        }
      });
    }
    
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '設定の取得中にエラーが発生しました' 
    });
  }
};

exports.updateCompanySettings = async (req, res) => {
  try {
    const settings = await Setting.updateCompanySettings(req.body);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '設定の更新中にエラーが発生しました' 
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await Setting.getUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'ユーザーの取得中にエラーが発生しました' 
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'ユーザー名とパスワードは必須です' 
      });
    }
    
    const user = await Setting.createUser({ username, password, role });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('エラー:', error);
    
    if (error.code === '23505') { // PostgreSQLの一意制約違反エラーコード
      return res.status(400).json({ 
        success: false, 
        message: 'そのユーザー名は既に使用されています' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'ユーザーの作成中にエラーが発生しました' 
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'ユーザー名は必須です' 
      });
    }
    
    const user = await Setting.updateUser(req.params.id, { username, password, role });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '指定されたユーザーが見つかりません' 
      });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('エラー:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: 'そのユーザー名は既に使用されています' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'ユーザーの更新中にエラーが発生しました' 
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await Setting.deleteUser(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'ユーザーの削除中にエラーが発生しました' 
    });
  }
};