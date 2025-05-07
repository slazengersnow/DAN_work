/**
 * ルートデバッグミドルウェア
 * リクエストのルートマッチングと処理に関する詳細な情報を提供します
 */

/**
 * ルートデバッグミドルウェアファクトリ関数
 * @param {Object} options - 設定オプション
 * @param {boolean} options.enabled - デバッグを有効にするかどうか
 * @param {boolean} options.verbose - 詳細情報を出力するかどうか
 * @param {Array<string>} options.methods - デバッグ対象のHTTPメソッド
 * @param {Array<string>} options.paths - デバッグ対象のパスパターン
 * @returns {Function} Express ミドルウェア関数
 */
function routeDebug(options = {}) {
  // デフォルト設定
  const config = {
    enabled: process.env.NODE_ENV !== 'production',
    verbose: false,
    methods: ['PUT', 'POST'],  // デフォルトではPUTとPOSTのみ記録
    paths: ['/api/monthly-reports', '/api/monthly-report'],  // デフォルトでは月次レポート関連のみ
    ...options
  };

  return (req, res, next) => {
    const { method, originalUrl, path, params, query, body } = req;
    
    // 設定に基づいてフィルタリング
    const shouldLog = 
      config.enabled && 
      (config.methods.length === 0 || config.methods.includes(method)) &&
      (config.paths.length === 0 || config.paths.some(p => originalUrl.startsWith(p)));
    
    if (shouldLog) {
      console.log('\n======= ROUTE DEBUG =======');
      console.log(`${method} ${originalUrl}`);
      console.log(`Base Path: ${path}`);
      console.log(`Route Parameters: ${JSON.stringify(params)}`);
      
      if (config.verbose) {
        console.log(`Query Parameters: ${JSON.stringify(query)}`);
        if (Object.keys(body).length > 0) {
          console.log(`Request Body: ${JSON.stringify(body, null, 2).substring(0, 200)}${Object.keys(body).length > 200 ? '...' : ''}`);
        }
      }
      
      // レスポンスログ用
      const originalSend = res.send;
      const originalJson = res.json;
      
      // レスポンスをインターセプト
      res.send = function(body) {
        console.log(`Response Status: ${res.statusCode}`);
        console.log('======= END DEBUG =======\n');
        return originalSend.apply(res, arguments);
      };
      
      res.json = function(body) {
        console.log(`Response Status: ${res.statusCode}`);
        if (config.verbose && body) {
          console.log(`Response Body: ${JSON.stringify(body, null, 2).substring(0, 200)}${JSON.stringify(body).length > 200 ? '...' : ''}`);
        }
        console.log('======= END DEBUG =======\n');
        return originalJson.apply(res, arguments);
      };
    }
    
    next();
  };
}

module.exports = routeDebug;