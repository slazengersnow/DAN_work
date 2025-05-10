/**
 * SimplifiedYearStateManager.js
 * CSVインポート時の年度管理を改善する簡潔なスクリプト
 */

// 年度管理の簡易実装
(() => {
  // 状態変数
  let importYear = null;
  let isImporting = false;
  
  // インポート開始時の年度をキャプチャする関数
  function captureImportYear() {
    // CSVからの年度検出ログを監視
    const consoleLogger = console.log;
    console.log = function(...args) {
      consoleLogger.apply(console, args);
      
      if (typeof args[0] === 'string' && args[0].includes('CSV列名から年度を検出:')) {
        const yearMatch = args[0].match(/CSV列名から年度を検出: (\d+)/);
        if (yearMatch && yearMatch[1]) {
          importYear = parseInt(yearMatch[1]);
          isImporting = true;
          console.info(`[YearManager] インポート年度を検出: ${importYear}`);
        }
      }
      
      // インポート成功検出
      if (typeof args[0] === 'string' && args[0].includes('成功したレスポンス:')) {
        if (isImporting && importYear) {
          setTimeout(() => forceYearChange(importYear), 500);
        }
      }
    };
  }
  
  // 年度を強制変更する関数
  function forceYearChange(year) {
    // 年度選択要素の検索
    const yearSelector = document.querySelector('.year-selector') || 
                         document.querySelector('select[name="fiscalYear"]') ||
                         document.querySelector('[data-testid="year-selector"]');
    
    if (yearSelector) {
      // 値を変更してイベントを発火
      yearSelector.value = year.toString();
      yearSelector.dispatchEvent(new Event('change', { bubbles: true }));
      console.info(`[YearManager] 年度を${year}に設定しました`);
      return true;
    }
    
    return false;
  }
  
  // CSVインポートボタンクリックを監視
  function watchImportButtons() {
    document.addEventListener('click', event => {
      // インポートボタンクリック検出
      if (event.target && event.target.tagName === 'BUTTON' && 
          (event.target.textContent.includes('インポート') || 
           event.target.textContent.includes('Import') || 
           event.target.textContent.includes('取込'))) {
        
        // 年度検出の準備
        isImporting = true;
        console.info('[YearManager] インポート処理を検出しました');
      }
    }, true);
  }
  
  // インポート完了後の通知を表示
  function showImportNotification() {
    document.addEventListener('importSuccess', () => {
      if (!importYear) return;
      
      // 簡易通知を表示
      const notification = document.createElement('div');
      notification.textContent = `${importYear}年度のデータがインポートされました`;
      notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #4caf50;
        color: white; padding: 12px; border-radius: 4px; z-index: 9999;
        font-family: sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    });
  }
  
  // 成功ログをイベントに変換
  const originalLog = console.log;
  console.log = function(...args) {
    originalLog.apply(console, args);
    
    if (typeof args[0] === 'string' && args[0].includes('成功したレスポンス:')) {
      document.dispatchEvent(new CustomEvent('importSuccess'));
    }
  };
  
  // 初期化
  function init() {
    captureImportYear();
    watchImportButtons();
    showImportNotification();
    console.info('[YearManager] 初期化完了');
  }
  
  // DOMロード完了時に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();