/**
 * 統合版 CSV インポート修正スクリプト
 * 
 * 特徴:
 * 1. 高度な DOM 要素検出機能による「Could not find identifiable element」エラーの解決
 * 2. 月次詳細 CSV インポート後の年度保持機能の強化
 * 3. 重複コード排除のための一元化モジュール
 * 
 * このスクリプトは以下の機能を組み合わせています:
 * - 複数の検出戦略による年度選択要素の特定
 * - MutationObserver を使用した DOM 変更の監視
 * - Network リクエスト/レスポンスの監視によるインポート検出
 * - LocalStorage を使用した状態の永続化
 * - 段階的な再試行メカニズムによる信頼性向上
 * 
 * @version 1.0.0
 * @author Claude AI
 */

(function() {
  // ==========================================================================
  // 設定
  // ==========================================================================
  
  // 基本設定
  const CONFIG = {
    // デバッグ設定
    debug: true,                       // デバッグログの有効化
    visualMarkers: false,              // 視覚的なマーカーの表示（開発時のみ有効化）
    
    // 検出設定
    yearPattern: /20[2-3]\d/,          // 年度パターン（2020-2039）
    maxRetries: 5,                     // 最大再試行回数
    retryIntervals: [150, 300, 600, 1000, 2000], // 再試行間隔（ミリ秒）
    
    // ストレージ設定
    storageKey: 'csv_import_state',    // LocalStorage のキー
    
    // 通知設定
    notificationDuration: 5000,        // 通知表示時間（ミリ秒）
    notificationPosition: 'top-right'  // 通知表示位置
  };
  
  // 内部状態
  const STATE = {
    // 実行状態
    initialized: false,                // 初期化完了フラグ
    observer: null,                    // MutationObserver インスタンス
    retryCount: 0,                     // 再試行カウンター
    lastError: null,                   // 最後のエラー
    
    // 年度情報
    yearSelector: null,                // 年度選択要素
    originalYear: null,                // 元の年度値
    detectedYear: null,                // CSV から検出された年度
    
    // インポート状態
    importInProgress: false,           // インポート進行中フラグ
    importFinished: false,             // インポート完了フラグ
    lastImportTime: null,              // 最後のインポート時間
    
    // 診断情報
    diagnosticInfo: null,              // 診断情報
    performanceMetrics: {}             // パフォーマンス測定値
  };
  
  // ==========================================================================
  // ユーティリティ関数
  // ==========================================================================
  
  /**
   * デバッグログを出力
   * @param {string} message - ログメッセージ
   * @param {string} level - ログレベル（info, warn, error, debug）
   * @param {any} data - 追加データ（省略可）
   */
  function log(message, level = 'info', data = null) {
    if (!CONFIG.debug && level === 'debug') return;
    
    const prefix = '[CSV修正]';
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    
    let consoleMethod;
    switch (level) {
      case 'error': consoleMethod = console.error; break;
      case 'warn': consoleMethod = console.warn; break;
      case 'debug': consoleMethod = console.debug; break;
      default: consoleMethod = console.log;
    }
    
    if (data) {
      consoleMethod(`${prefix} [${timestamp}] ${message}`, data);
    } else {
      consoleMethod(`${prefix} [${timestamp}] ${message}`);
    }
  }
  
  /**
   * 指定ミリ秒待機する Promise を返す
   * @param {number} ms - 待機ミリ秒
   * @return {Promise} 待機後に解決される Promise
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * LocalStorage に状態を保存
   * @param {Object} data - 保存するデータ
   */
  function saveState(data) {
    try {
      const currentState = loadState() || {};
      const newState = { ...currentState, ...data, lastUpdated: Date.now() };
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(newState));
    } catch (error) {
      log(`ストレージへの保存エラー: ${error.message}`, 'error');
    }
  }
  
  /**
   * LocalStorage から状態を読み込み
   * @return {Object|null} 保存された状態、または null
   */
  function loadState() {
    try {
      const data = localStorage.getItem(CONFIG.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      log(`ストレージからの読み込みエラー: ${error.message}`, 'error');
      return null;
    }
  }
  
  /**
   * パフォーマンス測定開始
   * @param {string} label - 測定ラベル
   */
  function startMeasure(label) {
    STATE.performanceMetrics[label] = {
      startTime: performance.now(),
      endTime: null,
      duration: null
    };
  }
  
  /**
   * パフォーマンス測定終了
   * @param {string} label - 測定ラベル
   * @return {number} 経過時間（ミリ秒）
   */
  function endMeasure(label) {
    if (!STATE.performanceMetrics[label]) return 0;
    
    const endTime = performance.now();
    const startTime = STATE.performanceMetrics[label].startTime;
    const duration = endTime - startTime;
    
    STATE.performanceMetrics[label].endTime = endTime;
    STATE.performanceMetrics[label].duration = duration;
    
    return duration;
  }
  
  // ==========================================================================
  // 主要機能: 年度選択要素の検出
  // ==========================================================================
  
  /**
   * 年度選択要素の検出を実行
   * @param {boolean} retry - 再試行フラグ
   * @return {HTMLElement|null} 検出された年度選択要素または null
   */
  async function findYearSelector(retry = false) {
    try {
      // 再試行状態の管理
      if (retry) {
        STATE.retryCount++;
        log(`再試行 (${STATE.retryCount}/${CONFIG.maxRetries}) で年度選択要素を検索`, 'info');
      } else {
        startMeasure('findYearSelector');
        log('年度選択要素の検出開始', 'info');
        STATE.retryCount = 0;
      }
      
      // すでに検出されている場合は再利用
      if (STATE.yearSelector) {
        log('既存の年度選択要素を再利用', 'debug');
        return STATE.yearSelector;
      }
      
      // 検出戦略の実行順
      const detectionStrategies = [
        { name: 'ID検索', fn: findYearSelectorById },
        { name: 'クラス検索', fn: findYearSelectorByClass },
        { name: 'セレクト要素検索', fn: findYearSelectorByContent },
        { name: 'テキスト検索', fn: findYearSelectorByText }
      ];
      
      // 各戦略を順番に試行
      for (const strategy of detectionStrategies) {
        log(`検出戦略「${strategy.name}」を実行`, 'debug');
        const element = strategy.fn();
        
        if (element) {
          log(`検出戦略「${strategy.name}」で要素を発見`, 'info');
          
          // 年度選択要素として保存
          STATE.yearSelector = element;
          STATE.originalYear = element.value;
          
          log(`現在の年度: ${STATE.originalYear}`, 'info');
          
          // 状態を保存
          saveState({
            yearSelector: {
              tagName: element.tagName,
              id: element.id,
              className: element.className,
              value: element.value
            },
            originalYear: STATE.originalYear,
            detectionTime: Date.now(),
            detectionStrategy: strategy.name
          });
          
          endMeasure('findYearSelector');
          return element;
        }
      }
      
      // 要素が見つからなかった場合
      log('どの戦略でも年度選択要素が見つかりませんでした', 'warn');
      
      // 再試行処理
      if (STATE.retryCount < CONFIG.maxRetries) {
        const interval = CONFIG.retryIntervals[STATE.retryCount] || 1000;
        log(`${interval}ms 後に再試行します`, 'info');
        
        await sleep(interval);
        return findYearSelector(true);
      }
      
      // 再試行回数上限に達した場合
      log('最大再試行回数に達しました', 'error');
      endMeasure('findYearSelector');
      return null;
    } catch (error) {
      log(`年度選択要素の検出中にエラー: ${error.message}`, 'error');
      STATE.lastError = error;
      endMeasure('findYearSelector');
      return null;
    }
  }
  
  /**
   * ID ベースで年度選択要素を検索
   * @return {HTMLElement|null} 検出された要素または null
   */
  function findYearSelectorById() {
    const idCandidates = [
      'yearSelect',
      'fiscal-year-select',
      'fiscalYearSelect',
      'fiscal_year_select',
      'year',
      'fiscalYear'
    ];
    
    for (const id of idCandidates) {
      try {
        const element = document.getElementById(id);
        if (element && isYearSelectorElement(element)) {
          log(`ID "${id}" で年度選択要素を発見`, 'debug');
          return element;
        }
      } catch (error) {
        log(`ID "${id}" の検索中にエラー: ${error.message}`, 'error');
      }
    }
    
    return null;
  }
  
  /**
   * クラス名ベースで年度選択要素を検索
   * @return {HTMLElement|null} 検出された要素または null
   */
  function findYearSelectorByClass() {
    const classSelectors = [
      '.year-select',
      '.fiscal-year-select',
      '.year-dropdown',
      '.fiscal-year-dropdown',
      '.year-selector',
      'select[name*="year"]',
      'select[name*="fiscal"]'
    ];
    
    for (const selector of classSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (isYearSelectorElement(element)) {
            log(`セレクタ "${selector}" で年度選択要素を発見`, 'debug');
            return element;
          }
        }
      } catch (error) {
        log(`セレクタ "${selector}" の検索中にエラー: ${error.message}`, 'error');
      }
    }
    
    return null;
  }
  
  /**
   * すべての SELECT 要素をチェックして年度選択要素を検索
   * @return {HTMLElement|null} 検出された要素または null
   */
  function findYearSelectorByContent() {
    try {
      const selects = document.querySelectorAll('select');
      log(`${selects.length}個のSELECT要素をチェック`, 'debug');
      
      for (const select of selects) {
        if (isYearSelectorElement(select)) {
          return select;
        }
      }
    } catch (error) {
      log(`SELECT要素の検索中にエラー: ${error.message}`, 'error');
    }
    
    return null;
  }
  
  /**
   * 年度関連のテキストを含む要素の周辺で年度選択要素を検索
   * @return {HTMLElement|null} 検出された要素または null
   */
  function findYearSelectorByText() {
    const textPatterns = ['年度', 'fiscal year', 'year'];
    
    try {
      // テキストノードを検索するための TreeWalker
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const yearTextNodes = [];
      let node;
      
      // テキストノードを収集
      while (node = walker.nextNode()) {
        const text = node.textContent.toLowerCase();
        if (textPatterns.some(pattern => text.includes(pattern)) || CONFIG.yearPattern.test(text)) {
          yearTextNodes.push(node);
        }
      }
      
      log(`${yearTextNodes.length}個の年度関連テキストノードを発見`, 'debug');
      
      // 各テキストノードの周辺でSELECT要素を検索
      for (const textNode of yearTextNodes) {
        // 親要素を取得
        const parent = textNode.parentElement;
        if (!parent) continue;
        
        // 1. 同じ親要素内のSELECT要素
        const siblingSelects = parent.querySelectorAll('select');
        for (const select of siblingSelects) {
          if (isYearSelectorElement(select)) {
            log('テキストノードの兄弟要素から年度選択要素を発見', 'debug');
            return select;
          }
        }
        
        // 2. 親の親要素内のSELECT要素
        const grandparent = parent.parentElement;
        if (grandparent) {
          const nearbySelects = grandparent.querySelectorAll('select');
          for (const select of nearbySelects) {
            if (isYearSelectorElement(select)) {
              log('テキストノードの近隣要素から年度選択要素を発見', 'debug');
              return select;
            }
          }
        }
      }
    } catch (error) {
      log(`テキスト検索中にエラー: ${error.message}`, 'error');
    }
    
    return null;
  }
  
  /**
   * 要素が年度選択要素かどうかを判定
   * @param {HTMLElement} element - 判定する要素
   * @return {boolean} 年度選択要素の場合は true
   */
  function isYearSelectorElement(element) {
    if (!element || element.tagName !== 'SELECT') return false;
    
    try {
      // 1. ID またはクラス名に年度関連のキーワードが含まれる
      if (element.id && (
        element.id.toLowerCase().includes('year') || 
        element.id.toLowerCase().includes('fiscal')
      )) {
        return true;
      }
      
      if (element.className && typeof element.className === 'string' && (
        element.className.toLowerCase().includes('year') || 
        element.className.toLowerCase().includes('fiscal')
      )) {
        return true;
      }
      
      // 2. name 属性に年度関連のキーワードが含まれる
      if (element.name && (
        element.name.toLowerCase().includes('year') || 
        element.name.toLowerCase().includes('fiscal')
      )) {
        return true;
      }
      
      // 3. オプションの値やテキストに年度を含む
      const options = element.querySelectorAll('option');
      for (const option of options) {
        if (CONFIG.yearPattern.test(option.value) || CONFIG.yearPattern.test(option.textContent)) {
          return true;
        }
      }
      
      // 4. オプションの数が少なく、値が連続した年度のような数値
      if (options.length > 0 && options.length < 10) {
        const values = Array.from(options).map(opt => parseInt(opt.value));
        const validYears = values.filter(val => !isNaN(val) && val >= 2010 && val <= 2040);
        
        if (validYears.length >= 2) {
          // 値が連続しているか判定
          const sorted = [...validYears].sort((a, b) => a - b);
          const isSequential = sorted.every((val, idx) => 
            idx === 0 || val === sorted[idx-1] + 1 || val === sorted[idx-1] + 5
          );
          
          if (isSequential) return true;
        }
      }
      
      return false;
    } catch (error) {
      log(`年度選択要素判定中にエラー: ${error.message}`, 'error');
      return false;
    }
  }
  
  // ==========================================================================
  // イベント監視と処理
  // ==========================================================================
  
  /**
   * DOM変更を監視するMutationObserverを設定
   */
  function setupDOMObserver() {
    try {
      // 既存のObserverをクリア
      if (STATE.observer) {
        STATE.observer.disconnect();
      }
      
      // 新しいObserverを作成
      STATE.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // 年度選択要素がまだ見つかっていない場合に再検索
            if (!STATE.yearSelector) {
              log('DOM変更を検出、年度選択要素を再検索', 'debug');
              findYearSelector();
            }
          }
        }
      });
      
      // documentまたはbodyの変更を監視
      const target = document.body || document.documentElement;
      STATE.observer.observe(target, { 
        childList: true, 
        subtree: true 
      });
      
      log('DOM変更の監視を開始', 'info');
      
      // 長時間実行を防ぐためのタイムアウト設定
      setTimeout(() => {
        if (STATE.observer) {
          STATE.observer.disconnect();
          log('DOM変更の監視を終了（タイムアウト）', 'debug');
        }
      }, 60000); // 60秒後に停止
    } catch (error) {
      log(`DOM監視の設定中にエラー: ${error.message}`, 'error');
    }
  }
  
  /**
   * コンソールログの監視を設定してCSVインポート操作を検出
   */
  function setupConsoleInterceptor() {
    try {
      const originalConsoleLog = console.log;
      
      console.log = function(...args) {
        // 元のconsole.logを呼び出し
        originalConsoleLog.apply(console, args);
        
        try {
          // 引数を結合してメッセージ文字列を作成
          const message = args.join(' ');
          
          // CSVインポート開始の検出
          if (message.includes('インポート処理開始') || 
              message.includes('CSVファイルから月次データをインポート') ||
              message.includes('CSVデータをインポート')) {
            log('CSVインポート開始を検出', 'info');
            onImportStart();
          }
          
          // CSV年度検出のログを検出
          const yearMatch = message.match(/CSVから年度を検出: (\d{4})/);
          if (yearMatch) {
            const detectedYear = parseInt(yearMatch[1], 10);
            log(`CSVから年度を検出: ${detectedYear}`, 'info');
            onYearDetected(detectedYear);
          }
          
          // インポート完了のログを検出
          if (message.includes('インポート成功コールバックを実行') || 
              message.includes('月次データをインポートしました') ||
              message.includes('インポート完了')) {
            log('CSVインポート完了を検出', 'info');
            onImportComplete();
          }
        } catch (error) {
          // エラーを無視して元のログ機能に影響させない
          originalConsoleLog('コンソールログ監視中にエラー:', error);
        }
      };
      
      log('コンソールログの監視を開始', 'info');
    } catch (error) {
      log(`コンソールインターセプタの設定中にエラー: ${error.message}`, 'error');
    }
  }
  
  /**
   * ネットワークリクエストの監視を設定
   */
  function setupNetworkInterceptor() {
    try {
      // XMLHttpRequestの監視
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        // URLとメソッドを保存
        this._url = url;
        this._method = method;
        return originalXHROpen.apply(this, [method, url, ...args]);
      };
      
      XMLHttpRequest.prototype.send = function(body) {
        // 月次レポート関連のPOST/PUTリクエストでインポート開始を検出
        const url = this._url || '';
        const method = this._method || '';
        
        if ((url.includes('/monthly-reports') || url.includes('/monthly-report')) && 
            (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
          log(`XHRリクエスト開始を検出: ${method} ${url}`, 'debug');
          onImportStart();
        }
        
        // レスポンス完了イベントハンドラを追加
        this.addEventListener('load', function() {
          try {
            const url = this._url || '';
            const method = this._method || '';
            
            // 月次レポート関連のPOST/PUTレスポンスでインポート完了を検出
            if ((url.includes('/monthly-reports') || url.includes('/monthly-report')) && 
                (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
              log(`XHRレスポンス完了を検出: ${method} ${url}`, 'debug');
              onImportComplete();
            }
          } catch (error) {
            log(`XHRレスポンス処理中にエラー: ${error.message}`, 'error');
          }
        });
        
        return originalXHRSend.apply(this, [body]);
      };
      
      // Fetch APIの監視
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input?.url;
        const method = init?.method || 'GET';
        
        // 月次レポート関連のPOST/PUTリクエストでインポート開始を検出
        if (url && (url.includes('/monthly-reports') || url.includes('/monthly-report')) && 
            (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
          log(`Fetchリクエスト開始を検出: ${method} ${url}`, 'debug');
          onImportStart();
        }
        
        // 元のfetchを呼び出し
        return originalFetch.apply(this, [input, init]).then(response => {
          // 月次レポート関連のPOST/PUTレスポンスでインポート完了を検出
          if (url && (url.includes('/monthly-reports') || url.includes('/monthly-report')) && 
              (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
            log(`Fetchレスポンス完了を検出: ${method} ${url}`, 'debug');
            onImportComplete();
          }
          
          return response;
        });
      };
      
      log('ネットワークリクエストの監視を開始', 'info');
    } catch (error) {
      log(`ネットワークインターセプタの設定中にエラー: ${error.message}`, 'error');
    }
  }
  
  /**
   * インポート開始時の処理
   */
  function onImportStart() {
    if (STATE.importInProgress) return;
    
    log('インポート開始を処理', 'info');
    STATE.importInProgress = true;
    STATE.importFinished = false;
    
    // 現在の年度を保存
    findYearSelector().then(selector => {
      if (selector) {
        STATE.originalYear = selector.value;
        log(`インポート前の年度: ${STATE.originalYear}`, 'info');
        
        // 状態を保存
        saveState({
          importStarted: true,
          importStartTime: Date.now(),
          originalYear: STATE.originalYear
        });
      }
    });
  }
  
  /**
   * CSVから検出した年度の処理
   * @param {number} year - 検出された年度
   */
  function onYearDetected(year) {
    log(`CSVからの年度検出: ${year}`, 'info');
    
    STATE.detectedYear = year;
    
    // 状態を保存
    saveState({
      detectedYear: year,
      detectionTime: Date.now()
    });
  }
  
  /**
   * インポート完了時の処理
   */
  async function onImportComplete() {
    if (STATE.importFinished) return;
    
    log('インポート完了を処理', 'info');
    STATE.importFinished = true;
    STATE.lastImportTime = Date.now();
    
    // 少し待機して画面更新を待つ
    await sleep(500);
    
    // 年度選択要素の再検出
    const yearSelector = await findYearSelector();
    if (!yearSelector) {
      log('年度選択要素が見つかりません。年度復元をスキップ', 'error');
      return;
    }
    
    // 使用する年度を決定（検出値→元の値の優先順）
    const yearToRestore = STATE.detectedYear || STATE.originalYear;
    if (!yearToRestore) {
      log('復元する年度値がありません', 'warn');
      return;
    }
    
    // 現在の値と異なる場合のみ変更
    if (yearSelector.value !== yearToRestore.toString()) {
      log(`年度を ${yearToRestore} に変更します (現在値: ${yearSelector.value})`, 'info');
      
      // 値を設定
      yearSelector.value = yearToRestore.toString();
      
      // change イベントを発火
      const event = new Event('change', { bubbles: true });
      yearSelector.dispatchEvent(event);
      
      // 通知を表示
      showNotification(`✓ 年度を ${yearToRestore} に設定しました`);
    } else {
      log(`年度は既に正しく設定されています: ${yearToRestore}`, 'info');
    }
    
    // インポート状態をリセット
    STATE.importInProgress = false;
    
    // 状態を保存
    saveState({
      importFinished: true,
      importEndTime: Date.now(),
      restoredYear: yearToRestore
    });
  }
  
  /**
   * 通知を表示
   * @param {string} message - 表示するメッセージ
   * @param {string} type - 通知のタイプ（success, error, info, warning）
   */
  function showNotification(message, type = 'success') {
    try {
      // 通知コンテナを取得または作成
      let container = document.getElementById('csv-fix-notifications');
      if (!container) {
        container = document.createElement('div');
        container.id = 'csv-fix-notifications';
        container.style.position = 'fixed';
        container.style.zIndex = '9999';
        
        // 位置を設定
        switch (CONFIG.notificationPosition) {
          case 'top-right':
            container.style.top = '20px';
            container.style.right = '20px';
            break;
          case 'top-left':
            container.style.top = '20px';
            container.style.left = '20px';
            break;
          case 'bottom-right':
            container.style.bottom = '20px';
            container.style.right = '20px';
            break;
          case 'bottom-left':
            container.style.bottom = '20px';
            container.style.left = '20px';
            break;
          default:
            container.style.top = '20px';
            container.style.right = '20px';
        }
        
        document.body.appendChild(container);
      }
      
      // 通知要素を作成
      const notification = document.createElement('div');
      notification.style.padding = '12px 20px';
      notification.style.marginBottom = '10px';
      notification.style.borderRadius = '4px';
      notification.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
      notification.style.fontSize = '14px';
      notification.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
      notification.style.transition = 'all 0.3s ease';
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      
      // タイプ別スタイル
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
        case 'info':
        default:
          notification.style.backgroundColor = '#2196f3';
          notification.style.color = 'white';
      }
      
      // メッセージを設定
      notification.textContent = message;
      
      // アニメーションスタイルを追加
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
      `;
      document.head.appendChild(style);
      
      // コンテナに追加
      container.appendChild(notification);
      
      // フェードイン
      notification.style.animation = 'fadeIn 0.3s forwards';
      
      // 一定時間後に削除
      setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, CONFIG.notificationDuration);
    } catch (error) {
      log(`通知表示中にエラー: ${error.message}`, 'error');
    }
  }
  
  // ==========================================================================
  // 診断機能
  // ==========================================================================
  
  /**
   * システム診断を実行して詳細情報を収集
   * @return {Object} 診断結果
   */
  function runDiagnostics() {
    log('システム診断を実行', 'info');
    
    try {
      // DOM診断
      const domInfo = {
        allSelects: Array.from(document.querySelectorAll('select')).length,
        yearTextElements: Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && (
            el.textContent.includes('年度') || 
            el.textContent.includes('fiscal') || 
            el.textContent.includes('year')
          )
        ).length,
        bodyChildCount: document.body?.children.length,
        idCount: document.querySelectorAll('[id]').length,
        yearPattern: CONFIG.yearPattern.toString()
      };
      
      // 年度選択要素診断
      const selectorInfo = STATE.yearSelector ? {
        tagName: STATE.yearSelector.tagName,
        id: STATE.yearSelector.id,
        className: STATE.yearSelector.className,
        name: STATE.yearSelector.name,
        optionCount: STATE.yearSelector.options?.length,
        currentValue: STATE.yearSelector.value,
        optionValues: Array.from(STATE.yearSelector.options || []).map(opt => ({
          value: opt.value,
          text: opt.textContent
        }))
      } : null;
      
      // ストレージ診断
      const storageInfo = {
        localStorageAvailable: isLocalStorageAvailable(),
        savedState: loadState()
      };
      
      // パフォーマンス診断
      const performanceInfo = {
        metrics: STATE.performanceMetrics,
        initializationTime: STATE.performanceMetrics.init?.duration || 0,
        detectionTime: STATE.performanceMetrics.findYearSelector?.duration || 0
      };
      
      // 統合診断結果
      const diagnosticResult = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        dom: domInfo,
        yearSelector: selectorInfo,
        storage: storageInfo,
        performance: performanceInfo,
        config: { ...CONFIG, debug: undefined },
        state: {
          initialized: STATE.initialized,
          retryCount: STATE.retryCount,
          originalYear: STATE.originalYear,
          detectedYear: STATE.detectedYear,
          importInProgress: STATE.importInProgress,
          importFinished: STATE.importFinished,
          lastImportTime: STATE.lastImportTime ? new Date(STATE.lastImportTime).toISOString() : null
        }
      };
      
      // 詳細をコンソールに出力
      console.group('CSV Import Fix 診断結果');
      console.log('診断実行時刻:', diagnosticResult.timestamp);
      console.log('年度選択要素:', diagnosticResult.yearSelector);
      console.log('DOM情報:', diagnosticResult.dom);
      console.log('パフォーマンス:', diagnosticResult.performance);
      console.log('保存状態:', diagnosticResult.storage);
      console.groupEnd();
      
      // 診断結果を保存
      STATE.diagnosticInfo = diagnosticResult;
      saveState({ lastDiagnostic: diagnosticResult });
      
      return diagnosticResult;
    } catch (error) {
      log(`診断実行中にエラー: ${error.message}`, 'error');
      return { error: error.message, state: STATE };
    }
  }
  
  /**
   * LocalStorageが利用可能かチェック
   * @return {boolean} 利用可能な場合はtrue
   */
  function isLocalStorageAvailable() {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * 年度選択要素の状態をHTML文字列で出力
   * @return {string} HTML形式の診断情報
   */
  function getYearSelectorStatusHTML() {
    const selector = STATE.yearSelector;
    if (!selector) {
      return '<div style="color:red">年度選択要素が見つかりません</div>';
    }
    
    return `
      <div style="font-family:monospace;background:#f8f9fa;padding:10px;border-radius:4px;border:1px solid #ddd">
        <div><strong>タグ名:</strong> ${selector.tagName}</div>
        <div><strong>ID:</strong> ${selector.id || '（なし）'}</div>
        <div><strong>クラス:</strong> ${selector.className || '（なし）'}</div>
        <div><strong>現在値:</strong> ${selector.value}</div>
        <div><strong>オプション数:</strong> ${selector.options?.length || 0}</div>
      </div>
    `;
  }
  
  // ==========================================================================
  // 初期化および公開 API
  // ==========================================================================
  
  /**
   * モジュールを初期化
   */
  async function init() {
    try {
      if (STATE.initialized) {
        log('すでに初期化済み', 'warn');
        return;
      }
      
      startMeasure('init');
      log('CSV Import Fix を初期化中...', 'info');
      
      // 監視機能をセットアップ
      setupConsoleInterceptor();
      setupNetworkInterceptor();
      setupDOMObserver();
      
      // 年度選択要素を検出
      const yearSelector = await findYearSelector();
      
      if (yearSelector) {
        STATE.yearSelector = yearSelector;
        STATE.originalYear = yearSelector.value;
        
        log(`年度選択要素を検出: ${yearSelector.tagName}#${yearSelector.id || ''}`, 'info');
        log(`現在の年度: ${STATE.originalYear}`, 'info');
        
        showNotification('✓ CSV年度修正機能を有効化しました', 'success');
      } else {
        log('年度選択要素の検出に失敗', 'error');
        showNotification('⚠ 年度選択要素が見つかりません。診断機能を実行してください', 'warning');
      }
      
      STATE.initialized = true;
      endMeasure('init');
      
      log('初期化完了', 'info');
      
      // 初期診断を実行
      runDiagnostics();
      
      return true;
    } catch (error) {
      log(`初期化中にエラー: ${error.message}`, 'error');
      STATE.lastError = error;
      endMeasure('init');
      return false;
    }
  }
  
  /**
   * DOMが準備完了したら初期化を実行
   */
  function domReadyInit() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      init();
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }
  }
  
  // グローバルAPIとして公開
  window.CSVImportFix = {
    // 状態管理
    getState: () => ({...STATE}),
    getConfig: () => ({...CONFIG}),
    
    // 主要機能
    findYearSelector,
    setYear: (year) => {
      if (!STATE.yearSelector) {
        log('年度選択要素が見つかりません', 'error');
        return false;
      }
      
      log(`年度を手動で設定: ${year}`, 'info');
      STATE.yearSelector.value = year;
      
      // changeイベントを発火
      const event = new Event('change', { bubbles: true });
      STATE.yearSelector.dispatchEvent(event);
      
      return true;
    },
    
    // 診断機能
    runDiagnostics,
    getYearSelectorStatusHTML,
    
    // ユーティリティ
    showNotification,
    log
  };
  
  // 初期化を開始
  domReadyInit();
  
  log('CSVImportFix がグローバル変数として利用可能です (window.CSVImportFix)', 'info');
})();