/**
 * minimal-installer.js
 * 
 * 最小限の年度修正スクリプトとCSVハンドラを統合するインストーラ
 * - パフォーマンスへの影響を最小限に抑えた設計
 * - 他のスクリプトとの競合を避ける
 * - 必要最小限の機能だけを提供
 */

(function() {
  // ログ出力
  function log(message) {
    try {
      console.log('[最小インストーラ] ' + message);
    } catch (e) {
      // エラーを無視
    }
  }
  
  // スクリプトをロード
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src + '?_=' + Date.now(); // キャッシュ防止
      
      script.onload = () => {
        log(`スクリプト ${src} をロードしました`);
        resolve(true);
      };
      
      script.onerror = (error) => {
        log(`スクリプト ${src} のロードに失敗: ${error}`);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  }
  
  // 月次レポート画面かどうかを判定
  function isMonthlyReportPage() {
    return window.location.pathname.includes('/monthly-report') || 
           window.location.pathname.includes('/MonthlyReport');
  }
  
  // 開発環境かどうかを判定
  function isDevelopmentEnvironment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
  
  // 初期化処理
  async function init() {
    try {
      log('最小インストーラを実行');
      
      // 月次レポート画面かチェック
      if (!isMonthlyReportPage() && !isDevelopmentEnvironment()) {
        log('月次レポート画面ではないため、スクリプトをインストールしません');
        return;
      }
      
      // スクリプトをロード
      await loadScript('/fixes/minimal-year-fix.js');
      await loadScript('/fixes/minimal-csv-handler.js');
      
      log('必要なスクリプトのロードが完了しました');
      
      // 完了通知
      if (window.MinimalYearFix && window.MinimalCSVHandler) {
        log('最小限の年度修正が適用されました');
      } else {
        log('一部のスクリプトが正常にロードされませんでした');
      }
    } catch (error) {
      log(`初期化中にエラー: ${error}`);
    }
  }
  
  // DOMの準備ができたら初期化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();