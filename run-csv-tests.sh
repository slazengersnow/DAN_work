#!/bin/bash

# 月次レポートCSVインポートテスト実行スクリプト
# 使用方法: ./run-csv-tests.sh [年度] [--repair]

YEAR=$(date +%Y)
REPAIR=false
VERBOSE=false
API_ENDPOINT="http://localhost:5001/api"

# コマンドライン引数の解析
while [[ $# -gt 0 ]]; do
  case $1 in
    --repair)
      REPAIR=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --endpoint)
      API_ENDPOINT="$2"
      shift 2
      ;;
    *)
      # 数値のみの引数は年度として扱う
      if [[ $1 =~ ^[0-9]+$ ]]; then
        YEAR=$1
      fi
      shift
      ;;
  esac
done

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}月次レポートCSVインポートテストを開始します${NC}"
echo -e "年度: ${YEAR}"
echo -e "修復モード: $([ "$REPAIR" = true ] && echo "${GREEN}有効${NC}" || echo "${YELLOW}無効${NC}")"
echo -e "詳細ログ: $([ "$VERBOSE" = true ] && echo "${GREEN}有効${NC}" || echo "${YELLOW}無効${NC}")"
echo -e "APIエンドポイント: ${API_ENDPOINT}"
echo "---------------------------------"

# 依存パッケージの確認
echo -e "${BLUE}必要なパッケージを確認しています...${NC}"
MISSING_PACKAGES=""

for package in axios util readline; do
  if ! npm list --depth=0 | grep -q "$package"; then
    MISSING_PACKAGES="${MISSING_PACKAGES} $package"
  fi
done

# 不足パッケージがある場合はインストール
if [ ! -z "$MISSING_PACKAGES" ]; then
  echo -e "${YELLOW}以下のパッケージがインストールされていないため、インストールします:${NC} ${MISSING_PACKAGES}"
  npm install $MISSING_PACKAGES --save-dev
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}パッケージのインストールに失敗しました。手動でインストールしてください。${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}すべての依存パッケージが揃っています。${NC}"
fi

# ディレクトリの存在確認
if [ ! -d "frontend/src/pages/MonthlyReport" ]; then
  echo -e "${RED}必要なディレクトリが見つかりません: frontend/src/pages/MonthlyReport${NC}"
  echo "正しいディレクトリで実行しているか確認してください。"
  exit 1
fi

# スクリプトファイルの存在確認
if [ ! -f "frontend/src/pages/MonthlyReport/CSVImportTester.js" ]; then
  echo -e "${RED}CSVImportTester.js が見つかりません${NC}"
  echo "ファイルが正しい場所にあるか確認してください。"
  exit 1
fi

# 出力ディレクトリの作成
mkdir -p frontend/logs

# コマンドラインの構築
CMD="node frontend/src/pages/MonthlyReport/CSVImportTester.js --year $YEAR"

if [ "$REPAIR" = true ]; then
  CMD="${CMD} --repair"
fi

if [ "$VERBOSE" = true ]; then
  CMD="${CMD} --verbose"
fi

CMD="${CMD} --endpoint $API_ENDPOINT"

# 実行
echo -e "${BLUE}テストを実行します: ${NC}${CMD}"
echo "---------------------------------"

eval $CMD

# 結果の確認
if [ $? -eq 0 ]; then
  echo "---------------------------------"
  echo -e "${GREEN}テストが正常に完了しました！${NC}"
  
  if [ "$REPAIR" = true ]; then
    echo -e "${GREEN}データの修復も完了しました。${NC}"
  else
    echo -e "${YELLOW}修復を実行するには --repair フラグを付けて再実行してください。${NC}"
  fi
else
  echo "---------------------------------"
  echo -e "${RED}テスト中にエラーが発生しました。${NC}"
  echo "ログファイルを確認してください: frontend/logs"
  exit 1
fi

# インポート成功のリマインダー
echo "---------------------------------"
echo -e "${BLUE}次のステップ:${NC}"
echo "1. CSVImportStateSync.jsx を MonthlyReport/index.jsx に統合"
echo "2. アプリケーションを再起動"
echo "3. 実際のCSVインポートをテスト"
echo -e "${YELLOW}詳細は README-CSV-IMPORT-FIX.md を参照してください${NC}"

exit 0