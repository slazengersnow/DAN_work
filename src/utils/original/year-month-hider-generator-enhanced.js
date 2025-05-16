#!/usr/bin/env node
/**
 * Claude Code用 シンプル年度月非表示生成器（強化版）
 * 複数の検出方法を用いた堅牢なスクリプトを生成します
 */

const fs = require('fs');
const path = require('path');

// 出力ディレクトリを作成
const outputDir = 'year-month-hider';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
  console.log(`出力ディレクトリを作成しました: ${outputDir}`);
}

// 強化版スクリプト - 複数の検出方法を使用
const enhancedScript = `/**
 * 年度月非表示スクリプト（強化版）
 * 複数の検出方法で年度・月表示を隠します
 */
(function() {
  console.log('年度・月表示非表示化スクリプト（強化版）を実行開始');
  
  // すでに実行済みなら終了
  if (window._yearMonthHiderActive) {
    console.log('年度・月表示非表示化スクリプトはすでに実行中です');
    return;
  }
  
  // フラグを設定
  window._yearMonthHiderActive = true;
  
  // 方法1: スタイル属性で検出
  function hideByStyleAttribute() {
    const containers = document.querySelectorAll([
      'div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"]',
      'div[style*="display:flex"][style*="gap:20px"][style*="background-color:rgb(248, 249, 250)"]',
      'div[style*="display: flex"][style*="gap: 20px"][style*="background-color: #f8f9fa"]',
      'div[style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px"]'
    ].join(','));
    
    let count = 0;
    containers.forEach(container => {
      container.style.display = 'none';
      container.setAttribute('data-hidden-by-script', 'true');
      count++;
    });
    
    if (count > 0) {
      console.log(\`スタイル属性で\${count}個のコンテナを非表示にしました\`);
      return true;
    }
    return false;
  }
  
  // 方法2: 年度・月を含むテキストで検出
  function hideByYearMonthText() {
    const allDivs = document.querySelectorAll('div');
    let count = 0;
    
    allDivs.forEach(div => {
      try {
        // 年度と月を含むdivを探す
        const text = div.textContent || '';
        if ((text.includes('年度') || text.includes('年')) && 
            (text.includes('月') || text.match(/[0-9１-９]+月/))) {
          
          // タブや主要コンテンツではないことを確認
          if (!div.classList.contains('tab') && 
              !div.classList.contains('tabContent') && 
              !div.classList.contains('ant-tabs') &&
              !div.getAttribute('role') === 'tabpanel') {
            
            // 年度・月セレクタの特徴: 小さなコンテナで、selectを含む可能性がある
            if (div.clientHeight < 100 && 
                (div.querySelector('select') || div.querySelectorAll('div').length <= 5)) {
              div.style.display = 'none';
              div.setAttribute('data-hidden-by-script', 'true');
              count++;
            }
          }
        }
      } catch (e) {}
    });
    
    if (count > 0) {
      console.log(\`テキスト内容で\${count}個の要素を非表示にしました\`);
      return true;
    }
    return false;
  }
  
  // 方法3: セレクト要素とラベルで検出
  function hideBySelectAndLabel() {
    // 年度・月のラベルを探す
    const yearLabels = Array.from(document.querySelectorAll('label')).filter(
      label => (label.textContent || '').includes('年度') || (label.textContent || '').includes('年')
    );
    
    const monthLabels = Array.from(document.querySelectorAll('label')).filter(
      label => (label.textContent || '').includes('月') && !(label.textContent || '').includes('営業月')
    );
    
    let count = 0;
    
    // ラベルの親要素を非表示にする
    function hideParentContainer(element, depth = 3) {
      // 最大depthレベルまで親をたどる
      let parent = element.parentElement;
      for (let i = 0; i < depth && parent; i++) {
        // 適切なコンテナサイズを確認
        if (parent.clientHeight < 80 && parent.clientWidth > 100) {
          parent.style.display = 'none';
          parent.setAttribute('data-hidden-by-script', 'true');
          count++;
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    }
    
    // 年度ラベルを処理
    yearLabels.forEach(label => {
      hideParentContainer(label);
    });
    
    // 月ラベルを処理
    monthLabels.forEach(label => {
      hideParentContainer(label);
    });
    
    // 特定の値を持つセレクトを探す
    const yearSelects = Array.from(document.querySelectorAll('select')).filter(select => {
      try {
        return Array.from(select.options).some(option => 
          option.text.includes('年度') || option.text.includes('年') || 
          option.value.match(/^20[0-9][0-9]$/)
        );
      } catch (e) {
        return false;
      }
    });
    
    const monthSelects = Array.from(document.querySelectorAll('select')).filter(select => {
      try {
        return Array.from(select.options).some(option => 
          option.text.includes('月') || option.value.match(/^[0-9]$|^1[0-2]$/)
        );
      } catch (e) {
        return false;
      }
    });
    
    // セレクトの親要素を非表示
    yearSelects.forEach(select => {
      hideParentContainer(select);
    });
    
    monthSelects.forEach(select => {
      hideParentContainer(select);
    });
    
    if (count > 0) {
      console.log(\`ラベルとセレクトで\${count}個の要素を非表示にしました\`);
      return true;
    }
    return false;
  }
  
  // 方法4: CSSによる強制非表示
  function addForcedHidingStyles() {
    // すでに追加済みなら何もしない
    if (document.getElementById('year-month-hider-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'year-month-hider-styles';
    style.textContent = \`
      /* スタイル属性によるコンテナ非表示 */
      div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"],
      div[style*="display:flex"][style*="gap:20px"][style*="background-color:rgb(248, 249, 250)"],
      div[style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      
      /* 年度月を含むラベル */
      label:has(+select option[value^="20"]),
      label:has(+select option[value^="1"]):has(+select option[value^="2"]),
      label:contains("年度"),
      label:contains("月:") {
        display: none !important;
      }
      
      /* スクリプトで非表示マークされた要素 */
      [data-hidden-by-script="true"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      
      /* タブは確実に表示 */
      .ant-tabs, .ant-tabs-nav, .ant-tabs-content,
      [role="tablist"], [role="tab"], [role="tabpanel"],
      .tab, .tabs, .tabContent, .tab-content {
        display: initial !important;
        visibility: visible !important;
        height: auto !important;
        overflow: visible !important;
      }
    \`;
    
    document.head.appendChild(style);
    console.log('非表示用CSSスタイルを追加しました');
  }
  
  // 実行関数
  function execute() {
    let success = false;
    
    // 各方法を順番に試す
    success = hideByStyleAttribute() || success;
    success = hideByYearMonthText() || success;
    success = hideBySelectAndLabel() || success;
    
    // CSSも追加
    addForcedHidingStyles();
    
    if (!success) {
      console.log('年度・月表示要素が見つかりませんでした');
    }
    
    return success;
  }
  
  // DOM変更監視
  function setupMutationObserver() {
    if (window._yearMonthHiderObserver) {
      return;
    }
    
    const observer = new MutationObserver(function(mutations) {
      let shouldExecute = false;
      
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldExecute = true;
        }
      });
      
      if (shouldExecute) {
        setTimeout(execute, 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    window._yearMonthHiderObserver = observer;
    console.log('DOM変更の監視を設定しました');
  }
  
  // 初期実行
  function init() {
    // まず直接実行
    execute();
    
    // DOM読み込み完了時に実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', execute);
    }
    
    // 少し遅延して再実行（非同期コンテンツ用）
    setTimeout(execute, 500);
    setTimeout(execute, 1000);
    
    // 定期チェック設定
    setInterval(execute, 2000);
    
    // DOM変更監視も設定
    setupMutationObserver();
  }
  
  // 実行開始
  init();
  
  // グローバル関数として公開（手動実行用）
  window.hideYearMonth = execute;
  
  console.log('年度・月表示非表示化スクリプト（強化版）の初期化が完了しました');
})();`;

// コンパクトスクリプト - 最小限の機能に絞った軽量版
const compactScript = `/**
 * 年度月非表示スクリプト（コンパクト版）
 * 軽量な実装で年度・月表示を隠します
 */
(function() {
  // コンテナを直接非表示
  const container = document.querySelector('div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"]');
  if (container) {
    container.style.display = 'none';
  }
  
  // CSSを追加
  const style = document.createElement('style');
  style.textContent = \`
    /* コンテナを非表示 */
    div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"] { 
      display: none !important; 
    }
    
    /* 年度・月ラベルを非表示 */
    label:contains("年度"), label:contains("月:") { 
      display: none !important; 
    }
    
    /* 年度・月が入ったdivを非表示 */
    div:has(label:contains("年度")), div:has(label:contains("月:")) {
      display: none !important;
    }
  \`;
  document.head.appendChild(style);
  
  // 遅延実行も追加
  setTimeout(function() {
    const delayed = document.querySelector('div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"]');
    if (delayed) {
      delayed.style.display = 'none';
    }
  }, 1000);
})();`;

// ブックマークレット版を作成する関数
function createBookmarklet(script) {
  // コメントを削除
  let code = script.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  
  // 空白・改行を削除
  code = code.replace(/\s+/g, ' ');
  
  // console.logを削除
  code = code.replace(/console\.log\([^)]*\);/g, '');
  
  // ブックマークレット形式に変換
  return `javascript:(function(){${code}})();`;
}

// 強化版ブックマークレット
const enhancedBookmarklet = createBookmarklet(enhancedScript);

// コンパクト版ブックマークレット
const compactBookmarklet = createBookmarklet(compactScript);

// インジェクション用スクリプト
const injectionScript = `/*
 * このスクリプトをindex.htmlに追加するか、直接読み込んでください
 */
document.addEventListener('DOMContentLoaded', function() {
  ${enhancedScript}
});`;

// HTMLデモファイル
const demoHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>年度月非表示 デモ</title>
  <style>
    body {
      font-family: sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .demo-container {
      border: 1px solid #ddd;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .target-container {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      background-color: rgb(248, 249, 250);
      padding: 10px 15px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .controls {
      margin: 20px 0;
    }
    button {
      padding: 8px 16px;
      background: #0275d8;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
    }
    .tabs {
      display: flex;
      border-bottom: 1px solid #ddd;
      margin: 20px 0;
    }
    .tab {
      padding: 10px 20px;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .tab.active {
      border: 1px solid #ddd;
      border-bottom-color: white;
      margin-bottom: -1px;
      background: white;
    }
    .tab-content {
      display: none;
      padding: 20px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .tab-content.active {
      display: block;
    }
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow: auto;
    }
    .bookmarklet-container {
      margin: 20px 0;
    }
    .bookmarklet-link {
      display: inline-block;
      padding: 8px 16px;
      background: #5cb85c;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <h1>年度月非表示 デモページ</h1>
  
  <div class="demo-container">
    <h2>月次報告画面のサンプル</h2>
    
    <!-- 年度月コンテナ (これを非表示にしたい) -->
    <div class="target-container">
      <div>
        <label for="year">年度:</label>
        <select id="year">
          <option value="2020">2020年度</option>
          <option value="2021">2021年度</option>
          <option value="2022">2022年度</option>
          <option value="2023">2023年度</option>
          <option value="2024">2024年度</option>
          <option value="2025" selected>2025年度</option>
        </select>
      </div>
      <div>
        <label for="month">月:</label>
        <select id="month">
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
    
    <!-- タブ (これは表示したまま) -->
    <div class="tabs" role="tablist">
      <div class="tab active" role="tab" aria-selected="true">社員一覧</div>
      <div class="tab" role="tab" aria-selected="false">月次サマリー</div>
      <div class="tab" role="tab" aria-selected="false">詳細情報</div>
    </div>
    
    <div class="tab-content active" role="tabpanel">
      <p>社員一覧の内容がここに表示されます</p>
      <p>この部分は非表示にならず、タブの内容が表示されます</p>
    </div>
    <div class="tab-content" role="tabpanel">
      <p>月次サマリーの内容がここに表示されます</p>
    </div>
    <div class="tab-content" role="tabpanel">
      <p>詳細情報の内容がここに表示されます</p>
    </div>
  </div>
  
  <div class="controls">
    <button id="apply-enhanced">強化版スクリプトを適用</button>
    <button id="apply-compact">コンパクト版を適用</button>
    <button id="reset">リセット</button>
  </div>
  
  <div class="bookmarklet-container">
    <h3>ブックマークレット</h3>
    <p>以下のリンクをブックマークバーにドラッグして、月次報告画面で使用できます:</p>
    <a href="${compactBookmarklet}" class="bookmarklet-link">年度月非表示 (コンパクト)</a>
    <p>より強力な版:</p>
    <a href="${enhancedBookmarklet}" class="bookmarklet-link">年度月非表示 (強化版)</a>
  </div>
  
  <h3>実装サンプル</h3>
  <pre>${enhancedScript}</pre>
  
  <script>
    // タブ機能
    document.querySelectorAll('.tab').forEach((tab, index) => {
      tab.addEventListener('click', () => {
        document.querySelector('.tab.active').classList.remove('active');
        document.querySelector('.tab-content.active').classList.remove('active');
        
        tab.classList.add('active');
        document.querySelectorAll('.tab-content')[index].classList.add('active');
      });
    });
    
    // スクリプト適用ボタン
    const targetContainer = document.querySelector('.target-container');
    const originalDisplay = targetContainer.style.display;
    
    document.getElementById('apply-enhanced').addEventListener('click', function() {
      // スクリプトを実行
      ${enhancedScript}
    });
    
    document.getElementById('apply-compact').addEventListener('click', function() {
      // スクリプトを実行
      ${compactScript}
    });
    
    document.getElementById('reset').addEventListener('click', function() {
      // 元に戻す
      targetContainer.style.display = originalDisplay;
      
      // スタイルタグを削除
      const styleTag = document.getElementById('year-month-hider-styles');
      if (styleTag) {
        styleTag.remove();
      }
      
      // data属性をリセット
      document.querySelectorAll('[data-hidden-by-script]').forEach(el => {
        el.removeAttribute('data-hidden-by-script');
        el.style.display = '';
      });
      
      console.log('表示状態をリセットしました');
    });
  </script>
</body>
</html>`;

// ファイルに保存
fs.writeFileSync(path.join(outputDir, 'year-month-hider-enhanced.js'), enhancedScript);
fs.writeFileSync(path.join(outputDir, 'year-month-hider-compact.js'), compactScript);
fs.writeFileSync(path.join(outputDir, 'year-month-hider-enhanced-bookmarklet.js'), enhancedBookmarklet);
fs.writeFileSync(path.join(outputDir, 'year-month-hider-compact-bookmarklet.js'), compactBookmarklet);
fs.writeFileSync(path.join(outputDir, 'year-month-hider-injection.js'), injectionScript);
fs.writeFileSync(path.join(outputDir, 'demo.html'), demoHtml);

// README.mdを作成
const readmeContent = `# 年度月非表示ソリューション

複数の方法で月次報告画面の年度・月表示部分を非表示にし、タブ機能は維持するツールです。

## ファイル構成

- \`year-month-hider-enhanced.js\`: 複数の検出方法を使った強化版スクリプト
- \`year-month-hider-compact.js\`: コンパクトな軽量版スクリプト
- \`year-month-hider-enhanced-bookmarklet.js\`: 強化版ブックマークレット
- \`year-month-hider-compact-bookmarklet.js\`: コンパクト版ブックマークレット
- \`year-month-hider-injection.js\`: HTML/JSに組み込むためのスクリプト
- \`demo.html\`: デモページ

## 使用方法

### 方法1: ブックマークレットとして使用

1. \`year-month-hider-compact-bookmarklet.js\`または\`year-month-hider-enhanced-bookmarklet.js\`をブックマークに追加
2. 月次報告画面を開いたらブックマークをクリック

### 方法2: HTMLに組み込む

\`\`\`html
<head>
  <!-- 既存のheadの内容 -->
  <script src="year-month-hider-injection.js"></script>
</head>
\`\`\`

### 方法3: 開発者コンソールで実行

1. ブラウザの開発者ツール(F12)を開く
2. コンソールタブで\`year-month-hider-compact.js\`の内容をコピー＆ペースト
3. エンターキーを押して実行

## デモの使い方

\`demo.html\`をブラウザで開き、各ボタンを押して動作を確認できます。

- 「強化版スクリプトを適用」: 複数の検出方法で年度・月表示を非表示
- 「コンパクト版を適用」: 軽量な実装で年度・月表示を非表示
- 「リセット」: 表示状態を元に戻す

## 特徴

### 強化版

- 複数の検出方法による堅牢な非表示機能
  - スタイル属性による検出
  - テキスト内容による検出
  - セレクト要素とラベルによる検出
- CSSとJavaScriptの両方を使用
- MutationObserverによるDOM変更の監視
- 定期的な再実行で確実に非表示化
- エラー処理の強化

### コンパクト版

- 最小限のコードで基本機能を実現
- ページ読み込み速度への影響を最小化
- 主要なCSSセレクタでのみ非表示化

## カスタマイズ方法

スクリプトのセレクタが合わない場合は、以下の部分を修正してください：

1. スタイル属性を使ったセレクタ
   - \`div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"]\`

2. 年度・月を含むテキスト検出
   - \`text.includes('年度')\`や\`text.includes('月')\`

## トラブルシューティング

- 非表示にならない場合:
  1. ブラウザの開発者ツールで要素を検査
  2. スタイル属性やクラス名を確認
  3. CSSのセレクタを更新
  4. コンソールでエラーがないか確認
`;

fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);

// 統合ガイド
const integrationGuide = `# 年度月非表示ソリューション 統合ガイド

## 概要

このガイドでは、年度月非表示ソリューションをウェブアプリケーションに統合する方法を説明します。

## サイト全体に適用する場合

### 1. index.htmlに直接組み込む

\`public/index.html\`または同等のHTMLファイルに追加:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <!-- 既存のヘッド内容 -->
  <script>
    // 年度月非表示スクリプト
    document.addEventListener('DOMContentLoaded', function() {
      ${compactScript}
    });
  </script>
</head>
<body>
  <!-- 既存のボディ内容 -->
</body>
</html>
\`\`\`

### 2. 外部ファイルとして読み込む

a) スクリプトを\`public/js/year-month-hider.js\`として保存

b) \`public/index.html\`に追加:

\`\`\`html
<head>
  <!-- 既存のヘッド内容 -->
  <script src="%PUBLIC_URL%/js/year-month-hider.js"></script>
</head>
\`\`\`

## 特定のページのみに適用する場合

### Reactコンポーネント内で使用

\`\`\`jsx
import React, { useEffect } from 'react';

function MonthlyReportPage() {
  useEffect(() => {
    // 年度月非表示スクリプト
    ${compactScript}
    
    // クリーンアップ関数
    return () => {
      // スタイル要素を削除
      const style = document.getElementById('year-month-hider-styles');
      if (style) style.remove();
      
      // 非表示にした要素を元に戻す
      document.querySelectorAll('[data-hidden-by-script="true"]').forEach(el => {
        el.style.display = '';
        el.removeAttribute('data-hidden-by-script');
      });
    };
  }, []);
  
  return (
    <div className="monthly-report-page">
      {/* ページコンテンツ */}
    </div>
  );
}
\`\`\`

## 条件付きで適用する場合

\`\`\`javascript
// URLに基づいて適用するかを判断
if (window.location.pathname.includes('/monthly-report')) {
  // 年度月非表示スクリプトを実行
  ${compactScript}
}
\`\`\`

## 応用: トグルボタンを追加する

\`\`\`javascript
// 表示/非表示を切り替えるボタンを追加
function addToggleButton() {
  const button = document.createElement('button');
  button.textContent = '年度・月表示切替';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '8px 12px';
  button.style.backgroundColor = '#007bff';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  let hidden = true;
  
  button.addEventListener('click', () => {
    const container = document.querySelector('div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"]');
    if (container) {
      if (hidden) {
        container.style.display = '';
        button.textContent = '年度・月を非表示';
      } else {
        container.style.display = 'none';
        button.textContent = '年度・月を表示';
      }
      hidden = !hidden;
    }
  });
  
  document.body.appendChild(button);
}

// ボタンを追加
addToggleButton();
\`\`\`

## 注意点

- スクリプトは\`DOMContentLoaded\`イベント後に実行するのが理想的です
- CSSセレクタがサイト固有の要素構造と一致するか確認してください
- パフォーマンスのため、コンパクト版を使用し、必要な場合のみ強化版を使用してください
- モバイル版でもテストし、レスポンシブデザインに影響がないか確認してください
`;

fs.writeFileSync(path.join(outputDir, 'INTEGRATION-GUIDE.md'), integrationGuide);

// 結果を表示
console.log(`年度月非表示ソリューションの強化版を生成しました: ${path.resolve(outputDir)}`);
console.log('\n以下のファイルが利用可能です:');
console.log('- year-month-hider-enhanced.js: 強化版スクリプト');
console.log('- year-month-hider-compact.js: コンパクト版スクリプト');
console.log('- year-month-hider-enhanced-bookmarklet.js: 強化版ブックマークレット');
console.log('- year-month-hider-compact-bookmarklet.js: コンパクト版ブックマークレット');
console.log('- demo.html: デモページ');
console.log('- README.md: 使用方法の説明');
console.log('- INTEGRATION-GUIDE.md: 統合ガイド');
console.log('\nブックマークレットを使用するには:');
console.log('1. ブラウザでブックマークを作成');
console.log('2. URLとしてブックマークレットファイルの内容をコピー＆ペースト');
console.log('3. 月次報告画面でブックマークをクリック');
console.log('\nデモページで機能を確認するには:');
console.log(`1. ${path.resolve(outputDir, 'demo.html')} をブラウザで開く`);
console.log('2. 各ボタンをクリックして動作を確認');