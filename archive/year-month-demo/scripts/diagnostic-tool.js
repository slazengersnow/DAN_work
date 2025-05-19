// 月次報告ページ診断ツール
(function() {
  console.clear();
  console.log('%c月次報告ページ診断ツール', 'font-size:16px; font-weight:bold; color:blue;');
  
  // 1. ページ情報収集
  console.log('%cページ情報:', 'font-weight:bold;');
  console.log('URL:', window.location.href);
  console.log('タイトル:', document.title);
  console.log('フレームワーク検出:');
  
  // フレームワーク検出
  const frameworks = {
    'React': !!window.React || !!document.querySelector('[data-reactroot], [data-reactid]'),
    'Angular': !!window.angular || !!document.querySelector('[ng-app], [ng-controller], [ng-model]'),
    'Vue': !!window.Vue || !!document.querySelector('[v-app], [v-model], [v-if]'),
    'jQuery': typeof jQuery !== 'undefined'
  };
  
  Object.entries(frameworks).forEach(([name, detected]) => {
    console.log(`- ${name}: ${detected ? '検出' : '未検出'}`);
  });
  
  // 2. 年度・月行の要素検出
  console.log('%c年度・月行の検出:', 'font-weight:bold;');
  
  // 検出方法の配列
  const detectionMethods = [
    {
      name: 'XPath (指定されたパス)',
      code: () => {
        const xpath = '//*[@id="root"]/div/div[2]/main/div/div[1]';
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const element = result.singleNodeValue;
        return { found: !!element, element };
      }
    },
    {
      name: 'セレクタ (年度/月を含む)',
      code: () => {
        const elements = document.querySelectorAll('div:has(select), div:has(input[type="month"])');
        return { found: elements.length > 0, elements: Array.from(elements) };
      }
    },
    {
      name: 'テキスト検索 (年度/月)',
      code: () => {
        const textNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes('年度') || node.textContent.includes('月:')) {
            textNodes.push(node.parentElement);
          }
        }
        return { found: textNodes.length > 0, elements: textNodes };
      }
    },
    {
      name: 'フォーム要素',
      code: () => {
        const forms = document.querySelectorAll('form');
        const relevantForms = Array.from(forms).filter(form => {
          return form.innerHTML.includes('年度') || form.innerHTML.includes('月');
        });
        return { found: relevantForms.length > 0, elements: relevantForms };
      }
    },
    {
      name: 'Shadow DOM 検索',
      code: () => {
        const hostElements = document.querySelectorAll('*');
        const shadowRoots = [];
        hostElements.forEach(host => {
          if (host.shadowRoot) {
            shadowRoots.push(host.shadowRoot);
          }
        });
        return { found: shadowRoots.length > 0, elements: shadowRoots };
      }
    }
  ];
  
  // 各検出方法を実行
  detectionMethods.forEach(method => {
    try {
      console.log(`検出方法: ${method.name}`);
      const result = method.code();
      console.log(`- 結果: ${result.found ? '要素を発見' : '要素なし'}`);
      if (result.found) {
        if (Array.isArray(result.elements)) {
          console.log(`- ${result.elements.length}個の要素が見つかりました`);
          result.elements.forEach((el, i) => {
            if (i < 3) { // 最初の3つだけ表示
              console.log(`  要素${i+1}:`, el);
              console.log(`  HTML: ${el.outerHTML?.substring(0, 100)}...`);
            }
          });
          if (result.elements.length > 3) {
            console.log(`  ...(他${result.elements.length - 3}個)`);
          }
        } else {
          console.log('- 要素:', result.element);
          console.log(`- HTML: ${result.element.outerHTML?.substring(0, 100)}...`);
        }
      }
    } catch (e) {
      console.error(`- エラー: ${e.message}`);
    }
  });
  
  // 3. CSP (Content Security Policy) の検出
  console.log('%cセキュリティポリシー:', 'font-weight:bold;');
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMeta) {
    console.log('CSP Meta タグ:', cspMeta.content);
  } else {
    console.log('CSP Meta タグ: 未検出');
  }
  
  // 4. インラインスクリプト実行テスト
  console.log('%cインラインスクリプト実行テスト:', 'font-weight:bold;');
  try {
    const testDiv = document.createElement('div');
    testDiv.id = 'csp-test';
    testDiv.style.display = 'none';
    document.body.appendChild(testDiv);
    
    const script = document.createElement('script');
    script.textContent = 'document.getElementById("csp-test").setAttribute("data-test", "passed");';
    document.body.appendChild(script);
    
    setTimeout(() => {
      const result = document.getElementById('csp-test').getAttribute('data-test') === 'passed';
      console.log('インラインスクリプト実行:', result ? '成功' : '失敗');
      document.body.removeChild(testDiv);
      document.body.removeChild(script);
    }, 100);
  } catch (e) {
    console.error('インラインスクリプト実行エラー:', e.message);
  }
  
  // 5. 解決策の提案
  console.log('%c解決策の提案:', 'font-weight:bold; color:green;');
  console.log('1. 直接コンソールで実行できる修正コード');
  console.log('2. ブラウザ拡張機能を使用した解決策');
  console.log('3. 開発者に問い合わせ');
  
  console.log('%c診断完了', 'font-size:16px; font-weight:bold; color:blue;');
})();