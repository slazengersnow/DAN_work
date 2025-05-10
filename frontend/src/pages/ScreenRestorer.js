/**
 * 画面表示を復元するスクリプト
 * - 以前のスクリプトによる過剰なDOM操作を修復
 * - 非表示になった要素を復元
 * - 無限ループを修正
 */
(function() {
  'use strict';
  
  // デバッグ情報を出力する関数
  function log(message) {
    console.log('[ScreenRestorer] ' + message);
  }

  log('画面復元スクリプトを開始します');

  // ステップ1: すべての既存のMutationObserverを停止
  if (window._existingYearObserver) {
    try {
      window._existingYearObserver.disconnect();
      log('既存のYearObserverを停止しました');
    } catch (e) {
      log('YearObserver停止中にエラー: ' + e.message);
    }
  }
  
  if (window._existingObservers) {
    try {
      window._existingObservers.forEach(observer => {
        if (observer && typeof observer.disconnect === 'function') {
          observer.disconnect();
        }
      });
      log('すべての既存Observerを停止しました');
    } catch (e) {
      log('Observer停止中にエラー: ' + e.message);
    }
  }
  
  if (window._uiFixObserver) {
    try {
      window._uiFixObserver.disconnect();
      log('UI修正Observerを停止しました');
    } catch (e) {
      log('UI修正Observer停止中にエラー: ' + e.message);
    }
  }
  
  if (window._employeeYearFixObserver) {
    try {
      window._employeeYearFixObserver.disconnect();
      log('従業員年度修正Observerを停止しました');
    } catch (e) {
      log('従業員年度修正Observer停止中にエラー: ' + e.message);
    }
  }

  // ステップ2: すべてのインターバルを停止
  if (window._enhancerIntervals) {
    try {
      window._enhancerIntervals.forEach(intervalId => {
        clearInterval(intervalId);
      });
      log('すべてのインターバルを停止しました');
    } catch (e) {
      log('インターバル停止中にエラー: ' + e.message);
    }
  }

  // ステップ3: 非表示にされた要素を復元
  try {
    // display: none が設定された要素を探して復元
    const hiddenElements = document.querySelectorAll('[style*="display: none"]');
    log(`非表示要素が ${hiddenElements.length} 個見つかりました`);
    
    hiddenElements.forEach(element => {
      // 月次報告の年度選択以外の要素を復元
      if (!element.textContent || 
          !element.textContent.includes('年度') || 
          !element.closest('.monthly-report-container, .page-header, .header-container')) {
        // インラインスタイルを削除
        element.style.display = '';
        element.style.visibility = '';
        log('要素を復元しました: ' + element.tagName);
      }
    });
    
    // visibility: hidden が設定された要素も復元
    const invisibleElements = document.querySelectorAll('[style*="visibility: hidden"]');
    log(`不可視要素が ${invisibleElements.length} 個見つかりました`);
    
    invisibleElements.forEach(element => {
      // 月次報告の年度選択以外の要素を復元
      if (!element.textContent || 
          !element.textContent.includes('年度') || 
          !element.closest('.monthly-report-container, .page-header, .header-container')) {
        element.style.visibility = '';
        log('不可視要素を復元しました: ' + element.tagName);
      }
    });
  } catch (e) {
    log('要素復元中にエラー: ' + e.message);
  }

  // ステップ4: bodyやhtml要素のスタイルをリセット
  try {
    document.body.style.display = '';
    document.body.style.visibility = '';
    document.documentElement.style.display = '';
    document.documentElement.style.visibility = '';
    log('body/html要素のスタイルをリセットしました');
  } catch (e) {
    log('スタイルリセット中にエラー: ' + e.message);
  }
  
  // ステップ5: スタイルシートをクリーンアップ
  try {
    // year-selector-hider-styles や monthly-view-enhancer-style などの特定のスタイル要素を削除
    const styleElements = ['year-selector-hider-styles', 'monthly-view-enhancer-style'];
    styleElements.forEach(id => {
      const styleElement = document.getElementById(id);
      if (styleElement) {
        styleElement.parentNode.removeChild(styleElement);
        log(`スタイル要素 ${id} を削除しました`);
      }
    });
  } catch (e) {
    log('スタイルシート削除中にエラー: ' + e.message);
  }

  // ステップ6: 月次報告の年度選択のみを非表示にする安全な関数
  function safelyHideYearSelector() {
    try {
      // 月次報告タイトルの確認
      const headers = document.querySelectorAll('h1, h2, h3, h4');
      let monthlyReportHeader = null;
      
      for (const header of headers) {
        if (header.textContent && header.textContent.includes('月次報告')) {
          monthlyReportHeader = header;
          break;
        }
      }

      if (!monthlyReportHeader) {
        log('月次報告のヘッダーが見つかりません');
        return;
      }

      // ヘッダーから最も近い親コンテナを取得
      const reportContainer = monthlyReportHeader.closest('.container, .content, .page, .monthly-report-container');
      
      if (!reportContainer) {
        log('月次報告のコンテナが見つかりません');
        return;
      }

      // このコンテナ内の年度セレクタを探す
      const yearSelectors = reportContainer.querySelectorAll('.form-group, .row, .col');
      
      for (const selector of yearSelectors) {
        if (selector.textContent && selector.textContent.includes('年度')) {
          // 実際に年度選択を含むか確認
          const hasSelect = selector.querySelector('select');
          const hasYearLabel = Array.from(selector.querySelectorAll('label')).some(
            label => label.textContent && label.textContent.includes('年度')
          );
          
          if (hasSelect || hasYearLabel) {
            // 対象年度の選択要素だけを非表示
            selector.style.cssText = 'display: none !important;';
            log('月次報告の年度セレクタを安全に非表示にしました');
          }
        }
      }
      
      // 月次報告コンテナの上部パネルを非表示
      const topPanel = document.querySelector('.monthly-report-container > div > div:nth-child(3)');
      if (topPanel) {
        topPanel.style.cssText = 'display: none !important;';
        log('月次報告の上部パネルを非表示にしました');
      }
      
      // 月次詳細タブの年度セレクタは表示
      document.querySelectorAll('.monthly-report-detail select#fiscal-year-select').forEach(el => {
        el.style.cssText = 'display: inline-block !important; visibility: visible !important;';
        log('月次詳細タブの年度セレクタを表示状態に復元しました');
      });
    } catch (e) {
      log('安全な非表示処理中にエラー: ' + e.message);
    }
  }
  
  // ステップ7: 従業員詳細の年度表示を確認
  function checkEmployeeYearDisplay() {
    try {
      // 従業員詳細のヘッダーを探す
      const employeeHeaders = Array.from(document.querySelectorAll('h1, h2, h3, h4')).filter(
        header => header.textContent && header.textContent.includes('従業員詳細')
      );
      
      if (employeeHeaders.length === 0) {
        log('従業員詳細のヘッダーが見つかりません');
        return;
      }
      
      // 既存の年度表示を確認
      const existingYearDisplay = document.querySelector('.employee-year-right, .employee-year-fixed, .employee-year-selector-fixed');
      
      if (existingYearDisplay) {
        log('従業員詳細の年度表示が既に存在します');
        return;
      }
      
      log('従業員詳細画面を検出しましたが、年度表示が見つかりません');
    } catch (e) {
      log('従業員年度表示確認中にエラー: ' + e.message);
    }
  }

  // 安全なMutationObserverの設定
  let isProcessing = false;
  const safeObserver = new MutationObserver(function(mutations) {
    // 実行中なら重複実行しない
    if (isProcessing) return;
    
    isProcessing = true;
    setTimeout(() => {
      try {
        // 現在表示中のページを判断して処理実行
        const monthlyHeader = Array.from(document.querySelectorAll('h1, h2, h3, h4')).some(
          header => header.textContent && header.textContent.includes('月次報告')
        );
        
        const employeeHeader = Array.from(document.querySelectorAll('h1, h2, h3, h4')).some(
          header => header.textContent && header.textContent.includes('従業員詳細')
        );
        
        if (monthlyHeader) {
          safelyHideYearSelector();
        }
        
        if (employeeHeader) {
          checkEmployeeYearDisplay();
        }
      } finally {
        isProcessing = false;
      }
    }, 100);
  });

  // 安全な設定で監視を開始（クラス変更、タブや画面切り替えの検出に必要最小限）
  safeObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributeFilter: ['class'], // クラスの変更のみ監視
    attributes: true
  });

  // 実行順序を制御するために遅延実行
  setTimeout(function() {
    safelyHideYearSelector();
    checkEmployeeYearDisplay();
    log('画面復元処理が完了しました');
  }, 500);

  // 現在のURLパスに基づいた処理の実行
  const currentPath = window.location.pathname;
  if (currentPath.includes('monthly') || currentPath.includes('report')) {
    log('月次報告のURLを検出しました');
    setTimeout(safelyHideYearSelector, 800);
  } else if (currentPath.includes('employee') || currentPath.includes('staff')) {
    log('従業員詳細のURLを検出しました');
    setTimeout(checkEmployeeYearDisplay, 800);
  }

  // グローバル変数にオブザーバーを保存
  window._screenRestorerObserver = safeObserver;
  
  log('画面復元スクリプトが設定されました');
})();