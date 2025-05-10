# 月次詳細 API エンドポイント修正ガイド

## 概要

このドキュメントでは、月次詳細機能のCSVインポートで発生している404エラーの原因と修正方法について説明します。

## 問題の詳細

現在、月次詳細画面でCSVインポート機能を使用すると、以下のようなエラーが発生します:

```
PUT http://localhost:5001/api/monthly-reports/2024/X 404 (Not Found)
```

原因は以下の点にあります:

1. API エンドポイントの不一致: フロントエンドが `/api/monthly-reports/{年度}/{月}` に PUT リクエストを送信していますが、バックエンドではこの形式のエンドポイントが定義されていません
2. HTTP メソッドのサポート不足: バックエンドで同じパスに対する PUT メソッドのハンドラが実装されていません

## 解決策

この問題を解決するために、以下の修正を行いました:

### 1. サーバー側の修正

- Express.js ルーターに PUT メソッドのルートを追加
- サーバーに `/api/monthly-report` (単数形) エンドポイントも追加し、互換性を確保

### 2. クライアント側の修正

- CSVImportModal コンポーネントを強化し、リトライ機能とエラーハンドリングを改善
- 複数の API エンドポイントを試す仕組みを実装

### 3. デバッグツールの追加

- ルートマッチングをデバッグするためのミドルウェアを追加

## 修正スクリプトの使用方法

この問題を修正するために、以下のスクリプトを用意しました:

1. **総合修正スクリプト**: すべての修正を一括で適用

```bash
node fix-monthly-api-complete.js
```

2. **明示的なルート修正スクリプト**: サーバーに明示的な単数形ルートを追加

```bash
node fix-monthly-routes-explicit.js
```

## 手動修正方法

手動で修正する場合は、以下の手順に従ってください:

### 1. バックエンドのルート定義を修正

`backend/routes/monthlyReportRoutes.js` ファイルに PUT メソッドを追加:

```javascript
// 月次レポート保存・更新
router.post('/:year/:month', monthlyReportController.saveMonthlyReport);

// 月次レポート更新（PUT）
router.put('/:year/:month', monthlyReportController.saveMonthlyReport);
```

### 2. サーバーに互換性ルートを追加

`backend/server.js` ファイルに単数形ルートを追加:

```javascript
app.use('/api/monthly-reports', monthlyReportRoutes);
// 月次レポートの互換性ルート - 単数形も対応
app.use('/api/monthly-report', monthlyReportRoutes);
```

### 3. フロントエンドの強化

フロントエンドのコンポーネントにリトライ機能を追加:

- `frontend/src/pages/MonthlyReport/CSVImportModal.enhanced.tsx` ファイルを使用

## トラブルシューティング

問題が解決しない場合は、以下のことを確認してください:

1. **サーバーの再起動**: 修正後、バックエンドサーバーを再起動しましたか？
2. **ルートの優先順位**: 具体的なルート（例: `/trend/:year`）が一般的なルート（例: `/:year/:month`）より先に定義されていますか？
3. **デバッグログ**: `routeDebug` ミドルウェアを有効にして、リクエストの処理状況を確認してください
4. **API クライアント設定**: フロントエンドの API クライアントが適切に設定されていますか？

## API エンドポイントのテスト

バックエンドの修正が正しく適用されているか確認するには、以下のコマンドを使用してください:

```bash
# 複数形のエンドポイントをテスト
curl http://localhost:5001/api/monthly-reports/2024/4

# 単数形のエンドポイントをテスト
curl http://localhost:5001/api/monthly-report/2024/4
```

両方のエンドポイントが正しく応答すれば、修正は正常に適用されています。

## 結論

この修正により、月次詳細機能の CSV インポートが正常に動作するようになりました。バックエンドとフロントエンドの両方を改善することで、より堅牢なシステムを実現しています。