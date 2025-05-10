/**
 * ドロップダウンメニューを削除するスクリプト
 * 
 * 使用方法:
 * 1. このコードをコピーする
 * 2. ブラウザの開発者ツール(F12)を開く
 * 3. コンソールタブに貼り付けて実行する
 * 
 * @version 1.0
 */

// 即時実行関数
(function() {
  // デバッグモード
  const DEBUG = true;
  const LOG_PREFIX = '[DROPDOWN-REMOVER]';
  
  // ログ出力関数
  function log(...args) {
    if (DEBUG) {
      console.log(LOG_PREFIX, ...args);
    }
  }
  
  log('🔵 ドロップダウンメニュー削除スクリプト実行開始');
  
  // 重複実行防止
  if (window._dropdownRemoverActive) {
    log('既に実行中のため再初期化します');
    if (window._dropdownRemoverInterval) {
      clearInterval(window._dropdownRemoverInterval);
    }
  }
  
  // グローバル変数の初期化
  window._dropdownRemoverActive = true;
  window._dropdownRemoverCount = 0;
  
  /**
   * ドロップダウンメニューを削除する主要関数
   */
  function removeDropdowns() {
    let removedCount = 0;
    
    // 方法1: 選択肢リストを含む親要素全体を削除
    try {
      const yearMonthSelectors = document.querySelectorAll('.年度\\:, .月\\:');
      yearMonthSelectors.forEach(element => {
        // 親要素を含めて削除（親要素のタグ名に応じて調整）
        const container = element.closest('div, form, section');
        if (container) {
          container.style.display = 'none';
          log('選択肢リストを含む親要素を非表示にしました:', container);
          removedCount++;
        }
      });
    } catch (e) {
      log('方法1実行中にエラー:', e);
    }
    
    // 方法2: select要素を直接特定して削除
    try {
      const selectElements = document.querySelectorAll('select');
      selectElements.forEach(select => {
        // 年度や月の選択リストを特定
        const labelText = select.previousElementSibling?.textContent || '';
        if (labelText.includes('年度') || labelText.includes('月')) {
          // 親要素を非表示に
          const container = select.closest('div, form, section');
          if (container) {
            container.style.display = 'none';
            log('年度/月のselect要素の親要素を非表示にしました:', container);
            removedCount++;
          }
        }
      });
    } catch (e) {
      log('方法2実行中にエラー:', e);
    }
    
    // 方法3: 「更新」ボタンも非表示にする場合
    try {
      const updateButtons = document.querySelectorAll('button.更新, input[type="submit"][value="更新"], button:contains("更新")');
      updateButtons.forEach(button => {
        button.style.display = 'none';
        log('更新ボタンを非表示にしました:', button);
        removedCount++;
      });
    } catch (e) {
      log('方法3実行中にエラー:', e);
    }
    
    // 方法4: テキスト内容によるセレクタ検索
    try {
      // テキストコンテンツによる要素検索
      document.querySelectorAll('div, label, span').forEach(el => {
        if (el.textContent.includes('年度:') || el.textContent.includes('月:')) {
          // 親要素を遡って非表示
          const container = el.closest('div, form, section');
          if (container && (
            container.querySelector('select') ||
            container.querySelector('button')
          )) {
            container.style.display = 'none';
            log('テキスト内容による検出で親要素を非表示にしました:', container);
            removedCount++;
          }
        }
      });
    } catch (e) {
      log('方法4実行中にエラー:', e);
    }
    
    window._dropdownRemoverCount += removedCount;
    
    if (removedCount > 0) {
      log(`${removedCount}個のドロップダウン関連要素を非表示にしました`);
    }
    
    return removedCount;
  }
  
  /**
   * 定期的な確認と削除を行うインターバルを設定
   */
  function setupIntervalCheck() {
    // 2秒ごとにチェックするインターバル
    const interval = setInterval(() => {
      removeDropdowns();
    }, 2000);
    
    // グローバル参照を保存
    window._dropdownRemoverInterval = interval;
    
    log('定期的な確認インターバルを設定しました (2秒ごと)');
  }
  
  /**
   * イベントリスナーを設定
   */
  function setupEventListeners() {
    // クリック後に再チェック
    document.addEventListener('click', () => {
      setTimeout(() => {
        removeDropdowns();
      }, 300);
    });
    
    // ページ変更時に再チェック
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        removeDropdowns();
      }, 300);
    });
    
    log('イベントリスナーを設定しました');
  }
  
  /**
   * ブックマークレットコードを生成
   */
  function createBookmarklet() {
    const code = `
      javascript:(function(){
        const yearMonthSelectors = document.querySelectorAll('.年度\\\\:, .月\\\\:, select');
        yearMonthSelectors.forEach(element => {
          const container = element.closest('div, form, section');
          if (container && (element.tagName === 'SELECT' || container.textContent.includes('年度') || container.textContent.includes('月'))) {
            container.style.display = 'none';
          }
        });
        
        const updateButtons = document.querySelectorAll('button.更新, input[type="submit"][value="更新"]');
        updateButtons.forEach(button => {
          button.style.display = 'none';
        });
      })();
    `;
    
    return code.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * 初期化と実行
   */
  function initialize() {
    log('ドロップダウンメニュー削除スクリプト初期化');
    
    // 1. 即時実行
    removeDropdowns();
    
    // 2. 定期チェックを設定
    setupIntervalCheck();
    
    // 3. イベントリスナーを設定
    setupEventListeners();
    
    // 4. 複数のタイミングで実行
    [100, 500, 1000].forEach(delay => {
      setTimeout(() => {
        removeDropdowns();
      }, delay);
    });
    
    // 5. ブックマークレットコードをコンソールに出力
    console.log('以下のコードをブックマークのURLとして保存できます:');
    console.log(createBookmarklet());
    
    log('初期化完了');
  }
  
  // ページの状態に応じて初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();