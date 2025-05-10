/**
 * 月次報告画面の年月選択コントロールを完全に削除する「究極の解決策」
 * 
 * これまでのCSSベース・DOM操作ベースのアプローチが失敗したため、
 * 今回はHTML直接書き換えによる「最終兵器」アプローチを採用
 * 
 * 3つの異なる戦略を組み合わせて実行:
 * 1. テキストノードの直接探索から要素を特定して削除
 * 2. 正規表現による要素のパターンマッチングと削除
 * 3. 直接HTMLパターンの置換（最終手段）
 * 
 * @version FINAL-SOLUTION-V1.0
 */
(function() {
  // デバッグモードの設定
  const DEBUG = true;
  const LOG_PREFIX = '[HTML-ANNIHILATOR]';
  
  // デバッグログ関数
  function log(...args) {
    if (!DEBUG) return;
    console.log(LOG_PREFIX, ...args);
  }
  
  log('🔥🔥🔥 月次報告コントロール除去スクリプト（HTML直接書き換え）起動 🔥🔥🔥');
  
  // 既存実行の管理
  if (window._directHtmlAnnihilatorActive) {
    log('すでに実行中のスクリプトを検出。リセットして再起動します。');
    clearAllTimers();
  }
  
  // グローバル状態の初期化
  window._directHtmlAnnihilatorActive = true;
  window._directHtmlAnnihilatorTimers = [];
  window._directHtmlAnnihilatorIntervals = [];
  window._directHtmlAnnihilatorRemovedCount = 0;
  window._directHtmlAnnihilatorLastExecutionTime = Date.now();
  
  /**
   * タイマーをクリアする関数
   */
  function clearAllTimers() {
    if (window._directHtmlAnnihilatorTimers) {
      window._directHtmlAnnihilatorTimers.forEach(timer => clearTimeout(timer));
      window._directHtmlAnnihilatorTimers = [];
    }
    
    if (window._directHtmlAnnihilatorIntervals) {
      window._directHtmlAnnihilatorIntervals.forEach(interval => clearInterval(interval));
      window._directHtmlAnnihilatorIntervals = [];
    }
    
    log('全てのタイマーをクリアしました');
  }
  
  /**
   * 戦略1: テキストノードを直接探索して親要素を特定・削除
   */
  function removeMonthlyControls() {
    log('戦略1: テキストノード探索による要素削除を実行');
    
    // テキストノードを直接探索して親要素を特定
    const textWalker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const targetsToRemove = [];
    let textNode;
    
    // テキストの内容から要素を特定
    while (textNode = textWalker.nextNode()) {
      // 削除済みの要素は対象外
      if (!document.body.contains(textNode)) continue;
      
      const text = textNode.textContent.trim();
      if (text.includes('年度:') || text.includes('月:') || text === '年度' || text === '月') {
        let parent = textNode.parentNode;
        let depth = 0;
        
        // フレックスボックスコンテナを見つける
        while (parent && parent !== document.body && depth < 5) {
          const style = window.getComputedStyle(parent);
          
          // 複数条件でのマッチング (複合パターン)
          const hasDisplay = style.display === 'flex' || style.display === 'inline-flex';
          const hasMonthText = parent.textContent.includes('月:') || parent.textContent.includes('月');
          const hasYearText = parent.textContent.includes('年度:') || parent.textContent.includes('年度');
          const hasUpdateButton = parent.textContent.includes('更新');
          
          if (hasDisplay && hasMonthText && hasYearText && hasUpdateButton) {
            // 既存のリストに含まれていなければ追加
            if (!targetsToRemove.some(el => el === parent)) {
              targetsToRemove.push(parent);
              log('テキストノードから月次コントロールを特定:', parent);
            }
            break;
          }
          
          parent = parent.parentNode;
          depth++;
        }
      }
    }
    
    // 特定した要素を物理的に削除
    const removedCount = removeElements(targetsToRemove);
    log(`テキストノード探索により ${removedCount} 個の要素を削除しました`);
    
    return removedCount;
  }
  
  /**
   * 戦略2: 正規表現によるHTMLパターンマッチングで要素を特定・削除
   */
  function removeByRegex() {
    log('戦略2: 正規表現による要素削除を実行');
    
    const divElements = document.querySelectorAll('div');
    const targetsToRemove = [];
    
    divElements.forEach(div => {
      try {
        const html = div.outerHTML;
        // すでに処理済みの要素はスキップ
        if (!document.body.contains(div)) return;
        
        // フレックスボックスのスタイルを持ち、年度と月のラベルを含む要素を検出
        if ((/style="[^"]*display:\s*flex[^"]*"/.test(html) || 
             window.getComputedStyle(div).display === 'flex') && 
            (html.includes('年度:') || html.includes('年度')) && 
            (html.includes('月:') || html.includes('月')) &&
            html.includes('更新')) {
          
          // 月次コントロールとして特定
          if (!targetsToRemove.some(el => el === div)) {
            targetsToRemove.push(div);
            log('正規表現に一致する要素を発見:', div);
          }
        }
      } catch (e) {
        // エラーの場合はスキップ
        log('正規表現マッチング中にエラー:', e);
      }
    });
    
    // 特定した要素を物理的に削除
    const removedCount = removeElements(targetsToRemove);
    log(`正規表現マッチングにより ${removedCount} 個の要素を削除しました`);
    
    return removedCount;
  }
  
  /**
   * 戦略3: 最後の手段として直接HTMLを書き換え
   */
  function nuclearOption() {
    log('戦略3: 直接HTMLパターン置換を実行（最終手段）');
    
    // 特定のHTMLパターンを直接置換
    const patterns = [
      // パターン1: フレックスディスプレイと年月ラベルを含むdiv
      /<div[^>]*style="[^"]*display:\s*flex[^"]*gap:\s*20px[^"]*margin-bottom:\s*20px[^"]*"[^>]*>[\s\S]*?<label[^>]*>年度:?[^<]*<\/label>[\s\S]*?<label[^>]*>月:?[^<]*<\/label>[\s\S]*?<\/div>/gi,
      
      // パターン2: 背景色と年月セレクターを含むコントロール
      /<div[^>]*style="[^"]*background-color:\s*rgb\(248,\s*249,\s*250\)[^"]*"[^>]*>[\s\S]*?<label[^>]*>年度:?[^<]*<\/label>[\s\S]*?<select[\s\S]*?<\/select>[\s\S]*?<label[^>]*>月:?[^<]*<\/label>[\s\S]*?<\/div>/gi,
      
      // パターン3: より一般的なセレクターとボタンの組み合わせ
      /<div[^>]*>[\s\S]*?<label[^>]*>年度:?[^<]*<\/label>[\s\S]*?<select[\s\S]*?<\/select>[\s\S]*?<label[^>]*>月:?[^<]*<\/label>[\s\S]*?<select[\s\S]*?<\/select>[\s\S]*?<button[^>]*>更新<\/button>[\s\S]*?<\/div>/gi
    ];
    
    // 複数の候補コンテナから探索
    const containers = [
      ...document.querySelectorAll('.monthly-report, .container, #app, .card, main, [class*="container"], [class*="content"], [class*="panel"]')
    ];
    
    // コンテナが見つからない場合はdocument.bodyを使用
    if (containers.length === 0) {
      containers.push(document.body);
    }
    
    let replacementCount = 0;
    
    // 各コンテナでパターン置換を実行
    containers.forEach(container => {
      if (!container) return;
      
      try {
        const originalHtml = container.innerHTML;
        let modifiedHtml = originalHtml;
        
        patterns.forEach(pattern => {
          // 置換前のHTMLと比較
          const initialHtml = modifiedHtml;
          // パターンを空のコメントで置換
          modifiedHtml = modifiedHtml.replace(pattern, '<!-- 月次報告コントロール削除 -->');
          
          // 変更があった場合はカウント
          if (initialHtml !== modifiedHtml) {
            replacementCount++;
          }
        });
        
        // 変更があった場合のみHTMLを更新
        if (modifiedHtml !== originalHtml) {
          log(`コンテナ内のHTMLパターンを ${replacementCount} 個置換しました`, container);
          container.innerHTML = modifiedHtml;
          
          // 操作の追跡とデバッグ
          window._directHtmlAnnihilatorRemovedCount += replacementCount;
          window._directHtmlAnnihilatorLastExecutionTime = Date.now();
        }
      } catch (e) {
        log('HTMLパターン置換中にエラー:', e);
      }
    });
    
    return replacementCount;
  }
  
  /**
   * 要素リストを削除する共通関数
   */
  function removeElements(elements) {
    let successCount = 0;
    
    elements.forEach(element => {
      try {
        if (element && element.parentNode) {
          // 削除前にデータ属性をマーク（デバッグ用）
          element.setAttribute('data-removed-by', 'html-annihilator');
          element.setAttribute('data-removed-at', Date.now().toString());
          
          // スタイルで非表示
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.style.height = '0';
          element.style.overflow = 'hidden';
          
          // 内容をクリア
          element.innerHTML = '';
          
          // 物理的に削除
          element.parentNode.removeChild(element);
          
          successCount++;
          window._directHtmlAnnihilatorRemovedCount++;
        }
      } catch (e) {
        log('要素削除中にエラー:', e);
      }
    });
    
    // 削除が発生したら結果を通知
    if (successCount > 0) {
      window._directHtmlAnnihilatorLastExecutionTime = Date.now();
      showResultNotification();
    }
    
    return successCount;
  }
  
  /**
   * 結果通知を表示
   */
  function showResultNotification() {
    // 既存の通知要素を探す
    let notificationEl = document.getElementById('html-annihilator-notification');
    
    if (!notificationEl) {
      // 新規作成
      notificationEl = document.createElement('div');
      notificationEl.id = 'html-annihilator-notification';
      notificationEl.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background-color: rgba(50, 50, 50, 0.9);
        color: white;
        font-size: 12px;
        padding: 8px 12px;
        border-radius: 4px;
        z-index: 9999;
        transition: opacity 0.3s ease;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      `;
      document.body.appendChild(notificationEl);
    }
    
    // 通知内容を更新
    const count = window._directHtmlAnnihilatorRemovedCount;
    const time = new Date().toLocaleTimeString();
    
    notificationEl.textContent = `${count}個の月次コントロールを除去 (${time})`;
    
    // 表示してから徐々に消す
    notificationEl.style.opacity = '1';
    setTimeout(() => {
      notificationEl.style.opacity = '0.3';
    }, 2000);
  }
  
  /**
   * 全戦略を順次実行
   */
  function executeAllStrategies() {
    log('全ての月次コントロール除去戦略を実行');
    
    // 各戦略を順番に実行し結果を集計
    const results = {
      textNodeStrategy: removeMonthlyControls(),
      regexStrategy: removeByRegex(),
      htmlReplaceStrategy: nuclearOption()
    };
    
    // 合計除去数
    const totalRemoved = 
      results.textNodeStrategy + 
      results.regexStrategy + 
      results.htmlReplaceStrategy;
    
    if (totalRemoved > 0) {
      log(`合計 ${totalRemoved} 個の月次コントロールを除去しました`, results);
    } else {
      log('除去対象の月次コントロールは見つかりませんでした');
    }
    
    return totalRemoved;
  }
  
  /**
   * クリックイベントの監視設定
   */
  function setupClickListeners() {
    document.addEventListener('click', event => {
      // ボタンやタブ、リンクのクリック後に実行
      if (event.target && (
        event.target.tagName === 'BUTTON' || 
        event.target.tagName === 'A' || 
        event.target.closest('button, a, .nav-item, .tab')
      )) {
        log('UI要素のクリック検出: 月次コントロール除去を再実行');
        
        // クリック後少し遅延させて実行
        const timer = setTimeout(() => {
          executeAllStrategies();
        }, 300);
        
        window._directHtmlAnnihilatorTimers.push(timer);
      }
    });
    
    log('クリックイベントリスナーを設定しました');
  }
  
  /**
   * ナビゲーション・URL変更の監視設定
   */
  function setupNavigationListeners() {
    // popstateイベント（ブラウザの戻る・進む）
    window.addEventListener('popstate', () => {
      log('ページナビゲーション検出: 月次コントロール除去を再実行');
      
      const timer = setTimeout(() => {
        executeAllStrategies();
      }, 500);
      
      window._directHtmlAnnihilatorTimers.push(timer);
    });
    
    // React Router対応のためのhistory API監視
    const originalPushState = history.pushState;
    history.pushState = function() {
      const result = originalPushState.apply(this, arguments);
      
      log('History API呼び出し検出: 月次コントロール除去を再実行');
      const timer = setTimeout(() => {
        executeAllStrategies();
      }, 500);
      
      window._directHtmlAnnihilatorTimers.push(timer);
      
      return result;
    };
    
    log('ナビゲーションリスナーを設定しました');
  }
  
  /**
   * 定期実行を設定
   */
  function setupPeriodicExecution() {
    // 定期的に実行するインターバル (3秒ごと)
    const interval = setInterval(() => {
      // 月次報告画面っぽい場合のみ実行
      const isMonthlyReportPage = 
        document.querySelector('h1, h2, h3, h4')?.textContent?.includes('月次報告') ||
        location.pathname.includes('monthly') ||
        location.href.includes('report');
      
      if (isMonthlyReportPage) {
        log('定期チェック: 月次報告画面を検出');
        executeAllStrategies();
      }
    }, 3000);
    
    window._directHtmlAnnihilatorIntervals.push(interval);
    log('定期実行インターバルを設定しました (3秒ごと)');
  }
  
  /**
   * 複数のタイミングで重ねて実行するスケジュール設定
   */
  function scheduleMultipleExecutions() {
    log('複数のタイミングでの実行をスケジュール');
    
    // 微妙に遅延させて実行 (100ms, 500ms, 1000ms, 2000ms, 3000ms)
    [100, 500, 1000, 2000, 3000].forEach(delay => {
      const timer = setTimeout(() => {
        log(`${delay}ms遅延実行`);
        executeAllStrategies();
      }, delay);
      
      window._directHtmlAnnihilatorTimers.push(timer);
    });
  }
  
  /**
   * MutationObserverによるDOM変更監視
   */
  function setupMutationObserver() {
    // MutationObserverの設定
    const observer = new MutationObserver(mutations => {
      // 関連する変更かどうかをチェック
      let relevantChanges = false;
      
      for (const mutation of mutations) {
        // 新しく追加されたノードをチェック
        if (mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== 1) continue; // 要素ノードのみ
            
            // テキスト内容や要素をチェック
            const containsYearMonth = 
              node.textContent?.includes('年度') || 
              node.textContent?.includes('月:');
            
            const hasRelevantElements = 
              node.querySelectorAll && (
                node.querySelectorAll('label').length > 0 || 
                node.querySelectorAll('select').length > 0
              );
            
            if (containsYearMonth || hasRelevantElements) {
              relevantChanges = true;
              break;
            }
          }
        }
        
        if (relevantChanges) break;
      }
      
      // 関連する変更があれば実行
      if (relevantChanges) {
        log('DOM変更を検出: 月次コントロール除去を再実行');
        
        // 少し遅延させて実行（連続変更の最後だけ処理するため）
        const now = Date.now();
        if (now - window._directHtmlAnnihilatorLastExecutionTime > 200) {
          const timer = setTimeout(() => {
            executeAllStrategies();
          }, 100);
          
          window._directHtmlAnnihilatorTimers.push(timer);
          window._directHtmlAnnihilatorLastExecutionTime = now;
        }
      }
    });
    
    // 監視開始
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      attributeFilter: ['style', 'class'] // 関連する属性のみ監視
    });
    
    // グローバル参照を保存（後でdisconnectするため）
    window._directHtmlAnnihilatorObserver = observer;
    
    log('MutationObserverによるDOM変更監視を設定しました');
    
    // ページアンロード時にクリーンアップ
    window.addEventListener('beforeunload', () => {
      if (window._directHtmlAnnihilatorObserver) {
        window._directHtmlAnnihilatorObserver.disconnect();
      }
      clearAllTimers();
    });
  }
  
  /**
   * 初期化と実行
   */
  function initialize() {
    log('🔥 月次報告コントロール除去スクリプト初期化');
    
    // 1. 即時実行
    executeAllStrategies();
    
    // 2. 複数のタイミングでスケジュール実行
    scheduleMultipleExecutions();
    
    // 3. 各種イベントリスナーの設定
    setupClickListeners();
    setupNavigationListeners();
    
    // 4. 定期実行の設定
    setupPeriodicExecution();
    
    // 5. DOM変更監視の設定
    setupMutationObserver();
    
    log('初期化完了: すべての除去メカニズムが有効化されました');
  }
  
  // ページの読み込み状態に応じて初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
    log('DOMContentLoadedイベントで初期化予定');
  } else {
    // すでに読み込み完了している場合は即時実行
    initialize();
    log('ページはすでに読み込み済み: 即時初期化実行');
  }
})();