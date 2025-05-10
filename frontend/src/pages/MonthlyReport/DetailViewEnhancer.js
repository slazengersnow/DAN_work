/**
 * 月次報告・従業員詳細画面のUI修正スクリプト
 * 1. 従業員詳細タブの対象年度セレクタを表示する
 * 2. 月次報告画面上部の年度選択を非表示にする
 */

(function() {
  'use strict';
  
  // デバッグ用ログ出力関数
  function logDebug(message) {
    console.log(`[DetailViewEnhancer] ${message}`);
  }
  
  logDebug('UI修正スクリプトを初期化');
  
  /**
   * 従業員詳細画面に対象年度セレクタを表示する関数
   */
  function addEmployeeYearSelector() {
    // 従業員詳細タブが表示されているか確認
    const isEmployeeDetailView = document.querySelector('.tab-pane.active .employee-detail-header') || 
                                Array.from(document.querySelectorAll('h2, h3, h4')).some(el => el.textContent.includes('従業員詳細'));
    
    if (isEmployeeDetailView) {
      logDebug('従業員詳細画面を検出しました');
      
      // ツールバー領域を特定 (ボタングループを含む領域)
      const toolbar = document.querySelector('.btn-group') || 
                     document.querySelector('button[class*="btn"]')?.parentElement;
      
      if (!toolbar) {
        logDebug('ツールバー領域が見つかりません');
        return;
      }
      
      // 既存のセレクタがなければ作成
      if (!document.querySelector('.year-selector-custom')) {
        logDebug('従業員詳細の年度セレクタを作成します');
        
        // 年度セレクタ要素を作成
        const yearSelectorDiv = document.createElement('div');
        yearSelectorDiv.className = 'year-selector-custom';
        yearSelectorDiv.style.cssText = 'display: inline-block; margin-right: 15px;';
        
        // 現在の年を取得
        const currentYear = new Date().getFullYear();
        
        // セレクタの内容を作成
        yearSelectorDiv.innerHTML = `
          <label style="margin-right: 5px; font-weight: bold;">対象年度:</label>
          <select class="form-control" id="employee-year-selector" style="display: inline-block; width: auto; height: 35px;">
            <option value="${currentYear-2}">${currentYear-2}年度</option>
            <option value="${currentYear-1}">${currentYear-1}年度</option>
            <option value="${currentYear}" selected>${currentYear}年度</option>
            <option value="${currentYear+1}">${currentYear+1}年度</option>
          </select>
        `;
        
        // イベントリスナーを設定（実際の実装ではここにデータ取得処理を追加）
        yearSelectorDiv.querySelector('select').addEventListener('change', function(e) {
          logDebug(`選択された年度: ${e.target.value}`);
          
          // 年度変更イベントを発行
          const yearChangeEvent = new CustomEvent('yearChanged', {
            detail: { year: parseInt(e.target.value, 10) }
          });
          document.dispatchEvent(yearChangeEvent);
        });
        
        // ボタングループの先頭に挿入
        toolbar.insertBefore(yearSelectorDiv, toolbar.firstChild);
        logDebug('従業員詳細の年度セレクタを追加しました');
      }
    }
  }
  
  /**
   * 月次報告画面の対象年度セレクタを非表示にする関数
   */
  function hideMonthlyReportYearSelector() {
    // 月次報告画面が表示されているか確認
    const titleElements = document.querySelectorAll('h1, h2, h3, h4, .page-title, .title');
    const isMonthlyReportView = Array.from(titleElements).some(el => el.textContent.includes('月次報告'));
    
    if (isMonthlyReportView) {
      logDebug('月次報告画面を検出しました');
      
      // 年度セレクタを複数の方法で探す
      const labelSelectors = Array.from(document.querySelectorAll('label')).filter(
        label => label.textContent.includes('年度')
      );
      
      // 年度ラベルを含む親要素を非表示
      labelSelectors.forEach(label => {
        const parent = label.parentElement;
        if (parent && parent.querySelector('select')) {
          logDebug('月次報告の年度セレクタを非表示にします');
          // セレクタの親要素全体を非表示
          parent.style.cssText = 'display: none !important; visibility: hidden !important;';
        }
      });
      
      // 月次レポート上部のパネル全体を非表示
      const topPanel = document.querySelector('.monthly-report-container > div > div:nth-child(3)');
      if (topPanel) {
        logDebug('月次報告の上部パネルを非表示にします');
        topPanel.style.cssText = 'display: none !important; visibility: hidden !important;';
      }
      
      // CSSで指定した要素のスタイルを強制
      const style = document.createElement('style');
      style.textContent = `
        .monthly-report-container .monthly-tab select[value],
        .monthly-report-container > div > div > div:first-child select[value] {
          display: none !important;
          visibility: hidden !important;
        }
        
        .monthly-report-container > div > div:nth-child(3) {
          display: none !important;
          visibility: hidden !important;
        }
        
        /* 月次詳細タブの年度セレクタは表示する */
        .monthly-report-detail select#fiscal-year-select {
          display: inline-block !important;
          visibility: visible !important;
        }
      `;
      
      // 既存のスタイル要素があれば更新、なければ追加
      const existingStyle = document.getElementById('monthly-view-enhancer-style');
      if (existingStyle) {
        existingStyle.textContent = style.textContent;
      } else {
        style.id = 'monthly-view-enhancer-style';
        document.head.appendChild(style);
        logDebug('月次報告のスタイル修正を適用しました');
      }
    }
  }
  
  /**
   * DOM変更の監視と初期適用
   */
  function setupEnhancements() {
    // 初期実行
    addEmployeeYearSelector();
    hideMonthlyReportYearSelector();
    
    // タブ切り替え時に再適用
    document.addEventListener('click', function(e) {
      const isTabLink = e.target.classList.contains('nav-link') || 
                        e.target.closest('.nav-link');
      
      if (isTabLink) {
        logDebug('タブ切り替えを検出、UIの再適用を実行します');
        
        setTimeout(function() {
          addEmployeeYearSelector();
          hideMonthlyReportYearSelector();
        }, 300);
      }
    });
    
    // DOM変更の監視
    const observer = new MutationObserver(function(mutations) {
      let shouldUpdate = false;
      
      // 特定の変更だけに反応して処理を最適化
      for (const mutation of mutations) {
        // 要素追加があった場合
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (
                node.classList?.contains('tab-pane') || 
                node.querySelector?.('.tab-pane') ||
                node.querySelector?.('select') ||
                node.tagName === 'SELECT'
              ) {
                shouldUpdate = true;
                break;
              }
            }
          }
        }
        
        // 属性変更でdisplay関連の場合
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' &&
            mutation.target.nodeType === Node.ELEMENT_NODE) {
          shouldUpdate = true;
        }
        
        if (shouldUpdate) break;
      }
      
      if (shouldUpdate) {
        logDebug('DOM変更を検出、UIの再適用を実行します');
        addEmployeeYearSelector();
        hideMonthlyReportYearSelector();
      }
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // さらに確実に適用するため定期実行する（頻度を低めに）
    setInterval(function() {
      addEmployeeYearSelector();
      hideMonthlyReportYearSelector();
    }, 3000);
    
    logDebug('監視と定期適用を設定しました');
  }
  
  // ページ読み込み完了後に実行
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupEnhancements();
  } else {
    window.addEventListener('DOMContentLoaded', setupEnhancements);
  }
  
  // 画面の完全読み込み後に再確認
  window.addEventListener('load', function() {
    logDebug('ページ読み込み完了、UI修正を再適用します');
    addEmployeeYearSelector();
    hideMonthlyReportYearSelector();
  });
  
  logDebug('スクリプトの初期化が完了しました');
})();