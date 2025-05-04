#!/bin/bash

# api-tests.sh
# 障害者雇用管理システム APIエンドポイント検査スクリプト
# 
# 使用方法:
# chmod +x api-tests.sh
# ./api-tests.sh

# ANSI カラーコード
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 設定
BACKEND_URL="http://localhost:5001"
API_PREFIX="/api"
TIMEOUT=5
VERBOSE=1 # 詳細モード: 0=最小出力, 1=標準出力, 2=詳細出力

# ヘッダー出力
echo -e "${BOLD}${CYAN}=====================================${NC}"
echo -e "${BOLD}${CYAN}障害者雇用管理システム API診断スクリプト${NC}"
echo -e "${BOLD}${CYAN}=====================================${NC}\n"

# 接続テスト関数
function check_connection() {
  echo -e "${BOLD}[1] サーバー接続テスト${NC}"
  
  # DELETEメソッドはテストしないことに注意
  
  # HEADリクエストでサーバー疎通確認
  echo -e "  ${BLUE}>>>${NC} ${BACKEND_URL} にHEADリクエスト送信中..."
  
  response=$(curl -s -I -X HEAD -m $TIMEOUT "${BACKEND_URL}" 2>&1)
  
  if [[ "$response" == *"Connection refused"* || "$response" == *"Failed to connect"* ]]; then
    echo -e "  ${RED}✗${NC} サーバー接続失敗: ${response}"
    echo -e "  ${YELLOW}⚠${NC} サーバーが起動しているか確認してください。"
    return 1
  elif [[ "$response" == *"HTTP/"* ]]; then
    status_code=$(echo "$response" | head -n1 | cut -d' ' -f2)
    echo -e "  ${GREEN}✓${NC} サーバー応答確認: ステータスコード ${status_code}"
  else
    echo -e "  ${YELLOW}⚠${NC} 不明な応答: ${response}"
  fi
  
  return 0
}

# APIエンドポイントテスト関数
function test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local requestBody=$4
  local expectedStatusCode=${5:-200}
  
  url="${BACKEND_URL}${API_PREFIX}${endpoint}"
  
  echo -e "\n  ${BLUE}>${NC} ${method} ${endpoint} (${description})テスト中..."
  
  # curlコマンド引数を構築
  curlArgs=("-s" "-X" "${method}" "-m" "${TIMEOUT}" "-H" "Accept: application/json")
  
  # POSTとPUTにはJSONボディとContent-Typeを追加
  if [[ "$method" == "POST" || "$method" == "PUT" ]] && [[ -n "$requestBody" ]]; then
    curlArgs+=("-H" "Content-Type: application/json" "-d" "${requestBody}")
  fi
  
  # リクエスト実行
  if [[ $VERBOSE -ge 2 ]]; then
    echo -e "  ${PURPLE}リクエスト:${NC} curl -X ${method} ${url} ${requestBody:+'-d '$requestBody}"
  fi
  
  # CURL実行でヘッダーも含めて取得
  response_headers=$(mktemp)
  response_body=$(curl "${curlArgs[@]}" -D "${response_headers}" "${url}" 2>&1)
  curl_exit_code=$?
  
  # CURLエラーチェック
  if [[ $curl_exit_code -ne 0 ]]; then
    echo -e "  ${RED}✗${NC} リクエストエラー (${curl_exit_code}): ${response_body}"
    rm "${response_headers}"
    return 1
  fi
  
  # ステータスコード取得
  status_code=$(cat "${response_headers}" | head -n1 | cut -d' ' -f2)
  content_type=$(grep -i "content-type:" "${response_headers}" | head -n1 | sed 's/^[^:]*: //' | tr -d '\r')
  
  # 応答の確認
  if [[ "$status_code" == "$expectedStatusCode" ]]; then
    echo -e "  ${GREEN}✓${NC} ステータスコード: ${status_code} (期待値: ${expectedStatusCode})"
    
    # Content-Typeチェック
    if [[ "$content_type" == *"application/json"* ]]; then
      echo -e "  ${GREEN}✓${NC} Content-Type: ${content_type}"
    else
      echo -e "  ${YELLOW}⚠${NC} Content-Type: ${content_type} (JSON形式ではありません)"
    fi
    
    # レスポンスボディの確認
    if [[ -n "$response_body" ]]; then
      # JSONパース試行
      if echo "$response_body" | jq . >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} 有効なJSONレスポンス"
        
        # 詳細モードの場合、レスポンスの構造を表示
        if [[ $VERBOSE -ge 1 ]]; then
          response_truncated=$(echo "$response_body" | jq -c . | cut -c 1-150)
          if [[ ${#response_body} -gt 150 ]]; then
            response_truncated="${response_truncated}..."
          fi
          echo -e "  ${PURPLE}応答:${NC} ${response_truncated}"
        fi
      else
        echo -e "  ${RED}✗${NC} 無効なJSONレスポンス"
        
        # HTMLレスポンスの検出
        if [[ "$response_body" == *"<!DOCTYPE"* || "$response_body" == *"<html"* ]]; then
          echo -e "  ${RED}✗${NC} HTMLレスポンスが返されました (おそらく404ページ)"
          
          # HTMLの先頭部分を表示
          html_preview=$(echo "$response_body" | head -n 5 | tr -d '\n' | cut -c 1-150)
          echo -e "  ${PURPLE}HTML応答:${NC} ${html_preview}..."
          
          # 問題の診断
          echo -e "  ${YELLOW}⚠${NC} 考えられる原因:"
          echo -e "    - APIエンドポイントが存在しない"
          echo -e "    - ルーティング設定の問題"
          echo -e "    - プロキシ設定の問題"
          echo -e "    - CORSの設定不足"
        else
          # 無効なJSONの先頭部分を表示
          response_preview=$(echo "$response_body" | tr -d '\n' | cut -c 1-150)
          echo -e "  ${PURPLE}無効な応答:${NC} ${response_preview}..."
        fi
      fi
    else
      echo -e "  ${YELLOW}⚠${NC} 空のレスポンスボディ"
    fi
  else
    echo -e "  ${RED}✗${NC} ステータスコード: ${status_code} (期待値: ${expectedStatusCode})"
    
    # エラーレスポンスの詳細
    if [[ -n "$response_body" ]]; then
      if echo "$response_body" | jq . >/dev/null 2>&1; then
        echo -e "  ${PURPLE}エラー応答:${NC} $(echo "$response_body" | jq -c . | cut -c 1-150)..."
      else
        response_preview=$(echo "$response_body" | tr -d '\n' | cut -c 1-150)
        if [[ "$response_body" == *"<!DOCTYPE"* || "$response_body" == *"<html"* ]]; then
          echo -e "  ${RED}✗${NC} HTMLエラーページが返されました"
          echo -e "  ${PURPLE}HTML応答:${NC} ${response_preview}..."
        else
          echo -e "  ${PURPLE}応答:${NC} ${response_preview}..."
        fi
      fi
    fi
  fi
  
  # ヘッダーの詳細表示（詳細モード）
  if [[ $VERBOSE -ge 2 ]]; then
    echo -e "  ${PURPLE}ヘッダー:${NC}"
    cat "${response_headers}" | grep -v "^$" | while read -r line; do
      echo "    ${line}"
    done
  fi
  
  # 一時ファイル削除
  rm "${response_headers}"
  
  return 0
}

# CORSテスト関数
function test_cors() {
  echo -e "\n${BOLD}[2] CORS設定テスト${NC}"
  
  url="${BACKEND_URL}${API_PREFIX}/employees"
  
  echo -e "  ${BLUE}>>>${NC} CORSプリフライトリクエスト (OPTIONS) 送信中..."
  
  # OPTIONS (プリフライト) リクエスト送信
  response_headers=$(mktemp)
  response_body=$(curl -s -X OPTIONS -m $TIMEOUT \
    -H "Origin: http://example.com" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -D "${response_headers}" \
    "${url}" 2>&1)
  
  # ステータスコード取得
  status_code=$(cat "${response_headers}" | head -n1 | cut -d' ' -f2)
  
  # CORS成功の場合は通常200 or 204
  if [[ "$status_code" == "200" || "$status_code" == "204" ]]; then
    echo -e "  ${GREEN}✓${NC} プリフライト応答: ${status_code}"
  else
    echo -e "  ${YELLOW}⚠${NC} プリフライト応答: ${status_code} (通常は200または204)"
  fi
  
  # CORSヘッダーをチェック
  allow_origin=$(grep -i "Access-Control-Allow-Origin:" "${response_headers}" | head -n1 | sed 's/^[^:]*: //' | tr -d '\r')
  allow_methods=$(grep -i "Access-Control-Allow-Methods:" "${response_headers}" | head -n1 | sed 's/^[^:]*: //' | tr -d '\r')
  allow_headers=$(grep -i "Access-Control-Allow-Headers:" "${response_headers}" | head -n1 | sed 's/^[^:]*: //' | tr -d '\r')
  
  # Access-Control-Allow-Origin チェック
  if [[ -n "$allow_origin" ]]; then
    echo -e "  ${GREEN}✓${NC} Access-Control-Allow-Origin: ${allow_origin}"
    
    # ワイルドカードか確認
    if [[ "$allow_origin" == "*" ]]; then
      echo -e "  ${YELLOW}⚠${NC} ワイルドカード (*) が使用されています - 本番環境では特定のオリジンに制限することを推奨"
    fi
  else
    echo -e "  ${RED}✗${NC} Access-Control-Allow-Origin ヘッダーがありません"
    echo -e "  ${YELLOW}⚠${NC} クロスオリジンリクエストがブロックされる可能性があります"
  fi
  
  # Access-Control-Allow-Methods チェック
  if [[ -n "$allow_methods" ]]; then
    echo -e "  ${GREEN}✓${NC} Access-Control-Allow-Methods: ${allow_methods}"
  else
    echo -e "  ${RED}✗${NC} Access-Control-Allow-Methods ヘッダーがありません"
  fi
  
  # Access-Control-Allow-Headers チェック
  if [[ -n "$allow_headers" ]]; then
    echo -e "  ${GREEN}✓${NC} Access-Control-Allow-Headers: ${allow_headers}"
    
    # Content-Type ヘッダーが許可されているか
    if [[ "$allow_headers" == *"Content-Type"* || "$allow_headers" == "*" ]]; then
      echo -e "  ${GREEN}✓${NC} Content-Type ヘッダーが許可されています"
    else
      echo -e "  ${YELLOW}⚠${NC} Content-Type ヘッダーが明示的に許可されていない可能性があります"
    fi
  else
    echo -e "  ${RED}✗${NC} Access-Control-Allow-Headers ヘッダーがありません"
  fi
  
  # その他のCORSヘッダー
  max_age=$(grep -i "Access-Control-Max-Age:" "${response_headers}" | head -n1 | sed 's/^[^:]*: //' | tr -d '\r')
  if [[ -n "$max_age" ]]; then
    echo -e "  ${GREEN}✓${NC} Access-Control-Max-Age: ${max_age}"
  fi
  
  # 一時ファイル削除
  rm "${response_headers}"
}

# Content-Typeテスト関数
function test_content_type() {
  echo -e "\n${BOLD}[3] Content-Type設定テスト${NC}"
  
  # JSONを送信するテスト
  url="${BACKEND_URL}${API_PREFIX}/employees"
  
  echo -e "  ${BLUE}>>>${NC} Content-Type指定でJSONリクエスト送信中..."
  
  # テスト用のデータ (存在しないエンティティの可能性)
  test_data='{"name":"テスト","employee_id":"TEST-001","disability_type":"身体障害"}'
  
  # POSTリクエスト送信
  response_headers=$(mktemp)
  response_body=$(curl -s -X POST -m $TIMEOUT \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "${test_data}" \
    -D "${response_headers}" \
    "${url}" 2>&1)
  
  # ステータスコード取得
  status_code=$(cat "${response_headers}" | head -n1 | cut -d' ' -f2)
  content_type=$(grep -i "content-type:" "${response_headers}" | head -n1 | sed 's/^[^:]*: //' | tr -d '\r')
  
  # ステータスコードチェック - 201か400あたりを期待
  if [[ "$status_code" == "201" || "$status_code" == "200" ]]; then
    echo -e "  ${GREEN}✓${NC} リクエスト成功: ${status_code}"
    echo -e "  ${GREEN}✓${NC} 新規作成リクエストが成功しました"
  elif [[ "$status_code" == "400" || "$status_code" == "422" ]]; then
    echo -e "  ${GREEN}✓${NC} バリデーションエラー: ${status_code} (予想されるエラー)"
  elif [[ "$status_code" == "401" || "$status_code" == "403" ]]; then
    echo -e "  ${YELLOW}⚠${NC} 認証/認可エラー: ${status_code} (認証が必要なAPIです)"
  elif [[ "$status_code" == "404" ]]; then
    echo -e "  ${RED}✗${NC} エンドポイントが見つかりません: ${status_code}"
  else
    echo -e "  ${YELLOW}⚠${NC} 予期しないステータスコード: ${status_code}"
  fi
  
  # レスポンスのContent-Typeチェック
  if [[ -n "$content_type" ]]; then
    if [[ "$content_type" == *"application/json"* ]]; then
      echo -e "  ${GREEN}✓${NC} レスポンスのContent-Type: ${content_type}"
    else
      echo -e "  ${RED}✗${NC} レスポンスのContent-Type: ${content_type} (application/jsonではありません)"
    }
  else
    echo -e "  ${RED}✗${NC} レスポンスにContent-Typeヘッダーがありません"
  fi
  
  # レスポンスのJSONチェック
  if [[ -n "$response_body" ]]; then
    if echo "$response_body" | jq . >/dev/null 2>&1; then
      echo -e "  ${GREEN}✓${NC} 有効なJSONレスポンス"
      
      # レスポンスの内容を表示
      response_preview=$(echo "$response_body" | jq -c . | cut -c 1-150)
      echo -e "  ${PURPLE}応答:${NC} ${response_preview}..."
    else
      echo -e "  ${RED}✗${NC} 無効なJSONレスポンス"
      
      # HTMLかどうかをチェック
      if [[ "$response_body" == *"<!DOCTYPE"* || "$response_body" == *"<html"* ]]; then
        echo -e "  ${RED}✗${NC} HTMLが返されました (JSONが期待される場所で)"
        html_preview=$(echo "$response_body" | head -n 3 | tr -d '\n' | cut -c 1-150)
        echo -e "  ${PURPLE}HTML応答:${NC} ${html_preview}..."
        
        echo -e "  ${YELLOW}⚠${NC} 考えられる原因:"
        echo -e "    - APIエンドポイントが誤っている"
        echo -e "    - 認証が必要かもしれません"
        echo -e "    - サーバーエラーページがHTMLで返されている"
      else
        # 無効なJSONの先頭部分を表示
        response_preview=$(echo "$response_body" | tr -d '\n' | cut -c 1-150)
        echo -e "  ${PURPLE}無効な応答:${NC} ${response_preview}..."
      fi
    fi
  else
    echo -e "  ${YELLOW}⚠${NC} 空のレスポンスボディ"
  fi
  
  # 一時ファイル削除
  rm "${response_headers}"
}

# タイムアウトテスト関数
function test_timeout() {
  echo -e "\n${BOLD}[4] リクエストタイムアウトテスト${NC}"
  
  url="${BACKEND_URL}${API_PREFIX}/employees"
  
  echo -e "  ${BLUE}>>>${NC} 短いタイムアウト (1秒) でリクエスト送信中..."
  
  # 短いタイムアウトでリクエスト送信
  response=$(curl -s -m 1 "${url}" 2>&1)
  exit_code=$?
  
  if [[ $exit_code -eq 28 ]]; then
    echo -e "  ${YELLOW}⚠${NC} リクエストがタイムアウトしました"
    echo -e "  ${YELLOW}⚠${NC} サーバーの応答が遅い可能性があります"
  elif [[ $exit_code -eq 0 ]]; then
    echo -e "  ${GREEN}✓${NC} リクエストは1秒以内に完了しました"
  else
    echo -e "  ${RED}✗${NC} エラーが発生しました: ${response}"
  fi
  
  echo -e "  ${BLUE}>>>${NC} 標準タイムアウト (${TIMEOUT}秒) でリクエスト送信中..."
  
  # 標準タイムアウトでリクエスト送信
  response=$(curl -s -m $TIMEOUT "${url}" 2>&1)
  exit_code=$?
  
  if [[ $exit_code -eq 28 ]]; then
    echo -e "  ${RED}✗${NC} ${TIMEOUT}秒でもタイムアウトしました"
    echo -e "  ${RED}✗${NC} サーバーの応答に深刻な問題がある可能性があります"
  elif [[ $exit_code -eq 0 ]]; then
    echo -e "  ${GREEN}✓${NC} リクエストは${TIMEOUT}秒以内に完了しました"
  else
    echo -e "  ${RED}✗${NC} エラーが発生しました: ${response}"
  fi
}

# 404エラーの形式テスト関数
function test_404_format() {
  echo -e "\n${BOLD}[5] 404エラー形式テスト${NC}"
  
  # 存在しないエンドポイントへのリクエスト
  url="${BACKEND_URL}${API_PREFIX}/nonexistent-endpoint-test"
  
  echo -e "  ${BLUE}>>>${NC} 存在しないエンドポイントへリクエスト送信中..."
  
  response_headers=$(mktemp)
  response_body=$(curl -s -m $TIMEOUT \
    -H "Accept: application/json" \
    -D "${response_headers}" \
    "${url}" 2>&1)
  
  # ステータスコード取得
  status_code=$(cat "${response_headers}" | head -n1 | cut -d' ' -f2)
  content_type=$(grep -i "content-type:" "${response_headers}" | head -n1 | sed 's/^[^:]*: //' | tr -d '\r')
  
  # ステータスコードのチェック
  if [[ "$status_code" == "404" ]]; then
    echo -e "  ${GREEN}✓${NC} 正しいステータスコード: ${status_code}"
  else
    echo -e "  ${YELLOW}⚠${NC} 予期しないステータスコード: ${status_code} (404が期待されていました)"
  fi
  
  # Content-Typeのチェック
  if [[ -n "$content_type" ]]; then
    if [[ "$content_type" == *"application/json"* ]]; then
      echo -e "  ${GREEN}✓${NC} 正しいContent-Type: ${content_type}"
    else
      echo -e "  ${RED}✗${NC} 誤ったContent-Type: ${content_type} (application/jsonが期待されていました)"
    fi
  else
    echo -e "  ${RED}✗${NC} Content-Typeヘッダーがありません"
  fi
  
  # 応答内容のチェック
  if [[ -n "$response_body" ]]; then
    # JSON形式かチェック
    if echo "$response_body" | jq . >/dev/null 2>&1; then
      echo -e "  ${GREEN}✓${NC} 404エラーが正しくJSON形式で返されました"
      response_preview=$(echo "$response_body" | jq -c . | cut -c 1-150)
      echo -e "  ${PURPLE}応答:${NC} ${response_preview}..."
    else
      echo -e "  ${RED}✗${NC} 404エラーがJSON形式ではありません"
      
      # HTMLフォーマットかどうかをチェック
      if [[ "$response_body" == *"<!DOCTYPE"* || "$response_body" == *"<html"* ]]; then
        echo -e "  ${RED}✗${NC} HTML形式の404ページが返されました (Unexpected token '<' エラーの原因)"
        html_preview=$(echo "$response_body" | head -n 3 | tr -d '\n' | cut -c 1-150)
        echo -e "  ${PURPLE}HTML応答:${NC} ${html_preview}..."
        
        echo -e "  ${YELLOW}⚠${NC} 考えられる原因:"
        echo -e "    - バックエンドのエラーハンドリングがHTMLを返している"
        echo -e "    - Expressのエラーハンドリングミドルウェアが不足している"
        echo -e "    - app.use((req, res, next) => { res.status(404).json({ error: 'Not found' }); }); を追加することを推奨"
      else
        # その他の無効なレスポンス
        response_preview=$(echo "$response_body" | tr -d '\n' | cut -c 1-150)
        echo -e "  ${PURPLE}無効な応答:${NC} ${response_preview}..."
      fi
    fi
  else
    echo -e "  ${YELLOW}⚠${NC} 空のレスポンスボディ"
  fi
  
  # 一時ファイル削除
  rm "${response_headers}"
}

# メイン実行部分
check_connection
if [[ $? -eq 0 ]]; then
  # 主要なエンドポイントのテスト
  echo -e "\n${BOLD}[2] 主要APIエンドポイントのテスト${NC}"
  
  # GET /employees (一覧取得)
  test_endpoint "GET" "/employees" "従業員一覧取得"
  
  # GET /monthly-reports (一覧取得)
  test_endpoint "GET" "/monthly-reports" "月次レポート一覧取得"
  
  # GET /settings (設定取得)
  test_endpoint "GET" "/settings" "設定取得"
  
  # POST /employees (新規作成)
  test_data='{"name":"テスト太郎","employee_id":"TEST-001","disability_type":"身体障害","status":"在籍"}'
  test_endpoint "POST" "/employees" "従業員新規作成" "$test_data" "201"
  
  # CORS設定のテスト
  test_cors
  
  # Content-Typeテスト
  test_content_type
  
  # タイムアウトテスト
  test_timeout
  
  # 404エラー形式のテスト
  test_404_format
else
  echo -e "\n${RED}サーバー接続に失敗したため、APIテストをスキップします。${NC}"
fi

echo -e "\n${BOLD}${CYAN}=====================================${NC}"
echo -e "${BOLD}${CYAN}診断完了${NC}"
echo -e "${BOLD}${CYAN}=====================================${NC}"