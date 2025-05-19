/**
 * 代替案: DOM Observerを使用した方法
 * ページの動的な変更に対応する場合はこちらを使用
 */
javascript:(function() {
  // ターゲット要素がDOMに追加されるのを監視
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        // 年度・月の行を特定して非表示に
        const yearMonthRow = document.querySelector(
          '#root div main div div:first-child, ' +
          'div:has(select[name*="year"], select[name*="month"])'
        );
        
        if (yearMonthRow) {
          yearMonthRow.style.display = 'none';
          console.log('年度・月の行を非表示にしました');
          observer.disconnect(); // 監視を停止
        }
      }
    });
  });
  
  // DOM全体を監視
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('DOM監視を開始しました');
  
  // 5秒後にObserverを自動停止
  setTimeout(() => {
    observer.disconnect();
    console.log('DOM監視を終了しました');
  }, 5000);
})();