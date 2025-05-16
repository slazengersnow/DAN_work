# プロジェクトツリー構造

## 障害者雇用管理システム (disability-employment-system)

```
disability-employment-system/
├── backend/                    # バックエンドAPI
│   ├── config/                # 設定ファイル
│   │   ├── auth.js
│   │   ├── database.js
│   │   └── db.js
│   ├── controllers/           # コントローラー
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── monthlyReportController.js
│   │   ├── paymentReportController.js
│   │   └── settingsController.js
│   ├── db/                    # データベース
│   │   └── init.sql
│   ├── middleware/            # ミドルウェア
│   │   ├── apiCompatibility.js
│   │   ├── auth.js
│   │   ├── methodOverride.js
│   │   ├── routeDebug.js
│   │   ├── validation.js
│   │   └── yearMonthSelector.js
│   ├── models/                # モデル
│   │   ├── Employee.js
│   │   ├── MonthlyReport.js
│   │   ├── Setting.js
│   │   └── paymentReportModel.js
│   ├── routes/                # ルート定義
│   │   ├── auth.js
│   │   ├── employeeRoutes.js
│   │   ├── monthlyReportRoutes.js
│   │   ├── paymentReportRoutes.js
│   │   └── settingsRoutes.js
│   ├── utils/                 # ユーティリティ
│   │   ├── calculationUtils.js
│   │   ├── csvExporter.js
│   │   └── errorHandler.js
│   └── server.js              # サーバーエントリポイント
│
├── frontend/                   # フロントエンド
│   ├── build/                 # ビルド出力
│   ├── public/                # 静的ファイル
│   │   ├── fixes/             # 修正スクリプト
│   │   ├── js/                # JavaScript
│   │   └── styles/            # スタイルシート
│   ├── src/                   # ソースコード
│   │   ├── api/               # API通信
│   │   │   ├── authApi.ts
│   │   │   ├── client.ts
│   │   │   ├── employeeApi.ts
│   │   │   ├── reportApi.ts
│   │   │   └── settingsApi.ts
│   │   ├── components/        # コンポーネント
│   │   │   ├── common/
│   │   │   ├── employee-tabs/
│   │   │   ├── PaymentReport/
│   │   │   └── Layout.tsx
│   │   ├── pages/             # ページコンポーネント
│   │   │   ├── Dashboard.tsx
│   │   │   ├── EmployeeList.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── MonthlyReport/
│   │   │   ├── Settings/
│   │   │   └── monthly-report/
│   │   ├── services/          # サービス層
│   │   ├── styles/            # スタイル
│   │   ├── types/             # TypeScript型定義
│   │   └── utils/             # ユーティリティ
│   └── package.json
│
├── backup/                     # バックアップファイル
├── migrations/                 # データベースマイグレーション
│   ├── 20250424_update_monthly_reports.sql
│   └── 20250507_add_notes_column.sql
│
├── src/                        # 追加コンポーネント
│   └── components/
│       └── JobAnalysis/
│
├── 月次報告修正スクリプト/       # 今回作成したファイル
│   ├── xpath-delete-solution.js           # XPath削除版
│   ├── xpath-hide-function.js             # XPath非表示関数版
│   ├── multi-method-hide.js               # 複数手法版
│   ├── ultimate-simple-hide.js            # 究極シンプル版
│   ├── one-line-solution.js               # ワンライナー版
│   └── 各種ブックマークレット(.txt)
│
├── README/                      # 各種README
│   ├── README-xpath-delete.md
│   ├── README-xpath-hide-function.md
│   ├── README-multi-method.md
│   ├── README-ultimate-simple.md
│   └── README-one-line.md
│
├── package.json                # プロジェクト設定
├── CLAUDE.md                   # Claude用ガイドライン
└── .gitignore
```

## 主要ディレクトリの説明

### /backend
Node.js/Expressベースのバックエンドアプリケーション
- 認証、従業員管理、月次報告、支払い報告などのAPI提供
- PostgreSQLデータベースを使用

### /frontend
React/TypeScriptベースのフロントエンドアプリケーション
- 管理画面UI
- 月次報告、従業員管理、設定管理などの機能

### /migrations
データベースのスキーマ変更スクリプト

### 月次報告修正スクリプト
本日作成した各種修正スクリプト
- 複数のアプローチで年度・月の行を非表示/削除
- ブックマークレット版も用意

## コマンド

```bash
# 開発環境の起動
npm start           # フロントエンドとバックエンドを同時起動

# 個別起動
npm run start:frontend   # フロントエンドのみ
npm run start:backend    # バックエンドのみ

# ビルド
cd frontend && npm run build

# テスト
npm test
```