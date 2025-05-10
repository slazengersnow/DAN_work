#!/bin/bash

# api-tests-install.sh
# 月次レポートAPI接続テスト用のセットアップスクリプト

echo "API接続テスト用の依存パッケージをインストールします..."

# 依存パッケージをインストール
npm install axios pg dotenv --save-dev

echo "インストール完了しました！"
echo "テストを実行するには以下のコマンドを実行してください："
echo "node test-monthly-api.js"