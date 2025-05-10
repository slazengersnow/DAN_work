/**
 * inject-fix-scripts.js
 * 月次レポートCSVインポート修正スクリプトを自動で注入するヘルパースクリプト
 */

// スクリプトの挿入を行う関数
function injectFixScripts() {
  try {
    // 既に挿入済みかどうかを確認
    if (document.querySelector('#csv-import-fix') || document.querySelector('#year-state-manager')) {
      console.log('修正スクリプトは既に挿入されています');
      return;
    }
    
    console.log('月次レポートCSVインポート修正スクリプトを注入します...');
    
    // SimplifiedYearStateManager.js の挿入
    const yearManagerScript = document.createElement('script');
    yearManagerScript.id = 'year-state-manager';
    yearManagerScript.src = `/static/js/SimplifiedYearStateManager.js?t=${Date.now()}`;
    yearManagerScript.async = true;
    yearManagerScript.onerror = (error) => {
      console.error('SimplifiedYearStateManager.js の読み込みに失敗しました:', error);
      // インライン版をフォールバックとして挿入
      injectInlineYearManager();
    };
    document.head.appendChild(yearManagerScript);
    
    // CSVImportFix.js の挿入
    const importFixScript = document.createElement('script');
    importFixScript.id = 'csv-import-fix';
    importFixScript.src = `/static/js/CSVImportFix.js?t=${Date.now()}`;
    importFixScript.async = true;
    importFixScript.onerror = (error) => {
      console.error('CSVImportFix.js の読み込みに失敗しました:', error);
      // インライン版をフォールバックとして挿入
      injectInlineImportFix();
    };
    document.head.appendChild(importFixScript);
    
    console.log('修正スクリプトの注入が完了しました');
  } catch (error) {
    console.error('スクリプト注入中にエラーが発生しました:', error);
  }
}

// SimplifiedYearStateManager.js のインライン版を注入する関数
function injectInlineYearManager() {
  try {
    console.log('SimplifiedYearStateManager のインライン版を注入します...');
    const script = document.createElement('script');
    script.id = 'year-state-manager-inline';
    script.textContent = `
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
            const yearMatch = args[0].match(/CSV列名から年度を検出: (\\d+)/);
            if (yearMatch && yearMatch[1]) {
              importYear = parseInt(yearMatch[1]);
              isImporting = true;
              console.info(\`[YearManager] インポート年度を検出: \${importYear}\`);
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
          console.info(\`[YearManager] 年度を\${year}に設定しました\`);
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
          notification.textContent = \`\${importYear}年度のデータがインポートされました\`;
          notification.style.cssText = \`
            position: fixed; top: 20px; right: 20px; background: #4caf50;
            color: white; padding: 12px; border-radius: 4px; z-index: 9999;
            font-family: sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          \`;
          
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
    `;
    document.head.appendChild(script);
  } catch (error) {
    console.error('インラインスクリプト注入中にエラーが発生しました:', error);
  }
}

// CSVImportFix.js のインライン版を注入する関数
function injectInlineImportFix() {
  try {
    console.log('CSVImportFix のインライン版を注入します...');
    const script = document.createElement('script');
    script.id = 'csv-import-fix-inline';
    script.textContent = `
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
            const yearMatch = args[0].match(/CSV列名から年度を検出: (\\d+)/);
            if (yearMatch && yearMatch[1]) {
              importYear = parseInt(yearMatch[1]);
              isImporting = true;
              console.info(\`[修正] インポート年度を検出: \${importYear}年度\`);
            }
          }
          
          // インポート成功のパターン
          if (args[0].includes('成功したレスポンス:')) {
            if (isImporting && importYear) {
              // インポート完了時に少し遅延して年度を強制設定
              setTimeout(() => {
                fixYearDisplay(importYear);
                showNotification(\`\${importYear}年度のデータを正常にインポートしました\`);
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
            console.info(\`[修正] 年度表示を\${year}年度に設定しました\`);
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
        notification.className = \`csv-import-notification \${type}\`;
        notification.textContent = message;
        
        // スタイル設定
        notification.style.cssText = \`
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: \${type === 'success' ? '#4caf50' : '#f44336'};
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
        \`;
        
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
    `;
    document.head.appendChild(script);
  } catch (error) {
    console.error('インラインスクリプト注入中にエラーが発生しました:', error);
  }
}

// 自動実行
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFixScripts);
  } else {
    injectFixScripts();
  }
}

// エクスポート（Node.js環境での利用のため）
if (typeof module !== 'undefined') {
  module.exports = { injectFixScripts };
}