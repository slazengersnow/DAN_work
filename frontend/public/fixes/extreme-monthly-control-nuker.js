/**
 * 月次報告コントロールを完全に削除する「最終手段」スクリプト
 * 他のすべての方法が失敗した場合の緊急対策として実装
 * 
 * 警告: このスクリプトは徹底的な破壊モードで動作します
 */
(function() {
  // デバッグ設定
  const DEBUG = true;
  const LOG_PREFIX = '[EXTREME-NUKER]';
  
  /**
   * ログ出力関数
   */
  function log(message, data) {
    if (!DEBUG) return;
    if (data !== undefined) {
      console.log(`${LOG_PREFIX} ${message}`, data);
    } else {
      console.log(`${LOG_PREFIX} ${message}`);
    }
  }
  
  log('## 月次報告コントロール徹底破壊モードを開始します ##');
  
  // グローバル実行フラグ
  if (window._monthlyNukerActive) {
    log('既に実行中です。リセットして再実行します');
    // クリーンアップ
    if (window._monthlyNukerObserver) {
      window._monthlyNukerObserver.disconnect();
    }
    if (window._monthlyNukerInterval) {
      clearInterval(window._monthlyNukerInterval);
    }
  }
  
  window._monthlyNukerActive = true;
  
  /**
   * 月次コントロールを直接破壊する関数
   * 複数の検索戦略を使用して確実に特定・削除
   */
  function nukeMonthlyControl() {
    log('月次コントロールの破壊実行を開始');
    let nukedCount = 0;
    
    // 疑わしい要素をすべて特定
    const targets = [
      // まず実際のHTMLから直接コピーした特徴的なスタイル属性で検索
      ...document.querySelectorAll('div[style*="display: flex"][style*="gap: 20px"]'),
      ...document.querySelectorAll('div[style*="background-color: rgb(248, 249, 250)"]'),
      ...document.querySelectorAll('div[style*="border: 1px solid rgb(221, 221, 221)"]'),
      // フォームコントロールを含む疑わしい要素
      ...document.querySelectorAll('div[style*="padding"][style*="border-radius"]'),
      ...document.querySelectorAll('div[style*="margin-bottom: 20px"]'),
      // 次に内容で検索
      ...Array.from(document.querySelectorAll('div')).filter(div => 
        div.textContent && div.textContent.includes('年度:') && div.textContent.includes('月:')
      )
    ];
    
    for(const target of targets) {
      // 確認：これが月次コントロールか最終チェック
      if (isMonthlyControl(target)) {
        log('月次コントロールを発見、削除します:', target);
        // 物理的に削除
        if (target.parentNode) {
          target.parentNode.removeChild(target);
          nukedCount++;
        }
      }
    }
    
    log(`合計 ${nukedCount} 個の月次コントロールを破壊しました`);
    return nukedCount;
  }
  
  /**
   * より徹底した検索と破壊
   * 複数の方向から年月コントロールを特定して削除
   */
  function extremeSearchAndDestroy() {
    log('拡張検索モードによる徹底破壊を実行');
    let destroyedCount = 0;
    
    // 1. ラベルから検索開始
    const yearLabels = Array.from(document.querySelectorAll('label')).filter(
      label => label.textContent && label.textContent.includes('年度:')
    );
    
    for (const label of yearLabels) {
      // ラベルからコンテナを探索（最大5階層）
      let container = label.parentElement;
      let depth = 0;
      
      while (container && depth < 5) {
        // このコンテナに月ラベルがあるかチェック
        const hasMonthLabel = Array.from(container.querySelectorAll('label')).some(
          l => l.textContent && l.textContent.includes('月:')
        );
        
        // セレクトボックスと更新ボタンの確認
        if (hasMonthLabel && 
            container.querySelectorAll('select').length >= 2 &&
            container.querySelectorAll('button').length > 0) {
          
          log('年度ラベルからコンテナを特定、破壊します:', container);
          if (container.parentNode) {
            container.parentNode.removeChild(container);
            destroyedCount++;
            break;
          }
        }
        
        container = container.parentElement;
        depth++;
      }
    }
    
    // 2. セレクトボックスのペアから検索
    const selects = document.querySelectorAll('select');
    const selectPairs = [];
    
    // 同じ親要素内にある複数のセレクトを特定
    for (let i = 0; i < selects.length; i++) {
      for (let j = i + 1; j < selects.length; j++) {
        const select1 = selects[i];
        const select2 = selects[j];
        
        // 共通の親要素が小さいものを見つける
        let parent1 = select1.parentElement;
        let depth = 0;
        
        while (parent1 && depth < 4) {
          if (parent1.contains(select2)) {
            // セレクトペアを見つけた
            selectPairs.push(parent1);
            break;
          }
          parent1 = parent1.parentElement;
          depth++;
        }
      }
    }
    
    // 見つけたセレクトペアをチェック、月次コントロールなら削除
    for (const pair of selectPairs) {
      if (isMonthlyControl(pair)) {
        log('セレクトペアから月次コントロールを特定、破壊します:', pair);
        if (pair.parentNode) {
          pair.parentNode.removeChild(pair);
          destroyedCount++;
        }
      }
    }
    
    // 3. 更新ボタンから検索
    const updateButtons = Array.from(document.querySelectorAll('button')).filter(
      btn => btn.textContent && btn.textContent.includes('更新')
    );
    
    for (const button of updateButtons) {
      // ボタンからコンテナを探索（最大4階層）
      let container = button.parentElement;
      let depth = 0;
      
      while (container && depth < 4) {
        // このコンテナにセレクトがあるかチェック
        if (container.querySelectorAll('select').length >= 2) {
          // ラベルもチェック
          const hasYearLabel = Array.from(container.querySelectorAll('label')).some(
            l => l.textContent && l.textContent.includes('年度')
          );
          
          const hasMonthLabel = Array.from(container.querySelectorAll('label')).some(
            l => l.textContent && l.textContent.includes('月')
          );
          
          if (hasYearLabel && hasMonthLabel) {
            log('更新ボタンから月次コントロールを特定、破壊します:', container);
            if (container.parentNode) {
              container.parentNode.removeChild(container);
              destroyedCount++;
              break;
            }
          }
        }
        
        container = container.parentElement;
        depth++;
      }
    }
    
    // 4. 直接コピーした具体的スタイル値でマッチング（最も効果的）
    const exactStyleTargets = [
      // 現在のスタイル属性（実際のHTMLから直接コピー）
      'div[style="display: flex; gap: 20px; margin-bottom: 20px; background-color: rgb(248, 249, 250); padding: 10px 15px; border-radius: 4px; border: 1px solid rgb(221, 221, 221);"]',
      // よりゆるい一致
      'div[style*="gap: 20px; margin-bottom: 20px; background-color:"]',
      'div[style*="padding: 10px 15px; border-radius: 4px;"]'
    ];
    
    for (const selector of exactStyleTargets) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (isMonthlyControl(el)) {
            log('完全なスタイル一致で月次コントロールを特定、破壊します:', el);
            if (el.parentNode) {
              el.parentNode.removeChild(el);
              destroyedCount++;
            }
          }
        }
      } catch (e) {
        log(`セレクタ処理エラー (${selector}):`, e);
      }
    }
    
    // 5. 構造のパターンマッチング
    const structuralPatterns = document.querySelectorAll('div > div > select + select + button');
    for (const pattern of structuralPatterns) {
      let container = pattern.parentElement;
      if (container && isMonthlyControl(container)) {
        log('構造パターンから月次コントロールを特定、破壊します:', container);
        if (container.parentNode) {
          container.parentNode.removeChild(container);
          destroyedCount++;
        }
      }
    }
    
    log(`拡張検索で ${destroyedCount} 個のコントロールを破壊しました`);
    return destroyedCount;
  }
  
  /**
   * 月次レポートコントロールかどうかを判定
   */
  function isMonthlyControl(el) {
    if (!el || !el.querySelectorAll) return false;
    
    return (
      // 条件を複数組み合わせて必ず特定できるようにする
      el.querySelectorAll('select').length >= 2 && // 2つ以上のセレクト
      (el.textContent.includes('年度') || el.textContent.includes('年度:')) && // 年度テキスト
      (el.textContent.includes('月') || el.textContent.includes('月:')) && // 月テキスト
      (el.textContent.includes('更新') || el.querySelector('button')) && // 更新ボタン
      !el.closest('[id*="employee"]') && // 従業員詳細エリアは除外
      !el.closest('.modal') // モーダルウィンドウは除外
    );
  }
  
  /**
   * データ要素にNuker情報を埋め込む（デバッグ用）
   */
  function tagPage() {
    const infoElement = document.createElement('div');
    infoElement.style.cssText = 'display: none !important;';
    infoElement.setAttribute('data-nuker-active', 'true');
    infoElement.setAttribute('data-nuker-timestamp', new Date().toISOString());
    document.body.appendChild(infoElement);
    log('ページにnuker情報タグを埋め込みました');
  }
  
  /**
   * 破壊的CSSルールを注入
   */
  function injectDestroyerCSS() {
    const css = `
      /* 月次コントロールを完全に削除するCSS */
      div[style*="display: flex"][style*="gap: 20px"][style*="margin-bottom: 20px"],
      div[style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px"],
      div[style*="border: 1px solid rgb(221, 221, 221)"][style*="border-radius: 4px"],
      div:has(label:contains("年度:")):has(label:contains("月:")):has(button:contains("更新")),
      div:has(select):has(select + select),
      div[style*="flex"]:has(select):has(button) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        position: absolute !important;
        pointer-events: none !important;
        clip: rect(0, 0, 0, 0) !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        max-height: 0 !important;
        transform: scale(0) !important;
      }
    `;
    
    const style = document.createElement('style');
    style.type = 'text/css';
    style.setAttribute('data-inserted-by', 'extreme-nuker');
    
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
    
    document.head.appendChild(style);
    log('破壊的CSSルールを注入しました');
  }
  
  /**
   * 実行中のMutationObserverを設定
   */
  function setupNukerObserver() {
    if (window._monthlyNukerObserver) {
      window._monthlyNukerObserver.disconnect();
    }
    
    const observer = new MutationObserver(mutations => {
      // 再生成を検知して即座に破壊
      const shouldNuke = mutations.some(mutation => {
        // 要素追加を確認
        if (mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // 要素ノード
              if (node.querySelectorAll && node.querySelectorAll('select').length > 0) {
                return true;
              }
              
              if (node.textContent && 
                  (node.textContent.includes('年度:') || node.textContent.includes('月:'))) {
                return true;
              }
            }
          }
        }
        
        // 属性変更（スタイル変更など）を確認
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          if (target.style && target.style.display !== 'none') {
            return true;
          }
        }
        
        return false;
      });
      
      if (shouldNuke) {
        log('DOM変更を検出: 破壊メソッドを再実行');
        executeAllDestructionMethods();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    window._monthlyNukerObserver = observer;
    log('Nuker Observerを設定しました');
    
    return observer;
  }
  
  /**
   * 定期チェックインターバルを設定
   */
  function setupNukerInterval() {
    if (window._monthlyNukerInterval) {
      clearInterval(window._monthlyNukerInterval);
    }
    
    const interval = setInterval(() => {
      // 月次報告画面表示中かチェック
      const isMonthlyReportPage = document.querySelector('h1, h2, h3')?.textContent.includes('月次報告');
      
      if (isMonthlyReportPage) {
        // 残存するコントロールを再検索
        const targets = document.querySelectorAll('div[style*="display: flex"], div:has(select)');
        for (const target of targets) {
          if (isMonthlyControl(target) && target.offsetParent !== null) { // 表示状態確認
            log('残存コントロールを検出: 破壊メソッドを再実行');
            executeAllDestructionMethods();
            break;
          }
        }
      }
    }, 1000);
    
    window._monthlyNukerInterval = interval;
    log('定期チェックインターバルを設定しました: 1秒ごと');
    
    return interval;
  }
  
  /**
   * Reactコンポーネントの上書き試行
   */
  function tryOverrideReactComponents() {
    log('Reactコンポーネント上書きを試行');
    
    // React Devtools拡張機能がある場合
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      log('React DevTools hookを検出');
      
      // すべてのReactコンポーネントインスタンスを取得
      const reactInstances = [];
      
      try {
        // コンポーネントが描画される前に非表示にするハンドラを挿入
        const originalRender = window.React?.Component?.prototype?.render;
        if (originalRender) {
          log('Reactのrenderメソッドを上書きします');
          window.React.Component.prototype.render = function(...args) {
            const result = originalRender.apply(this, args);
            
            // 結果がDOMエレメントでrenderメソッドのある月次レポート関連コンポーネントの場合
            if (result && 
                result.type && 
                (this.constructor.name || '').match(/Monthly|Report|Control/i)) {
              
              // クラス名や要素内容を確認
              if (result.props && result.props.className && 
                  result.props.className.includes('control')) {
                log('Reactレンダー中に月次コントロールを検出して非表示化');
                
                // 非表示プロパティを追加
                result.props.style = {
                  ...result.props.style,
                  display: 'none',
                  visibility: 'hidden',
                  height: 0,
                  overflow: 'hidden'
                };
              }
            }
            
            return result;
          };
        }
      } catch (e) {
        log('Reactコンポーネント上書き中にエラー:', e);
      }
    }
  }
  
  /**
   * すべての破壊メソッドを実行
   */
  function executeAllDestructionMethods() {
    let totalDestroyed = 0;
    
    // 1. 直接DOM破壊
    totalDestroyed += nukeMonthlyControl();
    
    // 2. 拡張検索破壊
    totalDestroyed += extremeSearchAndDestroy();
    
    // 3. CSSルール注入
    injectDestroyerCSS();
    
    // 4. React上書き試行
    tryOverrideReactComponents();
    
    return totalDestroyed;
  }
  
  /**
   * 初期化と実行
   */
  function initialize() {
    log('### 月次コントロール破壊スクリプトを初期化しています ###');
    
    // ページに情報タグを埋め込み
    tagPage();
    
    // すべての破壊メソッドを実行
    const destroyed = executeAllDestructionMethods();
    log(`初期実行で ${destroyed} 個のコントロールを破壊しました`);
    
    // 継続的な監視を設定
    setupNukerObserver();
    setupNukerInterval();
    
    // イベントリスナーを設定
    document.addEventListener('click', e => {
      // タブやナビゲーションのクリック
      if (e.target && (
          e.target.classList?.contains('nav-link') ||
          e.target.classList?.contains('nav-item') ||
          e.target.tagName === 'BUTTON'
      )) {
        setTimeout(executeAllDestructionMethods, 300);
      }
    });
    
    // 一定時間後にも再チェック（遅延ロード対策）
    setTimeout(executeAllDestructionMethods, 1000);
    setTimeout(executeAllDestructionMethods, 2500);
    
    log('### 月次コントロール破壊スクリプトの初期化が完了しました ###');
  }
  
  // 初期化を実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
    log('DOMContentLoadedイベントで初期化をスケジュールしました');
  } else {
    initialize();
    log('ページ読み込み完了済み: 即時初期化実行');
  }
})();