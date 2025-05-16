// 月次報告画面の年度・月表示を強制的に非表示にするスクリプト（エラー修正版）
(function() {
  console.log('年度・月表示の強制非表示スクリプト（エラー修正版）を実行開始');
  
  // グローバル変数を初期化（エラー回避）
  window._yearMonthObservers = window._yearMonthObservers || [];
  
  // 古いオブザーバーを停止（メモリリークと重複実行の防止）
  function stopExistingObservers() {
    if (Array.isArray(window._yearMonthObservers)) {
      window._yearMonthObservers.forEach(observer => {
        try {
          if (observer && typeof observer.disconnect === 'function') {
            observer.disconnect();
            console.log('既存のオブザーバーを停止しました');
          }
        } catch (e) {
          console.warn('オブザーバー停止中にエラーが発生しました', e);
        }
      });
      window._yearMonthObservers = [];
    }
  }

  // 既存のオブザーバーを停止
  stopExistingObservers();
  
  // 以前の実装を無効化
  if (typeof window.hideYearMonthElements === 'function') {
    window._originalHideFunction = window.hideYearMonthElements;
    window.hideYearMonthElements = function() {
      return forceHideYearMonth();
    };
  }

  // デバッグカウンター
  let executionCount = 0;
  
  // 直接非表示にする関数
  function forceHideYearMonth() {
    try {
      executionCount++;
      
      // 1. 月次報告画面かどうかを確認
      let isMonthlyReport = false;
      try {
        isMonthlyReport = 
          window.location.pathname.includes('monthly-report') || 
          Array.from(document.querySelectorAll('h1, h2')).some(el => 
            el.textContent && (el.textContent.includes('月次報告') || el.textContent.includes('月次詳細'))
          );
      } catch (e) {
        console.warn('画面検出エラー:', e);
        // エラーが発生した場合は安全策としてtrueを返す
        isMonthlyReport = true;
      }

      if (!isMonthlyReport) {
        if (executionCount % 20 === 0) {
          console.log('月次報告画面が検出されないため、非表示処理をスキップします');
        }
        return false;
      }

      if (executionCount % 10 === 0) {
        console.log(`月次報告画面を検出しました - 年度・月表示の非表示化を実行 (${executionCount}回目)`);
      }
      
      // 2. 複数の方法で年度・月表示を特定して非表示にする
      let elementsHidden = 0;
      
      // 方法A: 特定のクラス名で検索 - より包括的なセレクタを使用
      const classSelectors = [
        '.yearMonthDisplay',
        '.yearMonthSection',
        '.filterSection',
        '.year-month-selector',
        '.year-selector',
        '.month-selector',
        '[class*="yearMonth"]',
        '[class*="YearMonth"]',
        '[class*="Year-Month"]',
        '[class*="year-month"]',
        '[class*="filter"]:not(.tabsContainer):not(.ant-tabs):not(.ant-tabs-content):not(.ant-tabs-nav):not([class*="tabContent"])'
      ];
      
      // 方法B: 特定の文字列を含む要素を検索
      function containsYearMonthText(element) {
        try {
          const text = element.textContent || '';
          return (
            (text.includes('年度') || text.includes('年')) && 
            (text.includes('月') || text.match(/\d+月/))
          );
        } catch (e) {
          console.warn('テキスト検出エラー:', e);
          return false;
        }
      }
      
      // 方法C: h1/h2要素の直後の要素を検索
      try {
        const headingElements = document.querySelectorAll('h1, h2');
        headingElements.forEach(headingEl => {
          if (headingEl.textContent && (headingEl.textContent.includes('月次報告') || headingEl.textContent.includes('月次詳細'))) {
            const nextElements = [];
            let nextElement = headingEl.nextElementSibling;
            
            // 見出しの次の3つの要素を候補に追加
            for (let i = 0; i < 3 && nextElement; i++) {
              nextElements.push(nextElement);
              nextElement = nextElement.nextElementSibling;
            }
            
            // 年度・月を含む要素を非表示
            nextElements.forEach(el => {
              if (el && (containsYearMonthText(el) || el.querySelector('select'))) {
                try {
                  if (el.style && el.style.display !== 'none') {
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                    el.style.height = '0';
                    el.style.overflow = 'hidden';
                    el.style.margin = '0';
                    el.style.padding = '0';
                    el.setAttribute('data-hidden-by-script', 'true');
                    elementsHidden++;
                  }
                } catch (e) {
                  console.warn('要素スタイル変更エラー:', e);
                }
              }
            });
          }
        });
      } catch (e) {
        console.warn('見出し後要素処理エラー:', e);
      }
      
      // クラスセレクタによる非表示化
      classSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            try {
              if (el.style && el.style.display !== 'none') {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.height = '0';
                el.style.overflow = 'hidden';
                el.setAttribute('data-hidden-by-script', 'true');
                elementsHidden++;
              }
            } catch (e) {
              console.warn(`要素スタイル変更エラー (${selector}):`, e);
            }
          });
        } catch (e) {
          // セレクタが無効な場合はスキップ
          console.warn(`セレクタエラー (${selector}):`, e);
        }
      });
      
      // 方法D: セレクタを含む要素を検索
      try {
        document.querySelectorAll('select, .ant-select').forEach(select => {
          try {
            // セレクタの親要素をたどる
            let parent = select.parentElement;
            for (let i = 0; i < 4 && parent; i++) { // 最大4階層まで遡る
              if (
                containsYearMonthText(parent) || 
                (parent.querySelector('label') && containsYearMonthText(parent.querySelector('label')))
              ) {
                // 年度・月を含む親要素を見つけた場合、その要素を非表示
                if (parent.style && parent.style.display !== 'none') {
                  parent.style.display = 'none';
                  parent.style.visibility = 'hidden';
                  parent.style.height = '0';
                  parent.style.overflow = 'hidden';
                  parent.setAttribute('data-hidden-by-script', 'true');
                  elementsHidden++;
                  
                  // もう一段階上の親も確認（コンテナの可能性）
                  if (parent.parentElement) {
                    try {
                      // 兄弟要素に「更新」ボタンなどがあれば、親全体を非表示
                      if (
                        parent.parentElement.querySelector('button') || 
                        Array.from(parent.parentElement.children).length <= 3
                      ) {
                        parent.parentElement.style.display = 'none';
                        parent.parentElement.style.visibility = 'hidden';
                        parent.parentElement.style.height = '0';
                        parent.parentElement.style.overflow = 'hidden';
                        parent.parentElement.setAttribute('data-hidden-by-script', 'true');
                        elementsHidden++;
                      }
                    } catch (e) {
                      console.warn('親要素処理エラー:', e);
                    }
                  }
                }
                break;
              }
              parent = parent.parentElement;
            }
          } catch (e) {
            console.warn('セレクタ処理エラー:', e);
          }
        });
      } catch (e) {
        console.warn('セレクタ検索エラー:', e);
      }
      
      // 方法E: 「年度」「月」ラベルを持つ要素を検索
      try {
        document.querySelectorAll('label').forEach(label => {
          try {
            if (
              label.textContent && (
                label.textContent.includes('年度') || 
                label.textContent.includes('月')
              )
            ) {
              // ラベルの親要素を最大3階層まで遡り、適切なコンテナを非表示
              let parent = label.parentElement;
              for (let i = 0; i < 3 && parent; i++) {
                if (parent.style && parent.style.display !== 'none') {
                  parent.style.display = 'none';
                  parent.style.visibility = 'hidden';
                  parent.style.height = '0';
                  parent.style.overflow = 'hidden';
                  parent.setAttribute('data-hidden-by-script', 'true');
                  elementsHidden++;
                  
                  // コンテナが見つかった場合は終了
                  if (
                    parent.classList && (
                      parent.classList.contains('container') || 
                      parent.classList.contains('section') || 
                      parent.classList.contains('filterSection')
                    )
                  ) {
                    break;
                  }
                }
                parent = parent.parentElement;
              }
            }
          } catch (e) {
            console.warn('ラベル処理エラー:', e);
          }
        });
      } catch (e) {
        console.warn('ラベル検索エラー:', e);
      }

      // 方法F: div要素で年度・月の単語を含むものを検索
      try {
        document.querySelectorAll('div').forEach(div => {
          try {
            if (
              div.style && 
              div.style.display !== 'none' && 
              containsYearMonthText(div) && 
              // タブ関連要素は除外
              !(div.querySelector && div.querySelector('.ant-tabs')) && 
              !(div.classList && div.classList.contains('ant-tabs-content')) && 
              !(div.classList && div.classList.contains('tabsContainer')) && 
              !(div.classList && div.classList.contains('monthly-tab'))
            ) {
              div.style.display = 'none';
              div.style.visibility = 'hidden';
              div.style.height = '0';
              div.style.overflow = 'hidden';
              div.setAttribute('data-hidden-by-script', 'true');
              elementsHidden++;
            }
          } catch (e) {
            // 個別の要素処理中のエラーは無視（すべてのdiv要素に対して処理するため）
          }
        });
      } catch (e) {
        console.warn('div検索エラー:', e);
      }
      
      // 3. タブエリアは確実に表示
      const tabSelectors = [
        '.monthly-tabs-area',
        '.monthly-tab',
        '.tabsContainer',
        '.tabs-container',
        '.nav.nav-tabs',
        '.ant-tabs',
        '.ant-tabs-content',
        '.ant-tabs-nav',
        '.ant-tabs-tab',
        '.ant-tabs-tabpane',
        '[data-tab-container="true"]',
        '[data-role="monthly-tabs"]',
        '[data-tab-content]',
        '[role="tablist"]',
        '[role="tab"]',
        '[role="tabpanel"]',
        '.tab-content',
        '.tab-pane',
        '#monthly-report-tabs',
        '#secure-tabs-area'
      ];
      
      try {
        tabSelectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(el => {
              if (el instanceof HTMLElement) {
                el.style.display = '';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
                el.style.height = 'auto';
                el.style.overflow = 'visible';
                el.removeAttribute('data-hidden-by-script');
                
                // タブの表示モードを適切に設定
                if (selector.includes('ant-tabs') || 
                    selector.includes('tabs-container') || 
                    selector.includes('tabsContainer')) {
                  el.style.display = 'block';
                } else if (selector === '.nav.nav-tabs' || 
                           selector === '[role="tablist"]') {
                  el.style.display = 'flex';
                } else if (selector.includes('[role="tab"]') || 
                           selector.includes('ant-tabs-tab')) {
                  el.style.display = 'inline-block';
                }
                
                // アクティブなタブパネルを表示
                if ((selector.includes('tabpane') || 
                     selector.includes('tab-pane') || 
                     selector === '[role="tabpanel"]') && 
                    el.classList.contains('active')) {
                  el.style.display = 'block';
                }
              }
            });
          } catch (e) {
            console.warn(`タブセレクタエラー (${selector}):`, e);
          }
        });
      } catch (e) {
        console.warn('タブ表示処理エラー:', e);
      }

      // 4. 非表示にした要素があるか確認
      if (executionCount % 10 === 0) {
        if (elementsHidden > 0) {
          console.log(`年度・月表示の非表示化完了: ${elementsHidden}個の要素を非表示にしました`);
        } else {
          console.log('年度・月表示が見つかりませんでした');
        }
      }
      
      return elementsHidden > 0;
    } catch (e) {
      console.error('非表示処理中に重大なエラーが発生しました:', e);
      return false;
    }
  }
  
  // ページロード時に実行
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', forceHideYearMonth);
    } else {
      forceHideYearMonth();
    }
    
    // 少し遅延して複数回実行（非同期読み込みのための対策）
    setTimeout(forceHideYearMonth, 500);
    setTimeout(forceHideYearMonth, 1000);
    setTimeout(forceHideYearMonth, 2000);
  } catch (e) {
    console.error('初期実行中にエラーが発生しました:', e);
  }
  
  // MutationObserverで継続的に監視（エラーハンドリング強化）
  try {
    const observer = new MutationObserver((mutations) => {
      try {
        let shouldCheck = false;
        
        // DOM変更を確認
        for (const mutation of mutations) {
          if (
            mutation.type === 'childList' || 
            (mutation.type === 'attributes' && 
             mutation.attributeName && 
             ['class', 'style'].includes(mutation.attributeName))
          ) {
            shouldCheck = true;
            break;
          }
        }
        
        if (shouldCheck) {
          forceHideYearMonth();
        }
      } catch (e) {
        console.warn('MutationObserverコールバックエラー:', e);
      }
    });
    
    // bodyが存在することを確認してから監視
    if (document.body) {
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-hidden-by-script']
      });
      window._yearMonthObservers.push(observer);
      console.log('DOM監視を開始しました');
    } else {
      console.warn('body要素が見つからないため、監視を開始できません');
      
      // bodyが後から読み込まれる場合に対応
      const bodyObserver = new MutationObserver(() => {
        if (document.body) {
          try {
            observer.observe(document.body, { 
              childList: true, 
              subtree: true,
              attributes: true,
              attributeFilter: ['class', 'style', 'data-hidden-by-script']
            });
            window._yearMonthObservers.push(observer);
            console.log('遅延DOM監視を開始しました');
            bodyObserver.disconnect();
          } catch (e) {
            console.warn('遅延DOM監視開始エラー:', e);
          }
        }
      });
      
      // documentを監視してbodyの追加を検出
      bodyObserver.observe(document.documentElement, { childList: true });
      window._yearMonthObservers.push(bodyObserver);
    }
  } catch (e) {
    console.error('MutationObserver初期化エラー:', e);
  }
  
  // ページ遷移の検出（SPAの場合）
  try {
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
      try {
        const url = location.href;
        if (url !== lastUrl) {
          lastUrl = url;
          console.log('ページ遷移を検出しました - 年度・月表示の非表示化を再実行');
          setTimeout(forceHideYearMonth, 100);
        }
      } catch (e) {
        console.warn('URL変更検出エラー:', e);
      }
    });
    
    urlObserver.observe(document, { subtree: true, childList: true });
    window._yearMonthObservers.push(urlObserver);
  } catch (e) {
    console.error('URL監視エラー:', e);
  }

  // 定期的に実行（非同期読み込みや動的更新に対応）
  const intervalId = setInterval(() => {
    try {
      forceHideYearMonth();
    } catch (e) {
      console.warn('定期実行エラー:', e);
    }
  }, 1000);
  
  // クリーンアップ関数を定義
  window._cleanupYearMonthHider = function() {
    try {
      clearInterval(intervalId);
      stopExistingObservers();
      console.log('年度・月表示の非表示化スクリプトを停止しました');
    } catch (e) {
      console.error('クリーンアップエラー:', e);
    }
  };

  // グローバル関数として公開
  window.forceHideYearMonth = forceHideYearMonth;
  
  console.log('年度・月表示の継続的な監視を開始しました（エラー修正版）');
})();