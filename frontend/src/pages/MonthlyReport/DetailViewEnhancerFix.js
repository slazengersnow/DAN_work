/**
 * DetailViewEnhancer.js の無限ループを修正するスクリプト
 * パフォーマンス改善と安定性向上のための最適化を実装
 */

(function() {
  'use strict';
  
  console.log('[BugFix] DetailViewEnhancer.jsの無限ループを修正します');
  
  // 既存のMutationObserverインスタンスを全て切断
  if (window._existingObservers) {
    window._existingObservers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
        console.log('[BugFix] 既存のMutationObserverを切断しました');
      }
    });
  }
  
  // setIntervalによる定期実行をクリア
  if (window._enhancerIntervals) {
    window._enhancerIntervals.forEach(intervalId => {
      clearInterval(intervalId);
      console.log('[BugFix] 既存のインターバルをクリアしました: ' + intervalId);
    });
  }
  
  // DOM変更を最小限にするための処理済みフラグ
  let processedMonthlyReport = false;
  let processedEmployeeDetail = false;
  
  // 修正版の処理関数 - 一度だけ実行
  function fixDetailView() {
    // 月次報告の年度セレクタを非表示に（一度だけ）
    if (!processedMonthlyReport) {
      const monthlyReportContainer = document.querySelector('.monthly-report-container');
      if (monthlyReportContainer) {
        // 月次レポート上部のパネル全体を非表示
        const topPanel = document.querySelector('.monthly-report-container > div > div:nth-child(3)');
        if (topPanel) {
          topPanel.style.display = 'none';
          topPanel.style.visibility = 'hidden';
          console.log('[BugFix] 月次報告の上部パネルを非表示にしました');
          processedMonthlyReport = true;
        }
        
        // 年度ラベルを含む親要素を非表示（バックアップ対策）
        const yearLabels = Array.from(document.querySelectorAll('label')).filter(
          label => label.textContent && label.textContent.includes('年度')
        );
        
        yearLabels.forEach(label => {
          const parent = label.parentElement;
          if (parent && parent.querySelector('select') && !parent.closest('.monthly-report-detail')) {
            parent.style.display = 'none';
            parent.style.visibility = 'hidden';
            console.log('[BugFix] 月次報告の年度セレクタラベルを非表示にしました');
            processedMonthlyReport = true;
          }
        });
        
        // 月次詳細タブの年度セレクタは表示する
        const detailSelectors = document.querySelectorAll('.monthly-report-detail select#fiscal-year-select');
        detailSelectors.forEach(selector => {
          selector.style.display = 'inline-block';
          selector.style.visibility = 'visible';
          console.log('[BugFix] 月次詳細タブの年度セレクタを表示しました');
        });
      }
    }
    
    // 従業員詳細の年度セレクタを追加（一度だけ）
    if (!processedEmployeeDetail) {
      // 従業員詳細タブが表示されているか確認
      const isEmployeeDetailView = document.querySelector('.tab-pane.active .employee-detail-header') || 
                                  Array.from(document.querySelectorAll('h2, h3, h4')).some(el => 
                                    el.textContent && el.textContent.includes('従業員詳細'));
      
      if (isEmployeeDetailView) {
        // ツールバー領域を特定
        const toolbar = document.querySelector('.btn-group') || 
                        document.querySelector('button[class*="btn"]')?.parentElement;
        
        if (toolbar && !document.querySelector('.year-selector-fixed')) {
          const yearSelector = document.createElement('div');
          yearSelector.className = 'year-selector-fixed';
          yearSelector.style.display = 'inline-block';
          yearSelector.style.marginRight = '15px';
          
          const currentYear = new Date().getFullYear();
          yearSelector.innerHTML = `
            <label style="margin-right: 5px; font-weight: normal;">対象年度:</label>
            <select class="form-control form-control-sm" style="display: inline-block; width: auto;">
              <option value="${currentYear-1}">${currentYear-1}年度</option>
              <option value="${currentYear}" selected>${currentYear}年度</option>
              <option value="${currentYear+1}">${currentYear+1}年度</option>
            </select>
          `;
          
          // イベントリスナーを設定
          yearSelector.querySelector('select').addEventListener('change', function(e) {
            console.log('[BugFix] 選択された年度: ' + e.target.value);
            
            // 年度変更イベントを発行
            const yearChangeEvent = new CustomEvent('yearChanged', {
              detail: { year: parseInt(e.target.value, 10) }
            });
            document.dispatchEvent(yearChangeEvent);
          });
          
          toolbar.insertBefore(yearSelector, toolbar.firstChild);
          console.log('[BugFix] 従業員詳細の年度セレクタを追加しました');
          processedEmployeeDetail = true;
        }
      }
    }
  }
  
  // 最適化されたMutationObserver
  let debounceTimer = null;
  const observer = new MutationObserver(function(mutations) {
    // 処理を間引いて実行（デバウンス処理）
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      // 特定の変更のみに反応させる
      let shouldUpdate = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // タブペインや特定のコンテナが追加された場合のみ処理
              if (
                node.classList?.contains('tab-pane') || 
                node.querySelector?.('.tab-pane') ||
                node.classList?.contains('monthly-report-detail') ||
                node.classList?.contains('employee-detail')
              ) {
                shouldUpdate = true;
                break;
              }
            }
          }
        }
        
        if (shouldUpdate) break;
      }
      
      if (shouldUpdate) {
        console.log('[BugFix] 重要なDOM変更を検出しました（デバウンス処理後）');
        // フラグをリセットして再処理を許可
        processedMonthlyReport = false;
        processedEmployeeDetail = false;
        fixDetailView();
      }
    }, 500); // 500ms間、変更がなければ実行
  });
  
  // 状態の初期化とMutationObserverの設定
  window._existingObservers = window._existingObservers || [];
  window._existingObservers.push(observer);
  window._enhancerIntervals = window._enhancerIntervals || [];

  // 初期実行
  fixDetailView();
  
  // 監視設定（より限定的に）
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false, // 属性変更は監視しない
    characterData: false // テキスト変更は監視しない
  });
  
  // タブ切り替えイベントでの一度だけの処理
  document.addEventListener('click', function(e) {
    const isTabLink = e.target.classList.contains('nav-link') || 
                      e.target.closest('.nav-link');
                      
    if (isTabLink) {
      // タブ切り替え時にはフラグをリセットして再処理を許可
      setTimeout(() => {
        console.log('[BugFix] タブ切り替えを検出しました');
        processedMonthlyReport = false;
        processedEmployeeDetail = false;
        fixDetailView();
      }, 300);
    }
  });
  
  // ページ切り替えを検出して処理
  window.addEventListener('popstate', function() {
    setTimeout(() => {
      console.log('[BugFix] ページ遷移を検出しました');
      processedMonthlyReport = false;
      processedEmployeeDetail = false;
      fixDetailView();
    }, 300);
  });
  
  console.log('[BugFix] 修正スクリプトの適用が完了しました');
})();