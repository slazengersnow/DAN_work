# 月次報告と従業員詳細画面のUI修正スクリプト (更新版)

この文書では、月次報告画面と従業員詳細画面のUI表示を整理し、操作性を向上させるスクリプトについて説明します。このスクリプトは、以前の実装で発生していた問題を解決した改善版です。

## 実装の背景

以前のバージョンでは、複数のスクリプトが重複して実行され、以下の問題が発生していました：

1. 無限ループによるパフォーマンス低下
2. 過剰なDOM操作によるレンダリング問題
3. 複数のObserverによるメモリ使用量の増加
4. 意図しない要素の非表示化

これらの問題を解決するため、完全に書き直された統合スクリプトを実装しました。

## 最新の実装方法

今回の更新では、スクリプトを複数のモジュールに分割し、モジュール型のアーキテクチャを採用しました：

1. `/frontend/src/pages/FixedUIScript.js` - スクリプトローダー 
2. `/frontend/public/fixes/fixed-ui-script.js` - 基本的なUI修正の実装
3. `/frontend/public/fixes/employee-detail-enhancer.js` - 従業員詳細画面の拡張機能
4. `/frontend/public/fixes/employee-detail-enhancer-fix.js` - 従業員詳細セレクタのスタイルと機能の改善
5. `/frontend/public/fixes/monthly-control-hider.js` - 月次報告の下部コントロール非表示機能

この方式により、UI修正のロジックをReactコンポーネントから完全に分離し、メンテナンス性を向上させています。

## 主な機能

1. **月次報告画面の年度セレクタを非表示**
   - 画面上部の余分な年度選択パネルを隠す
   - 月次詳細タブの年度セレクタは表示を維持

2. **従業員詳細画面の対象年度セレクタを追加**
   - ツールバー領域に見やすい年度セレクタを追加
   - 年度変更時の視覚的フィードバック機能

3. **従業員詳細タイトルの年度選択機能**
   - タイトル横に年度情報を表示(ドロップダウン方式)
   - 複数年度への素早い切り替え機能
   - データ引き継ぎボタン左の冗長な年度セレクタの削除

4. **年度セレクタの機能強化**
   - タイトル横セレクタのフォントカラーを黒に変更し視認性向上
   - 年度変更時の実データ更新機能の追加
   - 「年度:」ラベルの削除によるUIの簡素化

5. **月次報告の下部コントロールを非表示**
   - 重複する年月選択UIの整理
   - 一貫性のあるUIレイアウトの実現
   - 表示制御のみによる機能への影響なし

## 技術的特徴

### 1. 堅牢なクリーンアップ機能

スクリプト実行前に、すべての既存処理を確実に停止します：

```javascript
function cleanupExistingScripts() {
  // Disconnect any existing observers
  if (window._existingObservers) {
    window._existingObservers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
  }
  
  // Clear any existing intervals
  if (window._existingIntervals) {
    window._existingIntervals.forEach(id => clearInterval(id));
  }
  
  // Reset global trackers
  window._existingObservers = [];
  window._existingIntervals = [];
}
```

### 2. 複数の検出戦略

複数の方法で目的の要素を検出し、ページ構造の変化に柔軟に対応します：

```javascript
// Strategy 1: Direct class selector
() => {
  const topSelectors = tabPanel.querySelectorAll('.card-header .year-selector-container');
  return Array.from(topSelectors);
},
// Strategy 2: Find by nearby text
() => {
  const cardHeaders = tabPanel.querySelectorAll('.card-header');
  const yearSelectors = [];
  cardHeaders.forEach(header => {
    const titleElement = findElementByText('h5, h6, div', '月次報告');
    if (titleElement && titleElement.closest('.card-header') === header) {
      const selector = header.querySelector('.year-selector-container');
      if (selector) yearSelectors.push(selector);
    }
  });
  return yearSelectors;
},
// Strategy 3: Find by structure pattern
() => {
  const headers = tabPanel.querySelectorAll('.card-header');
  return Array.from(headers)
    .filter(header => header.querySelector('select'))
    .map(header => header.querySelector('.year-selector-container, div:has(select)'))
    .filter(Boolean);
}
```

### 3. 効率的な監視メカニズム

必要最小限の変更だけを検出し、処理するよう最適化されています：

```javascript
// Filter relevant mutations to reduce processing
const relevantMutation = mutations.some(mutation => {
  // Only process if relevant elements were added
  const addedNodes = Array.from(mutation.addedNodes);
  return addedNodes.some(node => {
    if (node.nodeType !== 1) return false;
    const element = node;
    return element.matches && (
      element.matches('.card-header, .tab-content, .react-tabs__tab-panel, .employee-detail-container') ||
      element.querySelector('.card-header, .tab-content, .react-tabs__tab-panel, .employee-detail-container, .year-selector-container')
    );
  });
});

if (relevantMutation) {
  debouncedProcess();
}
```

### 4. パフォーマンス最適化

処理の効率化と安定性を確保する機能を実装しています：

```javascript
// デバウンス処理
const debouncedProcess = debounce(() => {
  if (isProcessing) return;
  isProcessing = true;
  
  setTimeout(() => {
    try {
      // Apply changes based on current page
      if (document.querySelector(config.monthlyReportTabSelector)) {
        handleMonthlyReportPage();
      }
      
      if (document.querySelector(config.employeeDetailSelector)) {
        handleEmployeeDetailPage();
      }
    } catch (e) {
      console.error('Error processing UI changes:', e);
    } finally {
      isProcessing = false;
    }
  }, config.processingDelay);
}, config.observerTimeout);
```

### 5. 視覚的フィードバック

ユーザーアクションに対する明確なフィードバックを提供します：

```javascript
// Add visual feedback indicator
const indicator = document.createElement('span');
indicator.className = 'year-changed-indicator';
indicator.textContent = '✓ 更新されました';
selectorContainer.appendChild(indicator);

// Show feedback indicator
indicator.classList.add('visible');
setTimeout(() => {
  indicator.classList.remove('visible');
}, 2000);
```

### 6. ドロップダウン年度セレクタ

従業員詳細画面のタイトル付近に直感的な年度選択UIを提供します：

```javascript
// 年度セレクタのためのスパン要素を作成
const yearSelectorSpan = document.createElement('span');
yearSelectorSpan.className = 'year-selector-dropdown';
yearSelectorSpan.style.cssText = 'margin-left: 10px; font-size: 0.9em; cursor: pointer; color: #000000;';
yearSelectorSpan.textContent = `(${currentYear}年度 ▼)`;
```

### 7. 実データ更新機能

年度選択時に実際のデータを更新する機能を実装しています：

```javascript
// 年度変更時のデータ更新処理
function updateDataForYear(year) {
  // 1. URLパラメータの変更
  updateUrlParam('year', year);
  
  // 2. 隠しフィールドの更新
  const yearInputs = document.querySelectorAll('input[name*="year"], input[name*="fiscal"]');
  yearInputs.forEach(input => {
    input.value = year;
  });
  
  // 3. セレクトボックスの更新
  const yearSelects = document.querySelectorAll('select[name*="year"], select[name*="fiscal"]');
  yearSelects.forEach(select => {
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value == year) {
        select.selectedIndex = i;
        // 変更イベントを発火
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
        break;
      }
    }
  });
}
```

### 8. 複合的な要素検出

複数の検出方法を組み合わせて、確実に対象のみを非表示化します：

```javascript
// 方法1: スタイル属性に基づいた特定
const flexContainers = document.querySelectorAll('div[style*="display: flex"][style*="gap: 20px"][style*="margin-bottom: 20px"]');

// 方法2: 構造に基づいた特定
const containers = document.querySelectorAll('div, section, article');

// 方法3: 特定のHTMLパターンをテキストで検索
const patterns = [
  /<div[^>]*style="[^"]*display:\s*flex[^"]*gap:\s*20px[^"]*>/i,
  /<label[^>]*>年度:<\/label>[\s\S]*?<label[^>]*>月:<\/label>/i
];

// 方法4: 最も具体的なセレクタを使用
const specificContainer = document.querySelector('div[style*="background-color: rgb(248, 249, 250)"][style*="padding: 10px 15px"][style*="border-radius: 4px"]');
```

## 年度セレクタの設計

### 月次報告画面

月次報告画面では、上部の余分な年度選択パネルを非表示にし、インターフェイスをすっきりとさせています。さらに下部の冗長なコントロールも非表示にすることで、必要なコントロールのみを表示しています。

### 従業員詳細画面

従業員詳細画面には、以下の2つの年度セレクタUIを実装：

1. **シンプルな年度セレクタ**：ツールバー領域に標準的なセレクタ
   - 視覚的な一貫性：月次詳細タブの年度セレクタと同様のデザイン
   - インタラクティブなフィードバック：年度変更時に通知を表示

2. **ドロップダウン式年度セレクタ**：タイトル横に高度な操作性のセレクタ
   - 従業員詳細タイトルに直接統合されたデザイン
   - 複数年度の素早い切り替え機能
   - 視覚的なハイライトで現在の選択を表示
   - 黒色フォントでの表示による視認性向上

## 使用方法

このスクリプトは、以下のようにインポートすることで使用できます：

```typescript
// 月次報告画面もしくは従業員詳細画面での使用
import '../pages/FixedUIScript.js'; // 月次報告と従業員詳細画面のUI修正
```

以下のファイルに既に実装されています：
- `/frontend/src/pages/MonthlyReport/index.tsx`
- `/frontend/src/pages/EmployeeDetailPage.tsx`

## 動作確認方法

1. 月次報告画面を開き、以下を確認：
   - 上部の年度選択パネルが表示されている
   - 重複する下部の年月選択UIが非表示になっている

2. 月次詳細タブに移動し、年度セレクタが表示されていることを確認

3. 従業員詳細画面に移動し、以下を確認：
   - ツールバー領域に年度セレクタが表示されている
   - タイトル横に黒色の「(XXXX年度 ▼)」表示がある
   - データ引き継ぎボタン左の年度セレクタが非表示になっている
   - 「年度:」ラベルが削除されている

4. 年度セレクタの機能を確認：
   - 値を変更すると画面が実際に更新される
   - 通知やフィードバックが表示される

5. ブラウザのコンソールでスクリプトのログを確認

## 改善点

このスクリプトは以前のバージョンから以下の点を改善しています：

1. **パフォーマンスの向上**：不要な処理を減らし、効率的な検出方法を採用
2. **安定性の向上**：エラー処理と実行制御による安定したUI操作
3. **柔軟性の向上**：複数の検出手法によるロバストな要素検出
4. **ユーザー体験の向上**：視覚的フィードバックと直感的な操作性の追加
5. **統合管理**：すべてのUI修正を少数のファイルで管理
6. **スタイルの分離**：CSS定義をJavaScriptに内包し依存関係を簡素化
7. **モジュール化**：ローダースクリプトと実装を分離し保守性を向上
8. **操作性の改善**：より直感的な年度選択UIの実装
9. **実データ連携**：年度選択時に実際のデータを更新する機能の追加
10. **UI整理**：重複するコントロールの非表示化による画面の簡素化

詳細な技術ドキュメントは `/frontend/public/fixes/README-fixed-ui-script.md` を参照してください。