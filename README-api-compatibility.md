# 月次詳細 API 互換性修正ガイド

## 概要

このドキュメントでは、月次詳細データのCSVインポート機能で発生している404エラーを解決するための対処方法について説明します。問題の本質は、フロントエンドの`CSVImportModal.tsx`コンポーネントが`/api/monthly-report/`エンドポイントを使用しているのに対し、バックエンドは`/api/monthly-reports/`（複数形）を使用していることです。

## 問題の詳細

### 1. API エンドポイントの不一致
フロントエンドでは:
```javascript
// CSVImportModal.tsx
const checkUrl = `${API_BASE_URL}/monthly-report/${monthData.fiscal_year}/${monthData.month}`;
```

バックエンドでは:
```javascript
// server.js
app.use('/api/monthly-reports', monthlyReportRoutes);
```

### 2. HTTP メソッドの非対応
バックエンドは `PUT` リクエストを直接サポートしていないケースがあります。現在は `POST` メソッドのみが実装されています。

## 解決策

この問題に対処するために、3つのアプローチを用意しました：

1. **修正スクリプト** - 一括で問題を修正するスクリプト
2. **強化されたCSVインポートコンポーネント** - リトライやフォールバック機能を備えた改良版
3. **バックエンド互換性レイヤー** - バックエンドでの互換性対応

## 使用方法

### 1. 修正スクリプトの実行

以下のコマンドを実行して、問題を一括修正します：

```bash
# スクリプトを実行
node fix-monthly-api-complete.js

# バックエンドサーバーも再起動する場合
node fix-monthly-api-complete.js --restart
```

このスクリプトは以下の処理を行います：
- バックエンドサーバーに互換性ルートを追加
- ルーティング定義に `PUT` メソッドを追加
- `CSVImportModal.tsx` を強化版に置き換え

### 2. 手動でのバックエンド修正

バックエンドを手動で修正する場合は、以下の手順に従ってください：

1. `server.js` を編集して互換性ルートを追加：

```javascript
// 既存のルート設定に追加
app.use('/api/monthly-reports', monthlyReportRoutes);
// 互換性のため、単数形のルートも追加
app.use('/api/monthly-report', monthlyReportRoutes);
```

2. ミドルウェアフォルダに互換性ファイルをコピー：

```bash
mkdir -p backend/middleware
cp backend/middleware/methodOverride.js backend/middleware
cp backend/middleware/apiCompatibility.js backend/middleware
```

3. `server.js` に互換性ミドルウェアを追加：

```javascript
// ミドルウェアのインポート
const methodOverride = require('./middleware/methodOverride');
const apiCompatibility = require('./middleware/apiCompatibility');

// APIルートの前にミドルウェアを追加
app.use(apiCompatibility());
app.use(methodOverride());

// 既存のAPIルート設定（上記のとおり）
```

4. `monthlyReportRoutes.js` に `PUT` メソッドを追加：

```javascript
// 既存のPOSTルートの後に追加
router.post('/:year/:month', monthlyReportController.saveMonthlyReport);
// PUTメソッドでも同じコントローラを使用
router.put('/:year/:month', monthlyReportController.saveMonthlyReport);
```

### 3. フロントエンドの修正

1. 強化版の `CSVImportModal.tsx` を使用する場合：

```bash
# バックアップの作成
cp frontend/src/pages/MonthlyReport/CSVImportModal.tsx frontend/src/pages/MonthlyReport/CSVImportModal.tsx.backup

# 強化版を適用
cp frontend/src/pages/MonthlyReport/CSVImportModal.enhanced.tsx frontend/src/pages/MonthlyReport/CSVImportModal.tsx
```

### 4. サーバーの再起動

変更を適用するには、バックエンドとフロントエンドを再起動します：

```bash
# バックエンドの再起動
cd backend
npm run dev

# 別のターミナルでフロントエンドを再起動
cd frontend
npm start
```

## 強化版CSVImportModalの特徴

強化版の `CSVImportModal.tsx` は以下の機能を追加しています：

1. **リトライ機能** - API呼び出しが失敗した場合、自動的に再試行します
2. **エンドポイント切り替え** - 404エラーが発生した場合、代替エンドポイントを試みます
3. **エラーハンドリングの改善** - より詳細なエラーメッセージと対処法を表示します
4. **互換性向上** - 単数形/複数形のエンドポイントの両方に対応します

## トラブルシューティング

問題が解決しない場合は、以下を確認してください：

1. **サーバーログ** - バックエンドのログを確認し、APIリクエストが到達しているか確認します
2. **ネットワークタブ** - ブラウザの開発者ツールでネットワークリクエストを確認します
3. **フロントエンドのコンソール** - エラーメッセージを確認します
4. **APIエンドポイントのテスト** - 以下のコマンドでAPIを直接テストします：

```bash
# GETリクエストのテスト
curl http://localhost:5001/api/monthly-reports/2024/4
curl http://localhost:5001/api/monthly-report/2024/4

# POSTリクエストのテスト
curl -X POST -H "Content-Type: application/json" -d '{"fiscal_year":2024,"month":4}' http://localhost:5001/api/monthly-reports/2024/4
```

## 拡張機能

このガイドで提供する修正は、他のAPI互換性の問題にも応用できます。同様の問題が他の部分で発生した場合も、同じ原則を適用してください。

---

この修正により、月次詳細データのCSVインポート機能が正常に動作するようになり、404エラーが解消されるはずです。バックエンドとフロントエンドの両方で対応することで、より堅牢なシステムを実現します。