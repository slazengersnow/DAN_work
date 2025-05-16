// 月次報告ページの年度・月の選択部分を非表示にするシンプルなスクリプト

/**
 * 月次報告ページの年度・月の選択部分を非表示にするスクリプト
 * 
 * 目的: 「月次報告」というタイトルの下にある年度と月を選択する行を非表示にします
 * 画像から確認できる要素: 年度: 2024 と 月: 5月 がある行
 */

// シンプルなブックマークレット形式（ブラウザのブックマークに保存して実行可能）
javascript:(function() {
  // 1. 画面に表示されている「年度: 2024」「月: 5月」部分を非表示にする
  const yearMonthRow = document.querySelector('.react-grid-Container .react-grid-Header .header-row');
  if (yearMonthRow) {
    yearMonthRow.style.display = 'none';
    console.log('年度・月の行を非表示にしました（方法1）');
    return;
  }
  
  // 2. 「年度:」と「月:」のラベルを含む要素を探して非表示にする
  const elements = Array.from(document.querySelectorAll('div, span, label'));
  const targetElements = elements.filter(el => 
    (el.textContent.includes('年度:') && el.textContent.includes('月:')) ||
    (el.textContent.includes('年度:') && el.parentElement && el.parentElement.textContent.includes('月:'))
  );
  
  if (targetElements.length > 0) {
    // 見つかった要素の親要素（行全体）を非表示に
    targetElements.forEach(el => {
      // 親要素のどれかが行全体を表す
      let parent = el;
      for (let i = 0; i < 3; i++) {
        if (parent.parentElement) {
          parent = parent.parentElement;
          // 行っぽい要素（横幅が大きい）を見つけたら非表示に
          if (parent.offsetWidth > window.innerWidth * 0.7) {
            parent.style.display = 'none';
            console.log('年度・月の行を非表示にしました（方法2）');
            return;
          }
        }
      }
    });
    
    // 親要素が見つからなければ、要素自体を非表示に
    if (targetElements[0].parentElement) {
      targetElements[0].parentElement.style.display = 'none';
      console.log('年度・月の行を非表示にしました（方法3）');
      return;
    }
  }
  
  // 3. 年度と月を含むセレクトボックスを探す
  const selects = document.querySelectorAll('select');
  const yearMonthSelects = Array.from(selects).filter(select => 
    select.id.includes('year') || 
    select.id.includes('month') ||
    select.name.includes('year') ||
    select.name.includes('month') ||
    Array.from(select.options).some(option => option.textContent.includes('2024') || option.textContent.includes('5月'))
  );
  
  if (yearMonthSelects.length > 0) {
    // セレクトボックスの親要素（行）を非表示に
    const selectRow = yearMonthSelects[0].closest('div[class*="row"], div[class*="filter"], div.form-group, div.form-row');
    if (selectRow) {
      selectRow.style.display = 'none';
      console.log('年度・月の行を非表示にしました（方法4）');
      return;
    }
  }
  
  // 4. 画像から見た要素の配置を考慮した直接的なセレクタ
  const directSelectors = [
    '#root > div > div:nth-child(2) > main > div > div:first-child',
    'div.container > div.row:first-of-type',
    'div.year-month-selector',
    'div.filter-row',
    'form > div:first-child',
    'div:has(select[name*="year"], select[name*="month"])'
  ];
  
  for (const selector of directSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = 'none';
        console.log(`セレクタ "${selector}" で年度・月の行を非表示にしました（方法5）`);
        return;
      }
    } catch (e) {
      // 一部のセレクタは古いブラウザで対応していないため、エラー処理
    }
  }
  
  // 5. 「年度: 2024, 月: 5月」と表示されている部分を特定
  const yearMonthText = Array.from(document.querySelectorAll('div, span, p'))
    .find(el => el.textContent.match(/年度\s*[:：]\s*2024/) && el.textContent.match(/月\s*[:：]\s*5月/));
  
  if (yearMonthText) {
    // 見つかった要素またはその親要素を非表示に
    if (yearMonthText.parentElement) {
      yearMonthText.parentElement.style.display = 'none';
    } else {
      yearMonthText.style.display = 'none';
    }
    console.log('年度・月のテキストを非表示にしました（方法6）');
    return;
  }
  
  // 成功または失敗の通知
  alert('年度・月の行を非表示にする処理を実行しました。うまくいかない場合は、違う方法を試してください。');
})();