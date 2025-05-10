/**
 * enhanced-csv-fix.js
 * 月次詳細CSVインポート機能の修正スクリプト - DOM検出強化版
 * 
 * 従業員詳細に影響を与えず、"Could not find identifiable element"エラーを解決する
 * 堅牢なDOM要素検出とエラーハンドリングを実装
 */

// 自己実行関数でスコープを隔離
(function() {
  // デバッグモード設定（問題調査時に有効化）
  const DEBUG = true;
  
  // ロガー関数
  const logger = {
    info: function(message, ...args) {
      console.info(`[年度修正] ${message}`, ...args);
    },
    debug: function(message, ...args) {
      if (DEBUG) console.debug(`[年度修正-詳細] ${message}`, ...args);
    },
    warn: function(message, ...args) {
      console.warn(`[年度修正-警告] ${message}`, ...args);
    },
    error: function(message, ...args) {
      console.error(`[年度修正-エラー] ${message}`, ...args);
    }
  };
  
  // 状態管理
  const state = {
    importYear: null,
    isImporting: false,
    yearSelectors: [],
    domReady: false,
    initialized: false,
    observers: [],
    searchAttempts: 0,
    maxSearchAttempts: 10 // 最大検索試行回数
  };
  
  /**
   * 複数の方法で年度選択要素を検索する関数
   * @returns {Element|null} 見つかった年度選択要素またはnull
   */
  function findYearSelector() {
    state.searchAttempts++;
    logger.debug(`年度選択要素の検索を開始します (試行回数: ${state.searchAttempts}/${state.maxSearchAttempts})`);
    
    // 検索するセレクタのリスト（優先度順）
    const selectors = [
      // ID属性 - 最も堅牢な検出方法
      '#fiscal-year-selector',
      '#fiscalYearSelector',
      '#year-selector',
      
      // name属性 - フォーム要素向け
      'select[name="fiscalYear"]',
      'select[name="fiscal_year"]',
      'input[name="fiscalYear"]',
      
      // data属性 - React等で使用される属性
      '[data-testid="year-selector"]',
      '[data-cy="fiscal-year-select"]',
      '[data-role="year-picker"]',
      
      // クラス名（最もよく変更される可能性あり）
      '.year-selector',
      '.fiscal-year-select',
      '.year-dropdown',
      
      // 役割や型に基づく汎用セレクタ
      'select.form-control',
      '.select-container select'
    ];
    
    // 各セレクタを試す
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          logger.debug(`年度選択要素を検出しました: ${selector}`, element);
          
          // 実際に年度選択要素かどうかを確認（選択肢に年度が含まれるか）
          if (isYearSelectorElement(element)) {
            logger.info(`有効な年度選択要素を検出しました: ${selector}`);
            return element;
          } else {
            logger.debug(`年度選択要素の候補ですが、確認できませんでした: ${selector}`);
          }
        }
      } catch (err) {
        logger.debug(`セレクタ "${selector}" の検索中にエラー: ${err.message}`);
      }
    }
    
    // 親コンテナから検索（最終手段）
    try {
      logger.debug('親コンテナから年度選択要素を検索します');
      
      // 可能性のある親コンテナを検索
      const containers = [
        document.querySelector('.monthly-report-container'),
        document.querySelector('.year-month-selector'),
        document.querySelector('header'),
        document.querySelector('nav')
      ].filter(Boolean);
      
      for (const container of containers) {
        // セレクト要素を検索
        const selects = container.querySelectorAll('select');
        for (const select of selects) {
          if (isYearSelectorElement(select)) {
            logger.info('親コンテナから年度選択要素を検出しました');
            return select;
          }
        }
        
        // 入力要素も検索
        const inputs = container.querySelectorAll('input[type="number"]');
        for (const input of inputs) {
          if (isYearInputElement(input)) {
            logger.info('親コンテナから年度入力要素を検出しました');
            return input;
          }
        }
      }
    } catch (err) {
      logger.debug(`親コンテナからの検索中にエラー: ${err.message}`);
    }
    
    // 最終的な手段: すべてのセレクト要素から年度っぽいものを探す
    try {
      logger.debug('すべてのセレクト要素から年度選択要素を検索します');
      const allSelects = document.querySelectorAll('select');
      for (const select of allSelects) {
        if (isYearSelectorElement(select)) {
          logger.info('ドキュメント全体から年度選択要素を検出しました');
          return select;
        }
      }
      
      const allInputs = document.querySelectorAll('input[type="number"]');
      for (const input of allInputs) {
        if (isYearInputElement(input)) {
          logger.info('ドキュメント全体から年度入力要素を検出しました');
          return input;
        }
      }
    } catch (err) {
      logger.debug(`全体検索中にエラー: ${err.message}`);
    }
    
    logger.warn('年度選択要素が見つかりませんでした');
    return null;
  }
  
  /**
   * 要素が年度選択要素かどうかを判定
   * @param {Element} element - 検査する要素
   * @returns {boolean} 年度選択要素かどうか
   */
  function isYearSelectorElement(element) {
    try {
      // セレクト要素の場合
      if (element.tagName === 'SELECT') {
        // オプションの値をチェック
        const options = Array.from(element.options || []);
        
        // オプションがない場合はfalse
        if (options.length === 0) return false;
        
        // 年度っぽい値があるかチェック
        const hasYearValue = options.some(opt => {
          const value = opt.value;
          // 年度らしい値（2000〜2050の範囲）かどうか
          return /^20\d{2}$/.test(value) || (parseInt(value) >= 2000 && parseInt(value) <= 2050);
        });
        
        // テキスト内容で年度に関連する単語があるかチェック
        const hasYearText = element.textContent && (
          element.textContent.includes('年度') || 
          element.textContent.includes('fiscal') || 
          element.textContent.includes('year')
        );
        
        return hasYearValue || hasYearText;
      }
      return false;
    } catch (err) {
      logger.debug(`要素検証中にエラー: ${err.message}`);
      return false;
    }
  }
  
  /**
   * 入力要素が年度入力かどうかを判定
   * @param {Element} element - 検査する要素
   * @returns {boolean} 年度入力要素かどうか
   */
  function isYearInputElement(element) {
    try {
      // 入力要素の場合
      if (element.tagName === 'INPUT') {
        // 属性をチェック
        const min = parseInt(element.getAttribute('min') || '0');
        const max = parseInt(element.getAttribute('max') || '9999');
        
        // 年度のような範囲設定がされているか
        const hasYearRange = (min >= 1900 && max <= 2100);
        
        // ラベルやプレースホルダーに年度関連のテキストがあるか
        const hasYearText = false;
        if (element.placeholder) {
          hasYearText = hasYearText || element.placeholder.includes('年度') || 
                       element.placeholder.includes('fiscal') || 
                       element.placeholder.includes('year');
        }
        
        // 関連するラベル要素を探す
        const id = element.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) {
            hasYearText = hasYearText || label.textContent.includes('年度') || 
                         label.textContent.includes('fiscal') || 
                         label.textContent.includes('year');
          }
        }
        
        // 値が年度っぽいかチェック
        const value = element.value;
        const hasYearValue = /^20\d{2}$/.test(value) || (parseInt(value) >= 2000 && parseInt(value) <= 2050);
        
        return hasYearRange || hasYearText || hasYearValue;
      }
      return false;
    } catch (err) {
      logger.debug(`入力要素検証中にエラー: ${err.message}`);
      return false;
    }
  }
  
  /**
   * 年度を強制的に変更する関数
   * @param {number} year - 設定する年度
   * @returns {boolean} 成功したかどうか
   */
  function forceYearChange(year) {
    try {
      if (!year) {
        logger.warn('無効な年度が指定されました');
        return false;
      }
      
      // 年度選択要素を再検索（状態が変わっている可能性があるため）
      if (state.yearSelectors.length === 0) {
        const selector = findYearSelector();
        if (selector) {
          state.yearSelectors = [selector];
        }
      }
      
      // 年度選択要素が見つからない場合
      if (state.yearSelectors.length === 0) {
        logger.warn('年度を変更できません: 年度選択要素が見つかりません');
        
        // 要素を遅延検索してリトライ
        setTimeout(() => {
          if (state.searchAttempts < state.maxSearchAttempts) {
            const selector = findYearSelector();
            if (selector) {
              state.yearSelectors = [selector];
              forceYearChange(year);
            }
          }
        }, 500);
        return false;
      }
      
      // すべての年度選択要素に対して処理
      let success = false;
      for (const selector of state.yearSelectors) {
        try {
          // セレクト要素の場合
          if (selector.tagName === 'SELECT') {
            // 値を変更
            selector.value = year.toString();
            // イベントを発火
            selector.dispatchEvent(new Event('change', { bubbles: true }));
            success = true;
          } 
          // 入力要素の場合
          else if (selector.tagName === 'INPUT') {
            // 値を変更
            selector.value = year.toString();
            // 変更イベントを発火
            selector.dispatchEvent(new Event('change', { bubbles: true }));
            selector.dispatchEvent(new Event('input', { bubbles: true }));
            success = true;
          }
        } catch (err) {
          logger.error(`年度選択要素 ${selector.tagName} の更新中にエラー: ${err.message}`);
        }
      }
      
      if (success) {
        logger.info(`年度を${year}に設定しました`);
        
        // 通知を表示
        showNotification(`年度を${year}に設定しました`, 'success');
        return true;
      } else {
        logger.warn('年度の変更に失敗しました');
        return false;
      }
    } catch (err) {
      logger.error(`年度変更処理中にエラー: ${err.message}`);
      return false;
    }
  }
  
  /**
   * DOM変更を監視して年度選択要素を検出する
   */
  function setupDOMObserver() {
    try {
      // すでに設定済みの場合はスキップ
      if (state.observers.length > 0) return;
      
      logger.debug('DOM変更の監視を開始します');
      
      // ドキュメント全体の変更を監視
      const bodyObserver = new MutationObserver((mutations) => {
        // 年度選択要素が既に見つかっている場合はスキップ
        if (state.yearSelectors.length > 0) return;
        
        // 変更があったらセレクタを検索
        const selector = findYearSelector();
        if (selector) {
          state.yearSelectors = [selector];
          logger.info('DOM変更監視により年度選択要素を検出しました');
          
          // インポート中で年度が既知の場合は強制変更
          if (state.isImporting && state.importYear) {
            forceYearChange(state.importYear);
          }
        }
      });
      
      // 設定とオブザーバーの開始
      bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // オブザーバーを保存
      state.observers.push(bodyObserver);
      
      logger.debug('DOM変更の監視を設定しました');
    } catch (err) {
      logger.error(`DOM監視設定中にエラー: ${err.message}`);
    }
  }
  
  /**
   * 通知を表示する関数
   * @param {string} message - 表示するメッセージ
   * @param {string} type - 通知の種類 ('success'|'error'|'info')
   */
  function showNotification(message, type = 'info') {
    try {
      // 既存の通知を削除
      const existingNotifications = document.querySelectorAll('.csv-import-notification');
      existingNotifications.forEach(note => {
        try {
          note.remove();
        } catch (e) {
          // 無視
        }
      });
      
      // 通知要素
      const notification = document.createElement('div');
      notification.className = `csv-import-notification csv-import-${type}`;
      notification.textContent = message;
      
      // 色の設定
      let bgColor, textColor;
      switch (type) {
        case 'success':
          bgColor = '#4caf50';
          textColor = 'white';
          break;
        case 'error':
          bgColor = '#f44336';
          textColor = 'white';
          break;
        case 'info':
        default:
          bgColor = '#2196f3';
          textColor = 'white';
      }
      
      // スタイル設定
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${bgColor};
        color: ${textColor};
        padding: 12px 16px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 0.3s, transform 0.3s;
      `;
      
      // DOMに追加
      document.body.appendChild(notification);
      
      // アニメーション表示
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      }, 10);
      
      // 自動消去
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          try {
            document.body.removeChild(notification);
          } catch (e) {
            // 要素がすでに削除されている可能性
          }
        }, 300);
      }, 5000);
    } catch (err) {
      // 通知表示中のエラーはコンソールにのみログ
      console.error('通知表示中にエラー:', err);
    }
  }
  
  /**
   * インポート中の年度を検出するためのログ監視
   */
  function setupLogWatcher() {
    try {
      // 元のconsole.log関数を保存
      const originalConsoleLog = console.log;
      
      // console.logをオーバーライド
      console.log = function(...args) {
        // 元の関数を呼び出し
        originalConsoleLog.apply(console, args);
        
        // 第一引数が文字列でない場合はスキップ
        if (typeof args[0] !== 'string') return;
        
        try {
          // CSV年度検出ログを監視
          if (args[0].includes('CSV列名から年度を検出:')) {
            const yearMatch = args[0].match(/CSV列名から年度を検出: (\d+)/);
            if (yearMatch && yearMatch[1]) {
              const detectedYear = parseInt(yearMatch[1]);
              if (detectedYear >= 2000 && detectedYear <= 2050) {
                state.importYear = detectedYear;
                state.isImporting = true;
                logger.info(`インポート年度を検出: ${detectedYear}年度`);
              }
            }
          }
          
          // インポート成功ログを監視
          if (args[0].includes('成功したレスポンス:') || 
              args[0].includes('インポートしました') ||
              args[0].includes('import success')) {
            
            if (state.isImporting && state.importYear) {
              logger.info(`インポート完了を検出: ${state.importYear}年度のデータ`);
              
              // 少し遅延して年度を設定（レンダリング完了後）
              setTimeout(() => {
                forceYearChange(state.importYear);
                // インポート状態をリセット
                state.isImporting = false;
              }, 800);
            }
          }
        } catch (err) {
          // ログ処理エラーは静かに無視（元のログ出力に影響しないよう）
        }
      };
      
      logger.debug('ログ監視を設定しました');
    } catch (err) {
      logger.error(`ログ監視設定中にエラー: ${err.message}`);
    }
  }
  
  /**
   * インポートボタンクリックを監視
   */
  function setupButtonWatcher() {
    try {
      // クリックイベントをキャプチャフェーズで監視
      document.addEventListener('click', event => {
        // クリックされた要素を取得
        const target = event.target;
        if (!target) return;
        
        try {
          // ボタン要素を検索（クリックされた要素またはその親）
          let button = null;
          
          // クリックされた要素がボタンの場合
          if (target.tagName === 'BUTTON' || 
              target.type === 'button' || 
              target.role === 'button') {
            button = target;
          } 
          // 親要素がボタンの場合（アイコンなどの子要素がクリックされた）
          else {
            const parents = [
              target.parentElement,
              target.parentElement?.parentElement,
              target.parentElement?.parentElement?.parentElement
            ].filter(Boolean);
            
            for (const parent of parents) {
              if (parent.tagName === 'BUTTON' || 
                  parent.type === 'button' || 
                  parent.role === 'button') {
                button = parent;
                break;
              }
            }
          }
          
          // ボタンが見つからなければ終了
          if (!button) return;
          
          // インポートボタンかどうか判定
          const buttonText = button.textContent || '';
          const isImportButton = 
            buttonText.includes('インポート') || 
            buttonText.includes('Import') || 
            buttonText.includes('取込') ||
            buttonText.includes('CSV') ||
            button.classList.contains('import-button') ||
            button.id.includes('import');
          
          if (isImportButton) {
            logger.info('インポートボタンのクリックを検出しました');
            // 年度検出の準備をする
            state.isImporting = true;
            
            // 現在の年度を保存
            const currentYearSelector = state.yearSelectors[0];
            if (currentYearSelector) {
              const currentYear = parseInt(currentYearSelector.value);
              if (currentYear >= 2000 && currentYear <= 2050) {
                // インポート年度が未設定の場合のみ現在の年度を保存
                if (!state.importYear) {
                  state.importYear = currentYear;
                  logger.debug(`現在の年度を保存: ${currentYear}年度`);
                }
              }
            }
          }
        } catch (err) {
          // クリック処理エラーは無視（ユーザー操作を妨げないため）
        }
      }, true); // キャプチャフェーズでイベントを捕捉
      
      logger.debug('ボタンクリック監視を設定しました');
    } catch (err) {
      logger.error(`ボタン監視設定中にエラー: ${err.message}`);
    }
  }
  
  /**
   * 初期化関数
   */
  function initialize() {
    try {
      // 二重初期化を防止
      if (state.initialized) return;
      
      logger.info('CSVインポート修正ツールを初期化しています...');
      
      // 年度選択要素を検索
      const selector = findYearSelector();
      if (selector) {
        state.yearSelectors = [selector];
      }
      
      // 各モニター設定
      setupDOMObserver();
      setupLogWatcher();
      setupButtonWatcher();
      
      // DOMが不完全な場合に備えて遅延検索
      if (state.yearSelectors.length === 0) {
        logger.debug('年度選択要素が見つからないため、遅延検索をスケジュールします');
        
        // DOMの読み込みが完了してから再試行
        window.addEventListener('DOMContentLoaded', () => {
          state.domReady = true;
          const selector = findYearSelector();
          if (selector) {
            state.yearSelectors = [selector];
          }
        });
        
        // DOMがすでに読み込まれている場合の対応
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          state.domReady = true;
          setTimeout(() => {
            if (state.yearSelectors.length === 0) {
              const selector = findYearSelector();
              if (selector) {
                state.yearSelectors = [selector];
              }
            }
          }, 1000);
        }
      }
      
      // 通知表示のテスト
      showNotification('CSVインポート修正ツールが初期化されました', 'info');
      
      state.initialized = true;
      logger.info('CSVインポート修正ツールの初期化が完了しました');
    } catch (err) {
      logger.error(`初期化中にエラー: ${err.message}`);
      
      // エラーが発生した場合でも基本機能だけは設定
      try {
        if (!state.initialized) {
          setupLogWatcher();
          state.initialized = true;
        }
      } catch (e) {
        // 致命的なエラー - 何もできない
      }
    }
  }
  
  // 遅延初期化 - ページが完全に読み込まれるのを待つ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // すでに読み込み完了している場合は即時実行
    initialize();
  }
  
  // ウィンドウ読み込み完了時にも再確認（確実に要素を検出するため）
  window.addEventListener('load', () => {
    if (state.yearSelectors.length === 0) {
      const selector = findYearSelector();
      if (selector) {
        state.yearSelectors = [selector];
        logger.info('ウィンドウロード時に年度選択要素を検出しました');
      }
    }
  });
  
  // 外部から使用可能な関数をエクスポート
  window.csvYearManager = {
    getState: () => ({ ...state }),
    forceYearChange,
    findYearSelector,
    showNotification
  };
})();