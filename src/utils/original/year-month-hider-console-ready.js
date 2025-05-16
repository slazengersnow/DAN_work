/**
 * 年度月非表示スクリプト（即時使用版）
 * ブラウザのコンソールに貼り付けて実行できます
 */
(function() {
  console.log('年度・月表示非表示化スクリプト実行開始');
  
  // スタイルシートを追加
  const style = document.createElement('style');
  style.id = 'year-month-hider-styles';
  style.textContent = `
    /* コンテナを非表示 */
    div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"],
    div[style*="display:flex"][style*="gap:20px"][style*="background-color:rgb(248, 249, 250)"],
    div[style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px"] {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
    }
    
    /* 年度月を含むラベル */
    label:has(+select option[value^="20"]),
    label:has(+select option[value^="1"]):has(+select option[value^="2"]),
    label:contains("年度"),
    label:contains("月:") {
      display: none !important;
    }
    
    /* スクリプトで非表示マークされた要素 */
    [data-hidden-by-script="true"] {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
    }
    
    /* タブは確実に表示 */
    .ant-tabs, .ant-tabs-nav, .ant-tabs-content,
    [role="tablist"], [role="tab"], [role="tabpanel"],
    .tab, .tabs, .tabContent, .tab-content {
      display: initial !important;
      visibility: visible !important;
      height: auto !important;
      overflow: visible !important;
    }
  `;
  document.head.appendChild(style);
  
  // 方法1: スタイル属性で検出
  const containers = document.querySelectorAll([
    'div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"]',
    'div[style*="display:flex"][style*="gap:20px"][style*="background-color:rgb(248, 249, 250)"]',
    'div[style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px"]'
  ].join(','));
  
  let count = 0;
  containers.forEach(container => {
    container.style.display = 'none';
    container.setAttribute('data-hidden-by-script', 'true');
    count++;
  });
  
  if (count > 0) {
    console.log(`スタイル属性で${count}個のコンテナを非表示にしました`);
  }
  
  // 方法2: 年度・月を含むテキストで検出
  const allDivs = document.querySelectorAll('div');
  
  allDivs.forEach(div => {
    try {
      // 年度と月を含むdivを探す
      const text = div.textContent || '';
      if ((text.includes('年度') || text.includes('年')) && 
          (text.includes('月') || text.match(/[0-9１-９]+月/))) {
        
        // タブや主要コンテンツではないことを確認
        if (!div.classList.contains('tab') && 
            !div.classList.contains('tabContent') && 
            !div.classList.contains('ant-tabs') &&
            !div.getAttribute('role') === 'tabpanel') {
          
          // 年度・月セレクタの特徴: 小さなコンテナで、selectを含む可能性がある
          if (div.querySelector('select') || div.querySelectorAll('div').length <= 5) {
            div.style.display = 'none';
            div.setAttribute('data-hidden-by-script', 'true');
            count++;
          }
        }
      }
    } catch (e) {}
  });
  
  // 年度・月のラベルを探す
  const yearLabels = Array.from(document.querySelectorAll('label')).filter(
    label => (label.textContent || '').includes('年度') || (label.textContent || '').includes('年')
  );
  
  const monthLabels = Array.from(document.querySelectorAll('label')).filter(
    label => (label.textContent || '').includes('月') && !(label.textContent || '').includes('営業月')
  );
  
  // ラベルの親要素を非表示にする
  function hideParentContainer(element, depth = 3) {
    // 最大depthレベルまで親をたどる
    let parent = element.parentElement;
    for (let i = 0; i < depth && parent; i++) {
      parent.style.display = 'none';
      parent.setAttribute('data-hidden-by-script', 'true');
      count++;
      return true;
    }
    return false;
  }
  
  // 年度ラベルを処理
  yearLabels.forEach(label => {
    hideParentContainer(label);
  });
  
  // 月ラベルを処理
  monthLabels.forEach(label => {
    hideParentContainer(label);
  });
  
  console.log(`合計${count}個の要素を非表示にしました`);
  
  // トグルボタンを追加（必要に応じて有効化）
  /* 
  function addToggleButton() {
    const button = document.createElement('button');
    button.textContent = '年度・月表示切替';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    button.style.padding = '8px 12px';
    button.style.backgroundColor = '#007bff';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    
    let hidden = true;
    
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-hidden-by-script="true"]').forEach(el => {
        if (hidden) {
          el.style.display = 'block';
        } else {
          el.style.display = 'none';
        }
      });
      
      button.textContent = hidden ? '年度・月を非表示' : '年度・月を表示';
      hidden = !hidden;
    });
    
    document.body.appendChild(button);
  }
  
  // トグルボタンを有効にする場合はコメントを解除
  // addToggleButton();
  */
  
  // 遅延実行も追加（非同期読み込み対応）
  setTimeout(function() {
    const delayedContainers = document.querySelectorAll([
      'div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"]',
      'div[style*="display:flex"][style*="gap:20px"][style*="background-color:rgb(248, 249, 250)"]'
    ].join(','));
    
    if (delayedContainers.length > 0) {
      delayedContainers.forEach(container => {
        container.style.display = 'none';
        container.setAttribute('data-hidden-by-script', 'true');
      });
      console.log(`遅延実行で${delayedContainers.length}個のコンテナを非表示にしました`);
    }
  }, 1000);
})();