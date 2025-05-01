#!/bin/bash
# サーバー起動スクリプト

# 現在のディレクトリを取得
CURRENT_DIR=$(pwd)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# プロジェクトのルートディレクトリを特定
if [ -d "$CURRENT_DIR/backend" ]; then
  BACKEND_DIR="$CURRENT_DIR/backend"
elif [ -d "$SCRIPT_DIR/backend" ]; then
  BACKEND_DIR="$SCRIPT_DIR/backend"
else
  # 親ディレクトリを確認
  PARENT_DIR="$(dirname "$CURRENT_DIR")"
  if [ -d "$PARENT_DIR/backend" ]; then
    BACKEND_DIR="$PARENT_DIR/backend"
  else
    echo "バックエンドディレクトリが見つかりません。現在の場所: $CURRENT_DIR"
    exit 1
  fi
fi

# バックエンドディレクトリに移動
echo "バックエンドディレクトリ: $BACKEND_DIR"
cd "$BACKEND_DIR" || { echo "バックエンドディレクトリに移動できません"; exit 1; }

# ここにサーバー起動コマンドを追加
# 例：npm start または node server.js
npm start