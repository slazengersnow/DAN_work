// 年度・月表示のみを非表示にし、タブは表示するスクリプト
(function() {
  function selectiveHide() {
    // 1. 年度・月表示部分を非表示にする
    const yearMonthSelectors = [
      '.yearMonthDisplay',
      '.yearMonthSection',
      '.filterSection',
      '[class*="yearMonth"]',
      '[class*="filter"]:not(.tabsContainer):not(.ant-tabs):not(.ant-tabs-content):not(.ant-tabs-nav)'
    ];
    
    yearMonthSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      });
    });
    
    // 2. タブ部分は表示を確保
    const tabSelectors = [
      '#monthly-report-tabs',
      '.tabsContainer',
      '.ant-tabs',
      '.ant-tabs-content',
      '.ant-tabs-nav',
      '.ant-tabs-tab',
      '.ant-tabs-tabpane'
    ];
    
    tabSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = '';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
        }
      });
    });
    
    // 3. hide-year-month.jsの挙動を無害化
    if (typeof window.hideYearMonthElements === 'function') {
      window.hideYearMonthElements = function() {
        console.log('年度/月のみ非表示にしました（タブには影響なし）');
        
        // 年度/月部分のみ非表示
        document.querySelectorAll('.yearMonthDisplay, .filterSection').forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.display = 'none';
          }
        });
        
        return true; // 関数が実行されたことを示す
      };
    }
  }
  
  // ページ読み込み時と定期的に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', selectiveHide);
  } else {
    selectiveHide();
  }
  
  // 定期的に実行
  setInterval(selectiveHide, 500);
})();