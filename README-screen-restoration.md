# 画面表示復元スクリプト

この文書では、過去に実装された年度表示制御スクリプトによる過剰なDOM操作を修復し、画面表示を適切に復元する修正スクリプトについて説明します。

## 問題の概要

複数のUI修正スクリプトが重複して実行され、以下の問題が発生していました：

1. **無限ループ**: 複数のMutationObserverが互いの変更を検出して再処理を繰り返す
2. **要素の過剰な非表示**: 本来表示すべき要素まで非表示になってしまう
3. **重複実行**: 同じ処理が何度も実行されリソースを消費する
4. **スタイルの競合**: 複数のスタイル適用が競合してレイアウト崩れを引き起こす

## 解決アプローチ

この問題を解決するため、以下の多層的なアプローチを採用しました：

### 1. 既存の処理をすべて停止

```javascript
// すべての既存のMutationObserverを停止
if (window._existingYearObserver) {
  window._existingYearObserver.disconnect();
}

if (window._existingObservers) {
  window._existingObservers.forEach(observer => {
    if (observer && typeof observer.disconnect === 'function') {
      observer.disconnect();
    }
  });
}

// インターバルも停止
if (window._enhancerIntervals) {
  window._enhancerIntervals.forEach(intervalId => {
    clearInterval(intervalId);
  });
}
```

### 2. 非表示にされた要素を復元

```javascript
// display: none が設定された要素を探して復元
const hiddenElements = document.querySelectorAll('[style*="display: none"]');

hiddenElements.forEach(element => {
  // 月次報告の年度選択以外の要素を復元
  if (!element.textContent || 
      !element.textContent.includes('年度') || 
      !element.closest('.monthly-report-container, .page-header, .header-container')) {
    // インラインスタイルを削除
    element.style.display = '';
    element.style.visibility = '';
  }
});
```

### 3. 特定の要素のみを正確に制御

```javascript
function safelyHideYearSelector() {
  // 月次報告タイトルを確認
  const headers = document.querySelectorAll('h1, h2, h3, h4');
  let monthlyReportHeader = null;
  
  for (const header of headers) {
    if (header.textContent && header.textContent.includes('月次報告')) {
      monthlyReportHeader = header;
      break;
    }
  }

  if (!monthlyReportHeader) return;

  // ヘッダーから最も近い親コンテナを取得
  const reportContainer = monthlyReportHeader.closest('.container, .content, .page, .monthly-report-container');
  
  if (!reportContainer) return;

  // 対象のセレクタのみを非表示
  // ...
}
```

### 4. 効率的で安全な監視メカニズム

```javascript
// 安全なMutationObserverの設定
let isProcessing = false;
const safeObserver = new MutationObserver(function(mutations) {
  // 実行中なら重複実行しない
  if (isProcessing) return;
  
  isProcessing = true;
  setTimeout(() => {
    try {
      // 現在表示中のページを判断して処理実行
      // ...
    } finally {
      isProcessing = false;
    }
  }, 100);
});

// 安全な設定で監視を開始（クラス変更、タブや画面切り替えの検出に必要最小限）
safeObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributeFilter: ['class'], // クラスの変更のみ監視
  attributes: true
});
```

## 実装内容

1. **既存処理の完全停止**
   - すべてのMutationObserver、インターバル、タイマーを停止
   - グローバル変数からの参照をクリア

2. **DOM状態の回復**
   - 非表示にされた要素を復元
   - bodyやhtml要素のスタイルをリセット
   - インジェクトされたスタイルシートを削除

3. **必要な年度表示制御のみを実装**
   - 月次報告画面：上部パネルの対象年度のみを非表示
   - 月次詳細タブ：年度セレクタを確実に表示
   - 従業員詳細画面：年度表示の状態を確認

4. **再発防止メカニズム**
   - 処理済みフラグによる重複実行防止
   - 限定的なDOM監視（必要最小限の変更のみを検出）
   - サイドエフェクトの少ない実装方法

## 動作確認方法

1. 月次報告画面を開き、上部パネルの年度選択が非表示になっていることを確認
2. 月次詳細タブに移動し、年度セレクタが表示されていることを確認
3. 従業員詳細画面に移動し、レイアウトが正常であることを確認
4. コンソールログで `[ScreenRestorer]` プレフィックス付きの出力を確認

## メンテナンスと今後の対応

このスクリプトは既存コードの問題を修正するための緊急対応として実装されています。中長期的には以下の対応を検討してください：

1. **コードの整理と統合**
   - 重複するUI修正ロジックの一元管理
   - 共通のユーティリティ関数の作成

2. **React的な実装への移行**
   - 直接のDOM操作ではなく、Reactコンポーネントとして実装
   - CSSモジュールを使ったスタイル管理

3. **テスト強化**
   - E2Eテストによる画面表示の検証
   - ユーザーシナリオに基づくインタラクションテスト

このスクリプトにより、以前の実装による問題を修正しつつ、必要な年度表示制御機能を維持することができました。