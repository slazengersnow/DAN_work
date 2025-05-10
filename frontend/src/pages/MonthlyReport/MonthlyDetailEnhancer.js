/**
 * 月次詳細画面の年度セレクタ表示/非表示を制御するスクリプト
 * このスクリプトは、月次レポートデータ表示を改善します
 */

(function() {
  'use strict';

  /**
   * 年度セレクタを制御する関数
   * - 月次詳細タブの年度セレクタを表示
   * - トップパネルの年度セレクタを非表示
   */
  function enhanceMonthlyDetailDisplay() {
    console.log('[MonthlyDetailEnhancer] 年度セレクタの表示/非表示を制御します');
    
    // スタイルの読み込み確認
    const styleExists = Array.from(document.styleSheets).some(sheet => {
      try {
        return sheet.href && sheet.href.includes('MonthlyDetailEnhancer.css');
      } catch (e) {
        return false;
      }
    });
    
    if (!styleExists) {
      console.log('[MonthlyDetailEnhancer] スタイルが読み込まれていないため、適用します');
      applyStyles();
    } else {
      console.log('[MonthlyDetailEnhancer] スタイルが既に適用されています');
    }
    
    // DOM監視を設定して動的に追加される要素にも対応
    observeDOM();
  }
  
  /**
   * スタイルを動的に適用する関数
   */
  function applyStyles() {
    const style = document.createElement('style');
    style.id = 'monthly-detail-enhancer-style';
    style.textContent = `
      /* 月次レポート画面のトップパネルの年度セレクタを非表示 */
      .monthly-report-container .monthly-tab select[value],
      .monthly-report-container > div > div > div:first-child select[value] {
        display: none !important;
      }
      
      /* 月次レポート画面のトップパネルを非表示 */
      .monthly-report-container > div > div:nth-child(3) {
        display: none !important;
      }
      
      /* 月次詳細タブの年度セレクタは表示する - 詳細な指定で上書き */
      .monthly-report-detail select#fiscal-year-select {
        display: inline-block !important;
      }
    `;
    document.head.appendChild(style);
    console.log('[MonthlyDetailEnhancer] スタイルを動的に適用しました');
  }
  
  /**
   * DOM変更を監視して動的な要素にもスタイルを適用する
   */
  function observeDOM() {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && node.querySelector) {
              // 月次詳細タブの年度セレクタを表示
              const detailSelector = node.querySelector('.monthly-report-detail select#fiscal-year-select');
              if (detailSelector) {
                detailSelector.style.display = 'inline-block';
                console.log('[MonthlyDetailEnhancer] 月次詳細タブの年度セレクタを表示しました');
              }
              
              // トップパネルの年度セレクタを非表示
              const topPanelSelector = node.querySelector('.monthly-report-container > div > div > div:first-child select');
              if (topPanelSelector) {
                topPanelSelector.style.display = 'none';
                console.log('[MonthlyDetailEnhancer] トップパネルの年度セレクタを非表示にしました');
              }
            }
          }
        }
      }
    });
    
    // document.body全体を監視
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[MonthlyDetailEnhancer] DOM監視を開始しました');
  }
  
  // 初期化関数を実行
  enhanceMonthlyDetailDisplay();
  
  // デバッグメッセージ
  console.log('[MonthlyDetailEnhancer] スクリプトが正常に実行されました');
})();