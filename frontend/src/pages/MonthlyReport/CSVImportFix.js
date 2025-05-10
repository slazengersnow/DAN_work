/**
 * CSVImportFix.js
 * 月次データCSVインポート時の年度管理問題を修正する軽量スクリプト
 */

// 自己実行関数でスコープを隔離
(function() {
  // 状態変数
  let importYear = null;
  let isImporting = false;
  
  // ログ関数の上書き - 年度検出とインポート完了の監視
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    // 元のログ関数を実行
    originalConsoleLog.apply(console, args);
    
    // ログメッセージが文字列かつパターンマッチする場合に処理
    if (typeof args[0] === 'string') {
      // 年度検出のパターン
      if (args[0].includes('CSV列名から年度を検出:')) {
        const yearMatch = args[0].match(/CSV列名から年度を検出: (\d+)/);
        if (yearMatch && yearMatch[1]) {
          importYear = parseInt(yearMatch[1]);
          isImporting = true;
          console.info(`[修正] インポート年度を検出: ${importYear}年度`);
        }
      }
      
      // インポート成功のパターン
      if (args[0].includes('成功したレスポンス:')) {
        if (isImporting && importYear) {
          // インポート完了時に少し遅延して年度を強制設定
          setTimeout(() => {
            fixYearDisplay(importYear);
            showNotification(`${importYear}年度のデータを正常にインポートしました`);
            isImporting = false;
          }, 800);
        }
      }
    }
  };
  
  // 年度表示を修正する関数
  function fixYearDisplay(year) {
    // 年度選択要素を検索
    const yearSelectors = [
      document.querySelector('.year-selector'),
      document.querySelector('select[name="fiscalYear"]'),
      document.querySelector('[data-testid="year-selector"]'),
      ...Array.from(document.querySelectorAll('select')).filter(el => 
        el.options && Array.from(el.options).some(opt => opt.value === year.toString())
      )
    ].filter(Boolean);
    
    if (yearSelectors.length > 0) {
      const selector = yearSelectors[0];
      // 現在の値と異なる場合のみ更新
      if (selector.value !== year.toString()) {
        selector.value = year.toString();
        selector.dispatchEvent(new Event('change', { bubbles: true }));
        console.info(`[修正] 年度表示を${year}年度に設定しました`);
        return true;
      }
    }
    
    return false;
  }
  
  // 通知を表示する関数
  function showNotification(message, type = 'success') {
    // 既存の通知を削除
    const existingNotifications = document.querySelectorAll('.csv-import-notification');
    existingNotifications.forEach(note => note.remove());
    
    // 通知要素の作成
    const notification = document.createElement('div');
    notification.className = `csv-import-notification ${type}`;
    notification.textContent = message;
    
    // スタイル設定
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${type === 'success' ? '#4caf50' : '#f44336'};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.3s, transform 0.3s;
    `;
    
    // DOMに追加
    document.body.appendChild(notification);
    
    // アニメーション表示
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // 自動消去
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-10px)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
  
  // 初期化メッセージ
  console.info('[修正] CSVインポート修正スクリプトが初期化されました');
})();