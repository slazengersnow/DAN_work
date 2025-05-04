# JSON Parse Error: Solutions and Best Practices

このドキュメントは `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` エラーの対処法をまとめたものです。

## 問題の概要

React+Express アプリケーションで API リクエストを行う際、サーバーが HTML レスポンスを返すと JSON としてパースできず、`Unexpected token '<'` エラーが発生します。

## 原因

主な原因：

1. **404 エラーが HTML 形式で返される**: Express の標準的な 404 ハンドラーは HTML を返します
2. **プロキシ設定の不備**: React 開発サーバーがバックエンドへ正しくプロキシできない
3. **API ベース URL の不一致**: フロントエンドとバックエンドでパスの不一致がある

## 解決策

### 1. バックエンド (Express) の改善

#### a) 404 エラーハンドラーの追加

```javascript
// サーバーの最後に追加する 404 ハンドラー
app.use((req, res, next) => {
  console.warn(`存在しないルート: ${req.method} ${req.originalUrl}`);
  
  // 常に JSON 形式でレスポンス
  res.status(404);
  res.setHeader('Content-Type', 'application/json');
  
  res.json({
    success: false,
    message: 'リソースが見つかりません',
    path: req.originalUrl,
    statusCode: 404
  });
});
```

#### b) 500 エラーハンドラーの追加

```javascript
// 500 エラーハンドラー
app.use((err, req, res, next) => {
  console.error('サーバーエラー:', err);
  
  res.status(500).json({
    success: false,
    message: 'サーバー内部エラーが発生しました',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

### 2. フロントエンド (React) の改善

#### a) 開発環境のプロキシ設定

`frontend/package.json` に正しいプロキシ設定を追加：

```json
{
  "name": "your-app",
  "version": "1.0.0",
  "proxy": "http://localhost:5001"
}
```

#### b) API クライアントの設定

開発環境では相対パスを使用してプロキシを活かす：

```javascript
// API_BASE_URL の正しい設定
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001/api');
```

#### c) HTML レスポンス検出の強化

```javascript
// HTML レスポンスを検出するヘルパー関数
function detectHtmlResponse(error) {
  const hasHtmlContent = error.request?.responseText && 
    (error.request.responseText.includes('<!DOCTYPE') || 
     error.request.responseText.includes('<html'));
  
  const contentType = error.response?.headers?.['content-type'] || '';
  const hasHtmlContentType = contentType.includes('text/html');
  
  return hasHtmlContent || hasHtmlContentType;
}
```

### 3. 診断ツール

不具合診断のためのスクリプトを用意しました：

- `npm run diagnostics` - 全体診断を実行
- `npm run test:404` - 404 JSON レスポンスのテスト
- `npm run test:api` - API エラーハンドリングのテスト

## 効果的なエラーハンドリングのベストプラクティス

1. **常に JSON レスポンス**
   - API はどんな場合も JSON で応答する
   - ステータスコードに関係なく Content-Type を application/json にする

2. **クライアント側の堅牢性**
   - HTML 応答の検出と変換
   - Accept ヘッダーで application/json を明示
   - エラーの種類（ネットワーク、サーバー、JSON パース）を区別する

3. **冗長な防御策**
   - バックエンドは必ず JSON 形式で応答
   - フロントエンドは HTML 応答を検出して適切に処理
   - プロキシ設定を正しく行う

4. **デバッグしやすいエラーメッセージ**
   - リクエスト情報を含む（URL、メソッド）
   - レスポンスの種類を識別（HTML か JSON か）
   - 具体的なエラーメッセージを提供

## 参考資料

- [Express エラーハンドリング公式ドキュメント](https://expressjs.com/ja/guide/error-handling.html)
- [React 開発サーバープロキシ設定](https://create-react-app.dev/docs/proxying-api-requests-in-development/)
- [Axios インターセプターの使い方](https://axios-http.com/docs/interceptors)