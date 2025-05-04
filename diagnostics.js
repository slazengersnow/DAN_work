/**
 * diagnostics.js
 * 障害者雇用管理システム診断スクリプト
 * 
 * 使用方法:
 * node diagnostics.js
 * 
 * 目的:
 * - バックエンドサーバーの疎通確認
 * - APIエンドポイントの存在確認
 * - CORSヘッダーの検証
 * - レスポンス形式の検証
 * - プロキシ設定の確認
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 設定
const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:3001';
const API_ENDPOINTS = [
  { method: 'GET', path: '/api/employees', name: '従業員一覧取得' },
  { method: 'GET', path: '/api/monthly-reports', name: '月次レポート一覧取得' },
  { method: 'GET', path: '/api/settings', name: '設定取得' },
  { method: 'GET', path: '/api/health', name: 'ヘルスチェック' },
  { method: 'OPTIONS', path: '/api/employees', name: 'OPTIONS確認(CORS)' }
];

// 結果出力
let results = {
  serverStatus: null,
  endpointChecks: [],
  corsStatus: null,
  proxyStatus: null,
  configChecks: {
    frontend: null,
    backend: null
  },
  errors: [],
  recommendations: []
};

// コンソール出力用のスタイル
const styles = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

/**
 * HTTPリクエストを実行する関数
 */
async function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = options.url || '';
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: options.path || urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 5000
    };
    
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let parsedData;
        try {
          // JSONレスポンスの場合はパース
          if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
            parsedData = JSON.parse(data);
          } else {
            parsedData = data;
            
            // HTMLが返ってきた場合は最初の1000文字だけ保存
            if (data.startsWith('<!DOCTYPE') || data.startsWith('<html')) {
              parsedData = data.substring(0, 1000) + '... (省略)';
              
              // HTMLが返された場合はエラーと判断
              if (options.expectJson) {
                results.errors.push({
                  type: 'JSON期待エラー',
                  message: `エンドポイント ${options.path} へのリクエストがJSONの代わりにHTMLを返しました`,
                  statusCode: res.statusCode,
                  contentType: res.headers['content-type'],
                  data: parsedData.substring(0, 100) + '...'
                });
              }
            }
          }
        } catch (e) {
          // JSONパースエラー
          parsedData = {
            parseError: true,
            originalData: data.substring(0, 1000) + (data.length > 1000 ? '... (省略)' : ''),
            error: e.message
          };
          
          results.errors.push({
            type: 'JSONパースエラー',
            message: e.message,
            path: options.path,
            originalData: data.substring(0, 200) + '...'
          });
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData
        });
      });
    });
    
    req.on('error', (error) => {
      reject({
        error: error,
        message: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({
        error: new Error('Request timed out'),
        message: 'リクエストタイムアウト'
      });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * バックエンドサーバーの状態を確認
 */
async function checkServerStatus() {
  console.log(`${styles.bright}[1] バックエンドサーバー疎通確認${styles.reset}`);
  
  try {
    // サーバーのルートページを確認
    const rootResponse = await makeRequest({
      url: BACKEND_URL,
      path: '/',
      timeout: 3000
    });
    
    console.log(`  ${styles.green}✓${styles.reset} サーバー応答: ${rootResponse.statusCode}`);
    results.serverStatus = {
      status: 'online',
      statusCode: rootResponse.statusCode,
      contentType: rootResponse.headers['content-type']
    };
    
    // ヘルスチェックエンドポイントがあれば確認
    try {
      const healthResponse = await makeRequest({
        url: BACKEND_URL,
        path: '/api/health',
        timeout: 3000
      });
      
      console.log(`  ${styles.green}✓${styles.reset} ヘルスチェック: ${healthResponse.statusCode}`);
      results.serverStatus.health = {
        statusCode: healthResponse.statusCode,
        data: healthResponse.data
      };
    } catch (error) {
      console.log(`  ${styles.yellow}⚠${styles.reset} ヘルスチェックなし: ${error.message}`);
    }
  } catch (error) {
    console.log(`  ${styles.red}✗${styles.reset} サーバー応答なし: ${error.message}`);
    results.serverStatus = {
      status: 'offline',
      error: error.message
    };
    
    results.recommendations.push(
      'バックエンドサーバー (localhost:5001) が起動していないか、応答しません。サーバーを起動してください。',
      '別のプロセスが5001ポートを使用していないか確認してください。'
    );
  }
  
  console.log('');
}

/**
 * 主要なAPIエンドポイントを確認
 */
async function checkApiEndpoints() {
  console.log(`${styles.bright}[2] APIエンドポイント確認${styles.reset}`);
  
  // サーバーがオフラインなら確認しない
  if (results.serverStatus && results.serverStatus.status === 'offline') {
    console.log(`  ${styles.red}✗${styles.reset} サーバーオフラインのためスキップ`);
    return;
  }
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      const response = await makeRequest({
        url: BACKEND_URL,
        path: endpoint.path,
        method: endpoint.method,
        expectJson: endpoint.method !== 'OPTIONS',
        headers: {
          'Origin': FRONTEND_URL,
          'Accept': 'application/json'
        },
        timeout: 3000
      });
      
      // OPTIONS以外のリクエストでHTTPステータスコードが2xx以外の場合は警告
      if (endpoint.method !== 'OPTIONS' && (response.statusCode < 200 || response.statusCode >= 300)) {
        console.log(`  ${styles.yellow}⚠${styles.reset} ${endpoint.name}: ${response.statusCode} - 予期しないステータスコード`);
      } else {
        console.log(`  ${styles.green}✓${styles.reset} ${endpoint.name}: ${response.statusCode}`);
      }
      
      results.endpointChecks.push({
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        statusCode: response.statusCode,
        contentType: response.headers['content-type'],
        cors: endpoint.method === 'OPTIONS' ? checkCorsHeaders(response.headers) : null
      });
      
      // CORSリクエストの場合、ヘッダーを検証
      if (endpoint.method === 'OPTIONS') {
        const corsCheck = checkCorsHeaders(response.headers);
        results.corsStatus = corsCheck;
        
        if (!corsCheck.valid) {
          console.log(`  ${styles.yellow}⚠${styles.reset} CORS設定に問題があります: ${corsCheck.issues.join(', ')}`);
          results.recommendations.push(
            'バックエンドのCORS設定を修正してください。特に Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers を確認してください。'
          );
        }
      }
    } catch (error) {
      console.log(`  ${styles.red}✗${styles.reset} ${endpoint.name}: エラー - ${error.message}`);
      
      results.endpointChecks.push({
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        error: error.message
      });
      
      // エンドポイントが存在しない場合の推奨事項
      if (error.message.includes('ECONNREFUSED')) {
        results.recommendations.push(
          `APIエンドポイント ${endpoint.path} への接続が拒否されました。サーバーが正しく起動しているか確認してください。`
        );
      } else {
        results.recommendations.push(
          `APIエンドポイント ${endpoint.path} の確認中にエラーが発生しました。ルーティング設定とコントローラーを確認してください。`
        );
      }
    }
  }
  
  console.log('');
}

/**
 * CORSヘッダーを検証
 */
function checkCorsHeaders(headers) {
  const result = {
    valid: true,
    issues: []
  };
  
  // Access-Control-Allow-Origin
  if (!headers['access-control-allow-origin']) {
    result.valid = false;
    result.issues.push('Access-Control-Allow-Origin ヘッダーがありません');
  } else if (headers['access-control-allow-origin'] !== '*' && 
             headers['access-control-allow-origin'] !== FRONTEND_URL) {
    result.valid = false;
    result.issues.push(`Access-Control-Allow-Origin が ${FRONTEND_URL} を許可していません`);
  }
  
  // Access-Control-Allow-Methods
  if (!headers['access-control-allow-methods']) {
    result.valid = false;
    result.issues.push('Access-Control-Allow-Methods ヘッダーがありません');
  } else if (!headers['access-control-allow-methods'].includes('GET') || 
             !headers['access-control-allow-methods'].includes('POST')) {
    result.valid = false;
    result.issues.push('Access-Control-Allow-Methods に GET, POST が含まれていません');
  }
  
  // Access-Control-Allow-Headers
  if (!headers['access-control-allow-headers']) {
    result.valid = false;
    result.issues.push('Access-Control-Allow-Headers ヘッダーがありません');
  } else if (!headers['access-control-allow-headers'].includes('Content-Type')) {
    result.valid = false;
    result.issues.push('Access-Control-Allow-Headers に Content-Type が含まれていません');
  }
  
  return result;
}

/**
 * プロキシ設定の確認
 */
async function checkProxyConfig() {
  console.log(`${styles.bright}[3] プロキシ設定確認${styles.reset}`);
  
  // フロントエンドのpackage.jsonを読み込む
  try {
    const frontendPath = path.join(__dirname, 'frontend', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(frontendPath, 'utf8'));
    
    if (packageJson.proxy) {
      console.log(`  ${styles.green}✓${styles.reset} proxy設定: ${packageJson.proxy}`);
      results.proxyStatus = {
        exists: true,
        value: packageJson.proxy
      };
      
      // プロキシ設定が正しいか確認
      if (packageJson.proxy !== BACKEND_URL) {
        console.log(`  ${styles.yellow}⚠${styles.reset} proxy設定が想定値 ${BACKEND_URL} と異なります`);
        results.recommendations.push(
          `フロントエンドのpackage.jsonのproxy設定が ${packageJson.proxy} になっています。${BACKEND_URL} に変更してみてください。`
        );
      }
    } else {
      console.log(`  ${styles.red}✗${styles.reset} package.jsonにproxy設定がありません`);
      results.proxyStatus = {
        exists: false
      };
      results.recommendations.push(
        `フロントエンドのpackage.jsonにproxy: "${BACKEND_URL}" を追加してください。`
      );
    }
  } catch (error) {
    console.log(`  ${styles.red}✗${styles.reset} package.jsonの読み込みに失敗: ${error.message}`);
    results.proxyStatus = {
      error: error.message
    };
  }
  
  // APIクライアント(client.ts)を確認
  try {
    const clientPath = path.join(__dirname, 'frontend', 'src', 'api', 'client.ts');
    if (fs.existsSync(clientPath)) {
      const clientContent = fs.readFileSync(clientPath, 'utf8');
      
      // baseURLの設定を確認
      const baseUrlMatch = clientContent.match(/baseURL:.*['"](.+)['"]/);
      if (baseUrlMatch) {
        const baseUrl = baseUrlMatch[1];
        console.log(`  ${styles.green}✓${styles.reset} APIクライアントのbaseURL: ${baseUrl}`);
        
        results.proxyStatus = {
          ...(results.proxyStatus || {}),
          clientBaseUrl: baseUrl
        };
        
        // baseURLがプロキシと競合していないか確認
        if (baseUrl.includes('localhost') && results.proxyStatus && results.proxyStatus.exists) {
          console.log(`  ${styles.yellow}⚠${styles.reset} baseURLとproxy設定が競合している可能性があります`);
          results.recommendations.push(
            `APIクライアントのbaseURLとpackage.jsonのproxy設定が競合している可能性があります。開発環境ではbaseURLを空文字列にするか、相対パスにすることを検討してください。`
          );
        }
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} APIクライアントにbaseURLの設定が見つかりません`);
      }
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} APIクライアントファイルが見つかりません: ${clientPath}`);
    }
  } catch (error) {
    console.log(`  ${styles.red}✗${styles.reset} APIクライアントの確認に失敗: ${error.message}`);
  }
  
  console.log('');
}

/**
 * 設定ファイルの確認
 */
async function checkConfigurations() {
  console.log(`${styles.bright}[4] 設定ファイル確認${styles.reset}`);
  
  // フロントエンド設定確認
  try {
    // .envファイルの確認
    const envPath = path.join(__dirname, 'frontend', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log(`  ${styles.green}✓${styles.reset} .envファイルが存在します`);
      
      // API_URLの設定を確認
      const apiUrlMatch = envContent.match(/REACT_APP_API_URL=(.+)/);
      if (apiUrlMatch) {
        console.log(`  ${styles.green}✓${styles.reset} REACT_APP_API_URL: ${apiUrlMatch[1]}`);
        results.configChecks.frontend = {
          ...(results.configChecks.frontend || {}),
          apiUrl: apiUrlMatch[1]
        };
        
        // API_URLとプロキシ設定の整合性確認
        if (results.proxyStatus && results.proxyStatus.exists && apiUrlMatch[1] !== '') {
          console.log(`  ${styles.yellow}⚠${styles.reset} REACT_APP_API_URLとproxy設定が競合している可能性があります`);
          results.recommendations.push(
            `開発環境では、.envファイルのREACT_APP_API_URLを空にするか、プロキシと一致させてください。`
          );
        }
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} .envファイルにREACT_APP_API_URLが設定されていません`);
      }
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} .envファイルが見つかりません`);
    }
    
    // tsconfig.jsonの確認
    const tsconfigPath = path.join(__dirname, 'frontend', 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      console.log(`  ${styles.green}✓${styles.reset} tsconfig.jsonが存在します`);
      
      // esModuleInteropの確認
      if (tsconfigContent.compilerOptions && tsconfigContent.compilerOptions.esModuleInterop) {
        console.log(`  ${styles.green}✓${styles.reset} esModuleInteropが有効です`);
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} esModuleInteropが無効か設定されていません`);
        results.recommendations.push(
          `tsconfig.jsonでesModuleInteropを有効にすることを検討してください。`
        );
      }
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} tsconfig.jsonが見つかりません`);
    }
  } catch (error) {
    console.log(`  ${styles.red}✗${styles.reset} フロントエンド設定の確認に失敗: ${error.message}`);
  }
  
  // バックエンド設定確認
  try {
    // server.jsの確認
    const serverPath = path.join(__dirname, 'backend', 'server.js');
    if (fs.existsSync(serverPath)) {
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      console.log(`  ${styles.green}✓${styles.reset} server.jsが存在します`);
      
      // CORSの設定を確認
      if (serverContent.includes('cors')) {
        console.log(`  ${styles.green}✓${styles.reset} CORSの設定があります`);
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} CORSの設定が見つかりません`);
        results.recommendations.push(
          `バックエンドのserver.jsにCORS設定を追加してください。`
        );
      }
      
      // APIルートのプレフィックスを確認
      const apiPrefixMatch = serverContent.match(/app\.use\(['"](.+)['"]/);
      if (apiPrefixMatch) {
        console.log(`  ${styles.green}✓${styles.reset} APIルートプレフィックス: ${apiPrefixMatch[1]}`);
        
        // APIプレフィックスがフロントエンドと整合しているか確認
        const clientPath = path.join(__dirname, 'frontend', 'src', 'api', 'client.ts');
        if (fs.existsSync(clientPath)) {
          const clientContent = fs.readFileSync(clientPath, 'utf8');
          if (!clientContent.includes(apiPrefixMatch[1])) {
            console.log(`  ${styles.yellow}⚠${styles.reset} APIプレフィックスがクライアント設定と一致しない可能性があります`);
            results.recommendations.push(
              `バックエンドとフロントエンドでAPIプレフィックスが一致していない可能性があります。確認してください。`
            );
          }
        }
      }
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} server.jsが見つかりません`);
    }
    
    // .envファイルの確認
    const envPath = path.join(__dirname, 'backend', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log(`  ${styles.green}✓${styles.reset} バックエンド.envファイルが存在します`);
      
      // PORTの設定を確認
      const portMatch = envContent.match(/PORT=(.+)/);
      if (portMatch) {
        console.log(`  ${styles.green}✓${styles.reset} PORT設定: ${portMatch[1]}`);
        if (portMatch[1] !== '5001') {
          console.log(`  ${styles.yellow}⚠${styles.reset} PORTが想定値(5001)と異なります`);
          results.recommendations.push(
            `バックエンドの.envファイルでPORT=5001に設定することをお勧めします。`
          );
        }
      }
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} バックエンド.envファイルが見つかりません`);
    }
  } catch (error) {
    console.log(`  ${styles.red}✗${styles.reset} バックエンド設定の確認に失敗: ${error.message}`);
  }
  
  console.log('');
}

/**
 * クライアントAPIが動作するかテスト
 */
async function testClientAPI() {
  console.log(`${styles.bright}[5] クライアントAPI動作テスト${styles.reset}`);
  
  // テスト用スクリプトを作成
  const testClientPath = path.join(__dirname, 'test-client.js');
  const testClientContent = `
const axios = require('axios');

// APIクライアント設定
const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 動作確認テスト
async function runTest() {
  try {
    console.log('GET /api/employees テスト...');
    const response = await apiClient.get('/employees');
    console.log(\`ステータス: \${response.status}\`);
    console.log(\`データ: \${JSON.stringify(response.data).substring(0, 100)}...\`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.log(\`ステータス: \${error.response.status}\`);
      console.log(\`ヘッダー: \${JSON.stringify(error.response.headers)}\`);
      if (error.response.data) {
        console.log(\`データ: \${JSON.stringify(error.response.data).substring(0, 200)}...\`);
      }
      return { success: false, error: error.message, response: error.response };
    } else {
      return { success: false, error: error.message };
    }
  }
}

runTest();
  `;
  
  try {
    // 一時的にテスト用スクリプトを作成
    fs.writeFileSync(testClientPath, testClientContent, 'utf8');
    
    // スクリプトを実行
    console.log(`  ${styles.blue}i${styles.reset} APIクライアントテスト実行中...`);
    const { stdout, stderr } = await execAsync(`node ${testClientPath}`);
    
    if (stderr) {
      console.log(`  ${styles.red}✗${styles.reset} エラー: ${stderr}`);
      results.errors.push({
        type: 'APIクライアントテストエラー',
        message: stderr
      });
    } else {
      console.log(`  ${styles.green}✓${styles.reset} テスト完了`);
      console.log(`  ${styles.dim}${stdout}${styles.reset}`);
      
      // JSONパースエラーがスタックトレースに含まれていないか確認
      if (stdout.includes('SyntaxError: Unexpected token') || 
          stdout.includes('is not valid JSON')) {
        console.log(`  ${styles.red}✗${styles.reset} JSONパースエラーを検出`);
        results.errors.push({
          type: 'JSONパースエラー',
          message: '標準的なAPIクライアントテストでJSONパースエラーが発生しました'
        });
        results.recommendations.push(
          'バックエンドが有効なJSONを返していない可能性があります。レスポンスヘッダーのContent-Typeが application/json になっているか確認してください。',
          'HTML形式のエラーページが返されている可能性があります。CORSやプロキシの設定を見直してください。'
        );
      }
    }
  } catch (error) {
    console.log(`  ${styles.red}✗${styles.reset} テスト実行に失敗: ${error.message}`);
  } finally {
    // テスト用スクリプトを削除
    if (fs.existsSync(testClientPath)) {
      fs.unlinkSync(testClientPath);
    }
  }
  
  console.log('');
}

/**
 * クロスオリジンリクエストをエミュレート
 */
async function emulateCrossOriginRequest() {
  console.log(`${styles.bright}[6] クロスオリジンリクエスト確認${styles.reset}`);
  
  try {
    const response = await makeRequest({
      url: BACKEND_URL,
      path: '/api/employees',
      headers: {
        'Origin': 'http://example.com', // 異なるオリジン
        'Accept': 'application/json'
      }
    });
    
    // CORSエラーが発生しないか確認
    if (response.statusCode === 200) {
      console.log(`  ${styles.green}✓${styles.reset} クロスオリジンリクエスト成功`);
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} クロスオリジンリクエスト: ${response.statusCode}`);
    }
    
    // CORSヘッダーを確認
    if (response.headers['access-control-allow-origin']) {
      console.log(`  ${styles.green}✓${styles.reset} Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin']}`);
      
      // フロントエンドのオリジンが許可されているか確認
      if (response.headers['access-control-allow-origin'] !== '*' && 
          response.headers['access-control-allow-origin'] !== FRONTEND_URL) {
        console.log(`  ${styles.yellow}⚠${styles.reset} フロントエンドのオリジン ${FRONTEND_URL} が明示的に許可されていない可能性があります`);
        results.recommendations.push(
          `バックエンドのCORS設定でフロントエンドのオリジン ${FRONTEND_URL} を明示的に許可することをお勧めします。`
        );
      }
    } else {
      console.log(`  ${styles.red}✗${styles.reset} CORSヘッダーが返されていません`);
      results.recommendations.push(
        'バックエンドがCORSヘッダーを返していません。CORS設定を追加してください。'
      );
    }
  } catch (error) {
    console.log(`  ${styles.red}✗${styles.reset} クロスオリジンテストに失敗: ${error.message}`);
  }
  
  console.log('');
}

/**
 * HTML 404レスポンスが返される問題を確認
 */
async function checkHtml404Issue() {
  console.log(`${styles.bright}[7] HTML 404レスポンス確認${styles.reset}`);
  
  try {
    // 存在しないパスでAPIリクエストを実行
    const response = await makeRequest({
      url: BACKEND_URL,
      path: '/api/nonexistent',
      expectJson: true
    });
    
    // レスポンスがHTMLかどうかを確認
    if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
      console.log(`  ${styles.red}✗${styles.reset} HTML 404レスポンスを確認: Content-Type: ${response.headers['content-type']}`);
      
      results.errors.push({
        type: 'HTML 404エラー',
        message: '存在しないAPIパスに対してHTMLレスポンスが返されています',
        statusCode: response.statusCode,
        contentType: response.headers['content-type']
      });
      
      results.recommendations.push(
        'バックエンドのExpressエラーハンドリングを修正し、API以外のルートへのリクエストが発生した場合でもJSONレスポンスを返すようにしてください。',
        'app.use((req, res, next) => { res.status(404).json({ error: "Not found" }); }); のようなミドルウェアを追加することをお勧めします。'
      );
    } else if (response.statusCode === 404 && response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
      console.log(`  ${styles.green}✓${styles.reset} JSON 404レスポンスを確認: ${response.statusCode}`);
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} 未知の404レスポンス形式: ${response.statusCode}, Content-Type: ${response.headers['content-type'] || 'なし'}`);
    }
  } catch (error) {
    console.log(`  ${styles.red}✗${styles.reset} 404テストに失敗: ${error.message}`);
    
    results.errors.push({
      type: '404テストエラー',
      message: error.message
    });
  }
  
  console.log('');
}

/**
 * エラーの分析と推奨対応を生成
 */
function analyzeIssues() {
  console.log(`${styles.bright}[8] 問題分析と推奨対応${styles.reset}`);
  
  // 明確なエラーがない場合は追加の確認
  if (results.errors.length === 0 && results.recommendations.length === 0) {
    // サーバーがオフライン
    if (results.serverStatus && results.serverStatus.status === 'offline') {
      results.recommendations.push(
        'バックエンドサーバーが起動していません。サーバーを起動してください。',
        'サーバー起動コマンド: cd backend && npm start'
      );
    }
    
    // プロキシ設定の問題
    if (results.proxyStatus && !results.proxyStatus.exists) {
      results.recommendations.push(
        'フロントエンドのpackage.jsonにproxy設定が不足しています。',
        `package.jsonに "proxy": "${BACKEND_URL}" を追加してください。`
      );
    }
  }
  
  // JSONパースエラーに関連する推奨対応
  const hasJsonParseError = results.errors.some(err => err.type === 'JSONパースエラー');
  if (hasJsonParseError) {
    results.recommendations.push(
      'JSONパースエラーが検出されました。以下を確認してください:',
      '1. バックエンドのレスポンスヘッダーにContent-Type: application/jsonが設定されているか',
      '2. HTMLレスポンスが返されている場合、プロキシ設定やCORS設定を見直す',
      '3. Content-TypeヘッダーがExpressの適切なミドルウェアで設定されているか確認'
    );
  }
  
  // HTML 404レスポンスに関連する推奨対応
  const hasHtml404Error = results.errors.some(err => err.type === 'HTML 404エラー');
  if (hasHtml404Error) {
    results.recommendations.push(
      'API以外のパスへのリクエストでHTMLエラーページが返されています:',
      '1. Expressのエラーハンドリングミドルウェアを追加する',
      '2. 404エラーの場合でもJSONレスポンスを返すようにする',
      '3. app.use((req, res) => { res.status(404).json({ error: "Not found" }); });'
    );
  }
  
  // 推奨対応がない場合のデフォルト
  if (results.recommendations.length === 0) {
    results.recommendations.push(
      '特に問題は検出されませんでした。以下の点を確認してください:',
      '1. フロントエンドとバックエンドの両方が正常に起動しているか',
      '2. APIエンドポイントのパスが正確か',
      '3. リクエスト/レスポンスの形式が一致しているか'
    );
  }
  
  // 推奨対応を表示
  console.log(`  ${styles.bright}推奨対応:${styles.reset}`);
  results.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  
  console.log('');
}

/**
 * 診断結果のサマリーを表示・出力
 */
function generateSummary() {
  console.log(`${styles.bright}${styles.cyan}====================================
障害者雇用管理システム診断結果
====================================${styles.reset}`);
  
  // サーバー状態
  console.log(`\n${styles.bright}[1] サーバー疎通チェック${styles.reset}`);
  if (results.serverStatus && results.serverStatus.status === 'online') {
    console.log(`- localhost:5001の応答: ${styles.green}✓ OK${styles.reset}`);
  } else {
    console.log(`- localhost:5001の応答: ${styles.red}✗ NG${styles.reset} - ${results.serverStatus ? results.serverStatus.error : 'テスト未実施'}`);
  }
  
  // エンドポイント確認
  console.log(`- エンドポイント存在確認:`);
  results.endpointChecks.forEach(endpoint => {
    const statusSymbol = endpoint.statusCode && endpoint.statusCode >= 200 && endpoint.statusCode < 300 ? 
      `${styles.green}✓${styles.reset}` : 
      (endpoint.error ? `${styles.red}✗${styles.reset}` : `${styles.yellow}⚠${styles.reset}`);
    
    const statusInfo = endpoint.statusCode ? 
      `(${endpoint.statusCode})` : 
      (endpoint.error ? `(${endpoint.error})` : '');
    
    console.log(`  ${statusSymbol} ${endpoint.path} ${statusInfo}`);
  });
  
  // ネットワーク設定
  console.log(`\n${styles.bright}[2] ネットワーク設定チェック${styles.reset}`);
  if (results.corsStatus && results.corsStatus.valid) {
    console.log(`- CORS設定: ${styles.green}✓ OK${styles.reset}`);
  } else if (results.corsStatus) {
    console.log(`- CORS設定: ${styles.red}✗ NG${styles.reset} - ${results.corsStatus.issues.join(', ')}`);
  } else {
    console.log(`- CORS設定: ${styles.yellow}⚠ 未確認${styles.reset}`);
  }
  
  if (results.proxyStatus && results.proxyStatus.exists) {
    console.log(`- プロキシ設定: ${styles.green}✓ OK${styles.reset} - ${results.proxyStatus.value}`);
  } else if (results.proxyStatus) {
    console.log(`- プロキシ設定: ${styles.red}✗ NG${styles.reset} - 設定なし`);
  } else {
    console.log(`- プロキシ設定: ${styles.yellow}⚠ 未確認${styles.reset}`);
  }
  
  // エラー詳細
  if (results.errors.length > 0) {
    console.log(`\n${styles.bright}[4] エラー詳細${styles.reset}`);
    results.errors.forEach((error, i) => {
      console.log(`- エラータイプ: ${styles.red}${error.type}${styles.reset}`);
      console.log(`- 詳細メッセージ: ${error.message}`);
      if (error.path) {
        console.log(`- パス: ${error.path}`);
      }
      if (error.statusCode) {
        console.log(`- ステータスコード: ${error.statusCode}`);
      }
      if (error.contentType) {
        console.log(`- Content-Type: ${error.contentType}`);
      }
      if (i < results.errors.length - 1) {
        console.log('');
      }
    });
  }
  
  // 推奨対応
  console.log(`\n${styles.bright}[5] 推奨対応${styles.reset}`);
  results.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });
  
  console.log(`\n${styles.bright}${styles.cyan}====================================${styles.reset}`);
  
  // 診断結果をファイルに保存
  const resultsFile = path.join(__dirname, 'diagnostic-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n診断結果を ${resultsFile} に保存しました`);
}

/**
 * メイン関数
 */
async function main() {
  console.log(`${styles.bright}${styles.cyan}
====================================
障害者雇用管理システム診断スクリプト
====================================${styles.reset}\n`);
  
  try {
    // 各種チェックを実行
    await checkServerStatus();
    await checkApiEndpoints();
    await checkProxyConfig();
    await checkConfigurations();
    await testClientAPI();
    await emulateCrossOriginRequest();
    await checkHtml404Issue();
    
    // 問題の分析と推奨対応の生成
    analyzeIssues();
    
    // 診断結果のサマリーを表示・出力
    generateSummary();
  } catch (error) {
    console.error(`${styles.red}エラーが発生しました: ${error.message}${styles.reset}`);
  }
}

// メイン関数を実行
main();