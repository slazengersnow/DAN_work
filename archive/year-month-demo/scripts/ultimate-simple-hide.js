// スタイルシートで非表示にする（最も確実な方法）
document.head.insertAdjacentHTML('beforeend', 
  '<style>' +
  '#root > div > div:nth-child(2) > main > div > div:first-child {display: none !important;}' +
  'div:has(select), div:has(label:contains("年度")), div:has(label:contains("月")) {display: none !important;}' +
  '</style>'
);

// 直接指定（成功率高）
try {
  const element = document.querySelector('#root > div > div:nth-child(2) > main > div > div:first-child');
  if (element) {
    element.style.display = 'none';
    console.log('直接指定で成功しました');
  }
} catch (e) {
  console.log('直接指定は失敗しました');
}

// テキスト検索（シンプルで確実）
const allDivs = document.querySelectorAll('div');
for (const div of allDivs) {
  if (div.textContent.includes('年度:') && div.textContent.includes('月:')) {
    div.style.display = 'none';
    console.log('テキスト検索で成功しました');
    break;
  }
}

console.log('月次報告の年度・月の行を非表示にする処理を実行しました。画面を確認してください。');