// 月次報告ページ修正スクリプト（コンソール実行用）
(function() {
  console.clear();
  console.log('%c月次報告ページ修正を開始します', 'font-size:14px; font-weight:bold; color:blue;');
  
  // アプローチ 1: CSSインジェクション
  function injectCSS() {
    console.log('方法1: CSSインジェクション');
    try {
      const style = document.createElement('style');
      style.textContent = `
        /* 年度・月の選択行を非表示 */
        #root > div > div:nth-child(2) > main > div > div:first-child,
        div:has(> select[id*="year"], > select[id*="month"]),
        div:has(label:contains("年度"), label:contains("月")),
        div.year-month-selector,
        div.filter-row,
        div.date-filter {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      console.log('- CSS追加完了');
      return true;
    } catch (e) {
      console.error('- CSSインジェクションエラー:', e.message);
      return false;
    }
  }
  
  // アプローチ 2: DOM操作（複数の検出方法）
  function manipulateDOM() {
    console.log('方法2: DOM操作');
    
    // 2.1: XPath
    try {
      const xpath = '//*[@id="root"]/div/div[2]/main/div/div[1]';
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const element = result.singleNodeValue;
      if (element) {
        element.style.display = 'none';
        console.log('- XPathで要素を非表示化しました');
        return true;
      }
    } catch (e) {
      console.error('- XPath操作エラー:', e.message);
    }
    
    // 2.2: セレクタ検索
    try {
      const selectors = [
        '#root div main div div:first-child',
        'div.year-month-selector',
        'div.filter-row',
        'div.date-filter',
        'div:has(select[name*="year"], select[name*="month"])'
      ];
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements && elements.length > 0) {
            elements.forEach(el => {
              el.style.display = 'none';
              console.log(`- セレクタ "${selector}" で要素を非表示化しました`);
            });
            return true;
          }
        } catch (e) {
          // セレクタが無効な場合はスキップ
        }
      }
    } catch (e) {
      console.error('- セレクタ検索エラー:', e.message);
    }
    
    // 2.3: テキスト内容検索
    try {
      const yearMonthTexts = ['年度:', '月:', '2024', '5月'];
      
      for (const text of yearMonthTexts) {
        const elements = Array.from(document.querySelectorAll('div, span, label'))
          .filter(el => el.textContent.includes(text));
        
        if (elements.length > 0) {
          elements.forEach(el => {
            // 親要素を遡って非表示化
            let parent = el;
            for (let i = 0; i < 3; i++) {
              parent = parent.parentElement;
              if (parent && parent.tagName.toLowerCase() === 'div') {
                parent.style.display = 'none';
                console.log(`- "${text}" を含む要素の親要素を非表示化しました`);
                break;
              }
            }
          });
          return true;
        }
      }
    } catch (e) {
      console.error('- テキスト検索エラー:', e.message);
    }
    
    return false;
  }
  
  // アプローチ 3: JavaScriptメインループ介入
  function interceptMainLoop() {
    console.log('方法3: JavaScriptメインループ介入');
    try {
      // UIフレームワークのレンダリングループ後に実行するため、setTimeout 0を使用
      setTimeout(() => {
        const elements = document.querySelectorAll('div');
        
        elements.forEach(el => {
          // 年度・月の選択肢を含む要素を特定
          if (
            (el.textContent.includes('年度') && el.textContent.includes('月')) ||
            (el.innerHTML.includes('select') && 
             (el.innerHTML.includes('2024') || el.innerHTML.includes('5月')))
          ) {
            el.style.display = 'none';
            console.log('- メインループ介入による要素の非表示化に成功しました');
          }
        });
      }, 0);
      
      return true;
    } catch (e) {
      console.error('- メインループ介入エラー:', e.message);
      return false;
    }
  }
  
  // アプローチ 4: MutationObserver（動的変更監視）
  function setupMutationObserver() {
    console.log('方法4: MutationObserver設定');
    try {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            // 新しく追加された要素をチェック
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // 年度・月の選択肢を含む要素を特定
                if (
                  (node.textContent && node.textContent.includes('年度') && node.textContent.includes('月')) ||
                  (node.innerHTML && node.innerHTML.includes('select') && 
                   (node.innerHTML.includes('2024') || node.innerHTML.includes('5月')))
                ) {
                  node.style.display = 'none';
                  console.log('- MutationObserverによる要素の非表示化に成功しました');
                }
              }
            });
          }
        });
      });
      
      // 監視を開始
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('- MutationObserver監視を開始しました');
      
      // 10秒後に自動停止（パフォーマンス対策）
      setTimeout(() => {
        observer.disconnect();
        console.log('- MutationObserver監視を終了しました');
      }, 10000);
      
      return true;
    } catch (e) {
      console.error('- MutationObserver設定エラー:', e.message);
      return false;
    }
  }
  
  // アプローチ 5: React/Vueアプリケーション検出と対応
  function handleJSFrameworks() {
    console.log('方法5: JSフレームワーク対応');
    
    // React検出
    if (window.React || document.querySelector('[data-reactroot], [data-reactid]')) {
      console.log('- Reactアプリケーションを検出しました');
      
      try {
        // Reactデバッガーが利用可能な場合
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          console.log('- React Devtools hookを検出しました');
          
          // Reactコンポーネントツリーへのアクセスを試みる
          const reactInstances = [];
          const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
          
          if (hook.renderers && hook.renderers.size > 0) {
            const renderer = Array.from(hook.renderers.values())[0];
            
            if (renderer && renderer.findFiberByHostInstance) {
              document.querySelectorAll('div').forEach(node => {
                try {
                  const fiber = renderer.findFiberByHostInstance(node);
                  if (fiber) {
                    reactInstances.push({ node, fiber });
                  }
                } catch (e) {}
              });
            }
          }
          
          console.log(`- ${reactInstances.length}のReactインスタンスを検出`);
          
          // 年度・月の選択肢を含むコンポーネントを探す
          reactInstances.forEach(({ node, fiber }) => {
            if (
              node.textContent.includes('年度') && 
              node.textContent.includes('月')
            ) {
              node.style.display = 'none';
              console.log('- Reactコンポーネントを非表示化しました');
            }
          });
        }
      } catch (e) {
        console.error('- React操作エラー:', e.message);
      }
    }
    
    // Vue検出
    if (window.Vue || document.querySelector('[v-app], [v-model], [v-if]')) {
      console.log('- Vueアプリケーションを検出しました');
      
      try {
        // Vue DevtoolsのAPIを使用
        if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
          console.log('- Vue Devtools hookを検出しました');
          
          // Vueアプリケーションインスタンスへのアクセスを試みる
          const hook = window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
          
          if (hook.Vue) {
            // Vue 2
            const vm = hook.Vue.prototype.$root;
            console.log('- Vueルートインスタンスにアクセスしました', vm);
          }
        }
        
        // Vueコンポーネントに影響を与える一般的なアプローチ
        document.querySelectorAll('[v-app], [data-v-app]').forEach(el => {
          const yearMonthEl = el.querySelector('div:has(select)');
          if (yearMonthEl) {
            yearMonthEl.style.display = 'none';
            console.log('- Vueコンポーネントを非表示化しました');
          }
        });
      } catch (e) {
        console.error('- Vue操作エラー:', e.message);
      }
    }
    
    return false;
  }
  
  // 全てのアプローチを順番に実行
  let success = false;
  
  // 1. CSSインジェクション
  success = injectCSS() || success;
  
  // 2. DOM操作
  success = manipulateDOM() || success;
  
  // 3. メインループ介入
  success = interceptMainLoop() || success;
  
  // 4. MutationObserver
  success = setupMutationObserver() || success;
  
  // 5. JSフレームワーク対応
  success = handleJSFrameworks() || success;
  
  // 結果報告
  if (success) {
    console.log('%c月次報告ページの修正に成功しました！', 'color:green; font-weight:bold;');
  } else {
    console.error('%c月次報告ページの修正に失敗しました。', 'color:red; font-weight:bold;');
    console.log('開発者ツール (F12) を開き、詳細なエラーメッセージを確認してください。');
  }
})();