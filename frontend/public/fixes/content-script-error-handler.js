/**
 * コンテントスクリプトエラーハンドラー
 * 
 * 「Could not find identifiable element」エラーに対応し、
 * web-client-content-scriptとの競合を解決するためのスクリプト
 */

(function() {
  // ================ 設定 ================
  const config = {
    debug: true,              // デバッグログの有効化
    contentScriptErrors: [    // 検出するエラーパターン
      'Could not find identifiable element',
      'Cannot find identifiable element',
      'Unable to locate identifiable element',
      'Element not found'
    ],
    elementSelectors: [       // 要素検索用セレクタ
      '[class*="year"]', 
      '[class*="month"]', 
      '[id*="year"]', 
      '[id*="month"]',
      'select',
      '.MuiSelect-root',
      '.dropdown'
    ],
    recoveryDelay: 800,       // リカバリー遅延（ms）
    uiRefreshDelay: 1200,     // UI更新遅延（ms）
    maxRetries: 5             // 最大再試行回数
  };

  // ================ 内部状態 ================
  const state = {
    retryCount: 0,
    errorDetected: false,
    originalConsoleError: window.console.error,
    handlerActive: false,
    recoveryInProgress: false
  };

  // ================ ユーティリティ ================
  
  /**
   * 安全なログ出力
   */
  function safeLog(message, level = 'log') {
    if (!config.debug && level === 'debug') return;
    
    const prefix = '[ContentErrorHandler]';
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
    // 通知コンテナの取得または作成
    let container = document.getElementById('content-error-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'content-error-notifications';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '80px',
        right: '20px',
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
   * エラー復旧を試行
   */
  async function attemptRecovery() {
    if (state.recoveryInProgress) return;
    state.recoveryInProgress = true;
    
    try {
      safeLog(`エラー復旧を試行中... (試行: ${state.retryCount + 1}/${config.maxRetries})`);
      
      // 復旧作業の前に少し待機
      await new Promise(resolve => setTimeout(resolve, config.recoveryDelay));
      
      // 1. 年月選択要素の再検出
      const yearMonthElements = findYearMonthElements();
      if (yearMonthElements.length > 0) {
        safeLog(`${yearMonthElements.length}個の年月関連要素を検出`);
      } else {
        safeLog('年月関連要素が見つかりませんでした', 'warn');
      }
      
      // 2. イベントハンドラの再設定
      refreshEventHandlers(yearMonthElements);
      
      // 3. UIの強制更新
      forceUIRefresh();
      
      state.retryCount++;
      
      // 通知表示
      if (state.retryCount < config.maxRetries) {
        showNotification('データ表示を復旧中...', 'info');
      } else {
        showNotification('データ表示を復旧しました。問題が続く場合は画面の再読み込みをお試しください。', 'success');
      }
    } catch (error) {
      safeLog(`復旧中にエラーが発生: ${error.message}`, 'error');
      
      if (state.retryCount >= config.maxRetries) {
        showNotification('データ表示の復旧に失敗しました。画面を再読み込みしてください。', 'error');
      }
    } finally {
      // 再試行が必要な場合
      if (state.retryCount < config.maxRetries) {
        setTimeout(attemptRecovery, config.recoveryDelay * (state.retryCount + 1));
      } else {
        safeLog('最大再試行回数に達しました');
        state.errorDetected = false;
      }
      
      state.recoveryInProgress = false;
    }
  }
  
  /**
   * 年月関連要素を検索
   */
  function findYearMonthElements() {
    const elements = [];
    
    // 各セレクタで検索
    for (const selector of config.elementSelectors) {
      try {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
          // 既に追加済みの要素を除外
          for (const el of found) {
            if (!elements.includes(el)) {
              elements.push(el);
            }
          }
        }
      } catch (error) {
        safeLog(`セレクタ${selector}での検索中にエラー: ${error.message}`, 'warn');
      }
    }
    
    return elements;
  }
  
  /**
   * イベントハンドラを再設定
   */
  function refreshEventHandlers(elements) {
    for (const element of elements) {
      try {
        // 既存のイベントリスナーをクリーンアップ（できる限り）
        const clone = element.cloneNode(true);
        if (element.parentNode) {
          element.parentNode.replaceChild(clone, element);
        }
        
        // 標準イベントの再発火
        if (clone.tagName === 'SELECT') {
          const event = new Event('change', { bubbles: true });
          clone.dispatchEvent(event);
        }
        
        safeLog(`要素 ${element.tagName}${element.id ? '#'+element.id : ''} のイベントハンドラをリフレッシュ`);
      } catch (error) {
        safeLog(`イベントリフレッシュ中にエラー: ${error.message}`, 'warn');
      }
    }
  }
  
  /**
   * UIを強制的に更新
   */
  function forceUIRefresh() {
    try {
      safeLog('UIの強制更新を試行');
      
      // 1. 直接的なDOM操作
      const containers = document.querySelectorAll(
        '.monthly-report-container, .data-container, .report-view, [class*="monthly"], [class*="report"]'
      );
      
      for (const container of containers) {
        // コンテナの内容を一時的に非表示にして再表示（強制再描画）
        if (container.style.display !== 'none') {
          const originalDisplay = container.style.display;
          container.style.display = 'none';
          
          // 非同期で元に戻す
          setTimeout(() => {
            container.style.display = originalDisplay || '';
            safeLog('コンテナ表示を復元');
          }, 50);
        }
      }
      
      // 2. Reactインスタンスへの働きかけ（非侵襲的アプローチ）
      setTimeout(() => {
        // カスタムイベントを発行して、Reactコンポーネントに更新を促す
        const refreshEvent = new CustomEvent('csv-data-imported', { 
          detail: { timestamp: Date.now() } 
        });
        document.dispatchEvent(refreshEvent);
        
        safeLog('カスタムイベント "csv-data-imported" を発行');
      }, 100);
      
      // 3. 最後の手段としてのclass変更（強制再描画のトリック）
      setTimeout(() => {
        document.body.classList.add('force-reflow');
        
        // すぐに削除して再フローを引き起こす
        setTimeout(() => {
          document.body.classList.remove('force-reflow');
          safeLog('強制再フロー完了');
        }, 10);
      }, 200);
    } catch (error) {
      safeLog(`UI更新中にエラー: ${error.message}`, 'error');
    }
  }
  
  /**
   * コンソールエラーインターセプター
   */
  function setupErrorInterceptor() {
    window.console.error = function(...args) {
      // 元のconsole.errorを呼び出し
      state.originalConsoleError.apply(console, args);
      
      try {
        // 自分自身によるログはスキップ
        if (args.length > 0 && 
            typeof args[0] === 'string' && 
            args[0].includes('[ContentErrorHandler]')) {
          return;
        }
        
        // エラーメッセージ取得
        const errorMessage = args.join(' ');
        
        // ContentScriptエラー検出
        const isContentScriptError = config.contentScriptErrors.some(pattern => 
          errorMessage.includes(pattern)
        );
        
        if (isContentScriptError && !state.errorDetected) {
          safeLog('ContentScriptエラーを検出: ' + errorMessage, 'warn');
          state.errorDetected = true;
          
          // エラー回復プロセスの開始
          attemptRecovery();
        }
      } catch (error) {
        // メタエラー - 元のconsole.errorで出力
        state.originalConsoleError.call(
          console, 
          `[ContentErrorHandler] インターセプト中にエラー: ${error.message}`
        );
      }
    };
    
    safeLog('コンソールエラーインターセプターを設定');
  }
  
  /**
   * ウィンドウエラーハンドラ
   */
  function setupWindowErrorHandler() {
    window.addEventListener('error', function(event) {
      try {
        // ContentScriptエラー検出
        const isContentScriptError = config.contentScriptErrors.some(pattern => 
          event.message && event.message.includes(pattern)
        );
        
        if (isContentScriptError && !state.errorDetected) {
          safeLog('ウィンドウエラーイベントでContentScriptエラーを検出', 'warn');
          state.errorDetected = true;
          
          // エラー回復プロセスの開始
          attemptRecovery();
          
          // クラッシュを防ぐためにエラーを処理済みとしてマーク
          event.preventDefault();
        }
      } catch (error) {
        safeLog(`ウィンドウエラーハンドラでエラー: ${error.message}`, 'error');
      }
    }, true);
    
    safeLog('ウィンドウエラーハンドラを設定');
  }
  
  /**
   * MutationObserverでDOM変更監視
   */
  function setupDomObserver() {
    // MutationObserverの設定
    const observer = new MutationObserver((mutations) => {
      // エラー検出済みで復旧中の場合は処理しない
      if (state.errorDetected && state.recoveryInProgress) return;
      
      // DOM変更の中でエラーがないか確認
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const errorNodes = Array.from(mutation.addedNodes).filter(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
              return config.contentScriptErrors.some(pattern => 
                node.textContent.includes(pattern)
              );
            }
            return false;
          });
          
          if (errorNodes.length > 0 && !state.errorDetected) {
            safeLog('DOM変更でContentScriptエラーを検出', 'warn');
            state.errorDetected = true;
            attemptRecovery();
            break;
          }
        }
      }
    });
    
    // body全体の監視開始
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    safeLog('DOM変更監視を開始');
    
    // 長時間の監視を避けるためのクリーンアップ
    setTimeout(() => {
      observer.disconnect();
      safeLog('DOM変更監視を終了（タイムアウト）');
    }, 300000); // 5分後に停止
  }
  
  /**
   * 復旧完了後のUI更新バリデーションチェック
   */
  function validateUIState() {
    // 一定時間後にUIの状態をチェック
    setTimeout(() => {
      try {
        safeLog('UI状態のバリデーションを実行');
        
        // 1. 年月選択要素の存在確認
        const yearMonthElements = findYearMonthElements();
        if (yearMonthElements.length === 0) {
          safeLog('バリデーション失敗: 年月選択要素が見つかりません', 'warn');
          showNotification('データ表示に問題が発生しています。画面をリロードしてください。', 'warning');
          return;
        }
        
        // 2. データコンテナの確認
        const dataContainers = document.querySelectorAll(
          '.monthly-data, .report-data, [class*="data-container"], [class*="table-container"]'
        );
        
        if (dataContainers.length === 0) {
          safeLog('バリデーション失敗: データコンテナが見つかりません', 'warn');
          return;
        }
        
        // 3. データの有無をチェック
        let hasData = false;
        for (const container of dataContainers) {
          // テーブルや行要素があるか確認
          const dataElements = container.querySelectorAll('table, tr, [role="row"]');
          if (dataElements.length > 1) { // ヘッダー行以外にデータがあるか
            hasData = true;
            break;
          }
        }
        
        if (!hasData) {
          safeLog('バリデーション警告: データが見つかりません', 'warn');
          showNotification('データが正しく表示されていない可能性があります。F5キーで画面を更新してください。', 'warning');
        } else {
          safeLog('UI状態のバリデーション成功');
        }
      } catch (error) {
        safeLog(`UI状態バリデーション中にエラー: ${error.message}`, 'error');
      }
    }, config.uiRefreshDelay);
  }
  
  /**
   * カスタムスタイルの追加
   */
  function addCustomStyles() {
    const styleId = 'content-error-handler-styles';
    
    // 既存のスタイルがあれば何もしない
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
      }
      
      .force-reflow {
        animation: none !important;
      }
      
      .ui-recovery-in-progress .data-container,
      .ui-recovery-in-progress [class*="data-container"],
      .ui-recovery-in-progress [class*="table-container"] {
        position: relative;
      }
      
      .ui-recovery-in-progress .data-container::after,
      .ui-recovery-in-progress [class*="data-container"]::after,
      .ui-recovery-in-progress [class*="table-container"]::after {
        content: "データ更新中...";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.7);
        z-index: 100;
        font-size: 14px;
        color: #333;
        animation: pulse 1.5s infinite;
      }
    `;
    
    document.head.appendChild(style);
    safeLog('カスタムスタイルを追加');
  }
  
  /**
   * 初期化
   */
  function init() {
    if (state.handlerActive) {
      safeLog('ハンドラは既に有効です');
      return;
    }
    
    try {
      safeLog('ContentScriptエラーハンドラを初期化');
      
      // カスタムスタイルの追加
      addCustomStyles();
      
      // 各インターセプターの設定
      setupErrorInterceptor();
      setupWindowErrorHandler();
      setupDomObserver();
      
      // UIの初期バリデーション
      validateUIState();
      
      state.handlerActive = true;
      
      // 成功通知
      showNotification('ContentScriptエラー対策が有効になりました', 'success');
      safeLog('初期化完了');
    } catch (error) {
      safeLog(`初期化中にエラー: ${error.message}`, 'error');
    }
  }
  
  // グローバルアクセス用オブジェクト
  window.ContentScriptErrorHandler = {
    getState: () => ({...state}),
    forceUIRefresh,
    validateUIState,
    attemptRecovery,
    findYearMonthElements,
    showNotification
  };
  
  // DOMが準備できたら初期化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();