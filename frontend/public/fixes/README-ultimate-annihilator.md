# 究極の年月選択コントロール除去ツール

このスクリプトは、月次報告画面の年月選択コントロールを確実に削除するための「究極の解決策」です。
過去のアプローチで完全に除去できなかった問題に対処するため、複数の手法を同時に継続的に適用する「殲滅的」アプローチを採用しています。

## 主な特徴

1. **多層的な検出戦略**
   - 完全一致セレクタによる検索
   - DOMの構造や属性に基づく検索
   - テキストコンテンツに基づく検索
   - 要素の親子関係を分析する深層検索

2. **複数の破壊メカニズム**
   - CSS注入による視覚的非表示化
   - 物理的なDOM要素の削除
   - イベントリスナー除去と内部コンテンツのクリア
   - React更新の監視と介入

3. **継続的な監視と実行**
   - MutationObserverによるDOM変更の監視
   - 複数のタイミングでの段階的な実行スケジュール
   - イベントベースの実行トリガー
   - 定期的なインターバル実行

4. **高度なクリーンアップと重複実行防止**
   - 既存のリソースの自動クリーンアップ
   - 重複実行の検出と再初期化
   - デバウンス処理によるパフォーマンス最適化

5. **デバッグモード**
   - 詳細なログ出力
   - 視覚的なフィードバック通知
   - 破壊数の追跡

## 技術的アプローチ

### 1. 要素検出戦略

```javascript
// 完全一致セレクタ
const exactSelectors = [
  'div[style="display: flex; gap: 20px; margin-bottom: 20px; background-color: rgb(248, 249, 250); padding: 10px 15px; border-radius: 4px; border: 1px solid rgb(221, 221, 221);"]',
  'div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"]'
];

// 構造検索
const yearLabels = Array.from(document.querySelectorAll('label')).filter(
  label => label.textContent && label.textContent.includes('年度:')
);

// 特徴スコアリングによる判定
let score = 0;
if (hasYearLabel) score += 3;
if (hasMonthLabel) score += 3;
if (hasTwoSelects) score += 2;
if (hasUpdateButton) score += 2;
```

### 2. 破壊メカニズム

```javascript
// DOM要素の破壊
function destroyElement(element) {
  // 内部コンテンツをクリア
  element.innerHTML = '';
  
  // イベントリスナー除去のためクローン置換
  const clone = element.cloneNode(false);
  if (element.parentNode) {
    element.parentNode.replaceChild(clone, element);
  }
  
  // スタイル注入で隠す
  clone.style.cssText = `
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
  `;
  
  // 物理的に削除
  if (clone.parentNode) {
    clone.parentNode.removeChild(clone);
  }
}
```

### 3. CSS注入による視覚的非表示化

```javascript
const css = `
  /* 最も具体的なセレクタでの絶対非表示 */
  div[style*="display: flex"][style*="gap: 20px"][style*="background-color: rgb(248, 249, 250)"],
  div:has(label:contains("年度:") + select):has(label:contains("月:") + select):has(button:contains("更新")) {
    display: none !important;
    visibility: hidden !important;
    position: absolute !important;
    left: -9999px !important;
    height: 0 !important;
    width: 0 !important;
    opacity: 0 !important;
  }
`;
```

### 4. 継続的な監視

```javascript
// MutationObserverでDOM変更を監視
const observer = new MutationObserver(mutations => {
  // 関連する変更があれば破壊を実行
  if (hasRelevantChanges) {
    findAndDestroyAllMonthlyControls();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['style', 'class', 'data-reactid']
});
```

### 5. 段階的な実行スケジュール

```javascript
// 複数のタイミングで実行
const executionSchedule = [
  100, 300, 500, 800, 1000, 1500, 2000, 3000, 5000, 8000
];

executionSchedule.forEach(delay => {
  setTimeout(() => {
    findAndDestroyAllMonthlyControls();
  }, delay);
});
```

## 使用方法

このスクリプトは`FixedUIScript.js`から自動的に読み込まれるように設定されています。
手動で実行する場合は以下のコードを実行してください：

```javascript
// スクリプトの読み込み
const script = document.createElement('script');
script.src = '/fixes/ultimate-monthly-control-annihilator.js';
script.async = true;
document.body.appendChild(script);
```

## トラブルシューティング

もし年月選択コントロールが依然として表示される場合：

1. ブラウザの開発者ツールでコンソールを確認 (ログ出力が表示されるはずです)
2. ページを完全に再読み込み (F5キー)
3. コントロールが表示される画面に移動した後、コンソールで以下を実行:
   ```javascript
   // 手動で究極の破壊を実行
   window._ultimateAnnihilatorActive = false;
   loadScript('/fixes/ultimate-monthly-control-annihilator.js');
   ```

## 互換性

- 主要なモダンブラウザ (Chrome, Firefox, Safari, Edge) に対応
- ES6機能を使用しているため、古いブラウザでは動作しない場合があります
- Reactアプリケーション向けに最適化されています