// 月次報告ページの年度・月の行を非表示にする - 複数の直接指定方法

/**
 * 目的: 月次報告ページの「年度: 2024」「月: 5月」の行を非表示にする
 * アプローチ: 複数の直接指定方法を順に試す
 */

// 各方法を試し、成功したらtrueを返す関数群
// 成功したものもあるかもしれないので、順に試していきます

// 方法1: 指定されたXPathを使用
function tryXPath() {
  try {
    const xpath = '//*[@id="root"]/div/div[2]/main/div/div[1]';
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const element = result.singleNodeValue;
    if (element) {
      element.style.display = 'none';
      console.log('成功: XPathで非表示にしました');
      return true;
    }
  } catch (e) {
    console.log('XPath方式は失敗しました');
  }
  return false;
}

// 方法2: CSSセレクタによる直接指定
function tryCSSSelectors() {
  const selectors = [
    '#root > div > div:nth-child(2) > main > div > div:first-child',
    '.container > .row:first-child',
    '.year-month-selector',
    '.date-filter-row',
    '.filter-row'
  ];
  
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = 'none';
        console.log(`成功: セレクタ "${selector}" で非表示にしました`);
        return true;
      }
    } catch (e) {
      // このセレクタは失敗、次へ
    }
  }
  
  console.log('CSSセレクタ方式は全て失敗しました');
  return false;
}

// 方法3: IDによる指定
function tryElementById() {
  // よくある要素IDを試す
  const ids = ['yearMonthSelector', 'filterRow', 'dateFilter', 'reportFilter', 'yearMonthRow'];
  
  for (const id of ids) {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
      console.log(`成功: ID "${id}" で非表示にしました`);
      return true;
    }
  }
  
  console.log('ID指定方式は失敗しました');
  return false;
}

// 方法4: テキスト内容で検索
function tryTextContent() {
  // 明確な特徴を持つテキストで要素を探す
  const elements = document.querySelectorAll('div');
  for (const element of elements) {
    if (element.textContent.includes('年度:') && element.textContent.includes('月:')) {
      element.style.display = 'none';
      console.log('成功: テキスト内容で非表示にしました');
      return true;
    }
  }
  
  console.log('テキスト内容方式は失敗しました');
  return false;
}

// 方法5: フォーム要素やセレクトボックスから特定
function tryFormElements() {
  // 年度と月のセレクトボックスを探す
  const selects = document.querySelectorAll('select');
  for (const select of selects) {
    // 年度または月を選択するセレクトボックスかチェック
    const hasYearOption = Array.from(select.options).some(opt => 
      opt.value === '2024' || opt.textContent === '2024'
    );
    
    const hasMonthOption = Array.from(select.options).some(opt => 
      opt.value === '5' || opt.textContent.includes('5月')
    );
    
    if (hasYearOption || hasMonthOption) {
      // セレクトボックスの親要素（行全体）を取得
      let parent = select.parentElement;
      while (parent && parent.tagName !== 'BODY') {
        // 行のような幅広の要素を探す
        if (parent.offsetWidth > 500) {
          parent.style.display = 'none';
          console.log('成功: セレクトボックスから親要素を特定して非表示にしました');
          return true;
        }
        parent = parent.parentElement;
      }
      
      // 適切な親が見つからなければセレクトの直接の親を非表示
      if (select.parentElement) {
        select.parentElement.style.display = 'none';
        console.log('成功: セレクトボックスの親要素を非表示にしました');
        return true;
      }
    }
  }
  
  console.log('フォーム要素方式は失敗しました');
  return false;
}

// 方法6: 更新ボタンから特定
function tryUpdateButton() {
  // 「更新」ボタンを探す
  const buttons = document.querySelectorAll('button');
  for (const button of buttons) {
    if (button.textContent === '更新' || button.innerText === '更新') {
      // ボタンの親要素（行全体）を取得
      let parent = button.parentElement;
      while (parent && parent.tagName !== 'BODY') {
        // 行のような幅広の要素を探す
        if (parent.offsetWidth > 500) {
          parent.style.display = 'none';
          console.log('成功: 更新ボタンから親要素を特定して非表示にしました');
          return true;
        }
        parent = parent.parentElement;
      }
    }
  }
  
  console.log('更新ボタン方式は失敗しました');
  return false;
}

// 方法7: JavaScriptスタイルシートを追加
function tryStyleSheet() {
  const style = document.createElement('style');
  style.textContent = `
    /* 年度・月の行を非表示にするスタイル */
    #root > div > div:nth-child(2) > main > div > div:first-child,
    div:has(select:has(option[value="2024"])),
    div:has(select:has(option[value="5"])),
    div.year-month-selector,
    div.filter-row,
    div.date-filter,
    div:has(> label:contains("年度")),
    div:has(> label:contains("月")) {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
  console.log('スタイルシートを追加しました（効果は不明）');
  return false; // 確実に成功したかどうかは分からないのでfalse
}

// 全ての方法を順番に試す
function hideYearMonthRow() {
  console.log('月次報告ページの年度・月の行を非表示にします...');
  
  // 各方法を順に試し、成功したら終了
  return tryXPath() || 
         tryCSSSelectors() || 
         tryElementById() || 
         tryTextContent() || 
         tryFormElements() || 
         tryUpdateButton() || 
         tryStyleSheet();
}

// 実行
const success = hideYearMonthRow();

if (success) {
  console.log('年度・月の行の非表示に成功しました！');
} else {
  console.log('全ての方法を試しましたが、確実な成功は確認できませんでした。');
  console.log('スタイルシートは追加されていますので、効果があるかもしれません。');
}