// backend/utils/errorHandler.js

class ErrorHandler {
  constructor() {
    this.errors = {
      database: {},
      validation: {},
      auth: {},
      server: {}
    };
    
    // PostgreSQLエラーコードマッピング（直接ハードコード）
    this.pgErrors = {
      '42703': 'データベースフィールドが見つかりません', // UNDEFINED_COLUMN
      '42P01': 'データベーステーブルが見つかりません', // UNDEFINED_TABLE
      '42701': 'フィールドが重複しています', // DUPLICATE_COLUMN
      '23503': '参照整合性制約違反です', // FOREIGN_KEY_VIOLATION
      '23505': 'データが重複しています' // UNIQUE_VIOLATION
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

// Expressミドルウェア用のエラーハンドラー

// JSONパースエラーハンドラー
const jsonParseErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSONパースエラー:', err.message);
    return res.status(400).json({
      success: false,
      message: '無効なJSONフォーマット',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  next(err);
};

// 一般的なエラーハンドラー
const generalErrorHandler = (err, req, res, next) => {
  console.error('アプリケーションエラー:', err);
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'サーバーエラーが発生しました' : err.message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// APIルート用の404ハンドラー
const apiNotFoundHandler = (req, res) => {
  console.warn(`存在しないAPIルート: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'APIルートが見つかりません',
    path: req.originalUrl
  });
};

// フォールバック用404ハンドラー
const notFoundHandler = (req, res) => {
  console.warn(`存在しないルート: ${req.method} ${req.originalUrl}`);
  // API以外のリクエストでもJSON形式で返す
  res.status(404).json({
    success: false,
    message: 'リソースが見つかりません',
    path: req.originalUrl
  });
};

// すべてのエラーハンドラーを適用する関数
const applyErrorHandlers = (app) => {
  // JSONパースエラー処理
  app.use(jsonParseErrorHandler);
  
  // 一般的なエラー処理
  app.use(generalErrorHandler);
  
  // 最初に、すべてのAPI関連ルートを処理したあと
  // API用の404ハンドラーを適用（重要：ルートの定義後に配置する必要があります）
  app.all('/api/*', apiNotFoundHandler);
  
  // 最終的な404ハンドラー（すべてのルートにマッチしない場合）
  app.use((req, res) => {
    console.warn(`未知のルートにアクセスされました: ${req.method} ${req.originalUrl}`);
    // 必ずJSONで応答する
    res.status(404).json({
      success: false,
      message: 'リソースが見つかりません',
      path: req.originalUrl
    });
  });
};

// 既存のインスタンスを維持
const errorHandler = new ErrorHandler();

// 新しいミドルウェア関数を追加
errorHandler.jsonParseErrorHandler = jsonParseErrorHandler;
errorHandler.generalErrorHandler = generalErrorHandler;
errorHandler.apiNotFoundHandler = apiNotFoundHandler;
errorHandler.notFoundHandler = notFoundHandler;
errorHandler.applyErrorHandlers = applyErrorHandlers;

module.exports = errorHandler;