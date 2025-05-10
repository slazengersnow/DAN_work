/**
 * 月次報告の年月選択コントロールを確実に削除する「究極の解決策」
 * 
 * 過去の失敗を教訓とした徹底的なアプローチで実装
 * 複数の手法を同時に継続的に適用する「殲滅的」アプローチ
 * 
 * V2.0の改善点:
 * - React Router変更検出強化
 * - より包括的なCSSセレクタ
 * - インタラクション後の遅延実行強化
 * - スタイルプロパティによる検出精度向上
 * - MutationObserverの最適化
 * 
 * @version FINAL-V2.0
 */
(function() {
  // ロギング設定
  const DEBUG_MODE = true;
  const LOG_PREFIX = '[ULTIMATE-ANNIHILATOR]';
  
  // デバッグログ出力関数
  function log(message, data) {
    if (!DEBUG_MODE) return;
    
    if (data !== undefined) {
      console.log(`${LOG_PREFIX} ${message}`, data);
    } else {
      console.log(`${LOG_PREFIX} ${message}`);
    }
  }
  
  log('▓█▓█▓█ 究極の年月選択コントロール除去ツール起動 █▓█▓█▓');
  
  // 重複実行防止とクリーンアップ
  if (window._ultimateAnnihilatorActive) {
    log('すでに実行中です。リセットして再起動します。');
    // 既存のリソースをクリーンアップ
    try {
      if (window._ultimateAnnihilatorObserver) {
        window._ultimateAnnihilatorObserver.disconnect();
        log('Observer停止完了');
      }
      
      if (window._ultimateAnnihilatorIntervals) {
        window._ultimateAnnihilatorIntervals.forEach(interval => clearInterval(interval));
        log('全Interval停止完了');
      }
      
      if (window._ultimateAnnihilatorTimeouts) {
        window._ultimateAnnihilatorTimeouts.forEach(timeout => clearTimeout(timeout));
        log('全Timeout停止完了');
      }
      
      // スタイル要素を削除
      document.querySelectorAll('style[data-annihilator="true"]').forEach(el => {
        el.parentNode.removeChild(el);
      });
      log('既存のスタイル要素を削除しました');
    } catch (e) {
      log('クリーンアップ中にエラー:', e);
    }
  }
  
  // スクリプト状態の初期化
  window._ultimateAnnihilatorActive = true;
  window._ultimateAnnihilatorIntervals = [];
  window._ultimateAnnihilatorTimeouts = [];
  window._ultimateAnnihilatorTargetsDestroyed = 0;
  window._ultimateAnnihilatorLastRun = Date.now();
  
  /**
   * 提供されたHTMLと完全一致のコントロールを探して削除
   */
  function findAndDestroyExactMatch() {
    log('完全一致セレクタによる検索と削除を実行');
    
    // 正確なHTMLに基づく最も具体的なセレクタ
    const exactSelectors = [
      // 最も具体的なスタイル属性
      'div[style="display: flex; gap: 20px; margin-bottom: 20px; background-color: rgb(248, 249, 250); padding: 10px 15px; border-radius: 4px; border: 1px solid rgb(221, 221, 221);"]',
      // 属性の部分一致
      'div[style*="display: flex"][style*="gap: 20px"][style*="margin-bottom: 20px"][style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px 15px"][style*="border-radius: 4px"][style*="border: 1px solid rgb(221, 221, 221)"]',
      // 部分一致の簡略版
      'div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"]'
    ];
    
    let destroyed = 0;
    
    // 各セレクタで検索
    for (const selector of exactSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        log(`セレクタ [${selector}] で ${elements.length} 個の要素が見つかりました`);
        
        elements.forEach(element => {
          // 年月選択コントロールか最終確認
          if (isMonthlyControlConfirmed(element)) {
            destroyElement(element, 'exact-match');
            destroyed++;
          }
        });
      } catch (e) {
        log(`セレクタ [${selector}] の処理中にエラー:`, e);
      }
    }
    
    return destroyed;
  }
  
  /**
   * 要素が年月選択コントロールであることを確認する最終判定
   */
  function isMonthlyControlConfirmed(element) {
    if (!element || !element.querySelectorAll) return false;
    
    // 内部要素の構成を検証
    const yearLabels = Array.from(element.querySelectorAll('label')).filter(
      label => label.textContent && (
        label.textContent.includes('年度:') || 
        label.textContent.trim() === '年度:'
      )
    );
    
    const monthLabels = Array.from(element.querySelectorAll('label')).filter(
      label => label.textContent && (
        label.textContent.includes('月:') || 
        label.textContent.trim() === '月:'
      )
    );
    
    const selects = element.querySelectorAll('select');
    const updateButtons = Array.from(element.querySelectorAll('button')).filter(
      btn => btn.textContent && btn.textContent.includes('更新')
    );
    
    // 月次ツールバーの特徴を備えているか総合的に判定
    const hasYearLabel = yearLabels.length > 0;
    const hasMonthLabel = monthLabels.length > 0;
    const hasTwoSelects = selects.length >= 2;
    const hasUpdateButton = updateButtons.length > 0;
    
    // チェックリストを実行しポイント計算
    let score = 0;
    if (hasYearLabel) score += 3;
    if (hasMonthLabel) score += 3;
    if (hasTwoSelects) score += 2;
    if (hasUpdateButton) score += 2;
    
    // 除外条件チェック - 重要なものではない
    const isNotEmployeeDetail = !element.closest('[id*="employee"], [class*="employee"]');
    const isNotImportModal = !element.closest('.modal, [role="dialog"]');
    
    if (isNotEmployeeDetail) score += 1;
    if (isNotImportModal) score += 1;
    
    // ボーダーラインポイント = 8
    const isConfirmed = score >= 8;
    
    // デバッグ情報
    if (score > 0) {
      log(`月次コントロール判定: スコア=${score}, 判定=${isConfirmed ? '判定一致' : '除外'}`);
    }
    
    return isConfirmed;
  }
  
  /**
   * 要素を複数の方法で完全に破壊する
   */
  function destroyElement(element, method = 'unknown') {
    if (!element) return false;
    
    try {
      log(`要素を破壊します (method=${method}):`, element);
      
      // 1. 要素を特定したことをマーク
      element.setAttribute('data-annihilator-target', 'true');
      element.setAttribute('data-annihilator-time', Date.now().toString());
      element.setAttribute('data-annihilator-method', method);
      
      // 2. 内部コンテンツを空にする
      element.innerHTML = '';
      
      // 3. イベントリスナーを破棄するためにクローンと置換
      const clone = element.cloneNode(false);
      if (element.parentNode) {
        element.parentNode.replaceChild(clone, element);
      }
      
      // 4. インラインスタイルによる非表示
      clone.style.cssText = `
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
      `;
      
      // 5. データ属性を完全消去
      clone.removeAttribute('class');
      clone.removeAttribute('id');
      clone.removeAttribute('role');
      
      // 6. DOMツリーから物理的に削除
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
      
      // 破壊カウンターを更新
      window._ultimateAnnihilatorTargetsDestroyed++;
      
      // 成功通知
      notifyDestruction();
      
      return true;
    } catch (e) {
      log(`要素破壊中にエラー:`, e);
      return false;
    }
  }
  
  /**
   * 構造的な特性から年月コントロールを検索して破壊
   */
  function findAndDestroyByStructure() {
    log('構造的特性からの検索と破壊を実行');
    let destroyed = 0;
    
    // 1. 子要素の構造からの検索
    try {
      // 年度ラベル + セレクト + 月ラベル + セレクト + 更新ボタンの構造を探す
      const elements = document.querySelectorAll('div > div > label + select, div > div > select + button');
      
      for (const el of elements) {
        const potentialContainer = el.closest('div[style*="display"], div[style*="flex"], div[style*="margin"]');
        if (potentialContainer && isMonthlyControlConfirmed(potentialContainer)) {
          if (destroyElement(potentialContainer, 'structure')) {
            destroyed++;
          }
        }
      }
    } catch (e) {
      log('構造検索中にエラー:', e);
    }
    
    // 2. 年度ラベルからの逆検索
    try {
      const yearLabels = Array.from(document.querySelectorAll('label')).filter(
        label => label.textContent && label.textContent.includes('年度:')
      );
      
      for (const label of yearLabels) {
        // ラベルから親コンテナを探す（最大5階層上まで）
        let container = label.parentElement;
        let depth = 0;
        
        while (container && depth < 5) {
          // このコンテナに月ラベルがあるか
          const hasMonthLabel = Array.from(container.querySelectorAll('label')).some(
            l => l.textContent && l.textContent.includes('月:')
          );
          
          // 更新ボタンがあるか
          const hasUpdateButton = Array.from(container.querySelectorAll('button')).some(
            b => b.textContent && b.textContent.includes('更新')
          );
          
          if (hasMonthLabel && hasUpdateButton && isMonthlyControlConfirmed(container)) {
            if (destroyElement(container, 'year-label-parent')) {
              destroyed++;
              break;
            }
          }
          
          container = container.parentElement;
          depth++;
        }
      }
    } catch (e) {
      log('年度ラベル検索中にエラー:', e);
    }
    
    // 3. 更新ボタンからの検索
    try {
      const updateButtons = Array.from(document.querySelectorAll('button')).filter(
        button => button.textContent && button.textContent.includes('更新')
      );
      
      for (const button of updateButtons) {
        // ボタンから親コンテナを探す
        let container = button.parentElement;
        let depth = 0;
        
        while (container && depth < 5) {
          if (container.querySelectorAll('select').length >= 2 && isMonthlyControlConfirmed(container)) {
            if (destroyElement(container, 'update-button-parent')) {
              destroyed++;
              break;
            }
          }
          
          container = container.parentElement;
          depth++;
        }
      }
    } catch (e) {
      log('更新ボタン検索中にエラー:', e);
    }
    
    // 4. テキストコンテンツによる検索
    try {
      // "年度: 2024, 月: 5" のようなテキストを含む要素を探す
      const yearMonthTexts = Array.from(document.querySelectorAll('div')).filter(div =>
        div.textContent && /年度:\s*\d{4},\s*月:\s*\d{1,2}/.test(div.textContent)
      );
      
      for (const textEl of yearMonthTexts) {
        let container = textEl.parentElement;
        let depth = 0;
        
        while (container && depth < 5) {
          if (container.querySelectorAll('select').length >= 2 && isMonthlyControlConfirmed(container)) {
            if (destroyElement(container, 'year-month-text')) {
              destroyed++;
              break;
            }
          }
          
          container = container.parentElement;
          depth++;
        }
      }
    } catch (e) {
      log('テキスト検索中にエラー:', e);
    }
    
    return destroyed;
  }
  
  /**
   * 全ての発見可能な月次コントロールを検索して破壊
   */
  function findAndDestroyAllMonthlyControls() {
    log('包括的な年月コントロール検索と破壊を開始');
    let totalDestroyed = 0;
    
    // 1. 完全一致による検索と破壊
    totalDestroyed += findAndDestroyExactMatch();
    
    // 2. 構造からの検索と破壊
    totalDestroyed += findAndDestroyByStructure();
    
    log(`合計 ${totalDestroyed} 個の年月コントロールを破壊しました`);
    window._ultimateAnnihilatorLastRun = Date.now();
    
    return totalDestroyed;
  }
  
  /**
   * 絶対的に確実なCSSルールを注入して視覚的に非表示化
   */
  function injectCSSAnnihilator() {
    log('最強の非表示CSSルールを注入');
    
    // すでに注入済みならスキップ
    if (document.querySelector('style[data-annihilator="true"]')) {
      return;
    }
    
    const css = `
      /* 最も具体的なセレクタでの絶対非表示 */
      div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"],
      div[style*="padding: 10px 15px"][style*="border-radius: 4px"][style*="border: 1px solid rgb(221, 221, 221)"],
      div[style*="display: flex"] > div > label[style*="margin-right: 8px"][style*="font-size: 0.9rem"]:first-child + select,
      
      /* ReactコンポーネントClass/IDによる特定 */
      div[class*="monthly"][class*="control"],
      div[class*="year"][class*="month"][class*="selector"],
      div[id*="monthly"][id*="control"],
      div[id*="year"][id*="month"][id*="select"],
      div[class*="filter"][class*="bar"],
      div[class*="toolbar"][class*="date"],
      
      /* 構造的特徴による高度な特定 - モダンブラウザ向け :has() */
      div:has(label:contains("年度:") + select):has(label:contains("月:") + select):has(button:contains("更新")),
      div:has(select + select + button:contains("更新")),
      div:has(> div > label:contains("年度:")):has(> div > label:contains("月:")):has(> button:contains("更新")),
      
      /* 親子構造パターン */
      div:has(> div > label + select + label + select),
      div:has(> div > select + select + button),
      div:has(> label + select):has(> label + select):has(> button),
      
      /* 複合パターン - ラベルとセレクトとボタンの組み合わせ */
      div:has(label[for*="year"]):has(select):has(label[for*="month"]):has(button),
      div:has(div:has(label:contains("年度")) + div:has(label:contains("月"))),
      
      /* 属性による広範な検出 */
      [aria-label*="日付選択"],
      [aria-label*="年月選択"],
      [data-testid*="date-picker"],
      [data-testid*="year-month-select"] {
        display: none !important;
        visibility: hidden !important;
        position: absolute !important;
        left: -9999px !important;
        height: 0 !important;
        width: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
        clip: rect(0, 0, 0, 0) !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        transform: scale(0) !important;
        filter: opacity(0) !important;
        z-index: -9999 !important;
        max-width: 0 !important;
      }
      
      /* ラベル・選択肢関連要素 */
      label:contains("年度:"),
      label:contains("月:"),
      label[for*="year"],
      label[for*="month"] {
        background-color: transparent !important;
      }
      
      /* データ属性でマークされた要素 */
      [data-annihilator-target="true"] {
        display: none !important;
        visibility: hidden !important;
        position: absolute !important;
        left: -9999px !important;
      }
      
      /* CSS変数での上書き - ReactのStyled-componentsで使われる可能性がある変数 */
      :root {
        --monthly-control-display: none !important;
        --year-month-selector-visibility: hidden !important;
        --date-picker-height: 0px !important;
      }
    `;
    
    // スタイル要素を作成して挿入
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.setAttribute('data-annihilator', 'true');
    
    // ブラウザ対応
    if (styleEl.styleSheet) {
      styleEl.styleSheet.cssText = css;
    } else {
      styleEl.appendChild(document.createTextNode(css));
    }
    
    // ドキュメントに追加
    document.head.appendChild(styleEl);
    log('拡張CSS非表示ルールの注入完了');
    
    // CSS Animation対策 - アニメーションを無効化
    const animationBlockerCss = `
      /* アニメーション無効化 - Reactが非表示を上書きするのを防止 */
      @keyframes blockAppearance {
        from, to { opacity: 0 !important; display: none !important; }
      }
      
      /* トランジション無効化 */
      div[style*="display: flex"][style*="gap: 20px"][style*="background-color"],
      div:has(label:contains("年度:") + select) {
        transition: none !important;
        animation: none !important;
      }
    `;
    
    // アニメーションブロッカーの注入
    const animStyleEl = document.createElement('style');
    animStyleEl.type = 'text/css';
    animStyleEl.setAttribute('data-annihilator', 'animation-blocker');
    
    if (animStyleEl.styleSheet) {
      animStyleEl.styleSheet.cssText = animationBlockerCss;
    } else {
      animStyleEl.appendChild(document.createTextNode(animationBlockerCss));
    }
    
    document.head.appendChild(animStyleEl);
    log('アニメーションブロッカーCSSの注入完了');
  }
  
  /**
   * MutationObserverを設定して継続的に監視
   */
  function setupDestructionObserver() {
    log('継続的破壊監視を設定');
    
    // 既存のObserverを切断
    if (window._ultimateAnnihilatorObserver) {
      window._ultimateAnnihilatorObserver.disconnect();
    }
    
    const observer = new MutationObserver(mutations => {
      // デバウンス - 複数変更のバッチ処理
      const now = Date.now();
      if (now - window._ultimateAnnihilatorLastRun < 100) {
        return; // 100ms以内の連続実行を防止
      }
      
      // DOMの変更を分析
      let hasRelevantChanges = false;
      
      for (const mutation of mutations) {
        // 新しく追加されたノードをチェック
        if (mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== 1) continue; // 要素ノードのみ
            
            // ラベルやセレクトが含まれているか
            if (node.querySelectorAll && (
                node.querySelectorAll('label').length > 0 ||
                node.querySelectorAll('select').length > 0 ||
                node.querySelectorAll('button').length > 0
            )) {
              hasRelevantChanges = true;
              break;
            }
            
            // テキストに特徴的な内容が含まれているか
            if (node.textContent && (
                node.textContent.includes('年度:') ||
                node.textContent.includes('月:')
            )) {
              hasRelevantChanges = true;
              break;
            }
          }
        }
        
        // スタイル属性の変更をチェック
        if (!hasRelevantChanges && 
            mutation.type === 'attributes' && 
            mutation.attributeName === 'style') {
          hasRelevantChanges = true;
        }
        
        if (hasRelevantChanges) break;
      }
      
      // 関連する変更があれば破壊を実行
      if (hasRelevantChanges) {
        log('DOM変更を検出: 破壊ロジックを再実行');
        findAndDestroyAllMonthlyControls();
      }
    });
    
    // ドキュメント全体を監視
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-reactid'] // 関連属性のみをフィルタリング
    });
    
    window._ultimateAnnihilatorObserver = observer;
    log('変異監視オブザーバーが設定されました');
    
    return observer;
  }
  
  /**
   * 定期的な再チェックのための複数のインターバルを設定
   */
  function setupMultipleIntervals() {
    log('定期的な再チェックインターバルを設定');
    
    // 既存のインターバルをクリア
    if (window._ultimateAnnihilatorIntervals) {
      window._ultimateAnnihilatorIntervals.forEach(id => clearInterval(id));
      window._ultimateAnnihilatorIntervals = [];
    }
    
    // 1秒ごとの再チェック (10秒間)
    const interval1s = setInterval(() => {
      findAndDestroyAllMonthlyControls();
    }, 1000);
    window._ultimateAnnihilatorIntervals.push(interval1s);
    
    // 10秒後に停止
    setTimeout(() => {
      clearInterval(interval1s);
      log('1秒インターバルを停止しました');
    }, 10000);
    
    // 2秒ごとの再チェック (30秒間)
    const interval2s = setInterval(() => {
      findAndDestroyAllMonthlyControls();
    }, 2000);
    window._ultimateAnnihilatorIntervals.push(interval2s);
    
    // 30秒後に停止
    setTimeout(() => {
      clearInterval(interval2s);
      log('2秒インターバルを停止しました');
    }, 30000);
    
    // 5秒ごとの長期再チェック (無期限)
    const interval5s = setInterval(() => {
      // 月次報告画面が表示されているか確認
      const isMonthlyReportVisible = !!document.querySelector('h1, h2, h3, h4')?.textContent?.includes('月次報告');
      
      if (isMonthlyReportVisible) {
        log('月次報告画面を検出: 5秒ごとの定期チェックで実行');
        findAndDestroyAllMonthlyControls();
      }
    }, 5000);
    window._ultimateAnnihilatorIntervals.push(interval5s);
    
    log('複数の定期チェックインターバルを設定しました');
  }
  
  /**
   * 複数のタイミングで確実に実行するためのタイムアウトを設定
   */
  function setupStaggeredTimeouts() {
    log('段階的なタイムアウト実行をスケジュール');
    
    // 既存のタイムアウトをクリア
    if (window._ultimateAnnihilatorTimeouts) {
      window._ultimateAnnihilatorTimeouts.forEach(id => clearTimeout(id));
      window._ultimateAnnihilatorTimeouts = [];
    }
    
    // 段階的な実行スケジュール (ミリ秒)
    const executionSchedule = [
      100, 300, 500, 800, 1000, 1500, 2000, 3000, 5000, 8000
    ];
    
    // 各タイミングで実行
    executionSchedule.forEach(delay => {
      const timeoutId = setTimeout(() => {
        log(`${delay}ms タイムアウトで破壊実行`);
        findAndDestroyAllMonthlyControls();
      }, delay);
      
      window._ultimateAnnihilatorTimeouts.push(timeoutId);
    });
    
    log('段階的実行がスケジュールされました');
  }
  
  /**
   * イベントリスナーを設定
   */
  function setupEventListeners() {
    log('イベントリスナーを設定');
    
    // クリックイベント
    document.addEventListener('click', e => {
      // タブやボタンのクリック
      if (e.target && (
          e.target.tagName === 'BUTTON' ||
          e.target.classList?.contains('nav-link') ||
          e.target.classList?.contains('nav-item') ||
          e.target.closest?.('button, .nav-link, .nav-item') ||
          e.target.closest?.('a[href]') ||
          e.target.tagName === 'A'
      )) {
        log('UI要素のクリックを検出: 複数のタイミングで破壊実行');
        
        // 複数のタイミングで実行
        const timings = [100, 300, 500, 800, 1200];
        timings.forEach(delay => {
          setTimeout(() => {
            findAndDestroyAllMonthlyControls();
          }, delay);
        });
      }
    });
    
    // スクロールイベント (デバウンス処理)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        log('スクロール後に破壊実行');
        findAndDestroyAllMonthlyControls();
      }, 500);
    });
    
    // React状態変更イベント検知の試み
    window.addEventListener('reactStateChange', () => {
      findAndDestroyAllMonthlyControls();
    });
    
    // popStateイベント (ブラウザの戻る/進むボタン)
    window.addEventListener('popstate', () => {
      log('ナビゲーション変更を検出: 複数のタイミングで破壊実行');
      
      // 複数のタイミングで実行
      [100, 300, 600, 1000, 1500].forEach(delay => {
        setTimeout(() => {
          findAndDestroyAllMonthlyControls();
        }, delay);
      });
    });
    
    // hashchangeイベント (URLハッシュ変更 - React Routerが使用)
    window.addEventListener('hashchange', () => {
      log('URLハッシュ変更を検出: 複数のタイミングで破壊実行');
      
      // 複数のタイミングで実行
      [100, 300, 600, 1000].forEach(delay => {
        setTimeout(() => {
          findAndDestroyAllMonthlyControls();
        }, delay);
      });
    });
    
    // フォーム送信イベント (データ更新の可能性)
    document.addEventListener('submit', () => {
      log('フォーム送信を検出: 後続の更新に備えて破壊実行');
      
      // フォーム送信後のデータ取得時に実行
      [500, 1000, 1500].forEach(delay => {
        setTimeout(() => {
          findAndDestroyAllMonthlyControls();
        }, delay);
      });
    });
    
    // React Router v4-v6のhistoryオブジェクト監視
    try {
      const originalPushState = window.history.pushState;
      window.history.pushState = function() {
        // 元の関数を実行
        const result = originalPushState.apply(this, arguments);
        
        // React Routerのルート変更を検出
        log('React Router変更を検出(pushState): 複数のタイミングで破壊実行');
        [200, 500, 800, 1200, 2000].forEach(delay => {
          setTimeout(() => {
            findAndDestroyAllMonthlyControls();
          }, delay);
        });
        
        return result;
      };
      
      const originalReplaceState = window.history.replaceState;
      window.history.replaceState = function() {
        // 元の関数を実行
        const result = originalReplaceState.apply(this, arguments);
        
        // React Routerのルート変更を検出
        log('React Router変更を検出(replaceState): 複数のタイミングで破壊実行');
        [200, 500, 800, 1200].forEach(delay => {
          setTimeout(() => {
            findAndDestroyAllMonthlyControls();
          }, delay);
        });
        
        return result;
      };
      
      log('React Routerヒストリーフックの設定完了');
    } catch (e) {
      log('React Router検出でエラー:', e);
    }
    
    // URL変更の監視 - MutationObserverを使用
    try {
      let lastUrl = location.href;
      
      // URLの変更を監視する関数
      const checkForUrlChanges = () => {
        if (location.href !== lastUrl) {
          log('URL変更を検出:', location.href);
          lastUrl = location.href;
          
          // URL変更後に複数回実行
          [300, 600, 1000, 1500, 2000, 3000].forEach(delay => {
            setTimeout(() => {
              findAndDestroyAllMonthlyControls();
            }, delay);
          });
        }
      };
      
      // 定期的にURLをチェック
      setInterval(checkForUrlChanges, 1000);
      log('URL変更監視を設定');
    } catch (e) {
      log('URL監視設定エラー:', e);
    }
    
    // DOMContentLoadedイベント
    window.addEventListener('DOMContentLoaded', () => {
      log('DOMContentLoaded: 破壊実行');
      findAndDestroyAllMonthlyControls();
    });
    
    // loadイベント
    window.addEventListener('load', () => {
      log('ページロード完了: 破壊実行');
      findAndDestroyAllMonthlyControls();
      
      // 遅延実行も追加
      setTimeout(() => {
        findAndDestroyAllMonthlyControls();
      }, 1000);
    });
    
    log('拡張イベントリスナーの設定完了');
  }
  
  /**
   * Reactコンポーネントや内部APIを上書きする試み
   * 
   * このJavaScriptハッキング手法はReactの内部APIを使って、
   * コンポーネントのレンダリングをインターセプトし、
   * 月次報告コントロールのレンダリングを検出・無効化します。
   */
  function attemptReactOverrides() {
    log('Reactコンポーネントの上書きを試行');
    
    try {
      // React DevToolsのフックが存在するか確認
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        log('React DevTools Hookを検出');
        
        // Reactインスタンスにアクセスできるか試行
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        
        // レンダリング関数をインターセプト
        if (hook.onCommitFiberRoot) {
          const originalCommit = hook.onCommitFiberRoot;
          hook.onCommitFiberRoot = (...args) => {
            // 元の処理を実行
            const result = originalCommit.apply(hook, args);
            
            // 複数のタイミングでレンダリング後に年月コントロールをチェック
            [50, 150, 300, 500].forEach(delay => {
              setTimeout(() => {
                log(`React更新を検出: ${delay}ms後に破壊実行`);
                findAndDestroyAllMonthlyControls();
              }, delay);
            });
            
            return result;
          };
          log('React更新のインターセプトを設定しました');
        }
        
        // React内部レンダラーフックをインターセプトする試み
        if (hook.renderers && Object.keys(hook.renderers).length > 0) {
          log('Reactレンダラーを検出しました');
          
          // すべてのレンダラーを走査
          for (const key in hook.renderers) {
            const renderer = hook.renderers[key];
            
            if (renderer && typeof renderer.currentDispatcherRef === 'object') {
              log('レンダラーの現在のディスパッチャーを検出');
              
              // ディスパッチャーを監視
              const dispatcherRef = renderer.currentDispatcherRef;
              
              // ディスパッチャーの変更を検知するためのプロキシ設定
              if (dispatcherRef.current && dispatcherRef.current.useState) {
                log('useStateフックを検出しました: オーバーライドを試みます');
                
                // 元のuseStateを保存
                const originalUseState = dispatcherRef.current.useState;
                
                // useStateをオーバーライド
                dispatcherRef.current.useState = function() {
                  // 元の関数を呼び出し
                  const result = originalUseState.apply(this, arguments);
                  
                  // 状態と更新関数を取得
                  const [state, setState] = result;
                  
                  // 更新関数をオーバーライド
                  if (typeof setState === 'function') {
                    return [
                      state,
                      function() {
                        // 元の関数を呼び出し
                        const updateResult = setState.apply(this, arguments);
                        
                        // 状態更新後に年月コントロールをチェック
                        setTimeout(() => {
                          log('React状態更新を検出: 破壊実行');
                          findAndDestroyAllMonthlyControls();
                        }, 100);
                        
                        return updateResult;
                      }
                    ];
                  }
                  
                  return result;
                };
                
                log('useStateフックを正常にオーバーライドしました');
              }
            }
          }
        }
      }
      
      // React 18のConcurrentモード検出
      if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
        log('React内部APIを検出しました');
        
        const internals = window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        
        // 内部APIの監視を試みる
        if (internals.ReactCurrentDispatcher) {
          log('ReactCurrentDispatcherを検出');
          
          // ディスパッチャーの変更を監視
          Object.defineProperty(internals, 'ReactCurrentDispatcher', {
            get: function() {
              return internals._ReactCurrentDispatcher;
            },
            set: function(value) {
              internals._ReactCurrentDispatcher = value;
              
              // ディスパッチャーが変更されたときに年月コントロールをチェック
              setTimeout(() => {
                log('Reactディスパッチャーの変更を検出: 破壊実行');
                findAndDestroyAllMonthlyControls();
              }, 100);
            },
            configurable: true
          });
          
          log('ReactCurrentDispatcherの監視を設定しました');
        }
      }
      
      // 直接的なReact DOMへの注入を試みる
      if (window.ReactDOM && window.ReactDOM.render) {
        const originalRender = window.ReactDOM.render;
        
        window.ReactDOM.render = function() {
          // 元のレンダリング関数を呼び出し
          const result = originalRender.apply(this, arguments);
          
          // レンダリング後に年月コントロールをチェック
          setTimeout(() => {
            log('ReactDOM.renderを検出: 破壊実行');
            findAndDestroyAllMonthlyControls();
          }, 100);
          
          return result;
        };
        
        log('ReactDOM.renderをオーバーライドしました');
      }
      
      // React 18のcreateRootメソッドが存在するか確認
      if (window.ReactDOM && window.ReactDOM.createRoot) {
        const originalCreateRoot = window.ReactDOM.createRoot;
        
        window.ReactDOM.createRoot = function() {
          // 元の関数を呼び出し
          const root = originalCreateRoot.apply(this, arguments);
          
          // オリジナルのrenderメソッドを保存
          const originalRootRender = root.render;
          
          // renderメソッドを上書き
          root.render = function() {
            // 元のレンダリング関数を呼び出し
            const result = originalRootRender.apply(this, arguments);
            
            // レンダリング後に年月コントロールをチェック
            setTimeout(() => {
              log('ReactDOM.createRoot.renderを検出: 破壊実行');
              findAndDestroyAllMonthlyControls();
            }, 100);
            
            return result;
          };
          
          return root;
        };
        
        log('ReactDOM.createRootをオーバーライドしました');
      }
    } catch (e) {
      log('React上書き中にエラー:', e);
    }
  }
  
  /**
   * 視覚的なフィードバックと通知を表示
   */
  function notifyDestruction() {
    if (!DEBUG_MODE) return;
    
    // 実行回数をインクリメント
    window._ultimateAnnihilatorExecutionCount = (window._ultimateAnnihilatorExecutionCount || 0) + 1;
    
    // すでに通知要素があれば更新
    let notificationEl = document.querySelector('#annihilator-notification');
    
    if (!notificationEl) {
      // 通知要素を作成
      notificationEl = document.createElement('div');
      notificationEl.id = 'annihilator-notification';
      notificationEl.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background-color: rgba(40, 40, 50, 0.9);
        color: white;
        padding: 10px 15px;
        border-radius: 6px;
        font-size: 13px;
        font-family: sans-serif;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 5px;
        max-width: 300px;
      `;
      document.body.appendChild(notificationEl);
      
      // カウンターとステータスの表示要素
      const counterEl = document.createElement('div');
      counterEl.id = 'annihilator-counter';
      counterEl.style.cssText = `
        display: flex;
        justify-content: space-between;
        font-weight: bold;
      `;
      notificationEl.appendChild(counterEl);
      
      // 最後の動作の時間表示要素
      const timeEl = document.createElement('div');
      timeEl.id = 'annihilator-timestamp';
      timeEl.style.cssText = `
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
      `;
      notificationEl.appendChild(timeEl);
      
      // アイコンの追加
      const iconEl = document.createElement('div');
      iconEl.id = 'annihilator-icon';
      iconEl.style.cssText = `
        position: absolute;
        top: -8px;
        left: -8px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #f44336;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
      `;
      iconEl.textContent = 'X';
      notificationEl.appendChild(iconEl);
      
      // クリックで非表示にするイベントリスナー
      notificationEl.addEventListener('click', () => {
        notificationEl.style.opacity = '0';
        setTimeout(() => {
          if (notificationEl.parentNode) {
            notificationEl.parentNode.removeChild(notificationEl);
          }
        }, 300);
      });
      
      // 情報のヘルプテキスト
      const helpText = document.createElement('div');
      helpText.style.cssText = `
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 4px;
      `;
      helpText.textContent = 'クリックで非表示';
      notificationEl.appendChild(helpText);
    }
    
    // カウンター要素を取得
    const counterEl = document.getElementById('annihilator-counter');
    const timeEl = document.getElementById('annihilator-timestamp');
    
    if (counterEl) {
      counterEl.innerHTML = `
        <span>除去: ${window._ultimateAnnihilatorTargetsDestroyed}</span>
        <span>実行: ${window._ultimateAnnihilatorExecutionCount}</span>
      `;
    }
    
    if (timeEl) {
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      timeEl.textContent = `最終更新: ${timeStr}`;
    }
    
    // パルスアニメーション効果
    const iconEl = document.getElementById('annihilator-icon');
    if (iconEl) {
      iconEl.style.transform = 'scale(1.5)';
      setTimeout(() => {
        iconEl.style.transform = 'scale(1)';
      }, 300);
    }
    
    // 通知を表示して自動的にフェードアウト
    notificationEl.style.opacity = '1';
    
    // 一定時間後に自動的に非表示
    clearTimeout(window._ultimateAnnihilatorNotificationTimeout);
    window._ultimateAnnihilatorNotificationTimeout = setTimeout(() => {
      notificationEl.style.opacity = '0.2';
    }, 3000);
    
    // 視覚効果: 削除した要素の位置に一時的なフラッシュエフェクト
    if (window._ultimateAnnihilatorTargetsDestroyed > 0) {
      showDestructionEffect();
    }
  }
  
  /**
   * 削除操作の視覚的フィードバックを表示
   */
  function showDestructionEffect() {
    // 月次レポートコンテナ位置の推定
    const reportContainers = document.querySelectorAll('.container, .main-content, main, [class*="report"], [class*="monthly"]');
    
    if (reportContainers.length > 0) {
      // コンテナ内で一番ありそうな位置を選択
      const container = reportContainers[0];
      const rect = container.getBoundingClientRect();
      
      // エフェクト要素の作成
      const effectEl = document.createElement('div');
      effectEl.style.cssText = `
        position: fixed;
        top: ${rect.top + 50}px;
        left: ${rect.left + (rect.width / 2) - 50}px;
        width: 300px;
        height: 60px;
        background-color: rgba(255, 30, 30, 0.2);
        border-radius: 4px;
        pointer-events: none;
        z-index: 9998;
        animation: destructionFlash 1s forwards;
      `;
      
      // アニメーションスタイルの追加
      const animStyle = document.createElement('style');
      animStyle.textContent = `
        @keyframes destructionFlash {
          0% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1); }
        }
      `;
      document.head.appendChild(animStyle);
      
      // ドキュメントに追加
      document.body.appendChild(effectEl);
      
      // アニメーション終了後に削除
      setTimeout(() => {
        if (effectEl.parentNode) {
          effectEl.parentNode.removeChild(effectEl);
        }
        if (animStyle.parentNode) {
          animStyle.parentNode.removeChild(animStyle);
        }
      }, 1000);
    }
  }
  
  /**
   * すべての破壊戦略を実行
   */
  function executeCompleteAnnihilation() {
    log('完全殲滅プロトコルを開始');
    
    // 1. CSS注入による視覚的な非表示 (最速の対応)
    injectCSSAnnihilator();
    
    // 2. DOMベースの破壊
    findAndDestroyAllMonthlyControls();
    
    // 3. Reactオーバーライド試行
    attemptReactOverrides();
    
    log('殲滅プロトコル実行完了');
  }
  
  /**
   * 初期化と実行
   */
  function initialize() {
    log('▓█▓ 究極の年月選択コントロール除去ツールの初期化を開始 ▓█▓');
    
    // 1. 即時実行
    executeCompleteAnnihilation();
    
    // 2. 継続的な監視を設定
    setupDestructionObserver();
    
    // 3. 定期的なチェックを設定
    setupMultipleIntervals();
    
    // 4. 段階的な実行をスケジュール
    setupStaggeredTimeouts();
    
    // 5. イベントリスナーを設定
    setupEventListeners();
    
    // 6. 視覚的なマーカーを追加
    const markerEl = document.createElement('div');
    markerEl.style.display = 'none';
    markerEl.setAttribute('data-annihilator-version', 'ULTIMATE-FINAL');
    markerEl.setAttribute('data-annihilator-initialized', Date.now().toString());
    document.body.appendChild(markerEl);
    
    log('▓█▓█▓ 初期化完了: すべての破壊プロトコルが有効です ▓█▓█▓');
  }
  
  // ページの状態に応じて初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
    log('DOMContentLoadedイベントで初期化予定');
    
    // 安全策として少し遅延した実行も追加
    setTimeout(initialize, 500);
  } else {
    initialize();
    log('ページはすでに読み込み済み: 即時初期化実行');
  }
})();