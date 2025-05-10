# 従業員詳細画面の年度セレクタ機能

この文書では、従業員詳細画面に新たに追加された年度選択機能について説明します。この機能を使用することで、特定の年度の従業員データを簡単に切り替えて表示できるようになります。

## 新機能の概要

従業員詳細画面のツールバー領域に「対象年度」選択ドロップダウンを追加しました。このセレクタを使用して、過去・現在・将来の年度に関連する従業員データを表示できます。

## 主な特徴

1. **ツールバーへの統合**
   - 既存のUIに自然に溶け込むデザイン
   - 編集ボタンやその他の操作ボタンと同じ領域に配置

2. **柔軟なDOM検出**
   - 複数の検出方法によるロバストな実装
   - 様々なページ構造・DOM構成に対応

3. **年度切り替えフィードバック**
   - 年度変更時の視覚的フィードバック
   - 一時的な確認メッセージの表示

4. **イベント発行**
   - カスタムイベントによる他コンポーネントとの連携
   - `employeeYearChanged` イベントの購読が可能

## 技術実装の詳細

### 多段階のDOM検出戦略

```javascript
// 従業員詳細画面の検出（複数の方法）
// 1. 見出しテキストによる検出
for (const heading of headings) {
  if (heading.textContent && heading.textContent.includes('従業員詳細')) {
    isEmployeeDetailActive = true;
    break;
  }
}

// 2. クラスによる検出
if (!isEmployeeDetailActive) {
  isEmployeeDetailActive = !!document.querySelector('.employee-detail, .employee-profile, .employee-info');
}

// 3. アクティブタブによる検出
// ...

// ツールバーの検出（複数の方法）
// 1. 既存のボタングループを探す
toolbar = document.querySelector('.btn-group, .button-group, .toolbar, .actions');

// 2. 編集ボタンから親要素を探す
// ...

// 3. 最終手段：新しいツールバーを作成
// ...
```

### 年度選択のUI実装

```html
<div class="employee-year-selector-fixed">
  <label>対象年度:</label>
  <select class="form-control form-control-sm">
    <option value="2023">2023年度</option>
    <option value="2024" selected>2024年度</option>
    <option value="2025">2025年度</option>
    <option value="2026">2026年度</option>
  </select>
</div>
```

### 年度変更イベント

```javascript
// カスタムイベントの発行
const yearChangeEvent = new CustomEvent('employeeYearChanged', {
  detail: { 
    year: parseInt(e.target.value, 10),
    yearText: `${e.target.value}年度`
  },
  bubbles: true
});
document.dispatchEvent(yearChangeEvent);
```

### フィードバックの表示

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
    // ...
  }, 3000);
}, 10);
```

## 動作確認方法

1. 従業員詳細画面を開く
2. ツールバー（編集ボタンなどが表示されている領域）に「対象年度」セレクタが表示されていることを確認
3. 年度を変更すると、「XXXX年度のデータを表示します」という一時的なメッセージが表示されることを確認
4. コンソールで `[EmployeeYearRestorer]` プレフィックス付きのログメッセージを確認

## 拡張・連携方法

他のコンポーネントで年度変更イベントを購読するには、以下のようにイベントリスナーを設定します：

```javascript
document.addEventListener('employeeYearChanged', function(e) {
  console.log('選択された年度:', e.detail.year);
  console.log('年度テキスト:', e.detail.yearText);
  
  // 年度変更に応じた処理
  loadEmployeeDataForYear(e.detail.year);
});
```

この機能により、従業員の年度別データの閲覧が容易になり、特に複数年度にわたるデータ比較や履歴確認が必要な場合のユーザーエクスペリエンスが向上します。