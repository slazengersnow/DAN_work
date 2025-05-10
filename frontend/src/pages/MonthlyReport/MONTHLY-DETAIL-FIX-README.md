# 月次詳細改善 - 実装概要

このドキュメントでは、月次詳細画面の改善点と実装内容について説明します。

## 対応した問題

1. **CSVインポート後に全ての月のデータが表示されない問題**
   - CSVインポート後に5月のみのデータが表示される問題を修正
   - すべての月（4月〜3月）のデータを画面に反映させる機能強化

2. **不要な年度セレクタの非表示化**
   - 月次詳細画面の下部にある年度セレクタを非表示に設定
   - 従業員詳細機能への影響を排除

## 実装内容

### 1. CSVインポート後の全月データ表示対策

`MonthlyReportDetail.tsx` の `handleImportSuccess` 関数を強化：

```javascript
// インポート成功時のハンドラー - 改善版: 確実に全ての月のデータを再ロード
const handleImportSuccess = useCallback((summary?: string, dataCount?: number) => {
  // データキャッシュを確実にクリア
  setDataFetched(prev => {
    const newFetched = {...prev};
    newFetched[selectedYear] = false;
    return newFetched;
  });
  
  // すべてのキャッシュと状態をリセット
  setYearDataLoaded(prev => {
    const newLoaded = {...prev};
    newLoaded[selectedYear] = false;
    return newLoaded;
  });
  
  // 保存データを強制的に削除して再ロード
  setSavedData(prev => {
    const newSaved = {...prev};
    delete newSaved[selectedYear];
    return newSaved;
  });
  
  // 複数回データ再読み込みを実行
  setTimeout(() => {
    loadYearData(selectedYear);
  }, 300);
  
  // 一定時間後に再度確認
  setTimeout(() => {
    if (!yearDataLoaded[selectedYear]) {
      loadYearData(selectedYear);
    }
  }, 1000);
}, [selectedYear, loadYearData, yearDataLoaded]);
```

`CSVImportModal.tsx` のコールバック処理も改善：

```javascript
// インポート成功コールバック処理を改善
if (onImportSuccess) {
  // まず成功通知を確実に保存
  onImportSuccess(summary, successResponses.length);
  
  // 遅延してモーダルを閉じる
  setTimeout(() => {
    onClose();
    
    // 2度目の再読み込みを実行（モーダルが閉じた後に）
    setTimeout(() => {
      try {
        // 念のため2回目の呼び出しを行い、確実に反映させる
        onImportSuccess(summary, successResponses.length);
      } catch (e) {
        logger.logError('2回目のリロード呼び出しでエラー:', e);
      }
    }, 500);
  }, 800);
}
```

### 2. 年度セレクタの非表示化対策

`MonthlyDetailEnhancer.css` を新規作成：

```css
/* 年度セレクタ非表示 */
#fiscal-year-select {
  display: none !important;
}

/* 年度セレクタを含む親要素も非表示 */
#fiscal-year-select-container,
select#fiscal-year-select,
div:has(> select#fiscal-year-select) {
  display: none !important;
}

/* さらに詳細な非表示化セレクタ */
.monthly-tab select[id="fiscal-year-select"],
.monthly-detail select[id="fiscal-year-select"],
div:has(> #fiscal-year-select) {
  display: none !important;
}
```

`MonthlyReportDetail.tsx` にCSSをインポート：

```javascript
import './MonthlyDetailEnhancer.css'; // 年度セレクタの非表示化用CSS
```

## 技術的ポイント

1. **データリロード戦略**
   - キャッシュ無効化による強制再読み込み
   - 複数回のリロード試行によるデータ表示保証
   - タイミングずれを考慮したsetTimeout処理

2. **CSS設計**
   - 高い優先度と特異性による確実な非表示化
   - 複数のセレクタによる冗長対策
   - 従業員詳細に影響しないセレクタ設計

## 影響範囲

これらの改善により、以下の効果が期待されます：

1. CSVインポート後、すべての月のデータが正しく表示される
2. 年度セレクタが非表示となり、UIがシンプルになる
3. 従業員詳細機能には影響を与えない

## 技術的メモ

- CSS `display: none !important` により強制的に非表示化
- 複数回のデータ再読み込みによりAPIリクエスト数が増加する可能性あり
- `setTimeout` によるタイミング調整は、環境によって最適化が必要な場合あり