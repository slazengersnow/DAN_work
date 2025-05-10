/**
 * 月次詳細CSV年度修正スクリプト
 * 
 * このスクリプトは月次レポートのCSVインポート後に年度が自動的に2025に変わる問題を解決します。
 * - CSVインポート前の年度を記憶
 * - コンソールログを監視してインポート完了を検出
 * - 年度選択要素を確実に特定するための複数の戦略を実装
 * - 「Could not find identifiable element」エラーを解決
 * 
 * 従業員詳細機能には影響しません。
 */

(function() {
  // ================ 設定 ================
  const config = {
    debug: true,              // デバッグログの有効化
    retryMaxCount: 5,         // 最大再試行回数
    retryIntervals: [100, 300, 600, 1000, 2000], // 再試行間隔（ミリ秒）
    targetPathPattern: /monthly-report/i // 対象URLパターン
  };

  // ================ 内部状態 ================
  const state = {
    originalYear: null,       // 元の年度
    detectedCsvYear: null,    // CSVから検出された年度
    yearSelector: null,       // 年度選択要素
    retryCount: 0,            // 再試行カウンタ
    importStarted: false,     // インポート開始フラグ
    importCompleted: false,   // インポート完了フラグ
    processingComplete: false, // インポート完了処理中フラグ（無限ループ防止用）
    initialized: false        // 初期化完了フラグ
  };

  // ================ ユーティリティ関数 ================
  
  /**
   * デバッグログを出力
   */
  function log(message, level = 'info') {
    if (!config.debug && level === 'debug') return;
    
    const prefix = '[年度修正]';
    
    // 最大コールスタックサイズエラーを防ぐために元のconsole関数参照を使用
    const originalConsole = {
      log: window.console.log.bind(window.console),
      error: window.console.error.bind(window.console),
      warn: window.console.warn.bind(window.console),
      debug: window.console.debug.bind(window.console)
    };
    
    switch (level) {
      case 'error':
        originalConsole.error(`${prefix} ${message}`);
        break;
      case 'warn':
        originalConsole.warn(`${prefix} ${message}`);
        break;
      case 'debug':
        originalConsole.debug(`${prefix} ${message}`);
        break;
      default:
        originalConsole.log(`${prefix} ${message}`);
    }
  }
  
  /**
   * 指定ミリ秒待機するPromiseを返す
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 通知を表示
   */
  function showNotification(message, type = 'success') {
    // 通知コンテナを取得または作成
    let container = document.getElementById('year-fix-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'year-fix-notifications';
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }
    
    // 通知要素を作成
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.padding = '12px 16px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
    notification.style.fontSize = '14px';
    notification.style.transition = 'all 0.3s ease';
    notification.style.opacity = '0';
    
    // 種類によってスタイル設定
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#4caf50';
        notification.style.color = 'white';
        break;
      case 'error':
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
        break;
      case 'warning':
        notification.style.backgroundColor = '#ff9800';
        notification.style.color = 'white';
        break;
      default:
        notification.style.backgroundColor = '#2196f3';
        notification.style.color = 'white';
    }
    
    // コンテナに追加
    container.appendChild(notification);
    
    // フェードイン
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // 一定時間後に削除
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // ================ 主要機能 ================
  
  /**
   * 年度選択要素を検出する関数
   * 複数の戦略と再試行メカニズムで確実な検出を実現
   */
  async function findYearSelector(retry = false) {
    try {
      // 再試行管理
      if (retry) {
        state.retryCount++;
        log(`年度選択要素検出再試行 (${state.retryCount}/${config.retryMaxCount})`);
      } else {
        log('年度選択要素の検出を開始');
        state.retryCount = 0;
      }
      
      // すでに検出済みなら再利用
      if (state.yearSelector) {
        return state.yearSelector;
      }
      
      // 検出戦略
      const strategies = [
        // 1. ID ベースの検索
        function byId() {
          const idCandidates = [
            'yearSelect', 
            'fiscal-year-select', 
            'fiscalYearSelect', 
            'year'
          ];
          
          for (const id of idCandidates) {
            const element = document.getElementById(id);
            if (element && element.tagName === 'SELECT') {
              log(`ID "${id}" で年度選択要素を検出`);
              return element;
            }
          }
          return null;
        },
        
        // 2. クラス名ベースの検索
        function byClass() {
          const classSelectors = [
            '.year-select', 
            '.year-selector',
            '.fiscal-year-select', 
            '.year-dropdown'
          ];
          
          for (const selector of classSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              if (element.tagName === 'SELECT') {
                log(`クラス "${selector}" で年度選択要素を検出`);
                return element;
              }
            }
          }
          return null;
        },
        
        // 3. 属性ベースの検索
        function byAttribute() {
          const selectors = [
            'select[name*="year"]',
            'select[name*="fiscal"]',
            'select[id*="year"]',
            'select[id*="Year"]'
          ];
          
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              log(`属性 "${selector}" で年度選択要素を検出`);
              return elements[0];
            }
          }
          return null;
        },
        
        // 4. 年度オプションをもつセレクト要素の検索
        function byOptions() {
          const selects = document.querySelectorAll('select');
          
          for (const select of selects) {
            const options = select.querySelectorAll('option');
            
            // オプションの値が年度かどうか判定
            let hasYearOption = false;
            for (const option of options) {
              if (/^20\d{2}$/.test(option.value) || /^20\d{2}$/.test(option.textContent)) {
                hasYearOption = true;
                break;
              }
            }
            
            if (hasYearOption) {
              log('オプション内容から年度選択要素を検出');
              return select;
            }
          }
          return null;
        },
        
        // 5. 特定のコンテナ内のセレクト要素
        function byContainer() {
          const containers = document.querySelectorAll('.monthly-report-header, .filter-section, .year-container');
          
          for (const container of containers) {
            const selects = container.querySelectorAll('select');
            if (selects.length > 0) {
              log('コンテナ内から年度選択要素を検出');
              return selects[0];
            }
          }
          return null;
        },
        
        // 6. 「年度」テキストの近くのセレクト要素
        function byNearbyText() {
          // テキストノードを探索
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          
          let node;
          const yearTextNodes = [];
          
          // 「年度」テキストを含むノードを収集
          while (node = walker.nextNode()) {
            if (node.textContent.includes('年度')) {
              yearTextNodes.push(node);
            }
          }
          
          // 各テキストノードの近くのSELECT要素を探索
          for (const textNode of yearTextNodes) {
            // 親要素を取得
            const parent = textNode.parentElement;
            if (!parent) continue;
            
            // 親要素内のselect
            const selects = parent.querySelectorAll('select');
            if (selects.length > 0) {
              log('「年度」テキスト近くから年度選択要素を検出');
              return selects[0];
            }
            
            // 親の親要素内のselect
            const grandparent = parent.parentElement;
            if (grandparent) {
              const gpSelects = grandparent.querySelectorAll('select');
              if (gpSelects.length > 0) {
                log('「年度」テキストの周辺から年度選択要素を検出');
                return gpSelects[0];
              }
            }
          }
          
          return null;
        }
      ];
      
      // 全検出戦略を試行
      for (const strategy of strategies) {
        const element = strategy();
        if (element) {
          state.yearSelector = element;
          state.originalYear = element.value;
          log(`年度選択要素を検出（現在値: ${state.originalYear}）`);
          return element;
        }
      }
      
      // 要素が見つからない場合、再試行
      if (state.retryCount < config.retryMaxCount) {
        const interval = config.retryIntervals[state.retryCount] || 1000;
        log(`${interval}ms後に再試行します`);
        
        await sleep(interval);
        return findYearSelector(true);
      }
      
      log('年度選択要素の検出に失敗しました', 'error');
      return null;
    } catch (error) {
      log(`年度選択要素検出中にエラー: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * 年度を設定する関数
   */
  function setYear(year) {
    if (!state.yearSelector) {
      log('年度選択要素が見つかりません', 'error');
      return false;
    }
    
    if (!year) {
      log('設定する年度がありません', 'error');
      return false;
    }
    
    log(`年度を ${year} に設定します（現在: ${state.yearSelector.value}）`);
    
    // 値を設定
    state.yearSelector.value = year;
    
    // change イベントを発火
    const event = new Event('change', { bubbles: true });
    state.yearSelector.dispatchEvent(event);
    
    return true;
  }

  /**
   * CSVインポート開始時の処理
   */
  function onImportStart() {
    if (state.importStarted) return;
    
    log('CSVインポート開始を検出');
    state.importStarted = true;
    state.importCompleted = false;
    
    // 現在の年度を保存
    findYearSelector().then(selector => {
      if (selector) {
        state.originalYear = selector.value;
        log(`インポート前の年度: ${state.originalYear}`);
      }
    });
  }

  /**
   * CSVから年度検出時の処理
   */
  function onYearDetected(year) {
    log(`CSVから年度を検出: ${year}`);
    state.detectedCsvYear = year;
  }

  /**
   * CSVインポート完了時の処理
   * この関数は外部から手動呼び出し用（コンソールログインターセプトからは直接呼ばない）
   */
  async function onImportComplete() {
    // すでに処理中または完了済みなら何もしない（重複呼び出し対策）
    if (state.importCompleted || state.processingComplete) return;
    
    // 処理中フラグをセット
    state.processingComplete = true;
    
    try {
      // 事前に状態を保存（他の部分で上書きされないように）
      const originalConsole = {
        log: window.console.log.bind(window.console),
        error: window.console.error.bind(window.console),
        warn: window.console.warn.bind(window.console)
      };
      
      originalConsole.log('[年度修正] CSVインポート完了の処理を開始');
      state.importCompleted = true;
      
      // 少し待機して画面更新を待つ
      await sleep(500);
      
      // 年度選択要素を再取得
      const yearSelector = await findYearSelector();
      if (!yearSelector) {
        originalConsole.error('[年度修正] 年度選択要素が見つかりません。年度復元をスキップします');
        return;
      }
      
      // 使用する年度を決定（検出値 → 元の値の優先順位）
      const yearToRestore = state.detectedCsvYear || state.originalYear;
      
      if (!yearToRestore) {
        originalConsole.warn('[年度修正] 復元する年度がありません');
        return;
      }
      
      // 現在値と異なる場合のみ変更
      if (yearSelector.value !== yearToRestore.toString()) {
        originalConsole.log(`[年度修正] 年度を ${yearToRestore} に復元します（現在: ${yearSelector.value}）`);
        
        if (setYear(yearToRestore)) {
          showNotification(`✓ 年度を ${yearToRestore} に設定しました`);
        }
      } else {
        originalConsole.log(`[年度修正] 年度は既に正しく設定されています: ${yearToRestore}`);
      }
    } catch (error) {
      // オリジナルのconsoleを使ってエラーをログ
      window.console.error('[年度修正] インポート完了処理中にエラーが発生しました:', error);
    } finally {
      // インポート状態をリセット
      state.importStarted = false;
      state.importCompleted = false;
      state.processingComplete = false;
    }
  }

  /**
   * コンソールログを監視してCSVインポート操作を検出
   */
  function setupConsoleInterceptor() {
    const originalConsoleLog = console.log;
    
    console.log = function(...args) {
      // 無限ループを防ぐ - 自身のログメッセージを無視
      const isInternalLogMessage = (
        args.length > 0 && 
        typeof args[0] === 'string' && 
        args[0].startsWith('[年度修正]')
      );
      
      // 元のconsole.logを呼び出し
      originalConsoleLog.apply(console, args);
      
      // 自身のログメッセージはスキップ
      if (isInternalLogMessage) {
        return;
      }
      
      try {
        // 引数を文字列に結合
        const message = args.join(' ');
        
        // CSVインポート開始の検出
        if (message.includes('インポート処理開始') || 
            message.includes('CSVファイルから月次データをインポート') ||
            message.includes('CSVデータをインポート')) {
          // 直接状態を変更し、無限ループを防止
          if (!state.importStarted) {
            state.importStarted = true;
            originalConsoleLog('[年度修正] CSVインポート開始を検出');
            
            // 現在の年度を保存
            findYearSelector().then(selector => {
              if (selector) {
                state.originalYear = selector.value;
                originalConsoleLog(`[年度修正] インポート前の年度: ${state.originalYear}`);
              }
            });
          }
        }
        
        // CSV年度検出の検出
        const yearMatch = message.match(/CSVから年度を検出: (\d{4})/);
        if (yearMatch) {
          const detectedYear = parseInt(yearMatch[1], 10);
          state.detectedCsvYear = detectedYear;
          originalConsoleLog(`[年度修正] CSVから年度を検出: ${detectedYear}`);
        }
        
        // インポート完了の検出
        if (message.includes('インポート成功コールバックを実行') || 
            message.includes('月次データをインポートしました') ||
            message.includes('インポート完了')) {
          // 直接 onImportComplete を呼び出すのではなく、
          // 少し遅延させて状態を変更するだけの処理を実行
          if (!state.importCompleted) {
            state.importCompleted = true;
            originalConsoleLog('[年度修正] CSVインポート完了を検出');
            
            // 遅延処理でインポート完了後の処理を実行
            setTimeout(async () => {
              // 年度選択要素を再取得
              const yearSelector = await findYearSelector();
              if (!yearSelector) {
                originalConsoleLog('[年度修正] 年度選択要素が見つかりません。年度復元をスキップします');
                return;
              }
              
              // 使用する年度を決定（検出値 → 元の値の優先順位）
              const yearToRestore = state.detectedCsvYear || state.originalYear;
              
              if (!yearToRestore) {
                originalConsoleLog('[年度修正] 復元する年度がありません');
                return;
              }
              
              // 現在値と異なる場合のみ変更
              if (yearSelector.value !== yearToRestore.toString()) {
                originalConsoleLog(`[年度修正] 年度を ${yearToRestore} に復元します（現在: ${yearSelector.value}）`);
                
                if (setYear(yearToRestore)) {
                  showNotification(`✓ 年度を ${yearToRestore} に設定しました`);
                }
              } else {
                originalConsoleLog(`[年度修正] 年度は既に正しく設定されています: ${yearToRestore}`);
              }
              
              // インポート状態をリセット
              state.importStarted = false;
              state.importCompleted = false;
            }, 800);
          }
        }
      } catch (error) {
        // エラーを無視（元のログ機能に影響を与えない）
        originalConsoleLog('コンソールログ監視中にエラー:', error);
      }
    };
  }

  /**
   * DOM変更を監視するMutationObserverをセットアップ
   */
  function setupDOMObserver() {
    try {
      const observer = new MutationObserver((mutations) => {
        // 年度選択要素がまだ見つかっていない場合は検出
        if (!state.yearSelector) {
          findYearSelector();
        }
      });
      
      // document.bodyの監視を開始
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      log('DOM変更の監視を開始');
      
      // 長時間実行を防ぐためのタイムアウト
      setTimeout(() => {
        observer.disconnect();
        log('DOM変更の監視を終了（タイムアウト）');
      }, 60000); // 60秒後に停止
    } catch (error) {
      log(`DOM監視のセットアップ中にエラー: ${error.message}`, 'error');
    }
  }

  /**
   * XMLHttpRequest/Fetch APIを監視してネットワークリクエストを検出
   */
  function setupNetworkInterceptors() {
    try {
      // XMLHttpRequestの監視
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._url = url;
        this._method = method;
        return originalXHROpen.apply(this, [method, url, ...args]);
      };
      
      XMLHttpRequest.prototype.send = function(body) {
        // 月次レポート関連の POST/PUT リクエスト
        if (this._url && (this._url.includes('/monthly-reports') || this._url.includes('/monthly-report')) &&
            (this._method === 'POST' || this._method === 'PUT')) {
          onImportStart();
        }
        
        // レスポンス完了の検出
        this.addEventListener('load', function() {
          // 月次レポート関連の POST/PUT レスポンス
          if (this._url && (this._url.includes('/monthly-reports') || this._url.includes('/monthly-report')) &&
              (this._method === 'POST' || this._method === 'PUT')) {
            onImportComplete();
          }
        });
        
        return originalXHRSend.apply(this, [body]);
      };
      
      // Fetch APIの監視
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input?.url;
        const method = init?.method || 'GET';
        
        // 月次レポート関連の POST/PUT リクエスト
        if (url && (url.includes('/monthly-reports') || url.includes('/monthly-report')) &&
            (method === 'POST' || method === 'PUT')) {
          onImportStart();
        }
        
        // 元のfetchを呼び出し
        return originalFetch.apply(this, [input, init]).then(response => {
          // 月次レポート関連の POST/PUT レスポンス
          if (url && (url.includes('/monthly-reports') || url.includes('/monthly-report')) &&
              (method === 'POST' || method === 'PUT')) {
            onImportComplete();
          }
          
          return response;
        });
      };
      
      log('ネットワークリクエストの監視を開始');
    } catch (error) {
      log(`ネットワーク監視のセットアップ中にエラー: ${error.message}`, 'error');
    }
  }

  /**
   * 初期化処理
   */
  async function init() {
    try {
      // 月次レポート画面でのみ実行
      if (!window.location.pathname.match(config.targetPathPattern)) {
        log('月次レポート画面ではないため、スクリプトを無効化します', 'debug');
        return;
      }
      
      log('CSV年度修正スクリプトを初期化中...');
      
      if (state.initialized) {
        log('すでに初期化済みです', 'warn');
        return;
      }
      
      // 各種監視を設定
      setupConsoleInterceptor();
      setupNetworkInterceptors();
      setupDOMObserver();
      
      // 年度選択要素を検出
      const yearSelector = await findYearSelector();
      
      if (yearSelector) {
        log('年度選択要素の検出に成功しました');
        showNotification('✓ CSV年度修正機能が有効になりました');
      } else {
        log('年度選択要素の検出に失敗しました', 'warn');
        showNotification('⚠ 年度選択要素の検出に失敗しました', 'warning');
      }
      
      state.initialized = true;
      log('初期化完了');
      
      return true;
    } catch (error) {
      log(`初期化中にエラー: ${error.message}`, 'error');
      return false;
    }
  }

  // ================ 公開API ================
  // グローバル変数として公開
  window.CSVYearFix = {
    getState: () => ({...state}),
    findYearSelector,
    setYear,
    showNotification,
    log
  };

  // ================ 初期化実行 ================
  // DOMが読み込まれたら初期化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
  
  log('CSVYearFixがグローバル変数として利用可能になりました');
})();