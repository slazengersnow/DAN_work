/**
 * 強化ネットワーク監視スクリプト
 * 
 * このスクリプトは月次レポートのCSVインポート時のネットワークリクエストを
 * より確実に監視し、インポート処理を検出します。
 * csv-import-year-fix.jsと連携して動作します。
 */

(function() {
  // ================ 設定 ================
  const config = {
    debug: true,                      // デバッグログの有効化
    reportEndpointPatterns: [         // 月次レポート関連エンドポイントのパターン
      '/monthly-reports',
      '/monthly-report',
      '/api/monthly-reports',
      '/api/monthly-report'
    ],
    batchDetectionThreshold: 3,       // バッチ検出しきい値（この数以上のリクエストでインポート検出）
    batchTimeWindow: 5000,            // バッチ検出時間枠（ms）
    responseDelay: 500               // レスポンス後の処理遅延（ms）
  };

  // ================ 内部状態 ================
  const state = {
    initialized: false,               // 初期化フラグ
    recentRequests: [],               // 最近のリクエスト
    pendingRequests: 0,               // 処理中リクエスト数
    csvImportDetected: false,         // CSVインポート検出フラグ
    importCompletePending: false,     // インポート完了保留フラグ
    importCompleteTimeout: null       // インポート完了タイマー
  };

  // ================ ユーティリティ関数 ================
  
  /**
   * デバッグログを出力
   */
  function log(message, level = 'info') {
    if (!config.debug && level === 'debug') return;
    
    const prefix = '[ネットワーク監視]';
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
  
  /**
   * 指定ミリ秒待機するPromiseを返す
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * CSV修正スクリプトのAPIを呼び出す
   */
  function callYearFixAPI(method, ...args) {
    try {
      if (window.CSVYearFix && typeof window.CSVYearFix[method] === 'function') {
        return window.CSVYearFix[method](...args);
      }
      return null;
    } catch (error) {
      log(`CSVYearFixのAPI呼び出しエラー (${method}): ${error.message}`, 'error');
      return null;
    }
  }

  // ================ 主要機能 ================
  
  /**
   * URLが月次レポートのエンドポイントかどうかを判定
   */
  function isMonthlyReportEndpoint(url) {
    if (!url) return false;
    
    return config.reportEndpointPatterns.some(pattern => 
      url.indexOf(pattern) !== -1
    );
  }
  
  /**
   * リクエストをキューに追加
   */
  function addRequestToQueue(request) {
    // 古いリクエストを削除（時間枠外のもの）
    const now = Date.now();
    state.recentRequests = state.recentRequests.filter(req => 
      now - req.timestamp < config.batchTimeWindow
    );
    
    // 新しいリクエストを追加
    state.recentRequests.push({
      ...request,
      timestamp: now
    });
    
    // 処理中リクエスト数を更新
    state.pendingRequests++;
    
    // バッチ検出のチェック
    checkBatchDetection();
  }
  
  /**
   * リクエスト完了処理
   */
  async function handleRequestComplete(request) {
    // 処理中リクエスト数をデクリメント
    state.pendingRequests--;
    
    // インポート検出済みで、全リクエスト完了した場合
    if (state.csvImportDetected && state.pendingRequests === 0) {
      // まだ完了ハンドラが呼ばれていない場合
      if (!state.importCompletePending) {
        state.importCompletePending = true;
        
        // 少し待機してからインポート完了を通知
        await sleep(config.responseDelay);
        triggerImportComplete();
      }
    }
  }
  
  /**
   * バッチ検出チェック
   */
  function checkBatchDetection() {
    // 時間枠内のリクエスト数がしきい値を超えているか
    if (state.recentRequests.length >= config.batchDetectionThreshold) {
      // 月次レポートに関連するリクエスト数をカウント
      const reportRequests = state.recentRequests.filter(req => 
        isMonthlyReportEndpoint(req.url) && 
        (req.method === 'POST' || req.method === 'PUT')
      );
      
      // 月次レポート関連のリクエストが十分ある場合、CSVインポートと判断
      if (reportRequests.length >= config.batchDetectionThreshold / 2) {
        if (!state.csvImportDetected) {
          log(`CSVインポートを検出しました（${reportRequests.length}件のリクエスト）`);
          state.csvImportDetected = true;
          triggerImportStart();
        }
      }
    }
  }
  
  /**
   * インポート開始イベントを発火
   */
  function triggerImportStart() {
    // CSVYearFixのインポート開始関数を呼び出す
    callYearFixAPI('log', 'ネットワーク監視からインポート開始を通知');
    
    // コンソールログにインポート開始を出力（csv-import-year-fix.jsが検出できるように）
    console.log('CSVデータをインポートします（ネットワーク監視による検出）');
  }
  
  /**
   * インポート完了イベントを発火
   */
  function triggerImportComplete() {
    // タイムアウトがあれば解除
    if (state.importCompleteTimeout) {
      clearTimeout(state.importCompleteTimeout);
      state.importCompleteTimeout = null;
    }
    
    // CSVYearFixのログ関数を呼び出す
    callYearFixAPI('log', 'ネットワーク監視からインポート完了を通知');
    
    // コンソールログにインポート完了を出力（csv-import-year-fix.jsが検出できるように）
    console.log('インポート完了（ネットワーク監視による検出）');
    
    // 状態をリセット
    state.csvImportDetected = false;
    state.importCompletePending = false;
    state.recentRequests = [];
  }
  
  /**
   * XMLHttpRequestの監視をセットアップ
   */
  function setupXhrInterceptor() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._requestData = {
        method,
        url,
        startTime: Date.now()
      };
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
      if (this._requestData) {
        // リクエストボディを保存（必要に応じて）
        if (body && typeof body === 'string') {
          try {
            this._requestData.body = body.length < 1000 ? body : body.substring(0, 1000) + '...';
          } catch (e) {
            // ボディの保存に失敗しても処理を続行
          }
        }
        
        // リクエストの追加（月次レポート関連のみ）
        if (isMonthlyReportEndpoint(this._requestData.url) && 
            (this._requestData.method === 'POST' || this._requestData.method === 'PUT')) {
          addRequestToQueue(this._requestData);
          log(`XHR ${this._requestData.method} ${this._requestData.url}`, 'debug');
        }
        
        // レスポンス監視
        this.addEventListener('loadend', () => {
          if (this._requestData) {
            const duration = Date.now() - this._requestData.startTime;
            
            if (isMonthlyReportEndpoint(this._requestData.url) && 
                (this._requestData.method === 'POST' || this._requestData.method === 'PUT')) {
              log(`XHR ${this._requestData.method} ${this._requestData.url} 完了 (${duration}ms)`, 'debug');
              
              // リクエスト完了処理
              handleRequestComplete(this._requestData);
            }
          }
        });
      }
      
      return originalSend.apply(this, arguments);
    };
    
    log('XMLHttpRequestの監視を開始');
  }
  
  /**
   * Fetch APIの監視をセットアップ
   */
  function setupFetchInterceptor() {
    const originalFetch = window.fetch;
    
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input?.url;
      const method = init?.method || 'GET';
      
      // リクエストデータを作成
      const requestData = {
        method,
        url,
        startTime: Date.now()
      };
      
      // リクエストの追加（月次レポート関連のみ）
      if (isMonthlyReportEndpoint(requestData.url) && 
          (requestData.method === 'POST' || requestData.method === 'PUT')) {
        addRequestToQueue(requestData);
        log(`Fetch ${requestData.method} ${requestData.url}`, 'debug');
      }
      
      // 元のfetchを呼び出す
      return originalFetch.apply(this, arguments)
        .then(response => {
          const duration = Date.now() - requestData.startTime;
          
          if (isMonthlyReportEndpoint(requestData.url) && 
              (requestData.method === 'POST' || requestData.method === 'PUT')) {
            log(`Fetch ${requestData.method} ${requestData.url} 完了 (${duration}ms)`, 'debug');
            
            // リクエスト完了処理
            handleRequestComplete(requestData);
          }
          
          return response;
        })
        .catch(error => {
          if (isMonthlyReportEndpoint(requestData.url) && 
              (requestData.method === 'POST' || requestData.method === 'PUT')) {
            log(`Fetch ${requestData.method} ${requestData.url} エラー: ${error.message}`, 'error');
            
            // エラー時もリクエスト完了処理
            handleRequestComplete(requestData);
          }
          
          throw error;
        });
    };
    
    log('Fetch APIの監視を開始');
  }
  
  /**
   * 監視のセットアップ
   */
  function setupInterceptors() {
    setupXhrInterceptor();
    setupFetchInterceptor();
  }
  
  /**
   * 初期化処理
   */
  function init() {
    try {
      if (state.initialized) {
        log('すでに初期化済みです', 'warn');
        return;
      }
      
      log('ネットワーク監視を初期化中...');
      
      // 監視をセットアップ
      setupInterceptors();
      
      state.initialized = true;
      log('ネットワーク監視の初期化完了');
      
      // CSVYearFixが既にロードされているか確認
      if (window.CSVYearFix) {
        callYearFixAPI('log', 'ネットワーク監視が接続されました');
      } else {
        log('CSVYearFixが見つかりません。単独モードで実行します', 'warn');
        
        // CSVYearFixがロードされるのを待つ
        const checkInterval = setInterval(() => {
          if (window.CSVYearFix) {
            clearInterval(checkInterval);
            callYearFixAPI('log', 'ネットワーク監視が接続されました（遅延）');
          }
        }, 500);
        
        // 一定時間後に諦める
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 10000);
      }
    } catch (error) {
      log(`初期化中にエラー: ${error.message}`, 'error');
    }
  }
  
  // ================ 公開API ================
  window.EnhancedNetworkMonitor = {
    getState: () => ({...state}),
    triggerImportStart,
    triggerImportComplete
  };
  
  // ================ 初期化実行 ================
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();