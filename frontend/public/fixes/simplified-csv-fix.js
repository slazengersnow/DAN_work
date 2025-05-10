/**
 * 簡易版CSV年度修正スクリプト
 * 
 * このスクリプトは月次レポートCSVインポート時の年度問題を修正するシンプルな実装です。
 * コードサイズを最小限に抑え、依存関係をなくして確実に動作するように設計されています。
 */

(function() {
  // グローバル状態の初期化（複数呼び出しを防止）
  if (window.SimplifiedCSVFix) {
    console.log('[年度修正] 簡易版スクリプトはすでに読み込まれています');
    return window.SimplifiedCSVFix.notify('スクリプトはすでに有効です');
  }
  
  // ================ 基本設定 ================
  const config = {
    debug: true,             // デバッグログの有効化
    yearSelectors: [         // 年度セレクタの候補リスト（優先順）
      'select[name="fiscalYear"]',
      'select.year-select',
      'select[id*="year"]',
      'select[id*="fiscal"]',
      'select:not([name="month"])'
    ],
    importPatterns: [        // インポート検出パターン
      'インポート処理開始',
      'CSVファイルから月次データをインポート',
      'CSVデータをインポート',
      'インポート成功',
      'インポートしました',
      'インポート完了'
    ],
    yearDetectionPattern: /CSVから年度を検出: (\d{4})/
  };
  
  // ================ 内部状態 ================
  const state = {
    originalYear: null,       // 元の年度
    detectedCsvYear: null,    // CSVから検出された年度
    yearSelector: null,       // 年度選択要素
    importMode: false,        // インポートモード中フラグ
    processingComplete: false // 処理中フラグ
  };
  
  // ================ 基本ユーティリティ ================
  
  // 安全なコンソールログ出力（無限ループ防止）
  const safeLog = (message, level = 'log') => {
    const prefix = '[年度修正]';
    const originalConsole = {
      log: window.console.log.bind(window.console),
      error: window.console.error.bind(window.console),
      warn: window.console.warn.bind(window.console),
      info: window.console.info.bind(window.console)
    };
    
    originalConsole[level](`${prefix} ${message}`);
  };
  
  // 簡易通知
  const showNotification = (message, type = 'info') => {
    let container = document.getElementById('simple-year-fix-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'simple-year-fix-notifications';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999'
      });
      document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.textContent = message;
    
    Object.assign(notification.style, {
      backgroundColor: type === 'error' ? '#f44336' : '#4CAF50',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '4px',
      marginBottom: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      fontSize: '14px',
      transition: 'opacity 0.3s',
      opacity: '0'
    });
    
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  };
  
  // ================ 主要機能 ================
  
  // 年度選択要素を探す
  const findYearSelector = () => {
    // すでに見つかっているセレクタがあれば再利用
    if (state.yearSelector) return state.yearSelector;
    
    safeLog('年度選択要素を探しています...');
    
    // セレクタ使用検索
    for (const selector of config.yearSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 1) {
        safeLog(`セレクタで年度選択要素を発見: ${selector}`);
        state.yearSelector = elements[0];
        return elements[0];
      } else if (elements.length > 1) {
        // 複数見つかった場合、年度らしい値を持つものを優先
        for (const element of elements) {
          if (element.value && /^20\d{2}$/.test(element.value)) {
            safeLog(`複数候補から年度らしい値を持つものを選択: ${element.value}`);
            state.yearSelector = element;
            return element;
          }
        }
      }
    }
    
    // オプション値からの検索（最後の手段）
    const selects = document.querySelectorAll('select');
    for (const select of selects) {
      const hasYearOptions = Array.from(select.options || []).some(
        opt => /^20\d{2}$/.test(opt.value) || /^20\d{2}$/.test(opt.textContent)
      );
      
      if (hasYearOptions) {
        safeLog('オプション値から年度選択要素を発見');
        state.yearSelector = select;
        return select;
      }
    }
    
    safeLog('年度選択要素が見つかりませんでした', 'warn');
    return null;
  };
  
  // 年度を設定
  const setYear = (year) => {
    const yearSelector = findYearSelector();
    if (!yearSelector) {
      safeLog('年度選択要素が見つからないため、値を設定できません', 'error');
      return false;
    }
    
    try {
      safeLog(`年度を ${year} に設定します`);
      yearSelector.value = year.toString();
      
      // 変更イベントを発火
      const changeEvent = new Event('change', { bubbles: true });
      yearSelector.dispatchEvent(changeEvent);
      
      return true;
    } catch (error) {
      safeLog(`年度設定中にエラー: ${error.message}`, 'error');
      return false;
    }
  };
  
  // コンソールログインターセプター
  const setupConsoleInterceptor = () => {
    const originalConsoleLog = console.log;
    
    console.log = function(...args) {
      // 元のconsole.logを呼び出し
      originalConsoleLog.apply(console, args);
      
      try {
        // インターセプトループを防ぐため、自分自身のログはスキップ
        if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('[年度修正]')) {
          return;
        }
        
        // 引数を文字列化
        const message = args.join(' ');
        
        // 年度検出チェック
        const yearMatch = message.match(config.yearDetectionPattern);
        if (yearMatch && yearMatch[1]) {
          const year = parseInt(yearMatch[1], 10);
          if (!isNaN(year) && year >= 2000 && year <= 2100) {
            safeLog(`CSVから年度を検出: ${year}`);
            state.detectedCsvYear = year;
            return;
          }
        }
        
        // インポートモード検出
        const isImportMessage = config.importPatterns.some(pattern => message.includes(pattern));
        if (isImportMessage) {
          // インポートモード中でなければ開始
          if (!state.importMode) {
            state.importMode = true;
            safeLog('インポートモードを開始');
            
            // 年度を保存
            const yearSelector = findYearSelector();
            if (yearSelector) {
              state.originalYear = yearSelector.value;
              safeLog(`現在の年度を保存: ${state.originalYear}`);
            }
            
            // 遅延してインポート完了を監視
            setTimeout(checkForImportCompletion, 2000);
          }
        }
      } catch (error) {
        safeLog(`コンソールインターセプト中にエラー: ${error.message}`, 'error');
      }
    };
  };
  
  // インポート完了チェック
  const checkForImportCompletion = async () => {
    if (state.processingComplete) return;
    state.processingComplete = true;
    
    try {
      safeLog('インポート完了後の処理を実行');
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 年度選択要素を再取得
      const yearSelector = findYearSelector();
      if (!yearSelector) {
        safeLog('年度選択要素が見つかりません', 'warn');
        return;
      }
      
      // 使用する年度を決定
      const yearToRestore = state.detectedCsvYear || state.originalYear;
      if (!yearToRestore) {
        safeLog('復元する年度が見つかりません', 'warn');
        return;
      }
      
      // 現在値と異なる場合のみ変更
      if (yearSelector.value !== yearToRestore.toString()) {
        safeLog(`年度を ${yearToRestore} に復元します（現在: ${yearSelector.value}）`);
        if (setYear(yearToRestore)) {
          showNotification(`✓ 年度を ${yearToRestore} に設定しました`);
        }
      } else {
        safeLog('年度は既に正しい値です');
      }
    } catch (error) {
      safeLog(`インポート完了処理中にエラー: ${error.message}`, 'error');
    } finally {
      // 状態をリセット
      state.importMode = false;
      state.processingComplete = false;
    }
  };
  
  // 初期化処理
  const init = () => {
    try {
      safeLog('簡易版CSV年度修正スクリプトを初期化');
      
      // 既存のCSSルールを確認
      const existingStyle = document.getElementById('simple-year-fix-styles');
      if (!existingStyle) {
        // スタイルシートを追加
        const styleEl = document.createElement('style');
        styleEl.id = 'simple-year-fix-styles';
        styleEl.textContent = `
          #simple-year-fix-notifications {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
          }
        `;
        document.head.appendChild(styleEl);
      }
      
      // 年度セレクタを検出
      const yearSelector = findYearSelector();
      if (yearSelector) {
        state.originalYear = yearSelector.value;
        safeLog(`年度選択要素を発見、現在の年度: ${state.originalYear}`);
        showNotification('✓ CSV年度修正が有効になりました');
      } else {
        safeLog('年度選択要素が見つかりませんでした。リトライします...', 'warn');
        
        // 遅延してDOM更新を待ってから再試行
        setTimeout(() => {
          const retrySelector = findYearSelector();
          if (retrySelector) {
            state.originalYear = retrySelector.value;
            safeLog(`リトライ後に年度選択要素を発見、現在の年度: ${state.originalYear}`);
            showNotification('✓ CSV年度修正が有効になりました');
          } else {
            safeLog('年度選択要素を検出できませんでした', 'error');
            showNotification('⚠ 年度選択要素が見つかりません', 'error');
          }
        }, 1500);
      }
      
      // ログインターセプタをセットアップ
      setupConsoleInterceptor();
      
      safeLog('初期化完了');
    } catch (error) {
      safeLog(`初期化中にエラー: ${error.message}`, 'error');
    }
  };
  
  // グローバルAPIをエクスポート
  window.SimplifiedCSVFix = {
    getState: () => ({...state}),
    findYearSelector,
    setYear,
    notify: showNotification,
    log: safeLog
  };
  
  // 初期化を実行
  init();
})();