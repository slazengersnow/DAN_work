/**
 * Enhanced DOM Detector for Monthly Reports CSV Import
 * 
 * 高度なDOM分析機能を提供し、「Could not find identifiable element」エラーを解決します
 * 
 * 特徴:
 * 1. 複数の検出戦略を使用して年度選択要素を特定
 * 2. 段階的な再試行メカニズムによる信頼性の向上
 * 3. MutationObserverを使用したDOM変更の監視
 * 4. 詳細なデバッグ情報の提供
 * 5. 視覚的なDOM要素ハイライト機能
 * 
 * @version 1.0.0
 * @author Claude AI
 */

(function() {
  // ==========================================================================
  // 設定
  // ==========================================================================
  const config = {
    // 基本設定
    debugMode: true,                // デバッグ情報の出力を有効化
    visualMarkers: true,            // DOM要素の視覚的ハイライトを有効化
    
    // 検出設定
    yearPattern: /20[2-3]\d/,       // 年度の正規表現パターン（2020-2039年）
    textContains: ['年度', 'fiscal', 'year'], // 検索する文字列
    
    // 再試行設定
    maxRetries: 5,                  // 最大再試行回数
    retryIntervals: [100, 300, 500, 1000, 2000], // 再試行間隔（ミリ秒）
    
    // MutationObserver設定
    observerTimeout: 30000,         // MutationObserverのタイムアウト（ミリ秒）
    
    // ストレージキー
    storageKey: 'monthly_report_year_state',  // LocalStorageのキー
    
    // 通知設定
    notificationDuration: 5000,     // 通知の表示時間（ミリ秒）
    notificationPosition: 'top-right' // 通知の位置
  };
  
  // 内部状態を管理
  const state = {
    // 検出状態
    yearSelectors: [],              // 検出された年度セレクタ
    bestSelector: null,             // 最適な年度セレクタ
    foundElements: {                // 検出された要素
      selects: [],                  // すべてのセレクト要素
      textNodes: [],                // テキストを含む要素
      containers: []                // コンテナ要素
    },
    
    // 実行状態
    initialized: false,             // 初期化済みフラグ
    domReady: false,                // DOM準備完了フラグ
    retryCount: 0,                  // 再試行カウンタ
    lastError: null,                // 最後のエラー
    observer: null,                 // MutationObserver
    
    // 年度情報
    detectedYear: null,             // 検出された年度
    originalYear: null,             // 元の年度
    
    // デバッグ情報
    analysisStartTime: null,        // 分析開始時間
    analysisEndTime: null,          // 分析終了時間
    analysisResults: null,          // 分析結果
    performanceMetrics: {}          // パフォーマンス指標
  };
  
  // ==========================================================================
  // ユーティリティ関数
  // ==========================================================================
  
  /**
   * デバッグログを出力
   * @param {string} message - ログメッセージ
   * @param {string} type - ログのタイプ（info, warn, error, debug）
   * @param {any} data - 追加データ
   */
  function log(message, type = 'info', data = null) {
    if (!config.debugMode && type === 'debug') return;
    
    const prefix = '[DOM検出]';
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
    
    // クローンされたデータを作成
    const safeData = data ? JSON.parse(JSON.stringify(data, (key, value) => {
      if (value instanceof Node) return `[${value.nodeName}]`;
      if (value instanceof Window) return '[Window]';
      if (value instanceof Document) return '[Document]';
      return value;
    })) : null;
    
    switch (type) {
      case 'error':
        console.error(`${prefix} [${timestamp}] ${message}`, safeData);
        break;
      case 'warn':
        console.warn(`${prefix} [${timestamp}] ${message}`, safeData);
        break;
      case 'debug':
        console.debug(`${prefix} [${timestamp}] ${message}`, safeData);
        break;
      default:
        console.log(`${prefix} [${timestamp}] ${message}`, safeData);
    }
  }
  
  /**
   * パフォーマンス計測開始
   * @param {string} label - 計測ラベル
   */
  function startPerformanceMeasure(label) {
    const startTime = performance.now();
    state.performanceMetrics[label] = { startTime, endTime: null, duration: null };
    return startTime;
  }
  
  /**
   * パフォーマンス計測終了
   * @param {string} label - 計測ラベル
   */
  function endPerformanceMeasure(label) {
    if (!state.performanceMetrics[label]) return 0;
    
    const endTime = performance.now();
    const startTime = state.performanceMetrics[label].startTime;
    const duration = endTime - startTime;
    
    state.performanceMetrics[label].endTime = endTime;
    state.performanceMetrics[label].duration = duration;
    
    log(`${label} 完了: ${duration.toFixed(2)}ms`, 'debug');
    return duration;
  }
  
  /**
   * 要素の詳細情報を取得
   * @param {Element} element - 対象要素
   * @return {Object} 要素の詳細情報
   */
  function getElementDetails(element) {
    if (!element) return { found: false };
    
    try {
      // 要素の属性を収集
      const attributes = {};
      for (let i = 0; i < element.attributes?.length || 0; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
      }
      
      // 子要素の数を計数
      const childCounts = {
        elements: element.children?.length || 0,
        childNodes: element.childNodes?.length || 0,
        options: element.tagName === 'SELECT' ? element.options?.length || 0 : 0
      };
      
      // セレクタパスを生成
      const paths = generateSelectorPaths(element);
      
      // オプション値（select要素の場合）
      const optionValues = element.tagName === 'SELECT' 
        ? Array.from(element.options || []).map(opt => ({
            value: opt.value,
            text: opt.textContent?.trim(),
            selected: opt.selected
          }))
        : [];
      
      return {
        found: true,
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        textContent: element.textContent?.substring(0, 100) + (element.textContent?.length > 100 ? '...' : ''),
        value: element.value,
        attributes,
        childCounts,
        paths,
        optionValues,
        containsYear: containsYearText(element),
        boundingRect: element.getBoundingClientRect()
      };
    } catch (error) {
      log(`要素詳細の取得中にエラー: ${error.message}`, 'error');
      return { 
        found: true, 
        tagName: element.tagName,
        error: error.message 
      };
    }
  }
  
  /**
   * 要素のセレクタパスの配列を生成（複数の戦略を使用）
   * @param {Element} element - 対象要素
   * @return {string[]} セレクタパスの配列
   */
  function generateSelectorPaths(element) {
    if (!element) return [];
    
    const paths = [];
    
    // 1. ID ベースのパス（最優先）
    if (element.id) {
      paths.push(`#${element.id}`);
    }
    
    // 2. クラス名ベースのパス
    if (element.className && typeof element.className === 'string') {
      const classPath = '.' + element.className.trim().split(/\s+/).join('.');
      if (classPath !== '.') paths.push(classPath);
    }
    
    // 3. 属性ベースのパス
    if (element.getAttribute('name')) {
      paths.push(`${element.tagName.toLowerCase()}[name="${element.getAttribute('name')}"]`);
    }
    
    if (element.getAttribute('data-testid')) {
      paths.push(`[data-testid="${element.getAttribute('data-testid')}"]`);
    }
    
    // 4. タグ名 + インデックスベースのパス
    const siblings = Array.from(element.parentElement?.children || []);
    const tagName = element.tagName.toLowerCase();
    
    if (siblings.length > 0) {
      const index = siblings.indexOf(element);
      if (index !== -1) {
        paths.push(`${tagName}:nth-child(${index + 1})`);
      }
      
      // 同じタグ名の要素のみでのインデックス
      const sameTagSiblings = siblings.filter(el => el.tagName === element.tagName);
      const tagIndex = sameTagSiblings.indexOf(element);
      if (tagIndex !== -1) {
        paths.push(`${tagName}:nth-of-type(${tagIndex + 1})`);
      }
    }
    
    // 5. 階層ベースのパス（最大3階層まで）
    let hierarchyPath = '';
    let currentElement = element;
    let depth = 0;
    
    while (currentElement && currentElement !== document.body && depth < 3) {
      // 現在の要素のシンプルなセレクタ
      let currentSelector = currentElement.tagName.toLowerCase();
      
      if (currentElement.id) {
        currentSelector = `#${currentElement.id}`;
      } else if (currentElement.className && typeof currentElement.className === 'string') {
        const classList = currentElement.className.trim().split(/\s+/);
        if (classList.length > 0 && classList[0]) {
          currentSelector += `.${classList[0]}`;
        }
      }
      
      // パスを構築
      hierarchyPath = hierarchyPath 
        ? `${currentSelector} > ${hierarchyPath}`
        : currentSelector;
      
      // 親要素に移動
      currentElement = currentElement.parentElement;
      depth++;
    }
    
    if (hierarchyPath) paths.push(hierarchyPath);
    
    // 6. シンプルなタグ名
    paths.push(tagName);
    
    return paths;
  }
  
  /**
   * 要素が年度関連のテキストを含むか確認
   * @param {Element} element - 対象要素
   * @return {boolean} 年度関連テキストを含む場合はtrue
   */
  function containsYearText(element) {
    if (!element || !element.textContent) return false;
    
    const text = element.textContent.toLowerCase();
    
    // 設定した文字列のいずれかを含むか確認
    const hasYearText = config.textContains.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    // 年度のパターンにマッチするか確認
    const hasYearPattern = config.yearPattern.test(text);
    
    return hasYearText || hasYearPattern;
  }
  
  /**
   * 指定ミリ秒待機する Promise を返す
   * @param {number} ms - 待機ミリ秒
   * @return {Promise} 待機後に解決されるPromise
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * LocalStorage に状態を保存
   * @param {Object} data - 保存するデータ
   */
  function saveToStorage(data) {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify(data));
    } catch (error) {
      log(`ストレージへの保存に失敗: ${error.message}`, 'error');
    }
  }
  
  /**
   * LocalStorage から状態を読み込み
   * @return {Object|null} 保存されたデータ、または null
   */
  function loadFromStorage() {
    try {
      const data = localStorage.getItem(config.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      log(`ストレージからの読み込みに失敗: ${error.message}`, 'error');
      return null;
    }
  }
  
  // ==========================================================================
  // 主要機能: 年度選択要素の検出
  // ==========================================================================
  
  /**
   * 年度選択要素の検出を開始
   * @param {boolean} retry - 再試行かどうか
   */
  async function findYearSelector(retry = false) {
    if (retry) {
      state.retryCount++;
      log(`年度選択要素の検出を再試行 (${state.retryCount}/${config.maxRetries})`, 'info');
    } else {
      startPerformanceMeasure('findYearSelector');
      log('年度選択要素の検出を開始', 'info');
    }
    
    try {
      // すでに要素が見つかっている場合は再利用
      if (state.bestSelector) {
        log('既存の年度選択要素を使用', 'debug');
        return state.bestSelector;
      }
      
      // 各戦略を順番に試行
      let yearSelector = null;
      
      // 戦略1: ID ベースの検索
      if (!yearSelector) {
        yearSelector = findYearSelectorById();
      }
      
      // 戦略2: クラス名ベースの検索
      if (!yearSelector) {
        yearSelector = findYearSelectorByClass();
      }
      
      // 戦略3: セレクト要素の内容ベースの検索
      if (!yearSelector) {
        yearSelector = findYearSelectorByContent();
      }
      
      // 戦略4: 文字列検索を使用したDOM全体の走査
      if (!yearSelector) {
        yearSelector = findYearSelectorByTextContent();
      }
      
      // 結果の処理
      if (yearSelector) {
        log('年度選択要素を発見', 'info', getElementDetails(yearSelector));
        
        // 最適な要素として保存
        state.bestSelector = yearSelector;
        
        // 現在の年度を記録
        state.originalYear = yearSelector.value;
        log(`現在の年度: ${state.originalYear}`, 'info');
        
        // ストレージに保存
        saveToStorage({
          year: state.originalYear,
          timestamp: Date.now(),
          selectorPaths: generateSelectorPaths(yearSelector)
        });
        
        endPerformanceMeasure('findYearSelector');
        return yearSelector;
      }
      
      // 要素が見つからなかった場合
      log('年度選択要素が見つかりませんでした', 'warn');
      
      // 再試行メカニズム
      if (state.retryCount < config.maxRetries) {
        const interval = config.retryIntervals[state.retryCount] || 1000;
        log(`${interval}ms後に再試行します`, 'info');
        
        await sleep(interval);
        return findYearSelector(true);
      }
      
      // 最大再試行回数に達した場合
      throw new Error('年度選択要素の検出に失敗しました（最大再試行回数に達しました）');
    } catch (error) {
      log(`年度選択要素の検出中にエラー: ${error.message}`, 'error');
      state.lastError = error;
      endPerformanceMeasure('findYearSelector');
      return null;
    }
  }
  
  /**
   * ID ベースで年度選択要素を検索
   * @return {Element|null} 見つかった要素または null
   */
  function findYearSelectorById() {
    startPerformanceMeasure('findYearSelectorById');
    log('ID ベースで年度選択要素を検索', 'debug');
    
    const idSelectors = [
      'yearSelect',
      'fiscal-year-select',
      'fiscalYearSelect',
      'year',
      'fiscal_year'
    ];
    
    for (const id of idSelectors) {
      try {
        const element = document.getElementById(id);
        if (element && isYearSelectorElement(element)) {
          log(`ID "${id}" で年度選択要素を発見`, 'debug');
          endPerformanceMeasure('findYearSelectorById');
          return element;
        }
      } catch (error) {
        log(`ID "${id}" の検索中にエラー: ${error.message}`, 'error');
      }
    }
    
    endPerformanceMeasure('findYearSelectorById');
    return null;
  }
  
  /**
   * クラス名ベースで年度選択要素を検索
   * @return {Element|null} 見つかった要素または null
   */
  function findYearSelectorByClass() {
    startPerformanceMeasure('findYearSelectorByClass');
    log('クラス名ベースで年度選択要素を検索', 'debug');
    
    const classSelectors = [
      '.year-select',
      '.fiscal-year-select',
      '.year-dropdown',
      '.fiscal-year-dropdown',
      '.year-selector',
      '.year-filter'
    ];
    
    for (const selector of classSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (isYearSelectorElement(element)) {
            log(`クラス "${selector}" で年度選択要素を発見`, 'debug');
            endPerformanceMeasure('findYearSelectorByClass');
            return element;
          }
        }
      } catch (error) {
        log(`クラス "${selector}" の検索中にエラー: ${error.message}`, 'error');
      }
    }
    
    endPerformanceMeasure('findYearSelectorByClass');
    return null;
  }
  
  /**
   * セレクト要素の内容ベースで年度選択要素を検索
   * @return {Element|null} 見つかった要素または null
   */
  function findYearSelectorByContent() {
    startPerformanceMeasure('findYearSelectorByContent');
    log('内容ベースで年度選択要素を検索', 'debug');
    
    try {
      const selects = document.querySelectorAll('select');
      state.foundElements.selects = Array.from(selects);
      
      log(`${selects.length}個のセレクト要素を検出`, 'debug');
      
      for (const select of selects) {
        if (isYearSelectorElement(select)) {
          log('内容から年度選択要素を発見', 'debug');
          endPerformanceMeasure('findYearSelectorByContent');
          return select;
        }
      }
    } catch (error) {
      log(`内容ベースの検索中にエラー: ${error.message}`, 'error');
    }
    
    endPerformanceMeasure('findYearSelectorByContent');
    return null;
  }
  
  /**
   * 文字列検索を使用して年度選択要素を検索
   * @return {Element|null} 見つかった要素または null
   */
  function findYearSelectorByTextContent() {
    startPerformanceMeasure('findYearSelectorByTextContent');
    log('文字列検索を使用して年度選択要素を検索', 'debug');
    
    try {
      // 年度関連の文字列を含む要素を検索
      const elements = [];
      const walk = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
      );
      
      let node;
      while (node = walk.nextNode()) {
        if (containsYearText(node)) {
          elements.push(node);
        }
      }
      
      state.foundElements.textNodes = elements;
      log(`${elements.length}個の年度関連テキストを含む要素を検出`, 'debug');
      
      // 検出した要素の周辺でselect要素を探す
      for (const element of elements) {
        // 1. 要素自体がselect
        if (element.tagName === 'SELECT' && isYearSelectorElement(element)) {
          log('テキスト内容に基づいて年度選択要素を発見', 'debug');
          endPerformanceMeasure('findYearSelectorByTextContent');
          return element;
        }
        
        // 2. 親要素内のselect
        const parentSelects = element.parentElement?.querySelectorAll('select');
        if (parentSelects && parentSelects.length > 0) {
          for (const select of parentSelects) {
            if (isYearSelectorElement(select)) {
              log('親要素内に年度選択要素を発見', 'debug');
              endPerformanceMeasure('findYearSelectorByTextContent');
              return select;
            }
          }
        }
        
        // 3. 兄弟要素内のselect
        const siblingSelects = element.parentElement?.querySelectorAll('select');
        if (siblingSelects && siblingSelects.length > 0) {
          for (const select of siblingSelects) {
            if (isYearSelectorElement(select)) {
              log('兄弟要素内に年度選択要素を発見', 'debug');
              endPerformanceMeasure('findYearSelectorByTextContent');
              return select;
            }
          }
        }
      }
    } catch (error) {
      log(`文字列検索中にエラー: ${error.message}`, 'error');
    }
    
    endPerformanceMeasure('findYearSelectorByTextContent');
    return null;
  }
  
  /**
   * 要素が年度選択要素かどうかを判定
   * @param {Element} element - 対象要素
   * @return {boolean} 年度選択要素である場合はtrue
   */
  function isYearSelectorElement(element) {
    if (!element) return false;
    
    try {
      // select要素でない場合はfalse
      if (element.tagName !== 'SELECT') return false;
      
      // 1. ID または クラス名に'year'または'fiscal'を含む
      if (element.id && (element.id.toLowerCase().includes('year') || 
                          element.id.toLowerCase().includes('fiscal'))) {
        return true;
      }
      
      if (element.className && typeof element.className === 'string' && 
          (element.className.toLowerCase().includes('year') || 
           element.className.toLowerCase().includes('fiscal'))) {
        return true;
      }
      
      // 2. option要素に年度を含む
      const options = element.querySelectorAll('option');
      for (const option of options) {
        const optionValue = option.value;
        const optionText = option.textContent;
        
        // 年度のパターンにマッチするか確認
        if ((optionValue && config.yearPattern.test(optionValue)) || 
            (optionText && config.yearPattern.test(optionText))) {
          return true;
        }
      }
      
      // 3. オプションの数が少なく、値が連続した数値である場合
      if (options.length > 0 && options.length < 10) {
        const values = Array.from(options).map(opt => parseInt(opt.value));
        const nonNanValues = values.filter(val => !isNaN(val));
        
        if (nonNanValues.length === values.length) {
          // すべての値が数値である場合、連続しているか確認
          const sorted = [...nonNanValues].sort((a, b) => a - b);
          const isSequential = sorted.every((val, idx) => 
            idx === 0 || val === sorted[idx-1] + 1
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
    if (state.observer) {
      log('既存のDOM観察者を停止', 'debug');
      state.observer.disconnect();
    }
    
    log('DOM変更の監視を開始', 'info');
    
    try {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            log('DOM変更を検出', 'debug');
            
            // 年度選択要素がまだ見つかっていない場合、再検索
            if (!state.bestSelector) {
              findYearSelector();
            }
          }
        }
      });
      
      // document.bodyの変更を監視
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      state.observer = observer;
      
      // 安全のため、一定時間後にObserverを停止
      setTimeout(() => {
        if (state.observer) {
          log('DOM観察者のタイムアウトにより停止', 'debug');
          state.observer.disconnect();
          state.observer = null;
        }
      }, config.observerTimeout);
    } catch (error) {
      log(`DOM変更監視の設定中にエラー: ${error.message}`, 'error');
    }
  }
  
  /**
   * CSVインポート関連のログを監視するためにconsole.logを拡張
   */
  function setupConsoleInterceptor() {
    log('コンソールログの監視を開始', 'info');
    
    const originalConsoleLog = console.log;
    
    console.log = function(...args) {
      // 元のコンソールログを呼び出し
      originalConsoleLog.apply(console, args);
      
      try {
        // 引数を結合した文字列を作成
        const message = args.join(' ');
        
        // CSVインポート開始のログを検出
        if (message.includes('インポート処理開始') || 
            message.includes('CSVファイルから月次データをインポート') ||
            message.includes('CSVデータをインポート')) {
          log('CSVインポート開始を検出', 'info');
          onImportStart();
        }
        
        // CSVからの年度検出のログを検出
        const yearMatch = message.match(/CSVから年度を検出: (\d{4})/);
        if (yearMatch) {
          const detectedYear = parseInt(yearMatch[1], 10);
          log(`CSVからの年度検出を検出: ${detectedYear}`, 'info');
          onYearDetected(detectedYear);
        }
        
        // CSVインポート完了のログを検出
        if (message.includes('インポート成功コールバックを実行') || 
            message.includes('月次データをインポートしました') ||
            message.includes('インポート完了')) {
          log('CSVインポート完了を検出', 'info');
          onImportComplete();
        }
      } catch (error) {
        // エラーをキャッチして元のログ機能に影響しないようにする
        originalConsoleLog.apply(console, ['[DOM検出] コンソールログ監視中にエラー:', error]);
      }
    };
  }
  
  /**
   * XHRおよびFetchリクエストを監視
   */
  function setupXHRInterceptor() {
    log('XHRおよびFetchリクエストの監視を開始', 'info');
    
    // XMLHttpRequestの監視
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._url = url;
      this._method = method;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
      // レスポンス完了時のイベントハンドラを追加
      this.addEventListener('load', function() {
        try {
          const url = this._url || '';
          const method = this._method || '';
          
          // 月次レポート関連のAPIリクエストを検出
          if (url.includes('/monthly-reports') || 
              url.includes('/monthly-report') || 
              url.includes('/api/monthly')) {
            log(`XHRリクエスト完了を検出: ${method} ${url}`, 'debug');
            
            if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') {
              // POST/PUTの場合はデータインポートとみなす
              onImportComplete();
            }
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
      
      // 元のfetchを呼び出し
      return originalFetch.apply(this, [input, init]).then(response => {
        try {
          // 月次レポート関連のAPIリクエストを検出
          if (url && (url.includes('/monthly-reports') || 
                     url.includes('/monthly-report') || 
                     url.includes('/api/monthly'))) {
            log(`Fetchリクエスト完了を検出: ${method} ${url}`, 'debug');
            
            if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') {
              // POST/PUTの場合はデータインポートとみなす
              onImportComplete();
            }
          }
        } catch (error) {
          log(`Fetchレスポンス処理中にエラー: ${error.message}`, 'error');
        }
        
        return response;
      });
    };
  }
  
  // ==========================================================================
  // イベントハンドラ
  // ==========================================================================
  
  /**
   * インポート開始時の処理
   */
  function onImportStart() {
    log('インポート開始イベントを処理', 'info');
    
    // まだ年度選択要素が見つかっていない場合は探す
    if (!state.bestSelector) {
      findYearSelector().then(selector => {
        if (selector) {
          // 現在の年度を保存
          state.originalYear = selector.value;
          log(`インポート前の年度: ${state.originalYear}`, 'info');
          
          // ストレージに保存
          saveToStorage({
            year: state.originalYear,
            timestamp: Date.now(),
            action: 'import_start'
          });
        }
      });
    } else {
      // 現在の年度を保存
      state.originalYear = state.bestSelector.value;
      log(`インポート前の年度: ${state.originalYear}`, 'info');
      
      // ストレージに保存
      saveToStorage({
        year: state.originalYear,
        timestamp: Date.now(),
        action: 'import_start'
      });
    }
  }
  
  /**
   * CSVからの年度検出時の処理
   * @param {number} year - 検出された年度
   */
  function onYearDetected(year) {
    log(`CSVから検出された年度: ${year}`, 'info');
    
    // 検出された年度を保存
    state.detectedYear = year;
    
    // ストレージに保存
    saveToStorage({
      year: state.originalYear,
      detectedYear: year,
      timestamp: Date.now(),
      action: 'year_detected'
    });
  }
  
  /**
   * インポート完了時の処理
   */
  async function onImportComplete() {
    log('インポート完了イベントを処理', 'info');
    
    // 少し待機して画面の更新を待つ
    await sleep(500);
    
    // 使用する年度を決定（検出されたものがあればそれを優先）
    const yearToRestore = state.detectedYear || state.originalYear;
    
    if (!yearToRestore) {
      log('復元する年度がありません', 'warn');
      return;
    }
    
    // まだ年度選択要素が見つかっていない場合は探す
    if (!state.bestSelector) {
      const selector = await findYearSelector();
      if (!selector) {
        log('年度選択要素が見つからないため、年度を復元できません', 'error');
        return;
      }
      state.bestSelector = selector;
    }
    
    // 年度が変更されているか確認
    if (state.bestSelector.value !== yearToRestore) {
      log(`年度を復元: ${yearToRestore} (現在: ${state.bestSelector.value})`, 'info');
      
      // 年度を設定
      state.bestSelector.value = yearToRestore;
      
      // change イベントを発火
      const event = new Event('change', { bubbles: true });
      state.bestSelector.dispatchEvent(event);
      
      // 通知を表示
      showNotification(`✓ 年度を ${yearToRestore} に設定しました`);
    } else {
      log(`年度は既に正しく設定されています: ${yearToRestore}`, 'info');
    }
    
    // ストレージに保存
    saveToStorage({
      year: yearToRestore,
      restored: true,
      timestamp: Date.now(),
      action: 'import_complete'
    });
  }
  
  // ==========================================================================
  // UI 関連
  // ==========================================================================
  
  /**
   * 通知を表示
   * @param {string} message - 表示するメッセージ
   * @param {string} type - 通知のタイプ（success, error, info, warning）
   */
  function showNotification(message, type = 'success') {
    log(`通知を表示: ${message} (${type})`, 'debug');
    
    try {
      // 既存の通知コンテナを探す
      let container = document.getElementById('year-manager-notifications');
      
      // コンテナがなければ作成
      if (!container) {
        container = document.createElement('div');
        container.id = 'year-manager-notifications';
        container.style.position = 'fixed';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-end';
        
        // 位置の設定
        switch (config.notificationPosition) {
          case 'top-right':
            container.style.top = '20px';
            container.style.right = '20px';
            break;
          case 'top-left':
            container.style.top = '20px';
            container.style.left = '20px';
            container.style.alignItems = 'flex-start';
            break;
          case 'bottom-right':
            container.style.bottom = '20px';
            container.style.right = '20px';
            break;
          case 'bottom-left':
            container.style.bottom = '20px';
            container.style.left = '20px';
            container.style.alignItems = 'flex-start';
            break;
          default:
            container.style.top = '20px';
            container.style.right = '20px';
        }
        
        document.body.appendChild(container);
      }
      
      // 通知要素を作成
      const notification = document.createElement('div');
      notification.style.margin = '0 0 10px 0';
      notification.style.padding = '12px 16px';
      notification.style.borderRadius = '4px';
      notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
      notification.style.fontSize = '14px';
      notification.style.lineHeight = '1.4';
      notification.style.minWidth = '250px';
      notification.style.maxWidth = '400px';
      notification.style.animation = 'yearManagerFadeIn 0.3s ease-out forwards';
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      
      // 種類によってスタイル変更
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
      
      // 削除ボタンを追加
      const closeButton = document.createElement('span');
      closeButton.textContent = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '8px';
      closeButton.style.right = '8px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontSize = '16px';
      closeButton.style.lineHeight = '1';
      closeButton.style.opacity = '0.7';
      closeButton.addEventListener('click', () => {
        container.removeChild(notification);
      });
      
      notification.style.position = 'relative';
      notification.appendChild(closeButton);
      
      // アニメーションのスタイルを追加
      if (!document.getElementById('year-manager-styles')) {
        const style = document.createElement('style');
        style.id = 'year-manager-styles';
        style.textContent = `
          @keyframes yearManagerFadeIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes yearManagerFadeOut {
            from {
              opacity: 1;
              transform: translateY(0);
            }
            to {
              opacity: 0;
              transform: translateY(-20px);
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      // コンテナに追加
      container.appendChild(notification);
      
      // 指定時間後に削除
      setTimeout(() => {
        notification.style.animation = 'yearManagerFadeOut 0.3s ease-in forwards';
        setTimeout(() => {
          if (notification.parentNode === container) {
            container.removeChild(notification);
          }
        }, 300);
      }, config.notificationDuration);
    } catch (error) {
      log(`通知の表示中にエラー: ${error.message}`, 'error');
    }
  }
  
  /**
   * 検出された要素に視覚的なマーカーを追加
   */
  function addVisualMarkers() {
    if (!config.visualMarkers) return;
    
    log('視覚的マーカーを追加', 'debug');
    
    try {
      // ベストセレクタにマーカーを追加
      if (state.bestSelector) {
        addMarkerToElement(state.bestSelector, '最適な年度選択要素', 'success');
      }
      
      // 他の候補にもマーカーを追加
      state.yearSelectors.forEach((item, index) => {
        if (item.element !== state.bestSelector) {
          addMarkerToElement(item.element, `年度選択候補 #${index+1}`, 'info');
        }
      });
    } catch (error) {
      log(`マーカー追加中にエラー: ${error.message}`, 'error');
    }
  }
  
  /**
   * 要素に視覚的なマーカーを追加
   * @param {Element} element - マーカーを追加する要素
   * @param {string} label - マーカーのラベル
   * @param {string} type - マーカーのタイプ（success, info, warning, error）
   */
  function addMarkerToElement(element, label, type = 'info') {
    if (!element) return;
    
    try {
      // マーカーコンテナを作成
      const marker = document.createElement('div');
      marker.className = 'year-detector-marker';
      
      // スタイル設定
      marker.style.position = 'absolute';
      marker.style.pointerEvents = 'none';
      marker.style.zIndex = '9999';
      marker.style.border = '2px solid';
      marker.style.borderRadius = '3px';
      marker.style.transition = 'all 0.3s ease';
      
      // タイプによってスタイルを変更
      switch (type) {
        case 'success':
          marker.style.borderColor = '#4caf50';
          marker.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
          break;
        case 'warning':
          marker.style.borderColor = '#ff9800';
          marker.style.backgroundColor = 'rgba(255, 152, 0, 0.2)';
          break;
        case 'error':
          marker.style.borderColor = '#f44336';
          marker.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
          break;
        case 'info':
        default:
          marker.style.borderColor = '#2196f3';
          marker.style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
      }
      
      // ラベルを追加
      const labelElement = document.createElement('div');
      labelElement.textContent = label;
      labelElement.style.position = 'absolute';
      labelElement.style.top = '-24px';
      labelElement.style.left = '0';
      labelElement.style.padding = '2px 6px';
      labelElement.style.borderRadius = '3px';
      labelElement.style.fontSize = '12px';
      labelElement.style.fontWeight = 'bold';
      labelElement.style.whiteSpace = 'nowrap';
      
      // ラベルのスタイルも設定
      switch (type) {
        case 'success':
          labelElement.style.backgroundColor = '#4caf50';
          break;
        case 'warning':
          labelElement.style.backgroundColor = '#ff9800';
          break;
        case 'error':
          labelElement.style.backgroundColor = '#f44336';
          break;
        case 'info':
        default:
          labelElement.style.backgroundColor = '#2196f3';
      }
      
      labelElement.style.color = 'white';
      marker.appendChild(labelElement);
      
      // 位置設定
      updateMarkerPosition(marker, element);
      
      // bodyに追加
      document.body.appendChild(marker);
      
      // 位置の更新
      window.addEventListener('resize', () => {
        updateMarkerPosition(marker, element);
      });
      
      window.addEventListener('scroll', () => {
        updateMarkerPosition(marker, element);
      });
      
      // 10秒後に削除
      setTimeout(() => {
        marker.style.opacity = '0';
        setTimeout(() => {
          if (marker.parentNode) {
            marker.parentNode.removeChild(marker);
          }
        }, 300);
      }, 10000);
    } catch (error) {
      log(`要素へのマーカー追加中にエラー: ${error.message}`, 'error');
    }
  }
  
  /**
   * マーカーの位置を更新
   * @param {Element} marker - マーカー要素
   * @param {Element} element - 対象要素
   */
  function updateMarkerPosition(marker, element) {
    try {
      const rect = element.getBoundingClientRect();
      
      marker.style.left = `${window.scrollX + rect.left}px`;
      marker.style.top = `${window.scrollY + rect.top}px`;
      marker.style.width = `${rect.width}px`;
      marker.style.height = `${rect.height}px`;
    } catch (error) {
      log(`マーカー位置更新中にエラー: ${error.message}`, 'error');
    }
  }
  
  // ==========================================================================
  // メイン処理
  // ==========================================================================
  
  /**
   * 初期化
   */
  async function init() {
    log('Enhanced DOM Detector を初期化中...', 'info');
    
    try {
      startPerformanceMeasure('init');
      state.analysisStartTime = new Date();
      
      // すでに初期化済みであれば終了
      if (state.initialized) {
        log('すでに初期化済みです', 'warn');
        return;
      }
      
      // 各種モニタリングを設定
      setupConsoleInterceptor();
      setupXHRInterceptor();
      setupDOMObserver();
      
      // 年度選択要素を検出
      const yearSelector = await findYearSelector();
      
      if (yearSelector) {
        state.bestSelector = yearSelector;
        state.originalYear = yearSelector.value;
        
        log(`年度選択要素を発見: ${yearSelector.tagName}`, 'info', getElementDetails(yearSelector));
        log(`現在の年度: ${state.originalYear}`, 'info');
        
        // 視覚的マーカーを追加
        if (config.visualMarkers) {
          addVisualMarkers();
        }
        
        // LocalStorageに保存
        saveToStorage({
          year: state.originalYear,
          timestamp: Date.now(),
          action: 'init_success'
        });
        
        // 成功通知を表示
        showNotification('✓ 年度セレクタの検出に成功しました', 'success');
      } else {
        log('年度選択要素の検出に失敗しました', 'warn');
        
        // 通知を表示
        showNotification('⚠ 年度セレクタの検出に失敗しました。DOM構造の分析結果を確認してください', 'warning');
      }
      
      state.initialized = true;
      state.analysisEndTime = new Date();
      state.analysisResults = {
        yearSelector: state.bestSelector ? getElementDetails(state.bestSelector) : null,
        year: state.originalYear,
        detectionTime: endPerformanceMeasure('init'),
        allSelects: state.foundElements.selects.length
      };
      
      log('Enhanced DOM Detector の初期化が完了しました', 'info', state.analysisResults);
    } catch (error) {
      log(`初期化中にエラー: ${error.message}`, 'error');
      state.lastError = error;
      
      // エラー通知を表示
      showNotification(`⚠ 初期化中にエラーが発生しました: ${error.message}`, 'error');
    }
  }
  
  /**
   * DOMが読み込まれた後に初期化を開始
   */
  function initWhenReady() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      state.domReady = true;
      init();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        state.domReady = true;
        init();
      });
    }
  }
  
  // 初期化を開始
  initWhenReady();
  
  // ==========================================================================
  // 公開 API
  // ==========================================================================
  
  // グローバルオブジェクトに公開
  window.EnhancedDOMDetector = {
    // 設定
    config,
    
    // 状態の取得
    getState: () => ({...state}),
    getSelector: () => state.bestSelector,
    getCurrentYear: () => state.originalYear,
    
    // 主要機能
    findYearSelector,
    restoreYear: (year) => {
      if (!state.bestSelector) {
        log('年度選択要素が見つかりません', 'error');
        return false;
      }
      
      log(`年度を手動で設定: ${year}`, 'info');
      state.bestSelector.value = year;
      
      // change イベントを発火
      const event = new Event('change', { bubbles: true });
      state.bestSelector.dispatchEvent(event);
      
      return true;
    },
    
    // 診断機能
    analyze: () => {
      log('DOM分析を開始', 'info');
      
      // 全セレクタを再検索
      findYearSelector(false);
      
      // 結果の表示
      const report = {
        bestSelector: state.bestSelector ? getElementDetails(state.bestSelector) : null,
        allSelects: state.foundElements.selects.map(getElementDetails),
        yearElements: state.foundElements.textNodes.map(getElementDetails),
        performanceMetrics: state.performanceMetrics
      };
      
      // コンソールに詳細を出力
      console.group('EnhancedDOMDetector 分析レポート');
      console.log('最適な年度選択要素:', report.bestSelector);
      console.log(`検出されたセレクト要素: ${report.allSelects.length}個`);
      console.log(`年度関連テキストを含む要素: ${report.yearElements.length}個`);
      console.log('パフォーマンス指標:', report.performanceMetrics);
      console.groupEnd();
      
      return report;
    },
    
    // ユーティリティ
    showNotification,
    log
  };
  
  log('EnhancedDOMDetector のグローバルインスタンスを作成しました（window.EnhancedDOMDetector）', 'info');
})();