/**
 * 月次報告の対象年度セレクタを非表示にするスクリプト
 * - 月次報告画面の上部に表示されている年度選択部分を隠します
 * - MutationObserverの副作用を最小限に抑えて実装
 * - デバッグ情報を詳細に出力
 */
(function() {
  'use strict';
  
  // デバッグログ用の関数
  function logDebug(message) {
    console.log('[YearSelectorHider] ' + message);
  }

  logDebug('スクリプトを開始します');

  // 既存のMutationObserverを停止（存在する場合）
  if (window._existingYearObserver && typeof window._existingYearObserver.disconnect === 'function') {
    window._existingYearObserver.disconnect();
    logDebug('既存のObserverを停止しました');
  }

  // 月次報告の年度セレクタを非表示にする関数
  function hideMonthlyReportYearSelector() {
    logDebug('月次報告の年度セレクタを探しています...');
    
    // 特定方法1: 「年度:」ラベルを含む要素
    const yearLabels = Array.from(document.querySelectorAll('label')).filter(el => 
      el.textContent && el.textContent.includes('年度'));
    
    if (yearLabels.length > 0) {
      yearLabels.forEach(label => {
        // 月次詳細タブの年度セレクタは非表示にしない
        if (label.closest('.monthly-report-detail')) {
          logDebug('月次詳細タブの年度セレクタは非表示にしません');
          return;
        }
        
        // 親要素を取得（フォームグループ全体を非表示にするため）
        const formGroup = label.closest('.form-group, .form-inline, .row');
        if (formGroup) {
          // 対象年度の入力グループ全体を非表示
          formGroup.style.cssText = 'display: none !important; visibility: hidden !important;';
          logDebug('年度ラベルの親要素を非表示にしました');
          return true;
        } else {
          logDebug('年度ラベルの親要素が見つかりませんでした');
        }
      });
    }
    
    // 特定方法2: 「年度：」というテキストを含む div
    const yearTexts = Array.from(document.querySelectorAll('div')).filter(el => 
      el.textContent && el.textContent.includes('年度：'));
    
    if (yearTexts.length > 0) {
      yearTexts.forEach(text => {
        // 月次詳細タブの要素は非表示にしない
        if (text.closest('.monthly-report-detail')) {
          logDebug('月次詳細タブの年度テキストは非表示にしません');
          return;
        }
        
        // 最も近い親コンテナを非表示
        const container = text.closest('.form-group, .row, .col, .control-group');
        if (container) {
          container.style.cssText = 'display: none !important; visibility: hidden !important;';
          logDebug('「年度：」テキストのコンテナを非表示にしました');
          return true;
        } else {
          // もし親コンテナが見つからない場合は要素自体を非表示
          text.style.cssText = 'display: none !important; visibility: hidden !important;';
          logDebug('「年度：」テキスト要素を直接非表示にしました');
          return true;
        }
      });
    }
    
    // 特定方法3: 月次報告コンテナ内の最初のフォームグループ
    const monthlyReportTitles = document.querySelectorAll('h1, h2, h3, h4');
    for (const title of monthlyReportTitles) {
      if (title.textContent && title.textContent.includes('月次報告')) {
        const container = title.closest('.container, .content, .page');
        if (container) {
          const firstFormGroup = container.querySelector('.form-group, .form-row, .input-group');
          if (firstFormGroup && firstFormGroup.textContent.includes('年度')) {
            firstFormGroup.style.cssText = 'display: none !important; visibility: hidden !important;';
            logDebug('月次報告内の最初のフォームグループを非表示にしました');
            return true;
          }
        }
      }
    }
    
    // 特定方法4: スタイルベースで追加の対応
    const yearSelectors = document.querySelectorAll('select');
    for (const selector of yearSelectors) {
      // 月次詳細タブの年度セレクタは非表示にしない
      if (selector.closest('.monthly-report-detail')) {
        continue;
      }
      
      // selectの中に2024, 2025などの年号を含む選択肢があるか確認
      const hasYearOptions = Array.from(selector.options || []).some(option => 
        /20\d\d/.test(option.textContent || '')
      );
      
      if (hasYearOptions) {
        // 親要素を取得（フォームグループ全体を非表示にするため）
        const container = selector.closest('.form-group, .row, .col');
        if (container && container.textContent && container.textContent.includes('年度')) {
          container.style.cssText = 'display: none !important; visibility: hidden !important;';
          logDebug('年度選択肢を含むセレクトボックスのコンテナを非表示にしました');
          return true;
        }
      }
    }
    
    // 特定方法5: 月次報告画面のトップパネル全体を非表示
    const topPanel = document.querySelector('.monthly-report-container > div > div:nth-child(3)');
    if (topPanel) {
      topPanel.style.cssText = 'display: none !important; visibility: hidden !important;';
      logDebug('月次報告の上部パネル全体を非表示にしました');
      return true;
    }
    
    // 特定方法6: 月次報告ページの上部にある年度選択部分を特定
    const monthlyReportContainer = document.querySelector('.monthly-report-container');
    if (monthlyReportContainer) {
      const yearSelectPanels = monthlyReportContainer.querySelectorAll('.row, .panel, .card');
      for (const panel of yearSelectPanels) {
        // パネル内に年度選択のセレクタがあるか確認
        const hasYearSelect = panel.textContent && panel.textContent.includes('年度') && 
                             panel.querySelector('select');
        
        if (hasYearSelect) {
          panel.style.cssText = 'display: none !important; visibility: hidden !important;';
          logDebug('月次報告の年度選択パネルを非表示にしました');
          return true;
        }
      }
    }
    
    logDebug('非表示にする年度セレクタが見つかりませんでした');
    return false;
  }
  
  // スタイルシートによる追加対策
  function injectHidingStyles() {
    // 既存のスタイル要素があれば再利用、なければ新規作成
    let styleEl = document.getElementById('year-selector-hider-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'year-selector-hider-styles';
      document.head.appendChild(styleEl);
    }
    
    // CSS定義
    styleEl.textContent = `
      /* 月次レポート画面のトップパネルの年度セレクタを非表示 */
      .monthly-report-container .monthly-tab select[value],
      .monthly-report-container > div > div > div:first-child select[value] {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* 月次レポート画面のトップパネルを非表示 */
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
    
    logDebug('非表示用CSSスタイルを注入しました');
  }

  // 初回実行
  injectHidingStyles();
  const result = hideMonthlyReportYearSelector();
  logDebug(`初回実行結果: ${result ? '成功' : '要素が見つかりませんでした'}`);

  // MutationObserverの設定
  // デバウンス処理用の変数
  let debounceTimer = null;
  
  const observer = new MutationObserver(function(mutations) {
    // 処理を間引く（デバウンス）
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      // 重要な変更のみに反応するフィルタリング
      let shouldUpdate = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // タブやコンテナの追加のみに反応
              if (
                node.classList?.contains('tab-pane') || 
                node.querySelector?.('.tab-pane') ||
                node.classList?.contains('monthly-report-container') ||
                node.querySelector?.('select')
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
        logDebug('重要なDOM変更を検出しました - 年度セレクタの非表示処理を再実行します');
        hideMonthlyReportYearSelector();
      }
    }, 500); // 500ms以内の連続した変更をまとめて処理
  });

  // 監視設定（ページ全体、子要素の追加のみ監視）
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false // 属性変更は監視しない
  });

  // グローバル変数に保存（後で停止できるように）
  window._existingYearObserver = observer;
  
  // タブ切り替えイベントでの処理
  document.addEventListener('click', function(e) {
    // タブのクリックを検出
    if (e.target.classList.contains('nav-link') || 
        (e.target.closest && e.target.closest('.nav-link'))) {
      logDebug('タブ切り替えを検出しました');
      // タブ切り替え後に少し遅延させて実行
      setTimeout(() => {
        hideMonthlyReportYearSelector();
        // 念のためスタイルも再注入
        injectHidingStyles();
      }, 300);
    }
  });

  // ページ読み込み完了時の処理
  window.addEventListener('load', function() {
    logDebug('ページ読み込み完了時の処理を実行します');
    hideMonthlyReportYearSelector();
    injectHidingStyles();
  });

  logDebug('月次報告の対象年度セレクタを非表示にするスクリプトを設定しました');
})();