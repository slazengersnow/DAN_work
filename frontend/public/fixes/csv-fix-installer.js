/**
 * csv-fix-installer.js
 * CSVインポート修正スクリプトのインストーラー
 * 
 * DOM要素検出エラーを解決した改良版スクリプトをインストールします。
 * 以下の機能を提供:
 * 1. 堅牢なDOM要素検出
 * 2. MutationObserverによる要素監視
 * 3. 強化されたエラーハンドリング
 * 4. 詳細なデバッグ情報
 */

(function() {
  // 実行済みフラグ
  if (window.__csvFixInstalled) {
    console.log('CSVインポート修正スクリプトは既にインストールされています');
    return;
  }
  
  // スクリプトをロードする関数
  function loadScript(src, id) {
    return new Promise((resolve, reject) => {
      try {
        // 既存のスクリプトチェック
        const existingScript = document.getElementById(id);
        if (existingScript) {
          console.log(`スクリプト ${id} は既に読み込まれています`);
          return resolve(existingScript);
        }
        
        console.log(`スクリプト ${src} を読み込んでいます...`);
        
        // スクリプト要素の作成
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        
        // ロード完了ハンドラ
        script.onload = () => {
          console.log(`スクリプト ${src} の読み込みが完了しました`);
          resolve(script);
        };
        
        // エラーハンドラ
        script.onerror = (error) => {
          console.error(`スクリプト ${src} の読み込みに失敗しました:`, error);
          reject(new Error(`スクリプト ${src} の読み込みに失敗しました`));
        };
        
        // DOMに追加
        document.head.appendChild(script);
      } catch (err) {
        console.error('スクリプト読み込み中にエラーが発生しました:', err);
        reject(err);
      }
    });
  }
  
  // インラインスクリプトを注入する関数
  function injectInlineScript(code, id) {
    try {
      // 既存のスクリプトチェック
      if (document.getElementById(id)) {
        console.log(`インラインスクリプト ${id} は既に注入されています`);
        return;
      }
      
      console.log(`インラインスクリプト ${id} を注入しています...`);
      
      // スクリプト要素の作成
      const script = document.createElement('script');
      script.id = id;
      script.textContent = code;
      
      // DOMに追加
      document.head.appendChild(script);
      console.log(`インラインスクリプト ${id} の注入が完了しました`);
    } catch (err) {
      console.error('インラインスクリプト注入中にエラーが発生しました:', err);
    }
  }
  
  // 通知を表示する関数
  function showNotification(message, type = 'success') {
    try {
      // 通知要素の作成
      const notification = document.createElement('div');
      notification.className = `csv-fix-notification ${type}`;
      notification.textContent = message;
      
      // スタイル設定
      notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 16px;
        text-align: center;
        max-width: 80%;
      `;
      
      // DOMに追加
      document.body.appendChild(notification);
      
      // 自動消去
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    } catch (err) {
      console.error('通知表示中にエラーが発生しました:', err);
    }
  }
  
  // 外部スクリプトのロードを試みる
  async function loadExternalScript() {
    try {
      // 外部スクリプトをロード
      await loadScript('./fixes/enhanced-csv-fix.js', 'enhanced-csv-fix');
      console.log('CSVインポート修正スクリプトのロードに成功しました');
      showNotification('CSVインポート修正スクリプトを適用しました', 'success');
      window.__csvFixInstalled = true;
      return true;
    } catch (err) {
      console.error('外部スクリプトのロードに失敗しました。インラインスクリプトを試みます:', err);
      return false;
    }
  }
  
  // フォールバックとしてのインラインスクリプト
  function injectFallbackScript() {
    console.log('フォールバックスクリプトを注入します');
    
    // 簡易版のインラインスクリプト
    const fallbackCode = `
    /**
     * CSVインポート修正スクリプト (フォールバック版)
     */
    (function() {
      // 状態変数
      let importYear = null;
      let isImporting = false;
      
      // ログ監視関数
      const originalConsoleLog = console.log;
      console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        
        if (typeof args[0] === 'string') {
          // 年度検出
          if (args[0].includes('CSV列名から年度を検出:')) {
            const yearMatch = args[0].match(/CSV列名から年度を検出: (\\d+)/);
            if (yearMatch && yearMatch[1]) {
              importYear = parseInt(yearMatch[1]);
              isImporting = true;
              console.info(\`[修正] インポート年度を検出: \${importYear}年度\`);
            }
          }
          
          // インポート成功
          if (args[0].includes('成功したレスポンス:') || args[0].includes('インポートしました')) {
            if (isImporting && importYear) {
              setTimeout(() => {
                // 年度選択要素を検索
                const selectors = [
                  document.querySelector('select[name="fiscalYear"]'),
                  document.querySelector('[data-testid="year-selector"]'),
                  document.querySelector('.year-selector'),
                  ...Array.from(document.querySelectorAll('select')).filter(el => 
                    el.options && Array.from(el.options).some(opt => opt.value === importYear.toString())
                  )
                ].filter(Boolean);
                
                // 見つかった要素で年度を変更
                if (selectors.length > 0) {
                  const selector = selectors[0];
                  selector.value = importYear.toString();
                  selector.dispatchEvent(new Event('change', { bubbles: true }));
                  console.info(\`[修正] 年度を\${importYear}年度に設定しました\`);
                  
                  // 通知表示
                  const notification = document.createElement('div');
                  notification.textContent = \`\${importYear}年度のデータをインポートしました\`;
                  notification.style.cssText = \`
                    position: fixed; top: 20px; right: 20px; background: #4caf50;
                    color: white; padding: 12px; border-radius: 4px; z-index: 9999;
                    font-family: sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    opacity: 0; transform: translateY(-10px); transition: all 0.3s;
                  \`;
                  
                  document.body.appendChild(notification);
                  setTimeout(() => {
                    notification.style.opacity = '1';
                    notification.style.transform = 'translateY(0)';
                  }, 10);
                  
                  setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateY(-10px)';
                    setTimeout(() => notification.remove(), 300);
                  }, 5000);
                }
                
                isImporting = false;
              }, 800);
            }
          }
        }
      };
      
      // ボタンクリック監視
      document.addEventListener('click', event => {
        if (event.target && event.target.tagName === 'BUTTON' && 
            (event.target.textContent.includes('インポート') || 
             event.target.textContent.includes('Import'))) {
          isImporting = true;
          console.info('[修正] インポート処理を検出しました');
        }
      }, true);
      
      console.info('[修正] CSVインポート修正スクリプト (フォールバック版) が初期化されました');
    })();
    `;
    
    // インラインスクリプトを注入
    injectInlineScript(fallbackCode, 'csv-fix-fallback');
    showNotification('CSVインポート修正スクリプト (簡易版) を適用しました', 'info');
    window.__csvFixInstalled = true;
  }
  
  // メイン処理関数
  async function main() {
    console.log('CSVインポート修正ツールのインストールを開始します...');
    
    try {
      // DOMが読み込まれているか確認
      if (document.readyState === 'loading') {
        console.log('DOMがまだ読み込み中です。DOMContentLoadedイベントを待ちます...');
        
        // DOMの読み込み完了を待つ
        document.addEventListener('DOMContentLoaded', async () => {
          const success = await loadExternalScript();
          if (!success) {
            injectFallbackScript();
          }
        });
      } else {
        // すでにDOMが読み込まれている場合は即時実行
        const success = await loadExternalScript();
        if (!success) {
          injectFallbackScript();
        }
      }
    } catch (err) {
      console.error('インストール中にエラーが発生しました:', err);
      // 最終手段としてフォールバックを試行
      injectFallbackScript();
    }
  }
  
  // 実行
  main();
})();

// ブックマークレット用のワンライナーコード:
// javascript:(function(){var s=document.createElement('script');s.src='/fixes/csv-fix-installer.js';s.async=true;document.body.appendChild(s);})();