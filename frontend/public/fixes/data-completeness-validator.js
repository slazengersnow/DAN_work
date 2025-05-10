/**
 * データ完全性バリデータ
 * 
 * CSVインポート後、すべての月のデータが正しく表示されることを確認し、
 * 必要に応じて強制的にUIを更新する機能を提供します。
 */

(function() {
  // ================ 設定 ================
  const config = {
    debug: true,              // デバッグログの有効化
    validationInterval: 1000, // バリデーション間隔（ms）
    maxValidations: 5,        // 最大バリデーション回数
    updateDelay: 500,         // UI更新前の遅延（ms）
    monthConfig: {
      months: [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3], // 年度順の月リスト
      alternativeNamePatterns: ['４月', '５月', '６月', '７月', '８月', '９月', '１０月', '１１月', '１２月', '１月', '２月', '３月']
    },
    selectors: {
      // 月次データテーブル関連
      monthlyTables: [
        '.monthly-data table', 
        '.month-data-table',
        'table.monthly-report',
        '[data-testid="monthly-table"]',
        '[class*="monthly"] table'
      ],
      
      // 各月のデータコンテナ
      monthContainers: [
        '.month-container', 
        '.monthly-cell',
        '[data-month]',
        '[class*="month-data"]'
      ],
      
      // データ表示領域全体
      dataContainers: [
        '.data-view',
        '.monthly-report-container',
        '.monthly-data',
        '.report-view',
        '[class*="report-container"]'
      ]
    }
  };

  // ================ 内部状態 ================
  const state = {
    validationCount: 0,
    validationInProgress: false,
    updateInProgress: false,
    isValidating: false,
    lastValidationTime: 0,
    detectedMonthElements: null, // 検出された月要素
    validationResult: {
      missingMonths: [],
      emptyDataCells: 0,
      visibleMonths: []
    },
    updateForced: false
  };

  // ================ ユーティリティ ================
  
  /**
   * 安全なログ出力
   */
  function safeLog(message, level = 'log') {
    if (!config.debug && level === 'debug') return;
    
    const prefix = '[データバリデータ]';
    const boundConsole = {
      log: window.console.log.bind(window.console),
      error: window.console.error.bind(window.console),
      warn: window.console.warn.bind(window.console),
      info: window.console.info.bind(window.console),
      debug: window.console.debug.bind(window.console)
    };
    
    boundConsole[level](`${prefix} ${message}`);
  }
  
  /**
   * 通知表示
   */
  function showNotification(message, type = 'info') {
    // 既存の通知システムに接続
    if (window.ContentScriptErrorHandler && window.ContentScriptErrorHandler.showNotification) {
      window.ContentScriptErrorHandler.showNotification(message, type);
      return;
    }
    
    // 通知コンテナの取得または作成
    let container = document.getElementById('data-validator-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'data-validator-notifications';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      });
      document.body.appendChild(container);
    }
    
    // 通知要素を作成
    const notification = document.createElement('div');
    notification.textContent = message;
    
    // スタイルの適用
    Object.assign(notification.style, {
      backgroundColor: type === 'error' ? '#f44336' : 
                       type === 'warning' ? '#ff9800' : 
                       type === 'success' ? '#4CAF50' : '#2196F3',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      fontSize: '14px',
      maxWidth: '300px',
      transition: 'all 0.3s ease',
      opacity: '0',
      transform: 'translateY(20px)'
    });
    
    // コンテナに追加
    container.appendChild(notification);
    
    // アニメーション
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // 一定時間後に削除
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
  
  /**
   * 指定ミリ秒待機するPromiseを返す
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ================ 主要機能 ================
  
  /**
   * 月次データテーブルを検出する
   */
  function findMonthlyTables() {
    for (const selector of config.selectors.monthlyTables) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          safeLog(`月次データテーブルを検出: ${selector} (${elements.length}個)`);
          return elements;
        }
      } catch (error) {
        safeLog(`テーブル検索エラー (${selector}): ${error.message}`, 'warn');
      }
    }
    
    safeLog('月次データテーブルが見つかりません', 'warn');
    return [];
  }
  
  /**
   * 月コンテナ要素を検出する
   */
  function findMonthContainers() {
    let containers = [];
    
    // 各種セレクタで検索
    for (const selector of config.selectors.monthContainers) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          containers = [...containers, ...elements];
          safeLog(`月コンテナを検出: ${selector} (${elements.length}個)`);
        }
      } catch (error) {
        safeLog(`月コンテナ検索エラー (${selector}): ${error.message}`, 'warn');
      }
    }
    
    // データ属性から月を検出
    const monthAttributes = [
      'data-month',
      'data-month-index',
      'data-month-value'
    ];
    
    for (const attr of monthAttributes) {
      const elements = document.querySelectorAll(`[${attr}]`);
      if (elements.length > 0) {
        containers = [...containers, ...elements];
        safeLog(`月属性を持つ要素を検出: ${attr} (${elements.length}個)`);
      }
    }
    
    // 月名をテキストに含む要素を検出
    if (containers.length === 0) {
      const allElements = document.querySelectorAll('td, th, div, span');
      const monthElements = Array.from(allElements).filter(el => {
        const text = el.textContent || '';
        return /^[１-１２\d]+月$/.test(text.trim()) || // 全角数字の月表記
               /^(\d{1,2})月$/.test(text.trim()) ||   // 半角数字の月表記
               config.monthConfig.alternativeNamePatterns.some(pattern => text.includes(pattern));
      });
      
      if (monthElements.length > 0) {
        containers = [...containers, ...monthElements];
        safeLog(`テキストから月要素を検出 (${monthElements.length}個)`);
      }
    }
    
    // 重複を除去
    const uniqueContainers = [...new Set(containers)];
    safeLog(`検出された月コンテナ: ${uniqueContainers.length}個`);
    
    return uniqueContainers;
  }
  
  /**
   * データの完全性を検証する
   */
  async function validateDataCompleteness() {
    if (state.validationInProgress) return;
    state.validationInProgress = true;
    
    try {
      // 最後の検証から一定時間経っていない場合はスキップ
      const now = Date.now();
      if (now - state.lastValidationTime < 500) {
        safeLog('前回の検証から十分な時間が経過していないためスキップ');
        return;
      }
      
      state.lastValidationTime = now;
      state.validationCount++;
      
      safeLog(`データ完全性検証を実行 (${state.validationCount}/${config.maxValidations})`);
      
      // 月コンテナの検出
      const monthElements = state.detectedMonthElements || findMonthContainers();
      if (!state.detectedMonthElements) {
        state.detectedMonthElements = monthElements;
      }
      
      if (monthElements.length === 0) {
        safeLog('月要素が見つかりません', 'warn');
        return;
      }
      
      // 検出された月を分析
      const detectedMonths = [];
      const emptyDataCells = [];
      
      for (const element of monthElements) {
        let month = null;
        
        // データ属性から月を取得
        if (element.hasAttribute('data-month')) {
          month = parseInt(element.getAttribute('data-month'), 10);
        }
        
        // テキストから月を取得
        if (!month && element.textContent) {
          const text = element.textContent.trim();
          const monthMatch = text.match(/^[１-１２\d]*(\d{1,2})月$/);
          if (monthMatch) {
            month = parseInt(monthMatch[1], 10);
          } else {
            // 全角数字の月表記を探す
            const fullWidthMatch = text.match(/^([１-１２]+)月$/);
            if (fullWidthMatch) {
              // 全角数字を半角に変換
              const fullWidthNum = fullWidthMatch[1];
              const halfWidthNum = fullWidthNum.replace(/[１-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
              month = parseInt(halfWidthNum, 10);
            }
          }
        }
        
        // 月が検出されたらリストに追加
        if (month && !isNaN(month) && month >= 1 && month <= 12) {
          detectedMonths.push(month);
          
          // データが空かチェック
          const dataContainer = element.closest('tr') || element.parentElement;
          if (dataContainer) {
            const cells = dataContainer.querySelectorAll('td, [class*="cell"]');
            let hasData = false;
            
            for (const cell of cells) {
              const text = cell.textContent?.trim() || '';
              // 数値または有意義なデータがあるかチェック
              if (/\d/.test(text) || text.length > 1) {
                hasData = true;
                break;
              }
            }
            
            if (!hasData) {
              emptyDataCells.push(month);
            }
          }
        }
      }
      
      // 検証結果を保存
      state.validationResult.visibleMonths = [...new Set(detectedMonths)].sort((a, b) => a - b);
      state.validationResult.emptyDataCells = emptyDataCells.length;
      
      // 欠けている月を検出
      const missingMonths = config.monthConfig.months.filter(month => 
        !state.validationResult.visibleMonths.includes(month)
      );
      state.validationResult.missingMonths = missingMonths;
      
      safeLog(`検出された月: ${state.validationResult.visibleMonths.join(', ')}`);
      
      if (missingMonths.length > 0) {
        safeLog(`欠けている月: ${missingMonths.join(', ')}`, 'warn');
      }
      
      if (emptyDataCells.length > 0) {
        safeLog(`データが空の月: ${emptyDataCells.join(', ')}`, 'warn');
      }
      
      // 問題があればUIの強制更新を実行
      const needsForceUpdate = 
        (missingMonths.length > 0 || emptyDataCells.length > 0) && 
        !state.updateForced;
      
      if (needsForceUpdate) {
        safeLog('データの問題を検出したため、UI強制更新を実行します');
        await forceDataUpdate();
        state.updateForced = true;
      } else if (state.validationCount >= config.maxValidations) {
        // 最大検証回数に達した場合
        if (missingMonths.length === 0 && emptyDataCells.length === 0) {
          safeLog('データ検証成功: すべての月のデータが正常に表示されています', 'info');
          showNotification('✓ データの検証が完了しました', 'success');
        } else {
          safeLog('最大検証回数に達しましたが、データの問題が解決していません', 'warn');
          showNotification('⚠ 一部のデータが表示されていない可能性があります。再読み込みをお試しください。', 'warning');
        }
      } else if (state.validationCount < config.maxValidations) {
        // 次の検証をスケジュール
        setTimeout(() => {
          validateDataCompleteness();
        }, config.validationInterval);
      }
    } catch (error) {
      safeLog(`データ検証中にエラー: ${error.message}`, 'error');
    } finally {
      state.validationInProgress = false;
    }
  }
  
  /**
   * UI強制更新を実行
   */
  async function forceDataUpdate() {
    if (state.updateInProgress) return;
    state.updateInProgress = true;
    
    try {
      safeLog('データ表示の強制更新を実行');
      
      // UI更新前の遅延
      await sleep(config.updateDelay);
      
      // ロード中表示を追加
      document.body.classList.add('data-update-in-progress');
      
      // データコンテナの強制更新
      const containers = [];
      for (const selector of config.selectors.dataContainers) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          containers.push(...elements);
        }
      }
      
      if (containers.length === 0) {
        safeLog('データコンテナが見つかりません', 'warn');
      } else {
        safeLog(`${containers.length}個のデータコンテナを更新します`);
        
        // 各コンテナを順に更新
        for (const container of containers) {
          // 1. 表示状態の保存と非表示化
          const originalDisplay = container.style.display;
          container.style.display = 'none';
          
          // 2. 短時間待機
          await sleep(50);
          
          // 3. 表示状態の復元
          container.style.display = originalDisplay || '';
          
          // 4. スタイルを強制的に再計算させる
          container.getBoundingClientRect();
        }
      }
      
      // 年月選択要素の変更イベントを発火
      const yearMonthSelectors = document.querySelectorAll('select[name*="year"], select[name*="month"]');
      for (const selector of yearMonthSelectors) {
        try {
          // 元の値を保存
          const originalValue = selector.value;
          
          // 変更イベントを発火
          const event = new Event('change', { bubbles: true });
          selector.dispatchEvent(event);
          
          safeLog(`選択要素 ${selector.name || selector.id} のイベントを発火`);
        } catch (error) {
          safeLog(`選択要素のイベント発火中にエラー: ${error.message}`, 'warn');
        }
      }
      
      // Reactコンポーネントに更新を促すカスタムイベント
      const forceUpdateEvent = new CustomEvent('data-force-update', { 
        detail: { 
          timestamp: Date.now(),
          source: 'data-completeness-validator'
        } 
      });
      document.dispatchEvent(forceUpdateEvent);
      
      safeLog('カスタムイベント "data-force-update" を発行');
      
      // 更新通知
      showNotification('データ表示を更新しています...', 'info');
      
      // ロード中表示を解除
      setTimeout(() => {
        document.body.classList.remove('data-update-in-progress');
      }, 1000);
    } catch (error) {
      safeLog(`データ更新中にエラー: ${error.message}`, 'error');
    } finally {
      state.updateInProgress = false;
    }
  }
  
  /**
   * CSVインポート完了イベントを監視
   */
  function setupImportCompletionListener() {
    // カスタムイベントをリッスン
    document.addEventListener('csv-data-imported', async () => {
      safeLog('CSVデータインポート完了イベントを検出');
      
      // 検証をリセット
      state.validationCount = 0;
      state.updateForced = false;
      
      // 少し待ってからデータ検証を開始
      await sleep(1000);
      validateDataCompleteness();
    });
    
    // コンソールログからインポート完了を検出
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      // 元のログを出力
      originalConsoleLog.apply(console, args);
      
      try {
        // インポート完了に関するメッセージをチェック
        const message = args.join(' ');
        if (message.includes('インポート成功') || 
            message.includes('インポート完了') || 
            message.includes('データをインポートしました')) {
          
          safeLog('ログからCSVインポート完了を検出');
          
          // 検証をリセット
          state.validationCount = 0;
          state.updateForced = false;
          
          // 少し待ってからデータ検証を開始
          setTimeout(() => {
            validateDataCompleteness();
          }, 1000);
        }
      } catch (error) {
        // エラーを無視
      }
    };
    
    safeLog('CSVインポート完了リスナーを設定');
  }
  
  /**
   * カスタムスタイルの追加
   */
  function addCustomStyles() {
    const styleId = 'data-completeness-styles';
    
    // 既存のスタイルがあれば何もしない
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* データ更新中の表示 */
      .data-update-in-progress [class*="data-container"],
      .data-update-in-progress [class*="table-container"],
      .data-update-in-progress .monthly-data {
        position: relative;
      }
      
      .data-update-in-progress [class*="data-container"]::after,
      .data-update-in-progress [class*="table-container"]::after,
      .data-update-in-progress .monthly-data::after {
        content: "データを更新中...";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.8);
        z-index: 1000;
        font-size: 14px;
        font-weight: bold;
        color: #1976d2;
      }
      
      /* 完了チェックマーク付きの進捗インジケーター */
      .data-validation-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        background: #f5f5f5;
        margin: 4px 0;
      }
      
      .data-validation-status__complete {
        background: #e8f5e9;
        color: #2e7d32;
      }
      
      .data-validation-status__error {
        background: #ffebee;
        color: #c62828;
      }
      
      .data-validation-status.loading::after {
        content: "";
        display: inline-block;
        width: 10px;
        height: 10px;
        border: 2px solid currentColor;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
        margin-left: 6px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
    safeLog('カスタムスタイルを追加');
  }
  
  /**
   * マンually強制更新用のUI追加
   */
  function addRefreshControls() {
    // 既に追加済みなら何もしない
    if (document.getElementById('data-refresh-controls')) return;
    
    // データコンテナの検出
    let targetContainer = null;
    for (const selector of config.selectors.dataContainers) {
      const containers = document.querySelectorAll(selector);
      if (containers.length > 0) {
        targetContainer = containers[0].parentElement;
        break;
      }
    }
    
    if (!targetContainer) {
      safeLog('リフレッシュコントロールを追加する対象コンテナが見つかりません');
      return;
    }
    
    // コントロール要素の作成
    const controls = document.createElement('div');
    controls.id = 'data-refresh-controls';
    controls.style.cssText = `
      margin: 8px 0;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      font-size: 13px;
    `;
    
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'データ表示を更新';
    refreshButton.style.cssText = `
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
    
    const icon = document.createElement('span');
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
        <path d="M21 3v5h-5"></path>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
        <path d="M3 21v-5h5"></path>
      </svg>
    `;
    refreshButton.prepend(icon);
    
    const statusIndicator = document.createElement('div');
    statusIndicator.classList.add('data-validation-status');
    statusIndicator.textContent = 'データ検証: 準備完了';
    
    // イベントリスナーの設定
    refreshButton.addEventListener('click', async () => {
      refreshButton.disabled = true;
      statusIndicator.textContent = 'データを更新中...';
      statusIndicator.classList.add('loading');
      
      // 検証をリセット
      state.validationCount = 0;
      state.updateForced = false;
      
      // 強制更新を実行
      await forceDataUpdate();
      
      // データ検証を再開
      setTimeout(() => {
        validateDataCompleteness();
        refreshButton.disabled = false;
        statusIndicator.textContent = 'データ検証中...';
      }, 1000);
    });
    
    // 要素の追加
    controls.appendChild(statusIndicator);
    controls.appendChild(refreshButton);
    
    // コンテナの先頭に追加
    targetContainer.insertBefore(controls, targetContainer.firstChild);
    
    safeLog('データリフレッシュコントロールを追加');
  }
  
  /**
   * データコンテナ監視のためのMutationObserver設定
   */
  function setupDataContainerObserver() {
    // すでにデータコンテナが存在するか確認
    let containersExist = false;
    for (const selector of config.selectors.dataContainers) {
      if (document.querySelectorAll(selector).length > 0) {
        containersExist = true;
        break;
      }
    }
    
    // コンテナが存在する場合は検証を開始
    if (containersExist) {
      safeLog('既存のデータコンテナを検出');
      setTimeout(() => {
        validateDataCompleteness();
        addRefreshControls();
      }, 1000);
    }
    
    // データコンテナの変更を監視
    const observer = new MutationObserver((mutations) => {
      let shouldValidate = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 新しく追加されたノードがデータコンテナの場合
          const addedContainers = Array.from(mutation.addedNodes).filter(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return false;
            
            // クラス名やIDからデータコンテナかを判定
            if (node.classList) {
              const classStr = node.className.toString();
              return classStr.includes('data') || 
                     classStr.includes('table') || 
                     classStr.includes('monthly');
            }
            return false;
          });
          
          if (addedContainers.length > 0) {
            shouldValidate = true;
            break;
          }
        }
      }
      
      if (shouldValidate && !state.validationInProgress) {
        safeLog('コンテナ変更を検出');
        setTimeout(() => {
          validateDataCompleteness();
          
          // コントロール要素がなければ追加
          if (!document.getElementById('data-refresh-controls')) {
            addRefreshControls();
          }
        }, 500);
      }
    });
    
    // body全体の監視を開始
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    safeLog('データコンテナ監視を開始');
  }
  
  /**
   * 初期化処理
   */
  function init() {
    try {
      safeLog('データ完全性バリデータを初期化');
      
      // カスタムスタイルの追加
      addCustomStyles();
      
      // CSVインポート完了リスナーを設定
      setupImportCompletionListener();
      
      // データコンテナ監視を設定
      setupDataContainerObserver();
      
      safeLog('初期化完了');
    } catch (error) {
      safeLog(`初期化中にエラー: ${error.message}`, 'error');
    }
  }
  
  // グローバルアクセス用オブジェクト
  window.DataCompletenessValidator = {
    validateNow: () => {
      state.validationCount = 0;
      state.updateForced = false;
      validateDataCompleteness();
    },
    forceUpdate: forceDataUpdate,
    getState: () => ({...state}),
    getValidationResult: () => ({...state.validationResult})
  };
  
  // DOMの準備ができたら初期化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();