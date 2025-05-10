# 月次詳細機能修正ガイド

このガイドでは、従業員データ取得時に発生する `error: column "notes" does not exist` エラーを解決するための手順を説明します。

## 問題の概要

月次詳細機能でデータを取得する際に、データベースの `employees` テーブルに `notes` カラムが存在しないことによるエラーが発生しています。従業員詳細機能には影響せずに、この問題を解決する必要があります。

## 解決策

2つの解決策を用意しました：

1. **データベースのnotesカラム追加** - 最も確実な解決方法
2. **コントローラーのフォールバッククエリ修正** - データベース変更なしで対応

## 解決手順

### 方法1：notesカラムの追加（推奨）

1. SQLマイグレーションスクリプトを実行してnotesカラムを追加します：

```bash
# PostgreSQLに接続し、マイグレーションスクリプトを実行
psql -U [ユーザー名] -d [データベース名] -f migrations/20250507_add_notes_column.sql
```

このスクリプトは:
- `employees` テーブルと `monthly_reports` テーブルの両方に `notes` カラムを追加します
- カラムが既に存在する場合はスキップします
- NULL値を許容し、デフォルト値はNULLです

### 方法2：コントローラーのパッチ適用

もしデータベース構造を変更したくない場合は、コントローラーのクエリを修正することでエラーを回避できます：

```bash
# パッチ適用スクリプトを実行
node patch_controller.js
```

このスクリプトは:
- `monthlyReportController.js` のバックアップを作成します
- fallbackQueryの中の `notes as memo` を `NULL as memo` に変更します
- これにより、notesカラムが存在しなくてもエラーは発生しなくなります

## 接続テスト

両方の解決策を適用した後、APIエンドポイントが正しく動作するか確認できます：

```bash
# 依存パッケージをインストール
./api-tests-install.sh

# テストスクリプトを実行
node test-monthly-api.js
```

テストスクリプトは以下を確認します：
- データベース接続
- notesカラムの存在
- singularとplural両方のAPIエンドポイント（/monthly-report/と/monthly-reports/）

## 推奨アプローチ

1. まず `migrations/20250507_add_notes_column.sql` を実行してnotesカラムを追加
2. 念のため `node patch_controller.js` も実行してコントローラーを修正
3. `./api-tests-install.sh` と `node test-monthly-api.js` で機能を確認

これにより、将来的にnotesカラムを使用するコードが追加されても問題なく動作するようになります。

## 解決後の確認ポイント

- 月次詳細機能が正常に動作すること
- 従業員詳細機能に影響がないこと
- APIエンドポイントが正しく応答すること
- エラー `error: column "notes" does not exist` が発生しないこと