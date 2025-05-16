#!/usr/bin/env node

/**
 * 年度・月非表示スクリプト生成ツール
 * 
 * 使用方法:
 * 1. このスクリプトをyear-month-hider.jsとして保存
 * 2. 実行権限付与: `chmod +x year-month-hider.js`
 * 3. 実行: `./year-month-hider.js`
 */

// 必要なモジュール
const fs = require('fs');
const path = require('path');

// スクリプト本体
const yearMonthHiderScript = `
/**
 * 年度と月の選択項目を非表示にし、タブは表示するスクリプト
 * 複数のアプローチを組み合わせた堅牢な実装
 */
(function() {
  // デバッグ出力設定
  const DEBUG = false;
  
  // デバッグログ用関数
  function log(message) {
    if (DEBUG) {
      console.log(\`[年度・月非表示] \${message}\`);
    }
  }
  
  log('スクリプト実行開始');
  
  // 年度・月表示を非表示にする関数
  function hideYearMonthElements() {
    // 非表示にした要素のカウント
    let elementsHidden = 0;
    
    // 方法A: クラスセレクタによる検索
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
      '[class*="filter"]:not(.tabsContainer):not(.tabs-container):not(.ant-tabs):not(.ant-tabs-content):not(.ant-tabs-nav):not([class*="tabContent"]):not([class*="tab-content"])'
    ];
    
    classSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          try {
            if (el.style.display !== 'none') {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.style.height = '0';
              el.style.overflow = 'hidden';
              el.setAttribute('data-hidden-by-script', 'true');
              elementsHidden++;
            }
          } catch (e) {
            // 要素操作エラーを無視
          }
        });
      } catch (e) {
        // セレクタエラーを無視
      }
    });
    
    // 方法B: 特定のコンテナを対象
    // 提示されたHTMLに一致するセレクタ
    try {
      const container = document.querySelector('div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"]');
      
      if (container) {
        container.style.display = 'none';
        container.style.visibility = 'hidden';
        container.style.height = '0';
        container.style.overflow = 'hidden';
        container.setAttribute('data-hidden-by-script', 'true');
        elementsHidden++;
        log('フレックスコンテナを非表示にしました');
      }
    } catch (e) {
      log('コンテナ非表示エラー: ' + e);
    }
    
    // 方法C: 見出しの直後の要素
    try {
      const headingElements = document.querySelectorAll('h1, h2');
      headingElements.forEach(headingEl => {
        if ((headingEl.textContent || '').includes('月次報告') || (headingEl.textContent || '').includes('月次詳細')) {
          const nextElements = [];
          let nextElement = headingEl.nextElementSibling;
          
          // 見出しの次の2つの要素を候補に追加
          for (let i = 0; i < 2 && nextElement; i++) {
            nextElements.push(nextElement);
            nextElement = nextElement.nextElementSibling;
          }
          
          // 年度・月を含む要素を非表示
          nextElements.forEach(el => {
            if (el && 
                !el.classList.contains('tabs-container') && 
                !el.classList.contains('tabsContainer') && 
                !el.classList.contains('ant-tabs') && 
                !el.querySelector('[role="tablist"]')) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.style.height = '0';
              el.style.overflow = 'hidden';
              el.setAttribute('data-hidden-by-script', 'true');
              elementsHidden++;
            }
          });
        }
      });
    } catch (e) {
      log('見出し後要素処理エラー: ' + e);
    }
    
    // 方法D: 年度・月のテキストを含む要素
    try {
      function containsYearMonthText(element) {
        const text = element.textContent || '';
        return (
          (text.includes('年度') || text.includes('年')) && 
          (text.includes('月') || text.match(/\\d+月/))
        );
      }
      
      document.querySelectorAll('div').forEach(div => {
        if (containsYearMonthText(div) && 
            !div.classList.contains('monthly-tab') &&
            !div.classList.contains('tab-content') &&
            !div.querySelector('.ant-tabs') &&
            !div.querySelector('[role="tablist"]')) {
          div.style.display = 'none';
          div.style.visibility = 'hidden';
          div.style.height = '0';
          div.style.overflow = 'hidden';
          div.setAttribute('data-hidden-by-script', 'true');
          elementsHidden++;
        }
      });
    } catch (e) {
      log('テキスト検索エラー: ' + e);
    }
    
    // 方法E: 特定のラベルとセレクト要素
    try {
      // 年度と月のラベルを非表示
      document.querySelectorAll('label').forEach(label => {
        if ((label.textContent || '').includes('年度') || (label.textContent || '').includes('月')) {
          label.style.display = 'none';
          label.style.visibility = 'hidden';
          label.setAttribute('data-hidden-by-script', 'true');
          elementsHidden++;
          
          // ラベルに関連するセレクトも非表示
          const forAttr = label.getAttribute('for');
          if (forAttr) {
            const relatedSelect = document.getElementById(forAttr);
            if (relatedSelect) {
              relatedSelect.style.display = 'none';
              relatedSelect.style.visibility = 'hidden';
              relatedSelect.setAttribute('data-hidden-by-script', 'true');
              elementsHidden++;
            }
          }
          
          // 親要素も非表示
          let parent = label.parentElement;
          if (parent && !parent.querySelector('[role="tablist"]') && !parent.querySelector('.ant-tabs')) {
            parent.style.display = 'none';
            parent.style.visibility = 'hidden';
            parent.setAttribute('data-hidden-by-script', 'true');
            elementsHidden++;
          }
        }
      });
      
      // 年度と月のセレクトボックスを非表示
      document.querySelectorAll('select').forEach(select => {
        if (select.name === 'fiscalYear' || select.name === 'year' || select.name === 'month' ||
            Array.from(select.options || []).some(opt => (opt.text || '').includes('月') || (opt.text || '').includes('年'))) {
          select.style.display = 'none';
          select.style.visibility = 'hidden';
          select.setAttribute('data-hidden-by-script', 'true');
          elementsHidden++;
          
          // 親要素も非表示
          let parent = select.parentElement;
          if (parent && !parent.querySelector('[role="tablist"]') && !parent.querySelector('.ant-tabs')) {
            parent.style.display = 'none';
            parent.style.visibility = 'hidden';
            parent.setAttribute('data-hidden-by-script', 'true');
            elementsHidden++;
          }
        }
      });
    } catch (e) {
      log('ラベル/セレクト処理エラー: ' + e);
    }
    
    log(\`\${elementsHidden}個の要素を非表示にしました\`);
    return elementsHidden > 0;
  }
  
  // タブを表示するための関数
  function showTabs() {
    const tabSelectors = [
      '.monthly-tabs-area',
      '.monthly-tab',
      '.tabsContainer',
      '.tabs-container',
      '.nav.nav-tabs',
      '.nav-item',
      '.nav-link',
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
        // タブセレクタエラーは無視
      }
    });
    
    log('タブの表示を確保しました');
  }
  
  // 非表示状態を維持するための監視を設定
  function setupVisibilityMaintenance() {
    // 既にwindow._yearMonthObserversが設定されていれば停止
    if (window._yearMonthObservers && Array.isArray(window._yearMonthObservers)) {
      window._yearMonthObservers.forEach(observer => {
        try {
          if (observer && typeof observer.disconnect === 'function') {
            observer.disconnect();
          }
        } catch (e) {
          // エラーを無視
        }
      });
    }
    
    // 監視対象の配列を初期化
    window._yearMonthObservers = [];
    
    // MutationObserverでDOMの変更を監視
    try {
      const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' || 
              (mutation.type === 'attributes' && 
               mutation.attributeName && 
               ['class', 'style'].includes(mutation.attributeName))) {
            shouldCheck = true;
            break;
          }
        }
        
        if (shouldCheck) {
          hideYearMonthElements();
          showTabs();
        }
      });
      
      // body要素の監視を開始
      if (document.body) {
        observer.observe(document.body, { 
          childList: true, 
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'data-hidden-by-script']
        });
        window._yearMonthObservers.push(observer);
        log('DOM変更の監視を開始しました');
      }
    } catch (e) {
      log('監視設定エラー: ' + e);
    }
    
    // 定期的な実行のためのインターバル
    const intervalId = setInterval(() => {
      hideYearMonthElements();
      showTabs();
    }, 1000);
    
    // グローバル変数に保存
    window._yearMonthHiderInterval = intervalId;
    
    // クリーンアップ関数
    window._cleanupYearMonthHider = function() {
      // インターバルを停止
      if (window._yearMonthHiderInterval) {
        clearInterval(window._yearMonthHiderInterval);
      }
      
      // 監視を停止
      if (window._yearMonthObservers && Array.isArray(window._yearMonthObservers)) {
        window._yearMonthObservers.forEach(observer => {
          try {
            if (observer && typeof observer.disconnect === 'function') {
              observer.disconnect();
            }
          } catch (e) {
            // エラーを無視
          }
        });
        window._yearMonthObservers = [];
      }
      
      log('年度・月非表示処理を停止しました');
    };
  }
  
  // 非表示用のCSSを追加
  function addHidingStyles() {
    // すでに追加済みかチェック
    if (document.getElementById('year-month-hider-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'year-month-hider-styles';
    style.textContent = \`
      /* 年度・月セレクタ関連の要素を強制的に非表示 */
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
      [class*="filter"]:not(.tabsContainer):not(.tabs-container):not(.ant-tabs):not(.ant-tabs-content):not(.ant-tabs-nav):not([class*="tabContent"]):not([class*="tab-content"]) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        opacity: 0 !important;
      }
      
      /* 月次報告コンテナのフィルタ部分を強制的に非表示 */
      .monthly-report-container > div:nth-child(2):not(.tabs-container):not(.ant-tabs):not(.tabsContainer):not(.tab-content):not([role="tablist"]) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      
      /* 年月セレクタとそのコンテナを非表示 */
      select[name="year"],
      select[name="month"],
      select[name="fiscalYear"],
      select[id*="year"],
      select[id*="month"] {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* タブ部分は確実に表示 */
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
      }
      
      /* タブリスト特有の表示スタイル */
      .nav.nav-tabs,
      [role="tablist"] {
        display: flex !important;
      }
      
      /* タブ要素特有の表示スタイル */
      .nav-item,
      .nav-link,
      [role="tab"],
      .ant-tabs-tab {
        display: inline-block !important;
      }
      
      /* アクティブなタブパネルは必ず表示 */
      .tab-pane.active,
      .ant-tabs-tabpane-active,
      [role="tabpanel"][aria-selected="true"],
      [role="tabpanel"].active {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    \`;
    
    document.head.appendChild(style);
    log('非表示用スタイルを追加しました');
  }
  
  // メイン実行関数
  function execute() {
    log('年度・月非表示スクリプト実行中...');
    
    // CSSによる非表示
    addHidingStyles();
    
    // JSによる非表示
    hideYearMonthElements();
    
    // タブ表示の確保
    showTabs();
    
    // 継続的な監視を設定
    setupVisibilityMaintenance();
    
    log('年度・月非表示処理が完了しました');
  }
  
  // DOMの準備ができたら実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', execute);
  } else {
    execute();
  }
  
  // ページロード完了時にも実行
  window.addEventListener('load', execute);
  
  // グローバル関数として公開
  window.hideYearMonthDisplay = execute;
  
  // すぐに実行
  execute();
})();
`;

// ブックマークレット形式に変換
function convertToBookmarklet(script) {
  // コメントやログ出力を削除してコンパクトに
  return `javascript:(function(){${script
    .replace(/\s+/g, ' ')
    .replace(/\/\*.*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .replace(/console\.log\([^)]*\);/g, '')
    .replace(/log\([^)]*\);/g, '')
    .replace(/\bDEBUG\s*=\s*true\b/, 'DEBUG=false')
  }}())`;
}

// インジェクション用のJavaScriptファイルを作成
function createInjectionScript() {
  const injectionScript = `
// 年度・月非表示スクリプトインジェクタ
const script = document.createElement('script');
script.textContent = \`${yearMonthHiderScript}\`;
document.head.appendChild(script);
console.log('年度・月非表示スクリプトを注入しました');
  `;
  
  // ファイルを保存
  fs.writeFileSync('inject-year-month-hider.js', injectionScript);
  console.log('インジェクションスクリプトを生成しました: inject-year-month-hider.js');
}

// ブックマークレットファイルを作成
function createBookmarklet() {
  const bookmarklet = convertToBookmarklet(yearMonthHiderScript);
  fs.writeFileSync('year-month-hider-bookmarklet.js', bookmarklet);
  console.log('ブックマークレットを生成しました: year-month-hider-bookmarklet.js');
}

// Chrome拡張機能の作成
function createChromeExtension() {
  // ディレクトリ作成
  const extDir = 'year-month-hider-extension';
  if (!fs.existsSync(extDir)) {
    fs.mkdirSync(extDir);
  }
  
  // マニフェストファイル
  const manifest = {
    "manifest_version": 3,
    "name": "年度・月非表示ツール",
    "version": "1.0",
    "description": "月次報告画面の年度・月セレクタを非表示にし、タブは表示します",
    "content_scripts": [
      {
        "matches": ["<all_urls>"],
        "js": ["content.js"],
        "run_at": "document_end"
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(extDir, 'manifest.json'), 
    JSON.stringify(manifest, null, 2)
  );
  
  // コンテンツスクリプト
  const contentScript = `
// 年度・月非表示スクリプトを注入
const script = document.createElement('script');
script.textContent = \`${yearMonthHiderScript}\`;
document.head.appendChild(script);
console.log('年度・月非表示スクリプトを注入しました');
  `;
  
  fs.writeFileSync(
    path.join(extDir, 'content.js'),
    contentScript
  );
  
  console.log('Chrome拡張機能を生成しました: ' + extDir);
}

// 独立して実行可能なJSファイルを作成
function createStandaloneScript() {
  fs.writeFileSync('year-month-hider-standalone.js', yearMonthHiderScript);
  console.log('単体実行用スクリプトを生成しました: year-month-hider-standalone.js');
}

// HTML用のテスト実装サンプル
function createHtmlSample() {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>年度・月非表示デモ</title>
  <style>
    body {
      font-family: sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .demo-section {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      padding: 20px;
      border-radius: 8px;
    }
    
    h1 {
      color: #333;
    }
    
    .monthly-report-container {
      margin-top: 20px;
    }
    
    .tabs-container {
      margin-top: 20px;
      border-bottom: 1px solid #ddd;
    }
    
    .tabs-container button {
      padding: 10px 15px;
      margin-right: 5px;
      background: none;
      border: none;
      cursor: pointer;
    }
    
    .tabs-container button.active {
      border-bottom: 2px solid blue;
      font-weight: bold;
    }
    
    .tab-content {
      padding: 20px 0;
    }
    
    .year-month-display {
      display: flex;
      gap: 20px;
      background-color: rgb(248, 249, 250);
      padding: 10px 15px;
      border-radius: 4px;
      border: 1px solid #ddd;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>年度・月非表示デモページ</h1>
  
  <div class="demo-section">
    <h2>このデモについて</h2>
    <p>このページは年度・月表示の非表示スクリプトのデモです。年度・月セレクタが非表示になり、タブは表示されるはずです。</p>
    <button id="toggle-script">スクリプトを無効化</button>
  </div>
  
  <div class="monthly-report-container">
    <h1>月次報告</h1>
    
    <div class="year-month-display">
      <div>
        <label for="fiscalYear">年度:</label>
        <select id="fiscalYear" name="fiscalYear">
          <option value="2023">2023年度</option>
          <option value="2024">2024年度</option>
          <option value="2025" selected>2025年度</option>
        </select>
      </div>
      
      <div>
        <label for="month">月:</label>
        <select id="month" name="month">
          <option value="1">1月</option>
          <option value="2">2月</option>
          <option value="3">3月</option>
          <option value="4">4月</option>
          <option value="5" selected>5月</option>
          <option value="6">6月</option>
          <option value="7">7月</option>
          <option value="8">8月</option>
          <option value="9">9月</option>
          <option value="10">10月</option>
          <option value="11">11月</option>
          <option value="12">12月</option>
        </select>
      </div>
      
      <button>更新</button>
    </div>
    
    <div class="tabs-container" id="monthly-report-tabs">
      <button class="active" data-tab="summary">サマリー</button>
      <button data-tab="employees">従業員詳細</button>
      <button data-tab="monthly">月次詳細</button>
    </div>
    
    <div class="tab-content">
      <div id="summary" style="display:block;">
        <h3>サマリータブの内容</h3>
        <p>ここにサマリー情報が表示されます。</p>
      </div>
      <div id="employees" style="display:none;">
        <h3>従業員詳細タブの内容</h3>
        <p>ここに従業員詳細が表示されます。</p>
      </div>
      <div id="monthly" style="display:none;">
        <h3>月次詳細タブの内容</h3>
        <p>ここに月次詳細が表示されます。</p>
      </div>
    </div>
  </div>

  <script>
    // タブ切り替え機能
    document.querySelectorAll('.tabs-container button').forEach(button => {
      button.addEventListener('click', () => {
        // タブボタンの状態を更新
        document.querySelectorAll('.tabs-container button').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // タブコンテンツを更新
        const tabId = button.dataset.tab;
        document.querySelectorAll('.tab-content > div').forEach(content => {
          content.style.display = 'none';
        });
        document.getElementById(tabId).style.display = 'block';
      });
    });
    
    // スクリプト切り替えボタン
    document.getElementById('toggle-script').addEventListener('click', () => {
      const button = document.getElementById('toggle-script');
      
      if (button.textContent === 'スクリプトを無効化') {
        if (window._cleanupYearMonthHider) {
          window._cleanupYearMonthHider();
        }
        
        // 非表示になっていた要素を表示
        document.querySelectorAll('[data-hidden-by-script="true"]').forEach(el => {
          el.style.display = '';
          el.style.visibility = '';
          el.style.height = '';
          el.style.overflow = '';
          el.removeAttribute('data-hidden-by-script');
        });
        
        // スタイルを削除
        const styleEl = document.getElementById('year-month-hider-styles');
        if (styleEl) {
          styleEl.remove();
        }
        
        button.textContent = 'スクリプトを有効化';
      } else {
        // スクリプトを再実行
        if (window.hideYearMonthDisplay) {
          window.hideYearMonthDisplay();
        }
        button.textContent = 'スクリプトを無効化';
      }
    });
  </script>

  <!-- 年度・月非表示スクリプト -->
  <script>
    ${yearMonthHiderScript}
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync('year-month-hider-demo.html', html);
  console.log('デモHTML文書を生成しました: year-month-hider-demo.html');
}

// メイン処理
function main() {
  console.log('年度・月非表示スクリプトツールの生成を開始します...');
  
  // 各種ファイルを生成
  createStandaloneScript();
  createInjectionScript();
  createBookmarklet();
  createChromeExtension();
  createHtmlSample();
  
  console.log('\n以下のファイルが生成されました:');
  console.log('1. year-month-hider-standalone.js - 単体実行用スクリプト');
  console.log('2. inject-year-month-hider.js - ブラウザコンソールで実行する用');
  console.log('3. year-month-hider-bookmarklet.js - ブックマークレット用');
  console.log('4. year-month-hider-extension/ - Chrome拡張機能用');
  console.log('5. year-month-hider-demo.html - デモHTML');
  
  console.log('\n使い方:');
  console.log('◆ ブラウザコンソール:');
  console.log('  開発者ツール(F12)のコンソールタブで inject-year-month-hider.js の内容をコピペして実行');
  
  console.log('\n◆ ブックマークレット:');
  console.log('  1. year-month-hider-bookmarklet.js の内容をコピー');
  console.log('  2. ブラウザのブックマークに新規ブックマークを作成');
  console.log('  3. 名前を「年度・月非表示」などに設定');
  console.log('  4. URLの代わりにコピーしたコードを貼り付け');
  console.log('  5. 月次報告画面でブックマークをクリックすると実行されます');
  
  console.log('\n◆ Chrome拡張機能:');
  console.log('  1. Chromeの拡張機能管理ページ(chrome://extensions/)を開く');
  console.log('  2. 「デベロッパーモード」をONにする');
  console.log('  3. 「パッケージ化されていない拡張機能を読み込む」をクリック');
  console.log('  4. year-month-hider-extension フォルダを選択');
  
  console.log('\n◆ デモ:');
  console.log('  year-month-hider-demo.html をブラウザで開くと動作確認ができます');
}

// 実行
main();