# 月次詳細のAPI修正について

## 問題の概要

月次詳細の機能で、CSVインポートが正しく動作しない問題が発生しています。
原因は、フロントエンドコード（CSVImportModal.tsx）がAPIエンドポイント `/api/monthly-report/:year/:month` を使用しているのに対し、
バックエンドでは `/api/monthly-reports/:year/:month` というエンドポイントが定義されているという不一致にあります。

## 解決策

この問題を解決するために、以下の3つのアプローチから選択することができます：

### 解決策1: サーバーにエイリアスルートを追加する

`server.js` に新しいルートマウントポイントを追加して、両方のエンドポイントパターンに対応できるようにします。

```javascript
// 既存のルート
app.use('/api/monthly-reports', monthlyReportRoutes);
// 追加するエイリアスルート
app.use('/api/monthly-report', monthlyReportRoutes);
```

### 解決策2: CSVImportModal.tsxのエンドポイントを修正する

フロントエンドコードを修正して、バックエンドのエンドポイントパターンに合わせます。

```javascript
// 修正前
const checkUrl = `${API_BASE_URL}/monthly-report/${monthData.fiscal_year}/${monthData.month}`;

// 修正後
const checkUrl = `${API_BASE_URL}/monthly-reports/${monthData.fiscal_year}/${monthData.month}`;
```

### 解決策3: ダイレクトなエンドポイントハンドラを追加する

Express.jsのサーバーに直接ハンドラを追加して、月次レポートのリクエストをルーティングします。

```javascript
app.get('/api/monthly-report/:year/:month', async (req, res) => {
  // 既存のmonthlyReportRoutesハンドラにリダイレクト
  req.url = `/${req.params.year}/${req.params.month}`;
  monthlyReportRoutes(req, res);
});

app.put('/api/monthly-report/:year/:month', async (req, res) => {
  // 既存のmonthlyReportRoutesハンドラにリダイレクト
  req.url = `/${req.params.year}/${req.params.month}`;
  req.method = 'POST'; // POSTメソッドに変換
  monthlyReportRoutes(req, res);
});
```

## 修正スクリプトの使用方法

提供されている修正スクリプト `fix-monthly-endpoints.js` は、上記のすべての解決策を適用します。

```bash
# プロジェクトのルートディレクトリで実行
node fix-monthly-endpoints.js
```

スクリプトは以下の操作を行います：
1. ファイルのバックアップを作成
2. サーバーにエイリアスルートを追加
3. CSVImportModal.tsxのエンドポイントをサーバーに合わせて修正
4. ダイレクトなエンドポイントハンドラを追加

## 注意事項

- 修正後は必ずサーバーを再起動してください
- バックアップファイルは `backup` ディレクトリに保存されます
- 従業員詳細など他の機能に影響はありません

## 動作確認方法

1. サーバーを再起動: `cd backend && npm run dev`
2. フロントエンドを再起動: `cd frontend && npm start`
3. 月次詳細タブを開いてCSVインポート機能を使用
4. 従業員詳細タブが正常に機能することを確認

## トラブルシューティング

修正が正常に機能しない場合は、バックアップファイルから元に戻すことができます：

```bash
# サーバーファイルを元に戻す
cp backup/server.js.bak.TIMESTAMP backend/server.js

# CSVImportModalを元に戻す
cp backup/CSVImportModal.tsx.bak.TIMESTAMP frontend/src/pages/MonthlyReport/CSVImportModal.tsx
```