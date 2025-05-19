// 月次報告ページの年度・月の行を削除するためのコード分析と改善版

/**
 * 前回の反省点:
 * 1. DOM構造が想定と異なっていた可能性がある
 * 2. XPathだけでは要素の特定が不十分だった
 * 3. ブックマークレット形式になっていなかった
 * 4. 実行タイミングが適切でなかった可能性がある
 * 5. CSSセレクタと組み合わせた複数のアプローチを用意していなかった
 */

/**
 * ブックマークレット形式のコード
 * 複数の手法を組み合わせて要素を特定・削除する
 */
javascript:(function() {
  // 実行開始のログ
  console.log('月次報告ページの年度・月行削除スクリプトを実行します...');
  
  // 方法1: XPathで指定された要素を取得
  function removeByXPath() {
    const xpath = '//*[@id="root"]/div/div[2]/main/div/div[1]';
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const element = result.singleNodeValue;
    
    if (element) {
      console.log('XPathで要素を特定しました');
      element.style.display = 'none'; // 要素を非表示
      return true;
    }
    return false;
  }
  
  // 方法2: CSSセレクタで年度・月の行を特定
  function removeByCssSelector() {
    // 年度・月の選択肢がある行を特定するための複数のセレクタを試す
    const selectors = [
      '#root div main div div:first-child',
      'div[class*="year"], div[class*="month"]',
      'div:has(select[name*="year"], select[name*="month"])',
      'div:has(select option[value="2024"])',
      'div:contains("年度:")',
      'div.year-month-selector',
      'div.filter-row'
    ];
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          console.log(`CSSセレクタ "${selector}" で要素を特定しました`);
          elements.forEach(el => el.style.display = 'none');
          return true;
        }
      } catch (e) {
        console.log(`セレクタ "${selector}" は無効または要素が見つかりませんでした`);
      }
    }
    return false;
  }
  
  // 方法3: 年度と月の文字列を含む要素を特定
  function removeByContent() {
    // 年度と月の文字列を含む要素や選択肢を持つ要素を探す
    const yearMonthTexts = ['年度:', '月:', '2024', '5月'];
    
    for (const text of yearMonthTexts) {
      const elements = Array.from(document.querySelectorAll('div, span, label'))
        .filter(el => el.textContent.includes(text));
      
      if (elements.length > 0) {
        console.log(`"${text}" を含む要素を特定しました`);
        
        // 親要素まで遡って隠す (最大3階層)
        elements.forEach(el => {
          let parent = el;
          for (let i = 0; i < 3; i++) {
            parent = parent.parentElement;
            if (parent && parent.tagName.toLowerCase() === 'div') {
              parent.style.display = 'none';
              console.log('親要素を非表示にしました');
              break;
            }
          }
        });
        return true;
      }
    }
    return false;
  }
  
  // 方法4: 年度・月選択が含まれるフォーム要素全体を特定
  function removeFormSection() {
    // フォーム要素やフィルター部分を探す
    const forms = document.querySelectorAll('form, div[class*="filter"], div[class*="search"]');
    
    if (forms.length > 0) {
      console.log('フォーム要素を特定しました');
      forms.forEach(form => {
        // 年度・月の選択肢を含むか確認
        if (form.textContent.includes('年度') || form.textContent.includes('月') ||
            form.innerHTML.includes('select') || form.innerHTML.includes('option')) {
          form.style.display = 'none';
          return true;
        }
      });
    }
    return false;
  }
  
  // 実行順序付きの関数呼び出し
  let success = false;
  
  // 1. XPathによる削除を試みる
  success = removeByXPath();
  if (success) {
    console.log('XPathによる削除に成功しました');
  } else {
    // 2. CSSセレクタによる削除を試みる
    success = removeByCssSelector();
    if (success) {
      console.log('CSSセレクタによる削除に成功しました');
    } else {
      // 3. コンテンツによる削除を試みる
      success = removeByContent();
      if (success) {
        console.log('コンテンツによる削除に成功しました');
      } else {
        // 4. フォーム要素による削除を試みる
        success = removeFormSection();
        if (success) {
          console.log('フォーム要素による削除に成功しました');
        } else {
          // すべての方法が失敗した場合
          console.error('すべての方法で要素の特定に失敗しました。');
          alert('月次報告の年度・月の行を削除できませんでした。ページ構造が想定と異なる可能性があります。');
        }
      }
    }
  }
  
  if (success) {
    console.log('処理が完了しました！');
  }
})();