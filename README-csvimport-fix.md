# CSVImportModal 修正内容

## 概要

このファイルでは、CSVインポート機能のAPIエンドポイントを修正しました。
`monthly-reports` から `monthly-report` へのエンドポイント変更を実装し、
従業員詳細などの他のタブやメニューに影響が出ないようにしています。

## 修正箇所

CSVImportModal.tsx 内の下記箇所を修正しました：

1. **データ存在チェックAPIの修正**:
   ```javascript
   // 修正前
   const checkUrl = `${API_BASE_URL}/monthly-reports/${monthData.fiscal_year}/${monthData.month}`;
   
   // 修正後
   const checkUrl = `${API_BASE_URL}/monthly-report/${monthData.fiscal_year}/${monthData.month}`;
   ```

2. **既存データチェック関数の修正**:
   ```javascript
   // 修正前
   const response = await axios.get(
     `${API_BASE_URL}/monthly-reports/${fiscalYear}/${month}`,
     { timeout: 3000 }
   );
   
   // 修正後
   const response = await axios.get(
     `${API_BASE_URL}/monthly-report/${fiscalYear}/${month}`,
     { timeout: 3000 }
   );
   ```

## 技術的詳細

1. **修正方針**:
   - APIエンドポイントのみを変更し、関数の動作は維持
   - 既存コードの構造を尊重して最小限の変更に留める
   - 更新処理におけるエンドポイントは新しいAPIに合わせて修正
   - 新規作成処理は元のエンドポイントを維持

2. **変更影響**:
   - CSVインポート機能のみに影響し、他の機能には影響なし
   - 既存のデータ構造や型定義は変更していない
   - バックエンド側で新しいAPIエンドポイントが実装されていることが前提

## 注意事項

- この修正は新しいAPIエンドポイント `/monthly-report/` が実装されていることを前提としています
- APIレスポンスの形式が変わっている場合は追加の修正が必要になる可能性があります
- 本修正はCSVインポート機能のみを対象としており、従業員詳細などの他の機能には影響しません

## 確認方法

1. CSVテンプレートをダウンロードして必要な項目を入力
2. CSVをインポートして正常に処理されることを確認
3. 複数月のデータを含むCSVで一括インポートが機能することを確認
4. エラーハンドリングが正常に機能することを確認