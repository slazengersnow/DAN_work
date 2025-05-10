# 従業員詳細画面の年度表示最適化

この文書では、従業員詳細画面における年度表示の最適化について説明します。この変更は、UIの一貫性を高め、従業員詳細画面のユーザーエクスペリエンスを向上させるものです。

## 実装内容

1. **重複している年度表示の削除**
   - 他のスクリプトで追加された重複する年度セレクタを非表示
   - 一貫したレイアウトを確保

2. **最適な位置への年度セレクタの配置**
   - 右揃えで配置（月次詳細画面と同様のレイアウト）
   - テーブルやタブセクションの直前に挿入
   - 複数の挿入戦略によるロバストな実装

3. **視覚的フィードバックの強化**
   - 年度変更時のアニメーション付き通知
   - 3秒後に自動的にフェードアウト

## 技術的な特徴

### 重複検出と非表示化

```javascript
// 重複している年度ラベルを検出
const duplicateYearLabels = Array.from(document.querySelectorAll('label, div')).filter(el => 
  el.textContent && 
  (el.textContent.includes('年度:') || el.textContent.includes('対象年度:') || el.textContent.includes('年度')) &&
  el.closest('.employee-detail, [class*="employee"], .employee-year-selector-fixed')
);

// 検出された重複要素を非表示
duplicateYearLabels.forEach(label => {
  const container = label.closest('.form-group, .row, .col, [class*="group"], .employee-year-selector-fixed');
  if (container && !container.classList.contains('employee-year-fixed')) {
    container.style.cssText = 'display: none !important;';
  }
});
```

### 柔軟な挿入位置決定

```javascript
// 最適な挿入位置を探す
// 方法1: テーブルやタブセクションの前
const insertBeforeElement = document.querySelector('.employee-detail table, .employee-list, .data-table, .tab-content, .nav-tabs');

// 方法2: ツールバーの親要素の次
const parentRow = toolbar.closest('.row, .container') || toolbar.parentElement;

// 方法3: 見出しの後
const headingElement = document.querySelector('h2:contains("従業員詳細"), h3:contains("従業員詳細")');

// 条件に応じて最適な位置を選択
if (insertBeforeElement) {
  insertBeforeElement.parentElement.insertBefore(yearContainer, insertBeforeElement);
} else if (parentRow) {
  // ...
} else if (headingElement) {
  // ...
}
```

### 視覚的フィードバック

```javascript
// UIフィードバック
const yearText = document.createElement('span');
yearText.className = 'year-change-notification';
yearText.textContent = `${e.target.value}年度のデータを表示します`;
yearText.style.cssText = 'color: #3a66d4; margin-left: 10px; font-weight: bold; opacity: 0; transition: opacity 0.3s;';

// アニメーション効果
setTimeout(() => {
  yearText.style.opacity = '1';
  
  // 3秒後にフェードアウト
  setTimeout(() => {
    yearText.style.opacity = '0';
    
    // フェードアウト後に削除
    setTimeout(() => {
      if (yearText.parentNode) yearText.parentNode.removeChild(yearText);
    }, 300);
  }, 3000);
}, 10);
```

### 変更検出と再適用

スクリプトはいくつかの方法で表示変更を検出します：

1. DOM変更の監視（MutationObserver）
2. タブクリックイベントの検出
3. URL変更の監視
4. ページ読み込み完了イベント

この複数の検出方法により、様々なケースで確実に年度表示の最適化が適用されます。

## 動作確認方法

1. 従業員詳細画面に移動
2. 画面上部に表示される年度セレクタが、テーブルかタブセクションの上に右揃えで配置されていることを確認
3. 年度を変更すると「XXXX年度のデータを表示します」という通知が表示され、数秒後に自動的に消えることを確認
4. コンソールで `[EmployeeDetailFix]` プレフィックス付きのログメッセージを確認

## 他コンポーネントとの連携

年度変更時には `employeeYearChanged` カスタムイベントが発火されるため、他のコンポーネントでこのイベントをリッスンすることで年度変更に対応することができます：

```javascript
document.addEventListener('employeeYearChanged', function(e) {
  console.log('選択された年度:', e.detail.year);
  console.log('年度テキスト:', e.detail.yearText);
  
  // 年度変更に応じたデータ取得や表示更新
});
```

## UIの一貫性

この変更により、月次詳細画面と従業員詳細画面の両方で、年度選択UIの見た目と位置が統一され、システム全体の一貫性が向上します。ユーザーは両画面間を移動しても同様の操作感を得ることができ、操作性が向上します。