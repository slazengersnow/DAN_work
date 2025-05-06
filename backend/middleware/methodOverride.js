/**
 * HTTP メソッドオーバーライドミドルウェア
 * 特定のPUTリクエストをPOSTリクエストとして処理する
 */

/**
 * 特定のパスへのPUTリクエストをPOSTリクエストにマッピング
 * 互換性のために使用
 */
function methodOverride(options = {}) {
  const defaultOptions = {
    debug: false,
    routes: [
      // 月次レポートのエンドポイント
      {
        pattern: /\/api\/monthly-reports\/\d+\/\d+$/,
        fromMethod: 'PUT',
        toMethod: 'POST'
      },
      {
        pattern: /\/api\/monthly-report\/\d+\/\d+$/,
        fromMethod: 'PUT',
        toMethod: 'POST'
      }
    ]
  };

  const config = { ...defaultOptions, ...options };

  return (req, res, next) => {
    const { method, originalUrl } = req;
    const { debug, routes } = config;

    if (debug) {
      console.log(`[methodOverride] ${method} ${originalUrl}`);
    }

    // ルートに一致するか確認
    const matchedRoute = routes.find(route => 
      route.fromMethod === method && route.pattern.test(originalUrl)
    );

    if (matchedRoute) {
      const originalMethod = req.method;
      req.method = matchedRoute.toMethod;
      
      if (debug) {
        console.log(`[methodOverride] Convert ${originalMethod} -> ${req.method} for ${originalUrl}`);
      }
      
      // 元のメソッドを保存（デバッグやログ用）
      req.originalMethod = originalMethod;
    }

    next();
  };
}

module.exports = methodOverride;