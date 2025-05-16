// エラーハンドリング付きバージョン
try {
  document.querySelector('div:has(div:contains("年度:"))').style.display = 'none';
  console.log('成功: 年度・月の行を非表示にしました');
} catch (e) {
  console.error('エラー: セレクタが見つかりませんでした', e);
  // 代替方法
  const divs = document.querySelectorAll('div');
  for (const div of divs) {
    if (div.textContent.includes('年度:')) {
      div.style.display = 'none';
      console.log('代替方法で成功しました');
      break;
    }
  }
}