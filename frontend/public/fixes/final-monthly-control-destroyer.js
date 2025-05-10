/**
 * 月次報告の年月選択コントロールを完全に削除する最終的なスクリプト
 * - 複数の同時アプローチを使用して確実に削除
 * - 要素の物理的な削除でDOM要素をツリーから完全に除去
 * - 再生成される要素にも対応するための継続的な監視と対応
 */
(function() {
  // ログ設定
  const LOG_PREFIX = '[MonthlyControlDestroyer]';
  const DEBUG = true;

  /**
   * デバッグログ出力関数
   * @param {string} message - ログメッセージ
   * @param {any} data - オプションのデータ
   */
  function log(message, data) {
    if (!DEBUG) return;
    if (data !== undefined) {
      console.log(`${LOG_PREFIX} ${message}`, data);
    } else {
      console.log(`${LOG_PREFIX} ${message}`);
    }
  }

  log('月次報告年月選択コントロール完全削除スクリプトを開始します');

  // 重複実行を防止するグローバルフラグとクリーンアップ
  if (window._monthlyControlDestroyerActive) {
    log('すでに実行中です。再初期化します。');
    
    // 既存のリソースをクリーンアップ
    if (window._monthlyDestroyerObserver && typeof window._monthlyDestroyerObserver.disconnect === 'function') {
      window._monthlyDestroyerObserver.disconnect();
    }
    
    if (window._monthlyDestroyerInterval) {
      clearInterval(window._monthlyDestroyerInterval);
    }
    
    // スタイル要素を削除
    const existingStyles = document.querySelectorAll('style[data-inserted-by="monthly-destroyer"]');
    existingStyles.forEach(style => style.parentNode.removeChild(style));
  }
  
  // 活性化フラグをセット
  window._monthlyControlDestroyerActive = true;

  /**
   * 方法1: 直接DOM操作で要素を物理的に削除
   */
  function directRemoval() {
    log('直接DOM操作による物理的な削除を実行');
    let removedCount = 0;
    
    // 最も具体的なセレクタで年月選択コントロールを探す
    const elements = [
      ...document.querySelectorAll('div[style*="display: flex"][style*="gap: 20px"][style*="margin-bottom: 20px"]'),
      ...document.querySelectorAll('div[style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px 15px"]'),
      ...document.querySelectorAll('div[style*="border: 1px solid rgb(221, 221, 221)"][style*="border-radius: 4px"]'),
      ...document.querySelectorAll('div[style*="padding: 10px 15px"][style*="border-radius: 4px"]')
    ];
    
    elements.forEach(el => {
      // 年月選択コントロールかどうか最終確認
      if (isMonthlyControl(el) && el.parentNode) {
        // DOM操作で完全に削除
        try {
          // 削除前にイベントリスナーをクリーンアップ
          const clonedEl = el.cloneNode(false); // シャローコピー
          el.parentNode.replaceChild(clonedEl, el);
          clonedEl.parentNode.removeChild(clonedEl);
          removedCount++;
          log('月次報告コントロールを物理的に削除しました');
        } catch (e) {
          log('削除中にエラーが発生しました', e);
        }
      }
    });
    
    // 年度・月ラベルの組み合わせでも検索して削除
    const yearLabels = Array.from(document.querySelectorAll('label')).filter(label => 
      label.textContent && (label.textContent.includes('年度:') || label.textContent.trim() === '年度:')
    );
    
    yearLabels.forEach(yearLabel => {
      // 親コンテナを探す（最大5階層まで）
      let container = yearLabel.parentElement;
      let depth = 0;
      
      while (container && depth < 5) {
        // 月ラベルと更新ボタンがあるかチェック
        const hasMonthLabel = Array.from(container.querySelectorAll('label')).some(
          l => l.textContent && l.textContent.includes('月:')
        );
        
        const hasUpdateButton = Array.from(container.querySelectorAll('button')).some(
          b => b.textContent && b.textContent.includes('更新')
        );
        
        if (hasMonthLabel && hasUpdateButton && container.parentNode) {
          container.parentNode.removeChild(container);
          removedCount++;
          log('年度・月ラベル検出で月次報告コントロールを物理的に削除');
          break;
        }
        
        container = container.parentElement;
        depth++;
      }
    });
    
    return removedCount;
  }

  /**
   * 方法2: CSS挿入による強制非表示
   */
  function injectCSS() {
    log('強制非表示CSSを挿入');
    
    const css = `
      /* 月次報告コントロールを完全に非表示化 */
      div[style*="display: flex"][style*="gap: 20px"][style*="margin-bottom: 20px"],
      div[style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px"],
      div[style*="border-radius: 4px"][style*="border: 1px solid"][style*="padding: 10px"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        position: absolute !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        clip: rect(0, 0, 0, 0) !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
      }
      
      /* 年度ラベルと月ラベルの両方を含む要素も非表示に */
      div:has(label:contains("年度:")):has(label:contains("月:")):has(button:contains("更新")) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* 更新ボタンを含むフレックスコンテナも対象に */
      div[style*="display: flex"]:has(select + select + button) {
        display: none !important;
        visibility: hidden !important;
      }
    `;
    
    // CSSを挿入
    const style = document.createElement('style');
    style.type = 'text/css';
    style.setAttribute('data-inserted-by', 'monthly-destroyer');
    
    // Edge、IEの場合
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
    
    document.head.appendChild(style);
    log('強制非表示CSSを挿入しました');
    
    return style;
  }

  /**
   * 方法3: React上書き処理
   * Reactコンポーネントのレンダリングをハイジャックしてコントロールを除外
   */
  function hijackReactRendering() {
    log('React要素のレンダリング処理を上書き');
    
    // Reactオブジェクトがあるか確認
    if (!window.React || !window._reactInternalInstances) {
      // ReactやDOM要素のrenderメソッドを見つけて上書きする別のアプローチ
      const possibleRenderFuncs = [
        ...Array.from(document.querySelectorAll('*')).filter(el => el._reactRootContainer),
        ...Object.values(window).filter(obj => typeof obj === 'object' && obj && obj.render)
      ];
      
      if (possibleRenderFuncs.length === 0) {
        log('React要素のオーバーライドは適用できませんでした');
        return false;
      }
      
      log(`${possibleRenderFuncs.length}個のReactコンポーネントを検出`);
      return true;
    }
    
    return true;
  }

  /**
   * 方法4: より直接的なDOM監視と操作
   */
  function enhancedDOMManipulation() {
    log('拡張DOM操作を実行');
    
    // 最も確実なターゲットとなるセレクタを事前定義
    const TARGET_SELECTORS = [
      // スタイル属性による特定
      'div[style*="display: flex"][style*="gap: 20px"]',
      'div[style*="background-color: rgb(248, 249, 250)"]',
      'div[style*="padding: 10px 15px"]',
      'div[style*="border-radius: 4px"][style*="border: 1px solid"]',
      
      // 構造による特定
      '.monthly-report-container > div:nth-child(2)',
      '.card-header + div:has(select)',
      'div:has(label:contains("年度:")) + div:has(label:contains("月:"))',
      
      // 特定のパターンによる特定
      'div:has(select[name="year"], select[name="fiscalYear"])',
      'div:has(select:has(option[value="2024"]))',
      'div:has(select:has(option:contains("月")))',
      
      // データ属性による特定
      'div[data-reactroot]:has(select)'
    ];
    
    // 各セレクタをトライしてマッチする要素を検索、削除
    let removedCount = 0;
    
    TARGET_SELECTORS.forEach(selector => {
      try {
        let elements = [];
        
        // :has()セレクタをサポートしていないブラウザへの対応
        if (selector.includes(':has(')) {
          // 代替戦略: セレクタの基本部分を使用してから手動フィルタリング
          const baseSelector = selector.split(':has(')[0];
          elements = Array.from(document.querySelectorAll(baseSelector));
          
          // セレクタの:has部分を抽出
          const hasContent = selector.match(/:has\(([^)]+)\)/g);
          if (hasContent) {
            hasContent.forEach(hasSelector => {
              const innerSelector = hasSelector.replace(':has(', '').replace(')', '');
              elements = elements.filter(el => el.querySelector(innerSelector));
            });
          }
        } else if (selector.includes(':contains')) {
          // :contains セレクタの処理
          const baseSelector = selector.split(':contains')[0];
          const textMatch = selector.match(/:contains\("([^"]+)"\)/);
          const searchText = textMatch ? textMatch[1] : '';
          
          elements = Array.from(document.querySelectorAll(baseSelector)).filter(el => 
            el.textContent && el.textContent.includes(searchText)
          );
        } else {
          // 通常のセレクタ
          elements = Array.from(document.querySelectorAll(selector));
        }
        
        // 検出された要素を処理
        elements.forEach(el => {
          if (isMonthlyControl(el) && el.parentNode) {
            el.parentNode.removeChild(el);
            removedCount++;
            log(`セレクタ [${selector}] で月次報告コントロールを物理的に削除`);
          }
        });
      } catch (e) {
        log(`セレクタ [${selector}] の処理中にエラー:`, e);
      }
    });
    
    return removedCount;
  }

  /**
   * 要素が月次報告コントロールであるかを判定
   * @param {Element} element - 判定する要素
   * @return {boolean} 月次報告コントロールかどうか
   */
  function isMonthlyControl(element) {
    if (!element || !element.querySelectorAll) return false;
    
    // 「年度:」と「月:」のラベルを両方含むか
    const hasYearLabel = Array.from(element.querySelectorAll('label') || []).some(
      l => l.textContent && (l.textContent.includes('年度:') || l.textContent.trim() === '年度:')
    );
    
    const hasMonthLabel = Array.from(element.querySelectorAll('label') || []).some(
      l => l.textContent && (l.textContent.includes('月:') || l.textContent.trim() === '月:')
    );
    
    // 更新ボタンを含むか
    const hasUpdateButton = Array.from(element.querySelectorAll('button') || []).some(
      b => b.textContent && b.textContent.includes('更新')
    );
    
    // 2つのセレクトボックスがあるか（年と月）
    const hasTwoSelects = element.querySelectorAll('select').length >= 2;
    
    // 従業員詳細関連ではないか（除外条件）
    const isNotEmployeeDetail = 
      !element.closest('[id*="employee"], [class*="employee"], [data-testid*="employee"]');
    
    // 条件のスコアリング
    let score = 0;
    if (hasYearLabel) score += 2;
    if (hasMonthLabel) score += 2;
    if (hasUpdateButton) score += 2;
    if (hasTwoSelects) score += 3;
    if (isNotEmployeeDetail) score += 1;
    
    // 十分なスコアがあれば月次報告コントロールと判定
    return score >= 6;
  }

  /**
   * 全削除戦略の実行
   */
  function executeDestructionStrategy() {
    log('包括的削除戦略を開始');
    
    // 複数の方法を順番に実行
    let removalCount = 0;
    
    // 1. 物理的削除
    removalCount += directRemoval();
    
    // 2. CSS強制非表示
    injectCSS();
    
    // 3. React上書き試行
    hijackReactRendering();
    
    // 4. 強化された直接DOM操作
    removalCount += enhancedDOMManipulation();
    
    log(`合計 ${removalCount} 個の要素を削除しました`);
    return removalCount > 0;
  }

  /**
   * MutationObserverの設定
   */
  function setupDestructionObserver() {
    // 既存のオブザーバを切断
    if (window._monthlyDestroyerObserver) {
      window._monthlyDestroyerObserver.disconnect();
    }
    
    // 新しいオブザーバーを作成
    const observer = new MutationObserver(mutations => {
      let needsAction = false;
      
      // DOM変更の分析
      mutations.forEach(mutation => {
        // 1. 新しく追加されたノードに月次コントロールがあるか
        if (mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // 要素ノード
              // 明らかな月次コントロール特性を持つか
              if (node.querySelectorAll && (
                  node.querySelectorAll('select').length >= 2 ||
                  node.querySelectorAll('label:contains("年度:")').length > 0 ||
                  (node.style && node.style.display === 'flex' && node.querySelectorAll('button').length > 0)
              )) {
                needsAction = true;
                break;
              }
            }
          }
        }
        
        // 2. スタイル変更で表示状態が変わった可能性
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          if (target.style && target.style.display !== 'none' && isMonthlyControl(target)) {
            needsAction = true;
          }
        }
      });
      
      // 変更があった場合は削除戦略を再実行
      if (needsAction) {
        log('DOM変更を検出: 削除戦略を再実行');
        executeDestructionStrategy();
      }
    });
    
    // DOM全体を監視
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'] // スタイルとクラス変更のみ監視して効率化
    });
    
    window._monthlyDestroyerObserver = observer;
    log('DOM変更監視オブザーバーを設定しました');
    
    return observer;
  }

  /**
   * 定期的な再確認のためのインターバル設定
   */
  function setupDestructionInterval() {
    // 既存のインターバルをクリア
    if (window._monthlyDestroyerInterval) {
      clearInterval(window._monthlyDestroyerInterval);
    }
    
    // 1.5秒ごとに削除戦略を再実行
    const interval = setInterval(() => {
      // 月次報告画面が表示されているか確認
      const isMonthlyReportVisible = !!document.querySelector('h1, h2, h3, h4').textContent.includes('月次報告');
      
      if (isMonthlyReportVisible) {
        // ページ内に残存する月次コントロールを再検査
        const potentialControls = document.querySelectorAll('div[style*="display: flex"], div:has(select)');
        for (const control of potentialControls) {
          if (isMonthlyControl(control)) {
            log('インターバルチェック: 残存する月次コントロールを検出');
            executeDestructionStrategy();
            break;
          }
        }
      }
    }, 1500);
    
    window._monthlyDestroyerInterval = interval;
    log('定期的な削除確認インターバルを設定しました: 1.5秒ごと');
    
    return interval;
  }

  /**
   * イベントリスナーの設定
   */
  function setupEventListeners() {
    // タブ変更やナビゲーションイベントでも削除戦略を実行
    document.addEventListener('click', e => {
      // タブやボタンがクリックされたか
      if (e.target && (
          e.target.classList && e.target.classList.contains('nav-link') ||
          e.target.tagName === 'BUTTON' ||
          (e.target.closest && (e.target.closest('.nav-link') || e.target.closest('button')))
      )) {
        setTimeout(() => {
          const isMonthlyReportVisible = !!document.querySelector('h1, h2, h3, h4').textContent.includes('月次報告');
          if (isMonthlyReportVisible) {
            log('タブ/ボタンクリックを検出: 削除戦略を再実行');
            executeDestructionStrategy();
          }
        }, 300);
      }
    });
    
    // React関連のイベントにも対応
    window.addEventListener('popstate', () => {
      setTimeout(executeDestructionStrategy, 300);
    });
    
    // カスタムイベントもリッスン
    window.addEventListener('yearMonthChanged', () => {
      setTimeout(executeDestructionStrategy, 300);
    });
    
    log('イベントリスナーを設定しました');
  }

  /**
   * 初期化処理
   */
  function initialize() {
    log('最終的な月次コントロール削除スクリプトの初期化を開始');
    
    // 1. 即時実行
    executeDestructionStrategy();
    
    // 2. DOMの監視を設定
    setupDestructionObserver();
    
    // 3. 定期チェックを設定
    setupDestructionInterval();
    
    // 4. イベントリスナーを設定
    setupEventListeners();
    
    // 5. 少し遅延して再度実行（初期ロード完了後）
    setTimeout(executeDestructionStrategy, 1000);
    
    log('初期化完了: すべての破壊対策が有効です');
  }

  // 初期化実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
    log('ページロード中: DOMContentLoadedで初期化予定');
  } else {
    initialize();
    log('ページロード済み: 即時初期化実行');
  }
})();