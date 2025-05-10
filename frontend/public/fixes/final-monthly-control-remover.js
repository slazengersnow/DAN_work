/**
 * 月次報告の年度・月選択部分を完全に削除する最終解決スクリプト
 * 
 * 削除対象:
 * 1. 「年度: [2025▼]」というドロップダウン
 * 2. 「月: [5月▼]」というドロップダウン 
 * 3. 「更新」ボタン
 * 4. これらを含む親コンテナ全体
 * 
 * 3つの削除方法を同時に適用:
 * - HTML直接書き換え
 * - DOM要素の直接削除
 * - 継続的な監視と削除
 * 
 * @version FINAL-SOLUTION-1.0
 */
(function() {
  // デバッグ設定
  const DEBUG = true;
  const LOG_PREFIX = '[FINAL-REMOVER]';
  
  // ログ出力関数
  function log(...args) {
    if (DEBUG) {
      console.log(LOG_PREFIX, ...args);
    }
  }
  
  log('🔴 月次報告コントロール最終削除スクリプト実行開始');
  
  // 既存実行のクリーンアップ
  if (window._monthlyControlRemoverActive) {
    log('既存の実行をクリーンアップ');
    if (window._monthlyControlRemoverInterval) {
      clearInterval(window._monthlyControlRemoverInterval);
    }
    if (window._monthlyControlMutationObserver) {
      window._monthlyControlMutationObserver.disconnect();
    }
  }
  
  // グローバル変数を初期化
  window._monthlyControlRemoverActive = true;
  window._monthlyControlRemovedCount = 0;
  
  /**
   * 方法1: HTML直接書き換えによる削除
   */
  function removeByDirectHtmlReplacement() {
    log('方法1: HTML直接書き換えによる削除を実行');
    
    try {
      // パフォーマンスのため対象コンテナを特定
      const containers = [
        ...document.querySelectorAll('.container, .content, main, [class*="container"], [class*="monthly"]'),
        document.body // フォールバック
      ];
      
      // HTML置換パターン
      const patterns = [
        // パターン1: 年度と月を含むflexコンテナ
        /<div[^>]*>(.*?年度:.*?月:.*?更新.*?)<\/div>/gs,
        
        // パターン2: よりマッチしやすい別のパターン
        /<div[^>]*style="[^"]*display:\s*flex[^"]*"[^>]*>([^<]*年度[^<]*月[^<]*更新[^<]*)<\/div>/gs,
        
        // パターン3: 背景色と丸みを持つコンテナ
        /<div[^>]*style="[^"]*background-color:\s*rgb\(248,\s*249,\s*250\)[^"]*border-radius[^"]*"[^>]*>([^<]*年度.*?月.*?更新.*?)<\/div>/gs
      ];
      
      // 各コンテナに対してパターン置換を実行
      let replacementCount = 0;
      
      containers.forEach(container => {
        if (!container) return;
        
        // 元のHTML
        const originalHtml = container.innerHTML;
        let modifiedHtml = originalHtml;
        
        // 各パターンで置換
        patterns.forEach(pattern => {
          modifiedHtml = modifiedHtml.replace(pattern, (match) => {
            replacementCount++;
            log(`パターンマッチ: ${match.substring(0, 50)}...`);
            return '<!-- 月次報告コントロール削除済み -->';
          });
        });
        
        // 変更があれば適用
        if (modifiedHtml !== originalHtml) {
          log(`コンテナのHTMLを書き換え: ${replacementCount}個のパターンを置換`);
          container.innerHTML = modifiedHtml;
          window._monthlyControlRemovedCount += replacementCount;
        }
      });
      
      return replacementCount;
    } catch (e) {
      log('HTML書き換え中にエラー:', e);
      return 0;
    }
  }
  
  /**
   * 方法2: DOM要素の直接探索と削除
   */
  function removeByDirectDomManipulation() {
    log('方法2: DOM直接操作による削除を実行');
    
    try {
      // 年度と月のラベルを両方含む要素を探す
      const containers = Array.from(document.querySelectorAll('div')).filter(div => {
        // すでに削除済みの要素をスキップ
        if (!document.body.contains(div)) return false;
        
        // 年度と月のラベルを両方含む要素を探す
        const hasYearText = div.textContent.includes('年度:') || div.textContent.includes('年度');
        const hasMonthText = div.textContent.includes('月:') || div.textContent.includes('月');
        const hasUpdateButton = div.querySelector('button')?.textContent?.includes('更新') || false;
        const hasSelects = div.querySelectorAll('select').length >= 2;
        
        return hasYearText && hasMonthText && (hasUpdateButton || hasSelects);
      });
      
      log(`DOM検索: ${containers.length}個の候補要素を発見`);
      
      // 検出した要素を削除
      let removedCount = 0;
      
      containers.forEach(container => {
        if (container.parentNode) {
          // デバッグ用にマーク
          container.setAttribute('data-removed-by', 'final-monthly-control-remover');
          
          // 物理的に削除
          container.parentNode.removeChild(container);
          removedCount++;
          window._monthlyControlRemovedCount++;
          
          log('月次報告コントロールを完全に削除しました:', container);
        }
      });
      
      return removedCount;
    } catch (e) {
      log('DOM操作中にエラー:', e);
      return 0;
    }
  }
  
  /**
   * 方法3: スタイル計算に基づく要素検出と削除
   */
  function removeByComputedStyle() {
    log('方法3: スタイル計算による削除を実行');
    
    try {
      // すべてのflex要素をチェック
      const flexElements = Array.from(document.querySelectorAll('div')).filter(el => {
        if (!document.body.contains(el)) return false;
        
        const computedStyle = window.getComputedStyle(el);
        return computedStyle.display === 'flex' || computedStyle.display === 'inline-flex';
      });
      
      log(`${flexElements.length}個のflex要素を検出`);
      
      let removedCount = 0;
      
      // 各flex要素をチェック
      for (const el of flexElements) {
        // 年度と月のテキストを含むか確認
        if (el.textContent.includes('年度:') && el.textContent.includes('月:')) {
          // 更新ボタンを含む親要素まで遡る
          let target = el;
          let depth = 0;
          let found = false;
          
          // 自身か親要素に更新ボタンがあるか検索
          while (target && depth < 3) {
            if (target.querySelector('button')?.textContent?.includes('更新')) {
              found = true;
              break;
            }
            
            // より範囲を広げて検索
            if (target.parentElement && 
                target.parentElement.querySelector('button')?.textContent?.includes('更新')) {
              target = target.parentElement;
              found = true;
              break;
            }
            
            target = target.parentElement;
            depth++;
          }
          
          // 対象要素を発見したら削除
          if (found && target && target.parentNode) {
            // デバッグ用にマーク
            target.setAttribute('data-removed-by', 'computed-style-removal');
            
            // 物理的に削除
            target.parentNode.removeChild(target);
            removedCount++;
            window._monthlyControlRemovedCount++;
            
            log('スタイル計算で月次報告コントロールを削除しました');
          }
        }
      }
      
      return removedCount;
    } catch (e) {
      log('スタイル計算による削除中にエラー:', e);
      return 0;
    }
  }
  
  /**
   * テキストノードを直接探索して親要素を削除
   */
  function removeByTextNodeWalker() {
    log('方法4: テキストノード探索による削除を実行');
    
    try {
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
        if (text.includes('年度:') || text.includes('月:')) {
          let parent = textNode.parentNode;
          let depth = 0;
          
          // フレックスコンテナを見つける
          while (parent && parent !== document.body && depth < 5) {
            try {
              const style = window.getComputedStyle(parent);
              
              // 複合条件でマッチングを試みる
              const isFlexContainer = 
                style.display === 'flex' || 
                style.display === 'inline-flex';
              
              // 親要素のテキスト内容をチェック
              const parentText = parent.textContent || '';
              const hasYearAndMonth = 
                parentText.includes('年度') && 
                parentText.includes('月') &&
                parentText.includes('更新');
              
              // 条件に一致したら対象に追加
              if (isFlexContainer && hasYearAndMonth) {
                if (!targetsToRemove.some(el => el === parent)) {
                  targetsToRemove.push(parent);
                  log('テキストノードから月次コントロールを特定:', parent);
                }
                break;
              }
            } catch (e) {
              // 一部の要素でエラーが発生する場合があるためスキップ
            }
            
            parent = parent.parentNode;
            depth++;
          }
        }
      }
      
      // 特定した要素を物理的に削除
      let removedCount = 0;
      
      targetsToRemove.forEach(element => {
        try {
          if (element && element.parentNode) {
            // デバッグ用にマーク
            element.setAttribute('data-removed-by', 'text-walker-removal');
            
            // 物理的に削除
            element.parentNode.removeChild(element);
            removedCount++;
            window._monthlyControlRemovedCount++;
          }
        } catch (e) {
          log('要素削除中にエラー:', e);
        }
      });
      
      log(`テキストノード探索により ${removedCount} 個の要素を削除しました`);
      return removedCount;
    } catch (e) {
      log('テキストノード探索中にエラー:', e);
      return 0;
    }
  }
  
  /**
   * すべての削除方法を実行
   */
  function executeAllRemovalMethods() {
    log('全ての削除方法を実行');
    
    const results = {
      htmlReplacement: removeByDirectHtmlReplacement(),
      domManipulation: removeByDirectDomManipulation(),
      computedStyle: removeByComputedStyle(),
      textWalker: removeByTextNodeWalker()
    };
    
    const totalRemoved = 
      results.htmlReplacement + 
      results.domManipulation + 
      results.computedStyle +
      results.textWalker;
    
    if (totalRemoved > 0) {
      log(`合計 ${totalRemoved} 個の月次コントロールを削除しました`, results);
      showNotification(totalRemoved);
    }
    
    return totalRemoved;
  }
  
  /**
   * 通知を表示
   */
  function showNotification(count) {
    // 既存の通知を探す
    let notificationEl = document.getElementById('monthly-control-notification');
    
    if (!notificationEl) {
      // 新規作成
      notificationEl = document.createElement('div');
      notificationEl.id = 'monthly-control-notification';
      notificationEl.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background-color: rgba(50, 50, 50, 0.85);
        color: white;
        font-size: 12px;
        padding: 8px 12px;
        border-radius: 4px;
        z-index: 9999;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(notificationEl);
    }
    
    // 通知内容を更新
    notificationEl.textContent = `${window._monthlyControlRemovedCount}個の月次コントロールを削除しました`;
    
    // 表示して徐々に消す
    notificationEl.style.opacity = '1';
    setTimeout(() => {
      notificationEl.style.opacity = '0';
    }, 2000);
  }
  
  /**
   * MutationObserverで継続監視
   */
  function setupMutationObserver() {
    log('MutationObserverを設定');
    
    // 監視設定
    const observer = new MutationObserver(mutations => {
      let shouldRemove = false;
      
      // 関連する変更かチェック
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== 1) continue;
            
            // 追加されたノードに年度/月の文字が含まれているか
            if (node.textContent?.includes('年度') || 
                node.textContent?.includes('月:')) {
              shouldRemove = true;
              break;
            }
          }
        }
        
        if (shouldRemove) break;
      }
      
      // 関連する変更があれば再度削除実行
      if (shouldRemove) {
        log('DOM変更を検出: 削除メソッドを再実行');
        setTimeout(() => {
          executeAllRemovalMethods();
        }, 100);
      }
    });
    
    // ドキュメント全体を監視
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
    
    // グローバル参照を保存
    window._monthlyControlMutationObserver = observer;
  }
  
  /**
   * イベントリスナーを設定
   */
  function setupEventListeners() {
    // クリックイベント後に再チェック
    document.addEventListener('click', () => {
      setTimeout(() => {
        executeAllRemovalMethods();
      }, 300);
    });
    
    // URLやハッシュの変更を検出
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        executeAllRemovalMethods();
      }, 300);
    });
    
    window.addEventListener('hashchange', () => {
      setTimeout(() => {
        executeAllRemovalMethods();
      }, 300);
    });
  }
  
  /**
   * CSSによる視覚的非表示も追加
   */
  function injectBlockingCSS() {
    // すでに挿入済みならスキップ
    if (document.getElementById('monthly-control-remover-css')) {
      return;
    }
    
    const css = `
      /* 月次コントロール用CSS */
      div:has(label:contains("年度:")):has(label:contains("月:")):has(button:contains("更新")),
      div:has(> div > label:contains("年度")):has(> div > label:contains("月")):has(button:contains("更新")),
      div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
      }
    `;
    
    const style = document.createElement('style');
    style.id = 'monthly-control-remover-css';
    style.textContent = css;
    document.head.appendChild(style);
    
    log('ブロッキングCSSを注入しました');
  }
  
  /**
   * 定期的に実行するインターバルを設定
   */
  function setupInterval() {
    log('定期実行インターバルを設定');
    
    // 1秒ごとに実行するインターバル
    const interval = setInterval(() => {
      // 月次報告画面と思われる場合のみ実行
      const isMonthlyReportPage = 
        document.querySelector('h1, h2, h3, h4')?.textContent?.includes('月次報告') ||
        location.pathname.includes('monthly') ||
        location.href.includes('report');
      
      if (isMonthlyReportPage) {
        executeAllRemovalMethods();
      }
    }, 1000);
    
    // グローバル参照を保存
    window._monthlyControlRemoverInterval = interval;
  }
  
  /**
   * 初期化と実行
   */
  function initialize() {
    log('🔴 月次コントロール最終削除スクリプト初期化');
    
    // 1. CSSによる視覚的非表示を即座に適用
    injectBlockingCSS();
    
    // 2. 各削除方法を実行
    executeAllRemovalMethods();
    
    // 3. 継続的な監視と削除を設定
    setupMutationObserver();
    setupInterval();
    setupEventListeners();
    
    // 4. 複数のタイミングで遅延実行
    const delays = [100, 500, 1000, 2000];
    delays.forEach(delay => {
      setTimeout(() => {
        executeAllRemovalMethods();
      }, delay);
    });
    
    log('初期化完了: すべての削除メカニズムが稼働中');
  }
  
  // ページの読み込み状態に応じて初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();