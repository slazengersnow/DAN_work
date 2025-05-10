/**
 * 年度・月選択コントロールの表示制御ミドルウェア
 * 
 * このミドルウェアはユーザーのロールに基づいて年度・月選択コントロールの
 * 表示/非表示を制御するためのサーバーサイド実装です。
 */

const { JWT_SECRET } = require('../config/auth');
const jwt = require('jsonwebtoken');

/**
 * ユーザーロールに基づいて年度・月選択コントロールの表示可否を判断
 */
exports.controlYearMonthSelector = (req, res, next) => {
  // ヘッダーからトークンを取得
  const authHeader = req.headers.authorization;
  
  // デフォルトではコントロールを表示する
  let showYearMonthControls = true;
  
  try {
    // トークンが存在する場合のみ検証
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      // トークンを検証
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // ユーザーロールに基づいて表示制御
      // 管理者の場合のみ表示、それ以外は非表示
      if (decoded.role === 'admin') {
        showYearMonthControls = true;
      } else {
        showYearMonthControls = false;
      }
      
      // ユーザー情報をリクエストに追加
      req.user = {
        ...decoded,
        canShowYearMonthControls: showYearMonthControls
      };
    }
  } catch (error) {
    console.error('年度・月選択コントロール表示制御エラー:', error);
    // エラーが発生した場合はデフォルト設定を使用
  }
  
  // 年度・月選択コントロールの表示設定をレスポンスヘッダーに追加
  res.set('X-Show-Year-Month-Controls', showYearMonthControls);
  
  // 後続の処理へ
  next();
};

/**
 * 月次レポートデータ取得時に年度・月選択コントロールの表示設定を追加
 */
exports.attachYearMonthControlSettings = (req, res, next) => {
  // 元のjsonメソッドを保存
  const originalJson = res.json;
  
  // jsonメソッドをオーバーライド
  res.json = function(data) {
    // レスポンスデータが存在し、成功フラグがある場合
    if (data && data.success) {
      // ユーザー情報からコントロール表示設定を取得
      const showControls = req.user?.canShowYearMonthControls ?? false;
      
      // レスポンスデータに表示設定を追加
      data.showYearMonthControls = showControls;
    }
    
    // 元のjsonメソッドを呼び出し
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * 設定情報取得時に年度・月選択コントロールの表示設定を追加
 */
exports.attachSettingsControlFlags = (req, res, next) => {
  // 元のjsonメソッドを保存
  const originalJson = res.json;
  
  // jsonメソッドをオーバーライド
  res.json = function(data) {
    // レスポンスデータが存在し、成功フラグがある場合
    if (data && data.success && data.data) {
      // ユーザー情報からコントロール表示設定を取得
      const showControls = req.user?.canShowYearMonthControls ?? false;
      
      // 設定データに表示設定を追加
      if (!data.data.ui) {
        data.data.ui = {};
      }
      
      data.data.ui.showYearMonthControls = showControls;
    }
    
    // 元のjsonメソッドを呼び出し
    return originalJson.call(this, data);
  };
  
  next();
};