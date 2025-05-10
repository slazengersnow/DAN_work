/**
 * simple-year-fix.js
 * CSVインポート時の年度維持問題を解決するシンプルなスクリプト
 */

(function() {
  // グローバル変数の初期化（クロージャ内に隠蔽）
  let originalYear = null;
  let isMonitoring = false;
  let fixAttempts = 0;
  let maxFixAttempts = 10;
  
  // 安全なコンソールログラッパー
  const safeLog = function(message) {
    try {
      console.log('[年度修正-シンプル版] ' + message);
    } catch (e) {
      // ログエラーを無視
    }
  };

  // ----------------
  // 年度検出と保存
  // ----------------
  
  // CSVから検出した年度を保存
  const saveDetectedYear = function(year) {
    if (!year) return;
    try {
      originalYear = year;
      localStorage.setItem('csv_original_year', year);
      safeLog(`CSVからの年度を保存: ${year}`);
    } catch (e) {
      safeLog(`年度保存エラー: ${e.message}`);
    }
  };

  // 保存された年度を取得
  const getOriginalYear = function() {
    try {
      return originalYear || localStorage.getItem('csv_original_year') || null;
    } catch (e) {
      return originalYear || null;
    }
  };

  // ----------------
  // コンソールログ監視
  // ----------------
  
  // コンソールログの監視を設定
  const setupConsoleMonitoring = function() {
    if (isMonitoring) return;
    isMonitoring = true;
    
    const originalConsoleLog = console.log;
    console.log = function() {
      const args = Array.from(arguments);
      const logStr = args.join(' ');
      
      // 年度検出のログをキャプチャ
      if (logStr.includes('CSV列名から年度を検出:')) {
        const match = logStr.match(/CSV列名から年度を検出: (\d+)/);
        if (match && match[1]) {
          saveDetectedYear(match[1]);
        }
      }
      
      // インポート完了のログをキャプチャ
      if (logStr.includes('インポート成功コールバックを実行')) {
        safeLog('インポート完了を検出、年度修正を開始');
        fixYearAfterImport();
      }
      
      // 年度変更のログをキャプチャ
      if (logStr.includes('年度選択変更:')) {
        const match = logStr.match(/年度選択変更: (\d+) → (\d+)/);
        if (match && match[1] && match[2]) {
          const fromYear = match[1];
          const toYear = match[2];
          
          const originalYear = getOriginalYear();
          if (originalYear && toYear !== originalYear) {
            safeLog(`年度の自動変更を検出: ${fromYear} → ${toYear}、元の年度に修正: ${originalYear}`);
            setTimeout(fixYearAfterChange, 100);
          }
        }
      }
      
      return originalConsoleLog.apply(console, args);
    };
  };

  // ----------------
  // 年度修正機能
  // ----------------
  
  // インポート後の年度修正
  const fixYearAfterImport = function() {
    const originalYear = getOriginalYear();
    if (!originalYear) {
      safeLog('保存された年度情報がありません');
      return;
    }
    
    // 複数回の修正を試行（非同期処理のタイミング問題に対応）
    fixAttempts = 0;
    attemptYearFix();
  };
  
  // 年度変更後の修正
  const fixYearAfterChange = function() {
    const originalYear = getOriginalYear();
    if (!originalYear) {
      safeLog('保存された年度情報がありません');
      return;
    }
    
    // 複数回の修正を試行（非同期処理のタイミング問題に対応）
    fixAttempts = 0;
    attemptYearFix();
  };
  
  // 年度修正の試行（再試行メカニズム）
  const attemptYearFix = function() {
    if (fixAttempts >= maxFixAttempts) {
      safeLog(`最大修正試行回数(${maxFixAttempts}回)に達しました`);
      return;
    }
    
    const originalYear = getOriginalYear();
    if (!originalYear) return;
    
    fixAttempts++;
    safeLog(`年度修正試行 ${fixAttempts}/${maxFixAttempts}`);
    
    try {
      // 1. 年度選択要素の検出と修正
      const yearSelectors = [
        'select[name*="year"]',
        'select[id*="year"]',
        'select.year-selector',
        'select[data-testid*="year"]',
        'input[name*="year"]',
        'input[id*="year"]'
      ];
      
      let foundYearElement = false;
      
      yearSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.value && el.value !== originalYear) {
            el.value = originalYear;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            foundYearElement = true;
            safeLog(`年度選択要素を修正: ${el.value} → ${originalYear}`);
          }
        });
      });
      
      // 2. URL内の年度パラメータの修正
      const currentUrl = window.location.href;
      const yearParam = currentUrl.match(/[?&]year=(\d+)/);
      if (yearParam && yearParam[1] !== originalYear) {
        const newUrl = currentUrl.replace(`year=${yearParam[1]}`, `year=${originalYear}`);
        window.history.replaceState(null, '', newUrl);
        safeLog(`URLの年度パラメータを修正: ${yearParam[1]} → ${originalYear}`);
      }
      
      // 3. DOM内のテキスト年度表示の検出と修正（React要素の内部テキスト）
      document.querySelectorAll('*').forEach(el => {
        if (el.childNodes && el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
          const text = el.textContent;
          if (text && text.match(/202\d年度/) && !text.includes(`${originalYear}年度`)) {
            const newText = text.replace(/202\d年度/, `${originalYear}年度`);
            if (newText !== text) {
              el.textContent = newText;
              safeLog('テキスト内の年度表示を修正');
            }
          }
        }
      });
      
      // 修正成功したか確認するために遅延処理で再チェック
      if (!foundYearElement || fixAttempts < 3) {
        setTimeout(attemptYearFix, 300 * fixAttempts);  // 遅延を増やしながら再試行
      }
    } catch (e) {
      safeLog(`年度修正中にエラー: ${e.message}`);
      // エラーがあっても再試行
      setTimeout(attemptYearFix, 300 * fixAttempts);
    }
  };

  // ----------------
  // コンテンツスクリプトエラー対策
  // ----------------
  
  // window.onerrorハンドラーでコンテンツスクリプトエラーを捕捉
  const setupErrorHandling = function() {
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      // 特定のエラーのみを処理
      if (message && message.includes('Could not find identifiable element')) {
        safeLog('コンテンツスクリプトエラーを検出して無視: ' + message);
        return true; // エラーを抑制
      }
      
      // その他のエラーは通常どおり処理
      if (originalOnError) {
        return originalOnError.apply(this, arguments);
      }
      return false;
    };
  };

  // ----------------
  // 初期化
  // ----------------
  
  // スクリプトの初期化
  const init = function() {
    safeLog('シンプル年度修正スクリプトを初期化');
    setupConsoleMonitoring();
    setupErrorHandling();
    
    // ページロード後に保存された年度情報があれば現在の年度と比較
    setTimeout(function() {
      const originalYear = getOriginalYear();
      if (originalYear) {
        safeLog(`保存された年度: ${originalYear}`);
        
        // 現在のURLから年度を取得
        const currentUrl = window.location.href;
        const yearParam = currentUrl.match(/[?&]year=(\d+)/);
        if (yearParam && yearParam[1] !== originalYear) {
          safeLog(`URL内の年度が異なります: ${yearParam[1]} (保存値: ${originalYear})`);
          fixYearAfterChange();
        }
      }
    }, 1000);
  };
  
  // スクリプト実行
  init();
})();