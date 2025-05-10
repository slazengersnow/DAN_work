# 月次レポートCSVインポート修正ガイド

月次レポートシステムのCSVインポート機能における問題を完全に解決するためのツール・パッチ群です。

## 問題の概要

1. **CSVデータインポート後に画面が更新されない**
   - 成功レスポンスが返っても、表示が更新されない
   - 再読み込み時にも最新データが反映されないことがある

2. **API呼び出しの互換性問題**
   - 一部のエンドポイントが `/monthly-report/` と `/monthly-reports/` の両形式に対応していない
   - HTTP 404エラーが発生する場合がある

3. **デバッグ情報の不足**
   - インポート処理の詳細を追跡する手段がない
   - エラー発生時の原因特定が困難

## 解決策: 3つのツール

以下の3つのツールを用意しました。それぞれが特定の問題に対処します。

### 1. CSVImportAnalyzer.js - デバッグツール

ブラウザコンソールで動作するデバッグツールで、CSVデータの変換とAPI呼び出しを詳細に追跡します。

**機能:**
- CSVパース処理の詳細ログ記録
- APIリクエスト・レスポンスの監視
- コンポーネント状態変更の追跡
- ローカルストレージへのログ保存

**使用方法:**
```javascript
// ブラウザコンソールで
// 1. ツールをロード
import('/src/pages/MonthlyReport/CSVImportAnalyzer.js')
  .then(() => console.log('Analyzer loaded'));

// 2. CSVインポートを実行

// 3. 結果を確認
window.csvAnalyzer.printFullAnalysis();
```

### 2. CSVImportStateSync.jsx - 画面更新改善コンポーネント

Reactコンポーネントの状態同期を改善し、インポート後の画面更新を確実にします。

**機能:**
- インポート成功後の自動データ再取得
- リトライ機能（最大3回）で一時的なエラーに対応
- ローカルストレージによるインポート状態の記憶
- 強制再レンダリングによる確実な表示更新

**実装方法:**
1. MonthlyReport/index.jsx に追加
2. CSVImportModalにonImportSuccess関数を渡す

### 3. CSVImportTester.js - テスト・修復ツール

コマンドラインで実行するテスト・修復ツールで、インポートプロセス全体をシミュレートし、問題を特定・修正します。

**機能:**
- データベース接続テスト
- APIエンドポイントの互換性確認
- CSVデータの変換シミュレーション
- 不足・不正データの特定
- 修復モードによる自動データ修正

**使用方法:**
```bash
# 基本テスト (年度の指定は任意)
node frontend/src/pages/MonthlyReport/CSVImportTester.js --year 2025

# 修復モード (データを自動修正)
node frontend/src/pages/MonthlyReport/CSVImportTester.js --year 2025 --repair

# 詳細ログ出力
node frontend/src/pages/MonthlyReport/CSVImportTester.js --verbose

# エンドポイント指定 (デフォルトはlocalhost:5001)
node frontend/src/pages/MonthlyReport/CSVImportTester.js --endpoint http://api.example.com/api
```

## インストール手順

1. 3つのファイルをプロジェクトにコピー:
   ```
   frontend/src/pages/MonthlyReport/CSVImportAnalyzer.js
   frontend/src/pages/MonthlyReport/CSVImportStateSync.jsx
   frontend/src/pages/MonthlyReport/CSVImportTester.js
   ```

2. `CSVImportStateSync.jsx`の統合:
   - `MonthlyReport/index.jsx`を開く
   - ファイル内の「実装手順」セクションに従って統合

3. 依存パッケージのインストール (テスト用):
   ```bash
   npm install axios util readline --save-dev
   ```

## 推奨される使用順序

1. **テストツールでAPIと接続の問題を確認**
   ```bash
   node frontend/src/pages/MonthlyReport/CSVImportTester.js
   ```

2. **修復モードを実行してデータの問題を解決**
   ```bash
   node frontend/src/pages/MonthlyReport/CSVImportTester.js --repair
   ```

3. **React側のコンポーネント統合**
   - `CSVImportStateSync.jsx`を統合
   - アプリを起動して実際のインポートをテスト

4. **問題が続く場合はデバッグツールで詳細分析**
   - ブラウザコンソールで`CSVImportAnalyzer.js`を使用
   - ログを確認して問題の根本原因を特定

## 技術的詳細

### CSVImportAnalyzer.js
- ブラウザAPIのインターセプター機能で全リクエストを監視
- WeakSetを使用した循環参照対応のJSONシリアライズ
- パフォーマンスへの影響を最小限に抑えるVERBOSEモード

### CSVImportStateSync.jsx
- React Context APIを活用した状態共有
- useEffectフックとuseRefによるメモリリーク防止
- 指数バックオフによるネットワークエラー対策

### CSVImportTester.js
- 非同期処理の適切なエラーハンドリング
- コマンドライン引数解析（Node.js util.parseArgs）
- カラー出力によるログの可読性向上

## トラブルシューティング

- **CSVの文字化けが発生する場合:**
  ファイルの先頭にBOM (Byte Order Mark) が付加されていることを確認

- **404エラーが続く場合:**
  両方の形式 (`/monthly-report/` と `/monthly-reports/`) へのリクエストが失敗していないか確認

- **インポート成功後も表示が更新されない場合:**
  - ブラウザキャッシュのクリア
  - React DevToolsでコンポーネント階層を確認
  - CSVImportStateSyncコンポーネントが正しく統合されているか確認

## 連絡先・サポート

問題が解決しない場合は、以下の情報を添えてサポートにご連絡ください:
- ログファイル（`logs/`ディレクトリ内）
- 使用しているブラウザとそのバージョン
- 発生状況の詳細な説明