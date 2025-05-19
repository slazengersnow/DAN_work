// 月次報告ページの「年度」「月」行を削除する極シンプルなコード

/**
 * 画像を見る限り、対象となる要素は以下の構造になっていると思われます：
 * 
 * 年度: [2024▼] 月: [5月▼] [更新]
 * 
 * この行をシンプルに非表示にするコードです。
 */

// 以下のコードをクロードコードにコピー＆ペーストして実行するだけです

// 方法1: スクリーンショットから見た要素に直接アクセス
const yearMonthRow = document.querySelector('div:has(select[value="2024"], select[value="5月"])');
if (yearMonthRow) {
  yearMonthRow.style.display = 'none';
  console.log('成功: 年度・月の行を非表示にしました (方法1)');
} else {
  // 方法2: テキスト「年度:」と「月:」を含む要素を検索
  const divs = document.querySelectorAll('div');
  for (const div of divs) {
    if (div.textContent.includes('年度:') && div.textContent.includes('月:')) {
      div.style.display = 'none';
      console.log('成功: 年度・月の行を非表示にしました (方法2)');
      break;
    }
  }
  
  // 方法3: セレクトボックスから見つける
  const selects = document.querySelectorAll('select');
  for (const select of selects) {
    const options = select.querySelectorAll('option');
    for (const option of options) {
      if (option.textContent === '2024' || option.textContent === '5月') {
        // セレクトの親要素（おそらく行全体）を非表示
        let parent = select.parentElement;
        while (parent && parent.tagName !== 'BODY' && parent.offsetWidth < window.innerWidth * 0.8) {
          parent = parent.parentElement;
        }
        if (parent && parent.tagName !== 'BODY') {
          parent.style.display = 'none';
          console.log('成功: 年度・月の行を非表示にしました (方法3)');
          break;
        }
      }
    }
  }
  
  // 方法4: 更新ボタンから遡って見つける
  const updateButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent === '更新' || btn.innerHTML.includes('更新')
  );
  
  if (updateButton) {
    // 更新ボタンの親要素（おそらく行全体）を非表示
    let parent = updateButton.parentElement;
    while (parent && parent.tagName !== 'BODY' && parent.offsetWidth < window.innerWidth * 0.8) {
      parent = parent.parentElement;
    }
    if (parent && parent.tagName !== 'BODY') {
      parent.style.display = 'none';
      console.log('成功: 年度・月の行を非表示にしました (方法4)');
    }
  }
}