// backend/utils/errorHandler.js

const errorCodes = require('pg-error-constants');

class ErrorHandler {
  constructor() {
    this.errors = {
      database: {},
      validation: {},
      auth: {},
      server: {}
    };
    
    // PostgreSQLエラーコードマッピング
    this.pgErrors = {
      [errorCodes.UNDEFINED_COLUMN]: 'データベースフィールドが見つかりません',
      [errorCodes.UNDEFINED_TABLE]: 'データベーステーブルが見つかりません',
      [errorCodes.DUPLICATE_COLUMN]: 'フィールドが重複しています',
      [errorCodes.FOREIGN_KEY_VIOLATION]: '参照整合性制約違反です',
      [errorCodes.UNIQUE_VIOLATION]: 'データが重複しています'
    };
  }
  
  // データベースエラーハンドラー
  handleDatabaseError(err) {
    console.error('データベースエラー:', err);
    
    const errorCode = err.code;
    const errorMessage = this.pgErrors[errorCode] || '予期せぬデータベースエラーが発生しました';
    
    // 特定のカラムエラーを処理
    if (err.message && err.message.includes('column "notes" of relation "monthly_reports" does not exist')) {
      return {
        success: false,
        message: '月次レポートの保存に失敗しました',
        error: err.message,
        code: 'SCHEMA_MISMATCH'
      };
    }
    
    return {
      success: false,
      message: errorMessage,
      error: err.message,
      code: errorCode || 'DB_ERROR'
    };
  }
  
  // バリデーションエラーハンドラー
  handleValidationError(err) {
    console.error('バリデーションエラー:', err);
    
    return {
      success: false,
      message: 'データの検証に失敗しました',
      validationErrors: err.errors || [],
      code: 'VALIDATION_ERROR'
    };
  }
  
  // 汎用エラーハンドラー
  handleGenericError(err) {
    console.error('サーバーエラー:', err);
    
    return {
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: err.message,
      code: 'SERVER_ERROR'
    };
  }
}

module.exports = new ErrorHandler();