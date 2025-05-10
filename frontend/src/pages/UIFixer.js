/**
 * 月次報告・従業員詳細画面の表示修正スクリプト
 * 1. 月次報告画面の対象年度を非表示に
 * 2. 従業員詳細画面の対象年度を適切な位置に表示
 */
(function() {
  'use strict';
  
  // デバッグログ用の関数
  function log(message) {
    console.log('[UI修正] ' + message);
  }

  log('UI修正スクリプトを開始します');

  // 既存の監視を停止（存在する場合）
  if (window._uiFixObserver && typeof window._uiFixObserver.disconnect === 'function') {
    window._uiFixObserver.disconnect();
    log('既存の監視を停止しました');
  }

  // テキスト内容で要素を検索するヘルパー関数
  function findElementByText(selector, text) {
    return Array.from(document.querySelectorAll(selector)).find(el => 
      el.textContent && el.textContent.includes(text));
  }

  // 1. 月次報告の対象年度を非表示にする関数
  function hideMonthlyReportYearSelector() {
    log('月次報告の対象年度を非表示にします');
    
    // 月次報告タイトルを検出
    const monthlyTitle = findElementByText('h2, h3, h4', '月次報告');
      
    if (!monthlyTitle) {
      // 月次報告画面が表示されているか確認（別の方法）
      const activeTab = document.querySelector('.nav-link.active');
      if (!activeTab || !(activeTab.textContent && 
          (activeTab.textContent.includes('月次報告') || 
           activeTab.textContent.includes('月次詳細')))) {
        log('月次報告画面が表示されていません');
        return false;
      }
    }
    
    // 検出方法1: 上部の年度セレクタを非表示
    document.querySelectorAll('div.form-group, .row, .col').forEach(el => {
      if (el.textContent && el.textContent.includes('年度:') && !el.querySelector('table')) {
        el.style.cssText = 'display: none !important;';
        log('上部の年度セレクタを非表示にしました');
      }
    });
    
    // 検出方法2: 「対象年度」を含む要素を非表示
    document.querySelectorAll('label, div, span').forEach(el => {
      if (el.textContent && el.textContent.includes('対象年度')) {
        const container = el.closest('.form-group, .row, .col, div');
        if (container && !container.querySelector('table') && !container.classList.contains('employee-year-right')) {
          container.style.cssText = 'display: none !important;';
          log('対象年度を含む要素を非表示にしました');
        }
      }
    });
    
    // 検出方法3: 月次詳細タブの年度セレクタだけは表示する
    document.querySelectorAll('.monthly-report-detail select#fiscal-year-select').forEach(el => {
      el.style.cssText = 'display: inline-block !important; visibility: visible !important;';
      log('月次詳細タブの年度セレクタを表示しました');
    });
    
    // 検出方法4: 月次報告コンテナの年度選択パネルを非表示
    const topPanel = document.querySelector('.monthly-report-container > div > div:nth-child(3)');
    if (topPanel) {
      topPanel.style.cssText = 'display: none !important; visibility: hidden !important;';
      log('月次報告の上部パネルを非表示にしました');
    }
    
    return true;
  }

  // 2. 従業員詳細の対象年度を適切な位置に表示する関数
  function fixEmployeeDetailYearDisplay() {
    log('従業員詳細の対象年度表示を修正します');
    
    // 従業員詳細画面が表示されているか確認
    const employeeDetailHeading = findElementByText('h2, h3, h4', '従業員詳細');
    const activeTab = document.querySelector('.nav-link.active');
    const isEmployeeDetail = (activeTab && activeTab.textContent && activeTab.textContent.includes('従業員詳細')) || 
                            employeeDetailHeading !== undefined;
    
    if (!isEmployeeDetail) {
      log('従業員詳細画面が表示されていません');
      return false;
    }
    
    // すでに修正済みかチェック
    if (document.querySelector('.employee-year-right')) {
      log('従業員詳細の対象年度はすでに修正済みです');
      return true;
    }
    
    // 既存の年度関連要素を非表示にする
    document.querySelectorAll('label, div, span').forEach(el => {
      if (el.textContent && (el.textContent.includes('年度:') || el.textContent.includes('対象年度'))) {
        const container = el.closest('.form-group, .row, .col, div');
        if (container && !container.classList.contains('employee-year-right')) {
          container.style.cssText = 'display: none !important;';
          log('既存の年度関連要素を非表示にしました');
        }
      }
    });
    
    // 従業員詳細のヘッダーエリアを検出
    let employeeDetailHeader = null;
    
    // 方法1: 見出しの親要素を検出
    if (employeeDetailHeading) {
      employeeDetailHeader = employeeDetailHeading.closest('.row, .container, .col');
    }
    
    // 方法2: 従業員詳細ヘッダークラスを検出
    if (!employeeDetailHeader) {
      employeeDetailHeader = document.querySelector('.employee-detail-header');
    }
    
    // 方法3: ボタングループの親要素を検出
    if (!employeeDetailHeader) {
      const btnGroup = document.querySelector('.btn-group');
      if (btnGroup) {
        employeeDetailHeader = btnGroup.closest('.row, .container');
      }
    }
    
    // 方法4: 編集ボタンの親要素を検出
    if (!employeeDetailHeader) {
      const editButton = findElementByText('button', '編集');
      if (editButton) {
        employeeDetailHeader = editButton.closest('.row, .container, .col');
      }
    }
    
    if (!employeeDetailHeader) {
      log('従業員詳細のヘッダーエリアが見つかりません');
      return false;
    }
    
    // 新しい対象年度表示を作成
    const yearDisplay = document.createElement('div');
    yearDisplay.className = 'employee-year-right';
    yearDisplay.style.cssText = 'display: flex; justify-content: flex-end; align-items: center; margin-bottom: 10px;';
    
    // 現在の年度を取得
    const currentYear = new Date().getFullYear();
    
    // 横並びの要素として構築
    yearDisplay.innerHTML = `
      <div style="margin-left: auto; display: flex; align-items: center;">
        <span style="font-weight: bold; margin-right: 5px;">対象年度:</span>
        <select class="form-control form-control-sm" style="display: inline-block; width: auto; padding: 4px 8px; height: auto;">
          <option value="${currentYear-2}">${currentYear-2}年度</option>
          <option value="${currentYear-1}">${currentYear-1}年度</option>
          <option value="${currentYear}" selected>${currentYear}年度</option>
          <option value="${currentYear+1}">${currentYear+1}年度</option>
        </select>
      </div>
    `;
    
    // ヘッダーエリアの後に挿入
    employeeDetailHeader.parentNode.insertBefore(yearDisplay, employeeDetailHeader.nextSibling);
    log('従業員詳細の対象年度表示を追加しました');
    
    // イベントリスナーを追加
    const select = yearDisplay.querySelector('select');
    if (select) {
      select.addEventListener('change', function(e) {
        log(`年度が変更されました: ${e.target.value}`);
        
        // 年度変更イベントの発行
        const yearChangeEvent = new CustomEvent('employeeYearChanged', {
          detail: { 
            year: parseInt(e.target.value, 10),
            yearText: `${e.target.value}年度`
          },
          bubbles: true
        });
        document.dispatchEvent(yearChangeEvent);
        
        // フィードバック表示
        const feedbackText = document.createElement('span');
        feedbackText.textContent = `${e.target.value}年度のデータを表示します`;
        feedbackText.style.cssText = 'color: #3a66d4; margin-left: 10px; font-weight: normal; opacity: 0; transition: opacity 0.3s;';
        
        // 既存の通知を削除
        const existingFeedback = document.querySelector('.year-feedback');
        if (existingFeedback) {
          existingFeedback.remove();
        }
        
        // 新しい通知を追加
        feedbackText.className = 'year-feedback';
        yearDisplay.querySelector('div').appendChild(feedbackText);
        
        // フェードイン・アウト効果
        setTimeout(() => {
          feedbackText.style.opacity = '1';
          
          setTimeout(() => {
            feedbackText.style.opacity = '0';
            
            setTimeout(() => {
              if (feedbackText.parentNode) {
                feedbackText.parentNode.removeChild(feedbackText);
              }
            }, 300);
          }, 3000);
        }, 10);
      });
    }
    
    return true;
  }

  // 初期実行
  setTimeout(() => {
    hideMonthlyReportYearSelector();
    fixEmployeeDetailYearDisplay();
  }, 500);

  // MutationObserverの設定
  let debounceTimer = null;
  
  const observer = new MutationObserver(function(mutations) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      // 重要な変更のみに反応
      let shouldUpdate = false;
      
      for (const mutation of mutations) {
        // 要素追加の場合
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 重要な要素の追加
              if (
                (node.textContent && (
                  node.textContent.includes('従業員詳細') || 
                  node.textContent.includes('月次報告')
                )) ||
                node.classList?.contains('tab-pane') ||
                node.querySelector?.('h2, h3, h4, button, .nav-tabs')
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
        log('重要なDOM変更を検出しました');
        hideMonthlyReportYearSelector();
        fixEmployeeDetailYearDisplay();
      }
    }, 300);
  });

  // 監視設定（最小限の設定で効率化）
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });

  // グローバル変数に保存
  window._uiFixObserver = observer;
  
  // タブ切り替えイベントでの処理
  document.addEventListener('click', function(e) {
    if (e.target.classList?.contains('nav-link') || 
        (e.target.closest && e.target.closest('.nav-link'))) {
      log('タブ切り替えを検出しました');
      
      setTimeout(() => {
        const clickedTab = e.target.closest('.nav-link') || e.target;
        const tabText = clickedTab.textContent || '';
        
        if (tabText.includes('従業員詳細')) {
          fixEmployeeDetailYearDisplay();
        } else if (tabText.includes('月次') || tabText.includes('サマリー')) {
          hideMonthlyReportYearSelector();
        }
      }, 300);
    }
  });
  
  // URL変更の検出（ページ遷移）
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      log('URL変更を検出しました');
      
      setTimeout(() => {
        if (url.includes('employee') || url.includes('staff')) {
          fixEmployeeDetailYearDisplay();
        } else if (url.includes('monthly') || url.includes('report')) {
          hideMonthlyReportYearSelector();
        }
      }, 500);
    }
  }).observe(document, {subtree: true, childList: true});
  
  // ページ読み込み完了時の処理
  window.addEventListener('load', function() {
    log('ページ読み込み完了');
    setTimeout(() => {
      hideMonthlyReportYearSelector();
      fixEmployeeDetailYearDisplay();
    }, 300);
  });

  log('UI修正スクリプトの設定が完了しました');
})();