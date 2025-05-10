/**
 * 強化CSV年度修正スクリプトインストーラー
 * 
 * このスクリプトは2つの修正スクリプトを適切な順序でページに挿入します：
 * 1. csv-import-year-fix.js - 年度検出とインターフェース
 * 2. enhanced-network-monitor.js - ネットワークリクエスト監視の強化
 * 
 * 使用方法：
 * 1. ブックマークレットとして追加:
 *    javascript:(function(){document.head.appendChild(document.createElement('script')).src='/fixes/enhanced-csv-fix-installer.js?_='+Date.now();})();
 * 
 * または
 * 
 * 2. index.htmlに直接追加:
 *    <script src="/fixes/enhanced-csv-fix-installer.js"></script>
 */

(function() {
  // 設定
  const config = {
    scripts: [
      {
        name: 'CSV年度修正', 
        path: '/fixes/csv-import-year-fix.js',
        required: true
      },
      {
        name: 'ネットワーク監視強化', 
        path: '/fixes/enhanced-network-monitor.js',
        required: false
      },
      {
        name: 'シンプル対応バージョン',
        path: '/fixes/simplified-csv-fix.js',
        required: false,
        condition: () => {
          // メインスクリプトのロードに失敗した場合のフォールバックとして使用
          return !window.CSVYearFix;
        }
      }
    ],
    debug: true
  };
  
  // ユーティリティ
  function log(message, type = 'info') {
    if (!config.debug && type === 'debug') return;
    
    const prefix = '[修正インストーラー]';
    
    switch (type) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
  
  function showNotification(message, type = 'success') {
    // 通知コンテナを取得または作成
    let container = document.getElementById('csv-fix-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'csv-fix-notifications';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }
    
    // 通知要素を作成
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.padding = '12px 16px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
    notification.style.fontSize = '14px';
    notification.style.transition = 'all 0.3s ease';
    notification.style.opacity = '0';
    
    // 種類によってスタイル設定
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#4caf50';
        notification.style.color = 'white';
        break;
      case 'error':
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
        break;
      case 'warning':
        notification.style.backgroundColor = '#ff9800';
        notification.style.color = 'white';
        break;
      default:
        notification.style.backgroundColor = '#2196f3';
        notification.style.color = 'white';
    }
    
    // コンテナに追加
    container.appendChild(notification);
    
    // フェードイン
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // 一定時間後に削除
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
  
  // スクリプトが既にロードされているかチェック
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
  
  // スクリプトを順番にロード
  function loadScripts(scripts, index = 0) {
    if (index >= scripts.length) {
      log('すべてのスクリプトをロードしました');
      showNotification('CSV年度修正が適用されました！', 'success');
      return;
    }
    
    const scriptInfo = scripts[index];
    
    // 条件付きスクリプトの場合、条件をチェック
    if (scriptInfo.condition && typeof scriptInfo.condition === 'function') {
      const shouldLoad = scriptInfo.condition();
      if (!shouldLoad) {
        log(`${scriptInfo.name}は条件を満たさないためスキップします`, 'debug');
        loadScripts(scripts, index + 1);
        return;
      }
    }
    
    // すでにロード済みならスキップ
    if (isScriptLoaded(scriptInfo.path)) {
      log(`${scriptInfo.name}は既にロード済みです`, 'debug');
      loadScripts(scripts, index + 1);
      return;
    }
    
    // スクリプト要素を作成
    const script = document.createElement('script');
    script.src = scriptInfo.path + '?_=' + Date.now(); // キャッシュ防止
    
    // スクリプトロード成功時
    script.onload = function() {
      log(`${scriptInfo.name}をロードしました`);
      // 次のスクリプトをロード
      loadScripts(scripts, index + 1);
    };
    
    // スクリプトロード失敗時
    script.onerror = function() {
      const errorMsg = `${scriptInfo.name}のロードに失敗しました`;
      log(errorMsg, 'error');
      
      if (scriptInfo.required) {
        // フォールバックがあるか確認
        const fallbackScript = scripts.find(s => 
          s.name !== scriptInfo.name && 
          !isScriptLoaded(s.path) && 
          (!s.condition || (s.condition && s.condition()))
        );
        
        if (fallbackScript) {
          log(`${scriptInfo.name}のロードに失敗しましたが、フォールバックの${fallbackScript.name}を試みます`, 'warn');
          showNotification(`${scriptInfo.name}の代わりに${fallbackScript.name}を使用します`, 'warning');
          // まず現在のスクリプトをスキップして次へ
          loadScripts(scripts, index + 1);
        } else {
          // フォールバックなしでエラー表示して終了
          showNotification(`エラー: ${errorMsg}`, 'error');
        }
      } else {
        // オプションスクリプトなら次へ進む
        log('オプションスクリプトなのでスキップします', 'warn');
        loadScripts(scripts, index + 1);
      }
    };
    
    // scriptタグを挿入
    document.head.appendChild(script);
  }
  
  // 初期化
  function init() {
    log('CSV年度修正インストーラーを実行中...');
    
    // 月次レポート画面かどうかチェック
    if (window.location.pathname.includes('/monthly-report') || window.location.pathname.includes('/MonthlyReport')) {
      loadScripts(config.scripts);
    } else {
      log('月次レポート画面ではないため、スクリプトをインストールしません', 'warn');
      // 開発モードの場合は、常にインストール
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        log('開発環境を検出しました。スクリプトをインストールします。');
        loadScripts(config.scripts);
      }
    }
  }
  
  // DOMが読み込まれたら初期化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();