// トラブルシューティング用診断ツール

function diagnosePageStructure() {
  console.clear();
  console.log('=== 月次報告ページ構造診断 ===');
  
  // 「年度:」「月:」を含む要素をすべて探して表示
  const yearMonthElements = Array.from(document.querySelectorAll('*'))
    .filter(el => el.textContent.includes('年度:') && el.textContent.includes('月:'));
  
  console.log(`「年度:」「月:」を含む要素数: ${yearMonthElements.length}`);
  
  yearMonthElements.forEach((el, index) => {
    console.log(`要素 ${index + 1}:`);
    console.log('- テキスト内容:', el.textContent.trim());
    console.log('- タグ名:', el.tagName);
    console.log('- クラス:', el.className);
    console.log('- ID:', el.id);
    
    // セレクタを生成
    let selector = el.tagName.toLowerCase();
    if (el.id) selector += `#${el.id}`;
    if (el.className) selector += `.${el.className.replace(/\s+/g, '.')}`;
    
    console.log('- セレクタ:', selector);
    console.log('- HTML:', el.outerHTML.substring(0, 100) + '...');
    console.log('---');
  });
  
  // #root 要素の構造を調査
  const rootElement = document.getElementById('root');
  if (rootElement) {
    console.log('#root 要素の構造:');
    console.log('- 子要素数:', rootElement.children.length);
    
    // 最初の数階層を表示
    let structure = '#root';
    let currentEl = rootElement;
    
    for (let i = 0; i < 5; i++) {
      if (currentEl.children.length === 0) break;
      currentEl = currentEl.children[0];
      structure += ` > ${currentEl.tagName.toLowerCase()}`;
      if (currentEl.className) structure += `.${currentEl.className.replace(/\s+/g, '.')}`;
    }
    
    console.log('- DOM構造:', structure + ' > ...');
  } else {
    console.log('#root 要素が見つかりません');
  }
  
  console.log('=== 診断完了 ===');
}

// 実行
diagnosePageStructure();