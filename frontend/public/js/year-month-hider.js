// 月次報告画面の年度・月表示を強制的に非表示にするスクリプト（シンプル版）
(function() {
  console.log('年度・月表示の非表示化スクリプト（シンプル版）を実行開始');
  
  // グローバル変数を初期化
  window._yearMonthObservers = window._yearMonthObservers || [];
  
  // 古いオブザーバーを停止
  function stopExistingObservers() {
    if (Array.isArray(window._yearMonthObservers)) {
      window._yearMonthObservers.forEach(observer => {
        try {
          if (observer && typeof observer.disconnect === 'function') {
            observer.disconnect();
          }
        } catch (e) {
          console.warn('オブザーバー停止中にエラー:', e);
        }
      });
      window._yearMonthObservers = [];
    }
  }

  // 既存のオブザーバーを停止
  stopExistingObservers();
  
  // 年度・月表示を非表示にする関数
  function hideYearMonthDisplay() {
    try {
      // 月次報告画面かどうかを確認
      const isMonthlyReport = 
        window.location.pathname.includes('monthly-report') || 
        Array.from(document.querySelectorAll('h1, h2')).some(el => 
          el.textContent && (el.textContent.includes('月次報告') || el.textContent.includes('月次詳細'))
        );

      if (!isMonthlyReport) return false;
      
      // 年度・月表示を非表示にする
      const selectors = [
        '.yearMonthDisplay',
        '.yearMonthSection',
        '.filterSection',
        '.year-month-selector',
        '[class*="yearMonth"]',
        '[class*="filter"]:not(.tabsContainer):not(.tab-container)'
      ];
      
      let elementsHidden = 0;
      
      // セレクタで指定された要素を非表示にする
      selectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            if (el.style && el.style.display !== 'none') {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.style.height = '0';
              el.style.overflow = 'hidden';
              elementsHidden++;
            }
          });
        } catch (e) {}
      });
      
      // 年度・月の文字列を含む要素を非表示にする
      document.querySelectorAll('div').forEach(div => {
        try {
          const text = div.textContent || '';
          if (
            div.style && 
            div.style.display !== 'none' && 
            (text.includes('年度') || text.includes('年')) && 
            (text.includes('月') || text.match(/\d+月/)) &&
            !div.querySelector('.tabs') && 
            !div.querySelector('.tab-content')
          ) {
            div.style.display = 'none';
            div.style.visibility = 'hidden';
            div.style.height = '0';
            div.style.overflow = 'hidden';
            elementsHidden++;
          }
        } catch (e) {}
      });
      
      // タブは確実に表示
      const tabSelectors = [
        '.monthly-tabs-area',
        '.monthly-tab',
        '.tabsContainer',
        '.ant-tabs',
        '.ant-tabs-content',
        '.ant-tabs-nav',
        '[role="tablist"]',
        '[role="tab"]',
        '[role="tabpanel"]',
        '.tab-content',
        '.tab-pane'
      ];
      
      tabSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.display = '';
              el.style.visibility = 'visible';
              el.style.opacity = '1';
              el.style.height = 'auto';
              el.style.overflow = 'visible';
              
              // タブの表示モードを適切に設定
              if (selector.includes('tabs-container') || selector.includes('tabsContainer')) {
                el.style.display = 'block';
              } else if (selector === '[role="tablist"]') {
                el.style.display = 'flex';
              } else if (selector === '[role="tab"]') {
                el.style.display = 'inline-block';
              }
            }
          });
        } catch (e) {}
      });
      
      return elementsHidden > 0;
    } catch (e) {
      console.error('非表示処理中にエラーが発生しました:', e);
      return false;
    }
  }
  
  // ページロード時に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideYearMonthDisplay);
  } else {
    hideYearMonthDisplay();
  }
  
  // 少し遅延して再実行（非同期読み込みのための対策）
  setTimeout(hideYearMonthDisplay, 500);
  setTimeout(hideYearMonthDisplay, 1000);
  
  // MutationObserverで継続的に監視
  try {
    const observer = new MutationObserver(() => {
      hideYearMonthDisplay();
    });
    
    if (document.body) {
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
      window._yearMonthObservers.push(observer);
    }
  } catch (e) {
    console.error('MutationObserver初期化エラー:', e);
  }
  
  // 定期的に実行（非同期読み込みや動的更新に対応）
  const intervalId = setInterval(hideYearMonthDisplay, 1000);
  
  // クリーンアップ関数を定義
  window._cleanupYearMonthHider = function() {
    clearInterval(intervalId);
    stopExistingObservers();
  };
  
  // グローバル関数として公開
  window.hideYearMonthDisplay = hideYearMonthDisplay;
  
  console.log('年度・月表示の監視を開始しました');
})();