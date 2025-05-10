// ページ読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
  // 指定されたセレクタの要素を取得して非表示にする
  const element = document.querySelector('body > div > div > div:nth-child(2) > main > div > div:nth-child(1)');
  if (element) {
    element.style.display = 'none';
  }
});