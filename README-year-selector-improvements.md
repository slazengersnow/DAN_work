# 月次報告の年度選択UIの改善

このドキュメントでは、月次報告画面の年度選択UIの改善点について説明します。この変更により、ユーザーエクスペリエンスの向上と画面レイアウトの最適化が実現されます。

## 実装内容

新しく実装した `YearSelectorHider.js` スクリプトは、月次報告画面の上部に表示されている年度選択部分を隠しつつ、月次詳細タブでは年度セレクタを表示するための最適化された解決策です。

### 主な機能

1. **複数の検出戦略**
   - テキスト内容による検出（「年度」を含むラベル）
   - 親要素・コンテナによる検出（フォームグループ、パネル）
   - CSSセレクタによる特定（クラス、階層構造）
   - 年号パターン（2023, 2024など）を含む選択肢の検出

2. **月次詳細タブの保護**
   - 月次詳細タブ内の年度セレクタは非表示にしない例外処理
   - CSSセレクタで詳細タブのセレクタを明示的に表示設定

3. **パフォーマンス最適化**
   - デバウンス処理による過剰な操作の防止
   - 重要な変更のみに反応するフィルタリング
   - スタイルシートによる効率的な表示制御

4. **柔軟な適用とデバッグ**
   - タブ切り替え時の再適用処理
   - ページ読み込み完了時の確実な適用
   - 詳細なデバッグログによる動作確認

### CSSによる制御

スクリプトは以下のようなCSSルールを動的に注入し、画面表示を効果的に制御します：

```css
/* 月次レポート画面のトップパネルの年度セレクタを非表示 */
.monthly-report-container .monthly-tab select[value],
.monthly-report-container > div > div > div:first-child select[value] {
  display: none !important;
  visibility: hidden !important;
}

/* 月次レポート画面のトップパネルを非表示 */
.monthly-report-container > div > div:nth-child(3) {
  display: none !important;
  visibility: hidden !important;
}

/* 月次詳細タブの年度セレクタは表示する */
.monthly-report-detail select#fiscal-year-select {
  display: inline-block !important;
  visibility: visible !important;
}
```

### JavaScriptによる動的検出

スクリプトは複数の戦略で年度セレクタを特定します：

```javascript
// 例：「年度:」ラベルを含む要素を検出
const yearLabels = Array.from(document.querySelectorAll('label')).filter(el => 
  el.textContent && el.textContent.includes('年度'));

// 例：年号を含む選択肢の検出
const hasYearOptions = Array.from(selector.options || []).some(option => 
  /20\d\d/.test(option.textContent || ''));
```

## 利点

1. **UI画面の最適化**
   - 画面上部のスペースをより効率的に使用
   - 重要なコンテンツにフォーカスしやすいレイアウト

2. **ユーザー体験の向上**
   - 必要な場所（月次詳細タブ）でのみ年度選択が可能
   - 冗長な操作要素の削減

3. **動的な対応**
   - ページ構造変更に柔軟に対応
   - 複数検出戦略による堅牢性

4. **メンテナンス性**
   - 詳細なデバッグ情報
   - モジュール化された実装

## 動作確認方法

1. 月次報告画面を開き、上部の年度選択パネルが非表示になっていることを確認
2. 月次詳細タブに移動し、年度セレクタが表示されていることを確認
3. ブラウザのコンソールで `[YearSelectorHider]` プレフィックス付きのログを確認

この改善により、月次報告画面のユーザビリティと視覚的な整理が進み、より使いやすいインターフェースが実現されました。