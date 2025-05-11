// タブ表示を強制するスクリプト
(function() {
  function forceTabDisplay() {
    // hide-year-month.jsの関数を無効化
    window.hideYearMonthElements = function() {
      console.log('hideYearMonthElements関数は無効化されました');
      return false;
    };
    
    // タブ要素を復元
    const tabSelectors = [
      '.monthly-tabs-area',
      '.monthly-report-tabs-container',
      '#secure-tabs-area',
      '[data-tab-container="true"]',
      '[data-role="monthly-tabs"]',
      '[data-tab-content]',
      '.ant-tabs',
      '.ant-tabs-content',
      '.ant-tabs-nav'
    ];
    
    tabSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'block';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
        }
      });
    });
  }
  
  // DOMContentLoadedイベントで実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceTabDisplay);
  } else {
    forceTabDisplay();
  }
  
  // 定期的に実行
  setInterval(forceTabDisplay, 100);
})();