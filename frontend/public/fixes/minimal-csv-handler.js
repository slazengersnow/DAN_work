/**
 * minimal-csv-handler.js
 * 
 * CSVインポートボタンに直接イベントリスナーを追加し、
 * インポート完了後に年度を復元する最小限の実装です。
 */

(function() {
  // 安全なログ関数
  function log(message) {
    try {
      console.log('[CSV最小ハンドラ] ' + message);
    } catch (e) {
      // ログエラーを無視
    }
  }
  
  // CSVインポートボタンを検出して監視を設定
  function setupImportButtonHandler() {
    try {
      // インポートボタンの検出
      const importButtons = [];
      
      // テキストによる検索
      const allButtons = document.querySelectorAll('button');
      for (const button of allButtons) {
        const text = button.textContent || '';
        if (text.includes('インポート') || 
            text.includes('CSV') || 
            text.includes('取込') || 
            text.includes('読込')) {
          importButtons.push(button);
        }
      }
      
      // クラス・ID・属性による検索
      const attrButtons = document.querySelectorAll(
        'button[class*="import"], ' + 
        'button[id*="import"], ' + 
        'button[class*="csv"], ' + 
        'button[id*="csv"], ' + 
        'input[type="file"][accept*="csv"]'
      );
      
      for (const button of attrButtons) {
        if (!importButtons.includes(button)) {
          importButtons.push(button);
        }
      }
      
      // 検出できなかった場合
      if (importButtons.length === 0) {
        log('インポートボタンが見つかりませんでした');
        return false;
      }
      
      log(`${importButtons.length}個のインポートボタンを検出`);
      
      // 各ボタンにクリックイベントリスナーを追加
      for (const button of importButtons) {
        button.addEventListener('click', function() {
          log('インポートボタンがクリックされました');
          
          // 年度情報を保存（現在の年度を記録）
          if (window.MinimalYearFix) {
            window.MinimalYearFix.detect();
          }
          
          // インポート完了を検出するために、少し遅延してから年度を復元
          setTimeout(function() {
            log('インポート完了後の年度復元を実行');
            if (window.MinimalYearFix) {
              window.MinimalYearFix.restore();
            } else if (window.restoreYear) {
              window.restoreYear();
            }
          }, 2000);
          
          // インポート完了チェックを複数回実行
          for (let delay of [3000, 5000, 8000]) {
            setTimeout(function() {
              if (window.MinimalYearFix) {
                window.MinimalYearFix.restore();
              } else if (window.restoreYear) {
                window.restoreYear();
              }
            }, delay);
          }
        });
        
        log(`ボタン "${button.textContent || button.id || 'unnamed'}" にリスナーを設定`);
      }
      
      return true;
    } catch (e) {
      log('ボタンハンドラエラー: ' + e.message);
      return false;
    }
  }
  
  // ページロード時にボタンハンドラを設定
  function init() {
    try {
      log('CSV最小ハンドラを初期化');
      
      // DOMの準備ができていれば即時実行
      if (document.readyState !== 'loading') {
        setupImportButtonHandler();
      } else {
        // DOMの準備ができたら実行
        document.addEventListener('DOMContentLoaded', () => {
          setupImportButtonHandler();
        });
      }
      
      // ダイナミックに追加される可能性のあるボタンのために
      // MutationObserverを短時間だけ使用
      setTimeout(() => {
        setupImportButtonHandler();
      }, 2000);
      
      // グローバルアクセス用
      window.MinimalCSVHandler = {
        setup: setupImportButtonHandler
      };
    } catch (e) {
      log('初期化エラー: ' + e.message);
    }
  }
  
  // 初期化実行
  init();
})();