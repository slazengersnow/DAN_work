# 月次レポート CSV インポート修正スクリプト

このディレクトリには、月次レポートのCSVインポート機能に関する問題を修正するためのスクリプトが含まれています。

## 最小限の年度修正スクリプト（推奨）

### 最小限の年度修正

コンソールログ監視や自動検出機能をすべて排除した、シンプルで軽量な実装です。

- 30行程度の超コンパクトなコード
- 一度だけ実行される関数による年度情報の検出と保存
- 無限ループ問題やパフォーマンス低下を解消
- CSVインポートボタンを直接監視して年度を維持

**ファイル構成:**
- `minimal-installer.js`: 最小限の統合インストーラー
- `minimal-year-fix.js`: 年度を検出して保存・復元するコアスクリプト
- `minimal-csv-handler.js`: CSVインポートボタンを監視するハンドラ

## 拡張版年度修正スクリプト（従来版）

### 1. CSV年度修正

CSVインポート後に年度が自動的に2025に変わる問題を解決します。

- CSVインポート前の年度を記憶
- コンソールログとネットワークリクエストを監視してインポート完了を検出
- 年度選択要素を確実に特定するための複数の戦略を実装
- インポート完了後に元の年度に自動復元

### 2. ContentScriptエラー対応

「Could not find identifiable element」エラーを処理し、エラー発生後もUIが正常に動作するようにします。

- エラーを検出して適切に処理
- DOM要素の検索と更新による復旧
- UIの強制的な更新による正常化
- エラー発生時の詳細ログ記録

### 3. データ表示の完全性確保

すべての月のデータが正しく表示されることを確認し、必要に応じてUIを強制的に更新します。

- 12ヶ月すべてのデータが表示されるよう確認
- データが欠損した場合の自動更新
- 手動更新ボタンの提供
- データロード状況の視覚的表示

### 4. 視覚的フィードバック強化

インポート操作の進行状況と結果を明確に表示します。

- インポート成功時の通知
- エラー発生時の明確なメッセージ
- 操作結果の視覚的フィードバック
- 控えめながらも明確な通知システム

## 実装方法

スクリプトは以下のいずれかの方法で適用できます：

1. **自動適用**: `index.html` に以下のタグが含まれています：
   ```html
   <script src="%PUBLIC_URL%/fixes/minimal-installer.js"></script>
   ```

2. **ブックマークレット**として手動適用:
   ```javascript
   javascript:(function(){document.head.appendChild(document.createElement('script')).src='/fixes/minimal-installer.js?_='+Date.now();})();
   ```

3. **開発者コンソール**から手動適用:
   ```javascript
   const script = document.createElement('script');
   script.src = '/fixes/minimal-installer.js';
   document.head.appendChild(script);
   ```

従来の拡張版を使用したい場合は、上記のパスを `enhanced-fixes-installer.js` に変更してください。

## ファイル構成

- `enhanced-fixes-installer.js`: メインインストーラー（すべての修正を一度に適用）
- `simple-year-fix.js`: シンプルで軽量な年度修正実装（優先）
- `csv-import-year-fix.js`: 年度修正のメイン実装
- `content-script-error-handler.js`: ContentScriptエラー対応
- `data-completeness-validator.js`: データ表示の完全性確保
- `visual-feedback-enhancer.js`: 視覚的フィードバック強化
- `enhanced-network-monitor.js`: ネットワークリクエスト監視の強化
- `simplified-csv-fix.js`: 簡易版（フォールバック用）

## グローバルAPI

以下のAPIがブラウザのコンソールから利用可能です：

- `window.EnhancedFixes`: 統合APIへのアクセス
   - `version`: 現在のバージョン
   - `showNotification(message, type)`: 通知表示
   - `checkStatus()`: 機能の状態確認
   - `init()`: 手動で再初期化

- `window.CSVYearFix`: 年度修正機能
   - `findYearSelector()`: 年度選択要素を検出
   - `setYear(year)`: 年度を設定

- `window.ContentScriptErrorHandler`: エラー対応機能
   - `forceUIRefresh()`: UIを強制更新
   - `attemptRecovery()`: エラーからの復旧を試行

- `window.DataCompletenessValidator`: データ完全性機能
   - `validateNow()`: データの検証を実行
   - `forceUpdate()`: UI更新を強制実行

- `window.VisualFeedback`: 視覚的フィードバック
   - `showToast(message, type)`: トースト通知表示
   - `showImportSummary(data)`: インポート成功サマリー表示

## 注意事項

- 本修正は月次レポート画面でのみ有効になります
- 従業員詳細機能には影響しません
- 開発環境（localhost）では常に有効になります

最終更新: 2025年5月