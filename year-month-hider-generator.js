/**
 * 年度・月表示非表示化ソリューション生成スクリプト
 * 
 * このNode.jsスクリプトは、月次報告画面の年度・月表示を非表示にするための
 * 複数の展開オプションを自動生成します。
 * 
 * 生成される成果物:
 * 1. スタンドアロンスクリプト (year-month-hider-standalone.js)
 * 2. ブラウザコンソール用注入スクリプト (inject-year-month-hider.js)
 * 3. ブックマークレット (year-month-hider-bookmarklet.js)
 * 4. Chrome拡張機能 (year-month-hider-extension/)
 * 5. デモページ (year-month-hider-demo.html)
 */

const fs = require('fs');
const path = require('path');

// 出力ディレクトリを作成
const outputDir = path.join(__dirname, 'year-month-hider-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
  console.log(`出力ディレクトリを作成しました: ${outputDir}`);
}

// Chrome拡張機能ディレクトリの作成
const extensionDir = path.join(outputDir, 'year-month-hider-extension');
if (!fs.existsSync(extensionDir)) {
  fs.mkdirSync(extensionDir);
  console.log(`拡張機能ディレクトリを作成しました: ${extensionDir}`);
}

// メインスクリプト - 年度・月表示を非表示にするコア機能
const yearMonthHiderScript = `// 月次報告画面の年度・月表示を強制的に非表示にするスクリプト（最適化版）
(function() {
  console.log('年度・月表示の非表示化スクリプトを実行開始');
  
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
        console.log(\`月次報告画面を検出しました - 年度・月表示の非表示化を実行 (\${executionCount}回目)\`);
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
            (text.includes('月') || text.match(/\\d+月/))
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
              console.warn(\`要素スタイル変更エラー (\${selector}):\`, e);
            }
          });
        } catch (e) {
          // セレクタが無効な場合はスキップ
          console.warn(\`セレクタエラー (\${selector}):\`, e);
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
            console.warn(\`タブセレクタエラー (\${selector}):\`, e);
          }
        });
      } catch (e) {
        console.warn('タブ表示処理エラー:', e);
      }

      // 4. 非表示にした要素があるか確認
      if (executionCount % 10 === 0) {
        if (elementsHidden > 0) {
          console.log(\`年度・月表示の非表示化完了: \${elementsHidden}個の要素を非表示にしました\`);
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
  
  console.log('年度・月表示の継続的な監視を開始しました（最適化版）');
})();`;

// CSS for hiding year/month elements
const yearMonthHiderCSS = `/* 月次報告の年度/月選択部分を非表示にするCSS（最適化版） */

/* セレクタ指定による非表示 */
.yearMonthDisplay,
.yearMonthSection,
.filterSection,
.year-month-selector,
.year-selector,
.month-selector,
[class*="yearMonth"],
[class*="YearMonth"],
[class*="Year-Month"],
[class*="year-month"],
[class*="filter"]:not(.tabsContainer):not(.ant-tabs):not(.ant-tabs-content):not(.ant-tabs-nav):not([class*="tabContent"]),
#yearSelector,
#monthSelector,
#dateFilter,
[id*="filter"]:not([id*="tab"]),
[id*="selector"]:not([id*="tab"]),
[id*="year"]:not([id*="tab"]),
[id*="month"]:not([id*="tab"]) {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  opacity: 0 !important;
}

/* 見出しの直後の要素を非表示（年度/月選択部分である可能性が高い） */
h1.title + div:not(.tabsContainer):not(.ant-tabs):not([class*="tab"]),
h2.title + div:not(.tabsContainer):not(.ant-tabs):not([class*="tab"]),
.page-title + div:not(.tabsContainer):not(.ant-tabs):not([class*="tab"]) {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
}

/* タブは確実に表示するためのCSS */
.monthly-tabs-area,
.monthly-tab,
.tabsContainer,
.tabs-container,
.nav.nav-tabs,
.ant-tabs,
.ant-tabs-content,
.ant-tabs-nav,
.ant-tabs-tab,
.ant-tabs-tabpane,
[data-tab-container="true"],
[data-role="monthly-tabs"],
[data-tab-content],
[role="tablist"],
[role="tab"],
[role="tabpanel"],
.tab-content,
.tab-pane,
#monthly-report-tabs,
#secure-tabs-area {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  height: auto !important;
  overflow: visible !important;
  margin: initial !important;
  padding: initial !important;
}

/* 特定のタブスタイルを修正 */
.nav.nav-tabs,
[role="tablist"] {
  display: flex !important;
}

[role="tab"],
.ant-tabs-tab {
  display: inline-block !important;
}

/* アクティブなタブパネルの表示 */
.tab-pane.active,
.ant-tabs-tabpane-active,
[role="tabpanel"][aria-hidden="false"] {
  display: block !important;
}`;

// 1. スタンドアロンスクリプトの生成
function createStandaloneScript() {
  const filePath = path.join(outputDir, 'year-month-hider-standalone.js');
  fs.writeFileSync(filePath, yearMonthHiderScript);
  console.log(`スタンドアロンスクリプトを生成しました: ${filePath}`);
}

// 2. ブラウザコンソール用注入スクリプトの生成
function createInjectionScript() {
  const injectionScript = `// 年度・月表示の非表示化スクリプト（ブラウザコンソール用）
// ブラウザのコンソールに下記をコピー＆ペーストして実行してください
(function() {
  // CSSを挿入
  const style = document.createElement('style');
  style.textContent = \`${yearMonthHiderCSS}\`;
  document.head.appendChild(style);
  console.log('年度・月非表示用のCSSを挿入しました');
  
  // メインスクリプトを実行
  ${yearMonthHiderScript}
})();`;

  const filePath = path.join(outputDir, 'inject-year-month-hider.js');
  fs.writeFileSync(filePath, injectionScript);
  console.log(`ブラウザコンソール用注入スクリプトを生成しました: ${filePath}`);
}

// 3. ブックマークレットの生成
function createBookmarklet() {
  // ブックマークレット用に最適化（CSSとJSを統合）
  const bookmarkletScript = `// 年度・月表示の非表示化スクリプト（ブックマークレット用）
// 以下をブックマークのURLとして保存してください
javascript:(function(){
  // CSSを挿入
  const style = document.createElement('style');
  style.textContent = \`${yearMonthHiderCSS}\`;
  document.head.appendChild(style);
  
  // メインスクリプトを実行
  ${yearMonthHiderScript.replace(/console\.log\([^)]+\);/g, '').replace(/\s+/g, ' ')}
})();`;

  // ブックマークレット形式に変換
  function convertToBookmarklet(script) {
    return `javascript:(function(){${script
      .replace(/\/\/ .*?\\n/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\\s*\\n\\s*/g, ' ')
      .replace(/\\s+/g, ' ')
      .replace(/console\.log\([^)]+\);/g, '')
      .replace(/console\.warn\([^)]+\);/g, '')
      .replace(/console\.error\([^)]+\);/g, '')
    }})()`;
  }

  const rawBookmarklet = convertToBookmarklet(bookmarkletScript);
  const filePath = path.join(outputDir, 'year-month-hider-bookmarklet.js');
  
  // ブックマークレットとその使用方法を記述
  const bookmarkletWithInstructions = `// 年度・月表示の非表示化ブックマークレット
// 
// 使用方法:
// 1. 以下のコードをコピーします（javascript:で始まる部分すべて）
// 2. ブラウザのブックマークに新規ブックマークを作成します
// 3. 名前を「年度・月表示を非表示」などにし、URLの代わりに下記コードを貼り付けます
// 4. 月次報告画面を開いたら、このブックマークをクリックして実行します
//
${rawBookmarklet}`;

  fs.writeFileSync(filePath, bookmarkletWithInstructions);
  console.log(`ブックマークレットを生成しました: ${filePath}`);
}

// 4. Chrome拡張機能の生成
function createChromeExtension() {
  // manifest.json
  const manifest = {
    "manifest_version": 3,
    "name": "年度・月表示非表示化",
    "version": "1.0",
    "description": "月次報告画面の年度・月表示を非表示にする拡張機能",
    "icons": {
      "48": "icon48.png",
      "128": "icon128.png"
    },
    "content_scripts": [
      {
        "matches": ["<all_urls>"],
        "js": ["content.js"],
        "css": ["styles.css"],
        "run_at": "document_end"
      }
    ],
    "permissions": ["activeTab"]
  };

  // content.js - 拡張機能用のコンテンツスクリプト
  const contentScript = `// 年度・月表示の非表示化（Chrome拡張機能用）
${yearMonthHiderScript.replace(/console\.log/g, '// console.log').replace(/console\.warn/g, '// console.warn').replace(/console\.error/g, '// console.error')}`;

  // icon48.png（単純な色付きの正方形アイコンをBase64で表現）
  const icon48Base64 = `
  iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5gULDAkv9ZdD/AAAAB9JREFUaN7t08ENACAMwDD0H52/8AMJW5RuwzpJZwEAAIkXG0QAjDr0BbEAAAAASUVORK5CYII=`;

  // icon128.png（単純な色付きの正方形アイコンをBase64で表現）
  const icon128Base64 = `
  iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5gULDAkv9ZdD/AAAACNJREFUWNM9wQENAAAAwKD3T20ON6AAAAAAAAAAAAAAAAAAAACAfwMxUAABOip3iQAAAABJRU5ErkJggg==`;

  // Base64デコード関数
  function base64ToBuffer(base64) {
    const base64String = base64.replace(/\s/g, '');
    const buffer = Buffer.from(base64String, 'base64');
    return buffer;
  }

  // 拡張機能ファイルの書き込み
  fs.writeFileSync(path.join(extensionDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(extensionDir, 'content.js'), contentScript);
  fs.writeFileSync(path.join(extensionDir, 'styles.css'), yearMonthHiderCSS);
  fs.writeFileSync(path.join(extensionDir, 'icon48.png'), base64ToBuffer(icon48Base64));
  fs.writeFileSync(path.join(extensionDir, 'icon128.png'), base64ToBuffer(icon128Base64));

  // README.md
  const readme = `# 年度・月表示非表示化拡張機能

この Chrome 拡張機能は、月次報告画面の年度・月表示を非表示にする機能を提供します。

## インストール方法

1. Chromeで「chrome://extensions/」を開きます
2. 右上の「デベロッパーモード」をオンにします
3. 「パッケージ化されていない拡張機能を読み込む」をクリックします
4. この拡張機能のフォルダを選択します

## 特徴

- 月次報告画面を自動検出
- 年度・月表示部分を完全に非表示
- タブ機能は維持
- エラーハンドリング機能搭載
- SPAにも対応

## トラブルシューティング

問題が発生した場合は、拡張機能を無効化して再度有効化してみてください。
`;

  fs.writeFileSync(path.join(extensionDir, 'README.md'), readme);
  console.log(`Chrome拡張機能を生成しました: ${extensionDir}`);
}

// 5. デモページの生成
function createHtmlSample() {
  const demoHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>年度・月表示非表示化デモ</title>
  <style>
    body {
      font-family: sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .demo-section {
      border: 1px solid #ccc;
      padding: 20px;
      margin-bottom: 20px;
      background-color: #f9f9f9;
    }
    .tabs {
      display: flex;
      border-bottom: 1px solid #ccc;
      margin-bottom: 15px;
    }
    .tab {
      padding: 10px 15px;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .tab.active {
      border: 1px solid #ccc;
      border-bottom-color: white;
      background-color: white;
      margin-bottom: -1px;
    }
    .tab-content {
      display: none;
      padding: 15px;
      background-color: white;
      border: 1px solid #ccc;
      border-top: none;
    }
    .tab-content.active {
      display: block;
    }
    .yearMonthSection {
      padding: 10px;
      margin: 15px 0;
      background-color: #eaeaea;
      border: 1px solid #ddd;
    }
    button {
      padding: 6px 12px;
      background-color: #4CAF50;
      color: white;
      border: none;
      cursor: pointer;
      margin-top: 10px;
    }
    select {
      padding: 5px;
      margin: 5px;
    }
    .code-block {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      padding: 15px;
      overflow-x: auto;
      margin: 15px 0;
    }
    .install-section {
      margin: 30px 0;
    }
    .bookmarklet-link {
      display: inline-block;
      padding: 8px 15px;
      background-color: #2196F3;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 0;
    }
  </style>
  <!-- 年度・月表示非表示化用のCSS -->
  <style id="year-month-hider-css">
${yearMonthHiderCSS}
  </style>
</head>
<body>
  <h1>年度・月表示非表示化デモ</h1>
  
  <div class="demo-section">
    <h2 class="title">月次報告</h2>
    
    <!-- 年度・月表示部分 (これが非表示になる) -->
    <div class="yearMonthSection">
      <label for="year">年度:</label>
      <select id="year">
        <option>2023年度</option>
        <option>2024年度</option>
        <option>2025年度</option>
      </select>
      
      <label for="month">月:</label>
      <select id="month">
        <option>1月</option>
        <option>2月</option>
        <option>3月</option>
        <option>4月</option>
        <option>5月</option>
        <option>6月</option>
      </select>
      
      <button>表示更新</button>
    </div>
    
    <!-- タブ部分 (これは表示されたまま) -->
    <div class="tabsContainer">
      <div class="tabs" role="tablist">
        <div class="tab active" role="tab" aria-selected="true">社員一覧</div>
        <div class="tab" role="tab" aria-selected="false">月次サマリー</div>
        <div class="tab" role="tab" aria-selected="false">詳細情報</div>
      </div>
      
      <div class="tab-content active" role="tabpanel">
        <p>社員一覧タブの内容がここに表示されます。</p>
      </div>
      <div class="tab-content" role="tabpanel">
        <p>月次サマリータブの内容がここに表示されます。</p>
      </div>
      <div class="tab-content" role="tabpanel">
        <p>詳細情報タブの内容がここに表示されます。</p>
      </div>
    </div>
  </div>
  
  <div class="install-section">
    <h2>年度・月表示非表示化の使用方法</h2>
    
    <h3>1. スクリプトの有効化/無効化</h3>
    <button id="toggle-script">スクリプトを無効化</button>
    <p id="script-status">スクリプトは現在有効です</p>
    
    <h3>2. ブックマークレットのテスト</h3>
    <a href="javascript:(function(){${yearMonthHiderScript.replace(/\/\/ .*?\\n/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\\s*\\n\\s*/g, ' ').replace(/\\s+/g, ' ').replace(/console\.log\([^)]+\);/g, '').replace(/console\.warn\([^)]+\);/g, '').replace(/console\.error\([^)]+\);/g, '')}})();" class="bookmarklet-link">年度・月表示を非表示化</a>
    <p>このリンクをブックマークしてテストできます。</p>
    
    <h3>3. スクリプトのコード</h3>
    <div class="code-block">
      <pre><code id="script-code">// スクリプトをここにコピー＆ペーストする
${yearMonthHiderScript.slice(0, 500)}...</code></pre>
    </div>
  </div>
  
  <script>
    // タブ機能の実装
    document.querySelectorAll('.tab').forEach((tab, index) => {
      tab.addEventListener('click', () => {
        // 現在のアクティブタブを非アクティブに
        document.querySelector('.tab.active').classList.remove('active');
        document.querySelector('.tab-content.active').classList.remove('active');
        
        // クリックされたタブをアクティブに
        tab.classList.add('active');
        document.querySelectorAll('.tab-content')[index].classList.add('active');
      });
    });
    
    // スクリプト有効/無効切り替え
    let scriptEnabled = true;
    const toggleButton = document.getElementById('toggle-script');
    const scriptStatus = document.getElementById('script-status');
    const yearMonthHiderCSS = document.getElementById('year-month-hider-css');
    
    toggleButton.addEventListener('click', () => {
      scriptEnabled = !scriptEnabled;
      
      if (scriptEnabled) {
        yearMonthHiderCSS.removeAttribute('disabled');
        toggleButton.textContent = 'スクリプトを無効化';
        scriptStatus.textContent = 'スクリプトは現在有効です';
      } else {
        yearMonthHiderCSS.setAttribute('disabled', 'disabled');
        toggleButton.textContent = 'スクリプトを有効化';
        scriptStatus.textContent = 'スクリプトは現在無効です';
      }
    });
  </script>
  
  <!-- 年度・月表示非表示化スクリプト -->
  <script>
${yearMonthHiderScript}
  </script>
</body>
</html>`;

  const filePath = path.join(outputDir, 'year-month-hider-demo.html');
  fs.writeFileSync(filePath, demoHtml);
  console.log(`デモページを生成しました: ${filePath}`);
}

// 6. READMEファイルの生成
function createReadme() {
  const readme = `# 年度・月表示非表示化ソリューション

このディレクトリには、月次報告画面の年度・月表示を非表示にするためのさまざまな実装が含まれています。

## 概要

このソリューションは月次報告画面で年度・月選択部分を完全に非表示にし、タブ機能のみを表示させるものです。
複数の展開方法に対応し、ウェブシステムの改修なしでも使用できます。

## 同梱ファイル

1. \`year-month-hider-standalone.js\` - スタンドアロンスクリプト
   - HTMLに直接埋め込むか、外部スクリプトとして読み込むことができます

2. \`inject-year-month-hider.js\` - ブラウザコンソール用注入スクリプト
   - ブラウザのデベロッパーツールのコンソールに貼り付けて実行します

3. \`year-month-hider-bookmarklet.js\` - ブックマークレット
   - ブラウザのブックマークとして保存し、クリックで実行できます

4. \`year-month-hider-extension/\` - Chrome拡張機能
   - Chromeブラウザに拡張機能としてインストールできます

5. \`year-month-hider-demo.html\` - デモページ
   - スクリプトの動作確認用のHTMLサンプルです

## 使用方法

### 1. スタンドアロンスクリプト

\`\`\`html
<script src="path/to/year-month-hider-standalone.js"></script>
\`\`\`

### 2. ブラウザコンソール用

デベロッパーツールを開き（F12キー）、コンソールタブで\`inject-year-month-hider.js\`の内容を貼り付けて実行します。

### 3. ブックマークレット

\`year-month-hider-bookmarklet.js\`ファイル内の指示に従って、ブックマークとして保存します。
月次報告画面を開いたら、保存したブックマークをクリックします。

### 4. Chrome拡張機能

1. Chromeで「chrome://extensions/」を開きます
2. 「デベロッパーモード」をオンにします
3. 「パッケージ化されていない拡張機能を読み込む」をクリックします
4. \`year-month-hider-extension\`フォルダを選択します

### 5. デモ

\`year-month-hider-demo.html\`をブラウザで開き、スクリプトの動作を確認できます。

## 特徴

- 月次報告画面の自動検出
- 複数の検出方法による堅牢な要素の非表示化
- タブ機能の維持
- 柔軟な展開オプション
- SPAとの互換性
- 包括的なエラーハンドリング

## 生成方法

これらのファイルは \`year-month-hider-generator.js\` スクリプトにより自動生成されています。
生成スクリプトを実行するには:

\`\`\`
node year-month-hider-generator.js
\`\`\`

## カスタマイズ

スクリプトの動作をカスタマイズする場合は、生成スクリプトの \`yearMonthHiderScript\` 変数と \`yearMonthHiderCSS\` 変数を編集し、再生成してください。
`;

  const filePath = path.join(outputDir, 'README.md');
  fs.writeFileSync(filePath, readme);
  console.log(`READMEファイルを生成しました: ${filePath}`);
}

// 各成果物を生成
createStandaloneScript();
createInjectionScript();
createBookmarklet();
createChromeExtension();
createHtmlSample();
createReadme();

console.log('\n年度・月表示非表示化ソリューションの生成が完了しました！');
console.log(`出力ディレクトリ: ${outputDir}`);
console.log('\n使用方法については、生成されたREADME.mdファイルを参照してください。');