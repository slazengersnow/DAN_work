/**
 * 月次報告の年月選択コントロールを強制的に非表示にする徹底的スクリプト
 * - 前回のスクリプトの反省点を踏まえ、より直接的かつ網羅的なアプローチで実装
 * - React/TSXコンポーネントの動的レンダリングにも対応
 * - EmployeesTabコンポーネントの特性を考慮した設計
 */
(function() {
  // 詳細なデバッグログを有効化
  const DEBUG = true;
  
  // 実行中のスクリプトのログプレフィックス
  const LOG_PREFIX = '[MonthlyControlRemover]';
  
  /**
   * デバッグログ出力関数
   * @param {string} message - ログメッセージ
   * @param {any} data - オプションのデータ
   */
  function logDebug(message, data) {
    if (!DEBUG) return;
    if (data !== undefined) {
      console.log(`${LOG_PREFIX} ${message}`, data);
    } else {
      console.log(`${LOG_PREFIX} ${message}`);
    }
  }

  logDebug('徹底的な月次報告コントロール削除スクリプトを開始します');

  // 重複実行を防止するためのフラグ
  if (window._monthlyControlsRemoverInitialized) {
    logDebug('すでに初期化されています。再初期化します。');
    // 既存のobserverを停止
    if (window._monthlyControlsObserver && typeof window._monthlyControlsObserver.disconnect === 'function') {
      window._monthlyControlsObserver.disconnect();
      logDebug('既存のObserverを停止しました');
    }
    // 既存のインターバルを停止
    if (window._monthlyControlsInterval) {
      clearInterval(window._monthlyControlsInterval);
      logDebug('既存のインターバルを停止しました');
    }
  }
  window._monthlyControlsRemoverInitialized = true;

  /**
   * アプリケーション全体からすべての年月選択コントロールを検索して非表示にする
   * 複数の検出方法を組み合わせて確実に捕捉する
   */
  function forceHideAllMonthlyControls() {
    logDebug('月次報告コントロールの徹底的検出を開始');
    let foundAndHidden = 0;

    // 方法1: 最も直接的なCSSセレクタを使用
    const directSelectors = [
      'div[style*="display: flex"][style*="gap: 20px"][style*="margin-bottom: 20px"]',
      'div[style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px"]',
      'div[style*="border: 1px solid rgb(221, 221, 221)"][style*="border-radius: 4px"]'
    ];

    directSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (isMonthlyControl(el)) {
          hideElement(el);
          foundAndHidden++;
          logDebug(`直接セレクタで月次コントロールを発見・非表示化: ${selector}`);
        }
      });
    });

    // 方法2: 年度と月のラベルの組み合わせで検索
    const yearLabels = Array.from(document.querySelectorAll('label')).filter(label => 
      label.textContent && (label.textContent.includes('年度:') || label.textContent.trim() === '年度:')
    );

    yearLabels.forEach(yearLabel => {
      // 親コンテナを探す
      let container = yearLabel.parentElement;
      while (container && !container.querySelector('label') && container !== document.body) {
        container = container.parentElement;
      }

      // コンテナ内に「月:」ラベルがあるかチェック
      if (container) {
        const monthLabels = Array.from(container.querySelectorAll('label')).filter(label => 
          label.textContent && (label.textContent.includes('月:') || label.textContent.trim() === '月:')
        );
        
        if (monthLabels.length > 0 && container.querySelector('button')) {
          hideElement(container);
          foundAndHidden++;
          logDebug('年度・月ラベルの組み合わせから月次コントロールを検出・非表示化');
        }
      }
    });

    // 方法3: 情報テキストから特定
    const infoTexts = Array.from(document.querySelectorAll('div')).filter(div => {
      const text = div.textContent;
      return text && /年度:\s*\d{4},\s*月:\s*\d{1,2}/.test(text);
    });

    infoTexts.forEach(infoEl => {
      // 親コンテナまでさかのぼる
      let container = findParentControl(infoEl);
      if (container) {
        hideElement(container);
        foundAndHidden++;
        logDebug('情報テキストから月次コントロールを検出・非表示化');
      }
    });

    // 方法4: React/TSXコンポーネントの属性で特定
    const reactComponents = document.querySelectorAll('[class*="monthly"], [class*="report"], [data-testid*="monthly"]');
    reactComponents.forEach(component => {
      const yearSelect = component.querySelector('select');
      const selects = component.querySelectorAll('select');
      
      if (selects.length >= 2) {
        const monthSelect = selects[1];
        
        if (yearSelect && monthSelect && 
            yearSelect.options && yearSelect.options.length >= 5 && // 年度選択には多数の選択肢がある
            monthSelect.options && monthSelect.options.length === 12) { // 月選択には12ヶ月ある
          
          // 最も近い親コンテナを取得
          const container = findParentControl(yearSelect);
          if (container) {
            hideElement(container);
            foundAndHidden++;
            logDebug('Reactコンポーネント構造から月次コントロールを検出・非表示化');
          }
        }
      }
    });

    // 方法5: DOM構造の特徴で検出
    const divs = document.querySelectorAll('div');
    for (const div of divs) {
      // 小さめのコンテナに絞る
      if (div.children.length >= 2 && div.children.length <= 10) {
        const selects = div.querySelectorAll('select');
        if (selects.length === 2) {
          // 2つのセレクトボックスがあるコンテナで
          const buttons = div.querySelectorAll('button');
          if (buttons.length === 1 && buttons[0].textContent.includes('更新')) {
            // 「更新」ボタンを含むものを対象に
            hideElement(div);
            foundAndHidden++;
            logDebug('DOM構造の特徴から月次コントロールを検出・非表示化');
          }
        }
      }
    }

    // 方法6: 強制的なセレクタの組み合わせ
    const allSelectGroups = document.querySelectorAll('div:has(select)');
    allSelectGroups.forEach(group => {
      if (group.querySelectorAll('select').length >= 2 && 
          group.querySelectorAll('button').length >= 1 &&
          !group.closest('[id*="employee"], [class*="employee"]')) { // 従業員詳細のものではないことを確認
        
        // 年度と月の選択肢を持つか確認
        const selects = group.querySelectorAll('select');
        let hasYearOptions = false;
        let hasMonthOptions = false;
        
        for (const select of selects) {
          // 選択肢をチェック
          if (select.options) {
            const options = Array.from(select.options).map(opt => opt.textContent);
            const optionsText = options.join(' ');
            
            if (/20\d{2}|令和\d+年度?/.test(optionsText)) {
              hasYearOptions = true;
            }
            
            if (options.length === 12 && 
                options.some(opt => opt.includes('月') || /^([1-9]|1[0-2])$/.test(opt.trim()))) {
              hasMonthOptions = true;
            }
          }
        }
        
        if (hasYearOptions && hasMonthOptions) {
          hideElement(group);
          foundAndHidden++;
          logDebug('選択肢の内容から月次コントロールを検出・非表示化');
        }
      }
    });

    // 総合結果をログ
    logDebug(`合計 ${foundAndHidden} 個の月次報告コントロールを非表示にしました`);
    return foundAndHidden > 0;
  }

  /**
   * 要素が月次報告コントロールであるかを判定
   * @param {Element} element - 判定する要素
   * @return {boolean} 月次報告コントロールかどうか
   */
  function isMonthlyControl(element) {
    // 「年度:」と「月:」のラベルを両方含むか
    const labels = Array.from(element.querySelectorAll('label'));
    const hasYearLabel = labels.some(l => l.textContent && l.textContent.includes('年度:'));
    const hasMonthLabel = labels.some(l => l.textContent && l.textContent.includes('月:'));
    
    // 更新ボタンを含むか
    const buttons = Array.from(element.querySelectorAll('button'));
    const hasUpdateButton = buttons.some(b => b.textContent && b.textContent.includes('更新'));
    
    // 2つのセレクトボックスがあるか
    const hasTwoSelects = element.querySelectorAll('select').length === 2;
    
    // 従業員詳細関連ではないか（除外条件）
    const isNotEmployeeDetail = !(element.id || '').includes('employee') && 
                                !(element.className || '').includes('employee') &&
                                !element.closest('[id*="employee"], [class*="employee"]');
    
    return (hasYearLabel && hasMonthLabel && hasUpdateButton && hasTwoSelects && isNotEmployeeDetail);
  }

  /**
   * 月次コントロールの親コンテナを探す
   * @param {Element} element - 起点となる要素
   * @return {Element|null} 見つかった親コンテナ、または null
   */
  function findParentControl(element) {
    let current = element;
    let container = null;
    
    // 最大5階層まで遡る
    for (let i = 0; i < 5; i++) {
      if (!current || current === document.body) break;
      
      // このレベルでコントロールを検出できるか
      if (current.querySelectorAll('select').length >= 2 && 
          current.querySelectorAll('button').length >= 1) {
        container = current;
        break;
      }
      
      current = current.parentElement;
    }
    
    return container;
  }

  /**
   * 要素を非表示にする
   * @param {Element} element - 非表示にする要素
   */
  function hideElement(element) {
    if (!element) return;
    
    // display:none をインラインスタイルで最優先に設定
    element.style.setProperty('display', 'none', 'important');
    element.style.setProperty('visibility', 'hidden', 'important');
    element.style.setProperty('opacity', '0', 'important');
    element.style.setProperty('height', '0', 'important');
    element.style.setProperty('overflow', 'hidden', 'important');
    element.setAttribute('data-hidden-by-script', 'true');
    
    // マーク付け
    if (!element.hasAttribute('data-hidden-by-script')) {
      logDebug('要素を完全に非表示にしました', element);
    }
  }

  /**
   * 他の要素への影響を評価する
   * 特にEmployeesTabコンポーネントの動作に影響がないか確認
   */
  function checkForSideEffects() {
    // エラーメッセージ検出
    const errorElements = document.querySelectorAll('.error-message, [class*="error"]');
    if (errorElements.length > 0) {
      for (const el of errorElements) {
        if (el.textContent && (
            el.textContent.includes('EmployeesTab') || 
            el.textContent.includes('データの取得') ||
            el.textContent.includes('読み込み')
        )) {
          logDebug('警告: UI変更に関連するエラーが発生している可能性があります', el.textContent);
        }
      }
    }
  }

  // MutationObserverの設定
  function setupObserver() {
    // すでに設定済みの場合は再度設定しない
    if (window._monthlyControlsObserver) {
      window._monthlyControlsObserver.disconnect();
    }
    
    // デバウンス処理用の変数
    let debounceTimer = null;
    
    // MutationObserver作成
    const observer = new MutationObserver(function(mutations) {
      // 処理を間引く（デバウンス）
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(() => {
        // 月次報告タブが表示されているかチェック
        const isMonthlyReportVisible = !!document.querySelector('h1, h2, h3, h4, .title, .header').textContent.includes('月次報告');
        
        if (isMonthlyReportVisible) {
          logDebug('DOM変更検出: 月次報告が表示中、コントロール検出を実行');
          forceHideAllMonthlyControls();
          checkForSideEffects();
        }
      }, 300); // 300ms以内の連続した変更をまとめて処理
    });
    
    // 監視設定（ページ全体、子要素の追加と削除を監視）
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'] // スタイルとクラスの変更のみ監視
    });
    
    window._monthlyControlsObserver = observer;
    logDebug('新しいMutationObserverを設定しました');
    
    return observer;
  }

  // 定期的なチェックのためのインターバル設定
  function setupInterval() {
    // すでに設定済みの場合はクリア
    if (window._monthlyControlsInterval) {
      clearInterval(window._monthlyControlsInterval);
    }
    
    // 2秒ごとにチェック
    const interval = setInterval(() => {
      // ページにコントロールが表示されているか再チェック
      const visibleControls = document.querySelectorAll('div[style*="display: flex"][style*="gap: 20px"]:not([data-hidden-by-script="true"])');
      if (visibleControls.length > 0) {
        for (const control of visibleControls) {
          if (isMonthlyControl(control)) {
            logDebug('インターバルチェック: 新たに表示された月次コントロールを検出');
            forceHideAllMonthlyControls();
            break;
          }
        }
      }
    }, 2000);
    
    window._monthlyControlsInterval = interval;
    logDebug('定期チェック用インターバルを設定しました: 2秒ごと');
    
    return interval;
  }

  // ページロード状態に応じた初期化
  function initialize() {
    logDebug('初期化処理を開始します');
    
    // 即時実行
    const initialResult = forceHideAllMonthlyControls();
    logDebug(`初期非表示化: ${initialResult ? '成功' : '対象要素が見つかりませんでした'}`);
    
    // MutationObserverを設定
    setupObserver();
    
    // インターバルを設定
    setupInterval();
    
    // タブ切り替えなどのイベントでも再適用
    document.addEventListener('click', function(e) {
      // タブやメニュー項目のクリックを検出
      if (e.target.classList && (
          e.target.classList.contains('nav-link') || 
          e.target.classList.contains('nav-item') ||
          (e.target.closest && (e.target.closest('.nav-link') || e.target.closest('.nav-item')))
      )) {
        logDebug('タブ/ナビゲーションクリックを検出');
        // 少し遅延させて実行
        setTimeout(forceHideAllMonthlyControls, 300);
      }
    });
    
    // ページの初期表示時にも実行
    setTimeout(forceHideAllMonthlyControls, 1000);
    
    logDebug('初期化完了: すべての監視と対策を有効化しました');
  }

  // 初期化実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
    logDebug('DOMContentLoaded イベントで初期化をスケジュールしました');
  } else {
    initialize();
    logDebug('ページ読み込み済み: 即時初期化実行');
  }
})();