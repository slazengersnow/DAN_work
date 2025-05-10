/**
 * 拡張修正インストーラー
 * 
 * CSV年度修正、ContentScriptエラー対応、データ完全性確保、
 * 視覚的フィードバック強化の各スクリプトを統合的に管理します。
 * 
 * 使用方法：
 * 1. ブックマークレットとして追加:
 *    javascript:(function(){document.head.appendChild(document.createElement('script')).src='/fixes/enhanced-fixes-installer.js?_='+Date.now();})();
 * 
 * または
 * 
 * 2. index.htmlに直接追加:
 *    <script src="/fixes/enhanced-fixes-installer.js"></script>
 */

(function() {
  // ================ 設定 ================
  const config = {
    scripts: [
      // 新シンプル年度修正（最優先）
      {
        name: 'シンプル年度修正', 
        path: '/fixes/simple-year-fix.js',
        required: true,
        condition: () => true // 常に適用
      },
      // 年度修正とCSVインポート
      {
        name: 'CSV年度修正', 
        path: '/fixes/csv-import-year-fix.js',
        required: false, // 優先度を下げる
        condition: () => !window.CSVYearFix
      },
      // ContentScriptエラー対応
      {
        name: 'ContentScriptエラー対応', 
        path: '/fixes/content-script-error-handler.js',
        required: false,
        condition: () => !window.ContentScriptErrorHandler
      },
      // データ完全性確認
      {
        name: 'データ完全性バリデータ',
        path: '/fixes/data-completeness-validator.js',
        required: false,
        condition: () => !window.DataCompletenessValidator
      },
      // 視覚的フィードバック
      {
        name: '視覚的フィードバック',
        path: '/fixes/visual-feedback-enhancer.js',
        required: false,
        condition: () => !window.VisualFeedback
      },
      // ネットワーク監視強化
      {
        name: 'ネットワーク監視強化', 
        path: '/fixes/enhanced-network-monitor.js',
        required: false,
        condition: () => !window.NetworkMonitor
      },
      // シンプル対応バージョン（フォールバック）
      {
        name: 'シンプル対応バージョン',
        path: '/fixes/simplified-csv-fix.js',
        required: false,
        condition: () => {
          // メインスクリプトのロードに失敗した場合のフォールバックとして使用
          return !window.CSVYearFix && !window.SimplifiedCSVFix;
        }
      }
    ],
    debug: true,
    version: '1.3.0',
    notificationTimeout: 5000,
    isMonthlyReportPath: () => {
      return window.location.pathname.includes('/monthly-report') || 
             window.location.pathname.includes('/MonthlyReport');
    },
    isDevelopmentEnvironment: () => {
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1';
    }
  };
  
  // ================ 内部状態 ================
  const state = {
    loadedScripts: [],
    errors: [],
    startTime: Date.now(),
    isInitialized: false
  };

  // ================ ユーティリティ ================
  
  /**
   * 安全なログ出力
   */
  function log(message, type = 'info') {
    if (!config.debug && type === 'debug') return;
    
    const prefix = '[拡張修正インストーラー]';
    const boundConsole = {
      log: window.console.log.bind(window.console),
      error: window.console.error.bind(window.console),
      warn: window.console.warn.bind(window.console),
      info: window.console.info.bind(window.console),
      debug: window.console.debug.bind(window.console)
    };
    
    boundConsole[type](`${prefix} ${message}`);
  }
  
  /**
   * 通知表示
   */
  function showNotification(message, type = 'success') {
    // 既存の通知APIがあれば使用
    if (window.VisualFeedback && window.VisualFeedback.showToast) {
      return window.VisualFeedback.showToast(message, type);
    }
    
    // 通知コンテナの取得または作成
    let container = document.getElementById('enhanced-fixes-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'enhanced-fixes-notifications';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      });
      document.body.appendChild(container);
    }
    
    // 通知要素の作成
    const notification = document.createElement('div');
    notification.textContent = message;
    
    // スタイルの適用
    Object.assign(notification.style, {
      backgroundColor: type === 'error' ? '#f44336' : 
                      type === 'warning' ? '#ff9800' : 
                      type === 'success' ? '#4CAF50' : '#2196F3',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      fontSize: '14px',
      maxWidth: '300px',
      transition: 'all 0.3s ease',
      opacity: '0',
      transform: 'translateY(20px)'
    });
    
    // コンテナに追加
    container.appendChild(notification);
    
    // アニメーション
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // 一定時間後に削除
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, config.notificationTimeout);
    
    return notification;
  }
  
  /**
   * スクリプトがすでにロードされているか確認
   */
  function isScriptLoaded(scriptPath) {
    // パスの末尾部分（ファイル名）を取得
    const fileName = scriptPath.split('/').pop();
    
    // 既存のscriptタグをチェック
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src && src.includes(fileName)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * スクリプトをロード
   */
  function loadScript(scriptInfo) {
    return new Promise((resolve, reject) => {
      // すでにロード済みならスキップ
      if (isScriptLoaded(scriptInfo.path)) {
        log(`${scriptInfo.name}は既にロード済みです`, 'debug');
        resolve({ name: scriptInfo.name, status: 'already-loaded' });
        return;
      }
      
      // 条件付きロードの場合
      if (scriptInfo.condition && typeof scriptInfo.condition === 'function') {
        const shouldLoad = scriptInfo.condition();
        if (!shouldLoad) {
          log(`${scriptInfo.name}は条件を満たさないためスキップします`, 'debug');
          resolve({ name: scriptInfo.name, status: 'skipped' });
          return;
        }
      }
      
      // スクリプト要素を作成
      const script = document.createElement('script');
      script.src = scriptInfo.path + '?_=' + Date.now(); // キャッシュ防止
      
      // スクリプトロード成功時
      script.onload = function() {
        log(`${scriptInfo.name}をロードしました`);
        state.loadedScripts.push(scriptInfo.name);
        resolve({ name: scriptInfo.name, status: 'loaded' });
      };
      
      // スクリプトロード失敗時
      script.onerror = function(error) {
        const errorMsg = `${scriptInfo.name}のロードに失敗しました`;
        log(errorMsg, 'error');
        state.errors.push({ name: scriptInfo.name, error: errorMsg });
        
        if (scriptInfo.required) {
          reject({ name: scriptInfo.name, error: errorMsg });
        } else {
          resolve({ name: scriptInfo.name, status: 'error' });
        }
      };
      
      // scriptタグを挿入
      document.head.appendChild(script);
    });
  }
  
  /**
   * 並列スクリプトロード
   */
  async function loadScriptsInParallel(scripts) {
    log(`${scripts.length}個のスクリプトをロード開始`);
    
    try {
      // 必須スクリプトと任意スクリプトに分類
      const requiredScripts = scripts.filter(s => s.required);
      const optionalScripts = scripts.filter(s => !s.required);
      
      // 必須スクリプトを最初にロード
      const requiredResults = await Promise.all(
        requiredScripts.map(script => loadScript(script).catch(error => {
          // 代替スクリプトを探す
          const fallbackScript = scripts.find(s => 
            s.name !== script.name && 
            !isScriptLoaded(s.path) && 
            (!s.condition || (s.condition && s.condition()))
          );
          
          if (fallbackScript) {
            log(`${script.name}のロードに失敗しましたが、代替として${fallbackScript.name}を試みます`, 'warn');
            showNotification(`${script.name}の代わりに${fallbackScript.name}を使用します`, 'warning');
            return loadScript(fallbackScript);
          }
          
          throw error;
        }))
      );
      
      log('必須スクリプトのロード完了');
      
      // 任意スクリプトをロード
      const optionalResults = await Promise.allSettled(
        optionalScripts.map(script => loadScript(script))
      );
      
      log('任意スクリプトのロード完了');
      
      // 結果を集計
      const results = [...requiredResults, ...optionalResults.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', name: r.reason?.name || 'unknown' })];
      
      const loadedCount = results.filter(r => r.status === 'loaded').length;
      const skippedCount = results.filter(r => r.status === 'skipped' || r.status === 'already-loaded').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      log(`スクリプトロード完了: ${loadedCount}個ロード, ${skippedCount}個スキップ, ${errorCount}個エラー`);
      
      return {
        loaded: loadedCount,
        skipped: skippedCount,
        error: errorCount,
        total: scripts.length,
        details: results
      };
    } catch (error) {
      log(`スクリプトロード中に致命的エラー: ${error.message}`, 'error');
      throw error;
    }
  }
  
  /**
   * 機能統合
   */
  function integrateFunctionality() {
    log('拡張機能の統合を開始');
    
    try {
      // 各機能間の連携をセットアップ
      
      // 1. CSVインポート完了イベントの発行
      // ContentScriptエラー対応が検出したイベントを他の機能に伝達
      if (window.ContentScriptErrorHandler) {
        const originalAttemptRecovery = window.ContentScriptErrorHandler.attemptRecovery;
        if (originalAttemptRecovery) {
          window.ContentScriptErrorHandler.attemptRecovery = async function() {
            // 元の関数を呼び出し
            await originalAttemptRecovery.apply(this, arguments);
            
            // CSV完了イベントの発行
            document.dispatchEvent(new CustomEvent('csv-data-imported', {
              detail: { source: 'ContentScriptErrorHandler', timestamp: Date.now() }
            }));
          };
        }
      }
      
      // 2. 視覚的フィードバックのAPI提供
      // すべての機能で使えるように通知APIを統合
      if (window.VisualFeedback) {
        window.EnhancedFixes = window.EnhancedFixes || {};
        window.EnhancedFixes.showNotification = window.VisualFeedback.showToast;
      }
      
      log('機能統合完了');
    } catch (error) {
      log(`機能統合中にエラー: ${error.message}`, 'error');
    }
  }
  
  /**
   * 全体的なステータスチェック
   */
  function checkStatus() {
    try {
      const result = {
        csvYearFix: !!window.CSVYearFix,
        simplifiedFix: !!window.SimplifiedCSVFix,
        contentErrorHandler: !!window.ContentScriptErrorHandler,
        dataValidator: !!window.DataCompletenessValidator,
        visualFeedback: !!window.VisualFeedback,
        networkMonitor: !!window.NetworkMonitor,
        loadTime: Date.now() - state.startTime
      };
      
      log(`機能ステータス: ${JSON.stringify(result)}`);
      
      // 統合APIにステータスを追加
      window.EnhancedFixes = window.EnhancedFixes || {};
      window.EnhancedFixes.status = result;
      window.EnhancedFixes.version = config.version;
      
      return result;
    } catch (error) {
      log(`ステータスチェック中にエラー: ${error.message}`, 'error');
      return { error: error.message };
    }
  }

  /**
   * 初期化処理
   */
  async function init() {
    if (state.isInitialized) {
      log('既に初期化済みです');
      return;
    }
    
    state.isInitialized = true;
    
    try {
      log(`拡張修正インストーラー v${config.version} を実行中...`);
      
      // 月次レポート画面かチェック
      if (!config.isMonthlyReportPath() && !config.isDevelopmentEnvironment()) {
        log('月次レポート画面ではないため、スクリプトをインストールしません', 'warn');
        return;
      }
      
      // スクリプトロード
      const loadResult = await loadScriptsInParallel(config.scripts);
      
      // 機能統合
      if (loadResult.loaded > 0) {
        integrateFunctionality();
      }
      
      // 最終ステータスチェック
      const status = checkStatus();
      
      // 結果通知
      if (loadResult.error === 0) {
        showNotification('CSV年度修正と拡張機能が適用されました', 'success');
      } else {
        showNotification(`一部の機能 (${loadResult.error}個) の適用に失敗しました`, 'warning');
      }
      
      // 統合APIの拡張
      window.EnhancedFixes = window.EnhancedFixes || {};
      window.EnhancedFixes.getLoadResult = () => loadResult;
      window.EnhancedFixes.getErrors = () => state.errors;
      window.EnhancedFixes.checkStatus = checkStatus;
      
      log('初期化完了');
    } catch (error) {
      log(`初期化中に致命的エラー: ${error.message}`, 'error');
      showNotification('修正スクリプトの適用に失敗しました', 'error');
    }
  }
  
  // DOMが読み込まれたら初期化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
  
  // グローバルアクセス用
  window.EnhancedFixes = {
    version: config.version,
    log: log,
    showNotification: showNotification,
    loadScripts: (scriptList) => loadScriptsInParallel(scriptList || config.scripts),
    init: init
  };
})();