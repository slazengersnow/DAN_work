/**
 * API互換性ミドルウェア
 * 古いAPIパスを新しいパスに変換するためのミドルウェア
 */

/**
 * リクエストパスを修正するミドルウェア
 * 古いAPIパス形式 (/api/monthly-report/) を新しい形式 (/api/monthly-reports/) に変換
 */
function apiCompatibility(options = {}) {
  const defaultOptions = {
    debug: false,
    pathMappings: [
      {
        from: /^\/api\/monthly-report\/(.*)$/,
        to: '/api/monthly-reports/$1'
      }
    ]
  };

  const config = { ...defaultOptions, ...options };

  return (req, res, next) => {
    const { originalUrl, method } = req;
    const { debug, pathMappings } = config;

    if (debug) {
      console.log(`[apiCompatibility] ${method} ${originalUrl}`);
    }

    // パスを変換
    let newUrl = originalUrl;
    
    pathMappings.forEach(mapping => {
      if (mapping.from.test(originalUrl)) {
        newUrl = originalUrl.replace(mapping.from, mapping.to);
        
        if (debug) {
          console.log(`[apiCompatibility] Redirecting ${originalUrl} -> ${newUrl}`);
        }
        
        // 元のURLを記録
        req.originalApiUrl = originalUrl;
        
        // URLを更新
        req.url = newUrl.replace(/^\/api/, '');
      }
    });

    next();
  };
}

module.exports = apiCompatibility;