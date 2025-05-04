/**
 * check-frontend-config.js
 * 障害者雇用管理システム フロントエンド設定診断スクリプト
 * 
 * 使用方法:
 * node check-frontend-config.js
 * 
 * 目的:
 * - フロントエンドの設定を確認し、JSONパースエラーの原因となる問題を特定
 * - API接続設定、プロキシ設定、環境変数などを診断
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 設定
const FRONTEND_DIR = path.join(__dirname, 'frontend');
const FRONTEND_SRC_DIR = path.join(FRONTEND_DIR, 'src');
const BACKEND_URL = 'http://localhost:5001';

// コンソール出力スタイル
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

// 結果オブジェクト
const results = {
  packageJson: null,
  envFiles: [],
  apiClient: null,
  issues: [],
  recommendations: []
};

/**
 * ファイルの存在確認
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

/**
 * package.jsonの確認
 */
function checkPackageJson() {
  console.log(`${styles.bright}[1] package.json設定診断${styles.reset}`);
  
  const packageJsonPath = path.join(FRONTEND_DIR, 'package.json');
  
  if (!fileExists(packageJsonPath)) {
    console.log(`  ${styles.red}✗${styles.reset} package.jsonが見つかりません: ${packageJsonPath}`);
    results.issues.push('package.jsonファイルが見つかりません');
    results.recommendations.push('frontend ディレクトリが正しいか確認してください');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    results.packageJson = packageJson;
    
    console.log(`  ${styles.green}✓${styles.reset} package.jsonを読み込みました`);
    
    // proxy設定の確認
    if (packageJson.proxy) {
      console.log(`  ${styles.green}✓${styles.reset} proxy設定: ${packageJson.proxy}`);
      
      // プロキシがバックエンドURLと一致するか確認
      if (packageJson.proxy === BACKEND_URL) {
        console.log(`  ${styles.green}✓${styles.reset} プロキシ設定は正しいバックエンドURLを指しています`);
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} プロキシ設定 (${packageJson.proxy}) が想定値 (${BACKEND_URL}) と異なります`);
        results.issues.push(`プロキシ設定が想定と異なります: ${packageJson.proxy} vs ${BACKEND_URL}`);
        results.recommendations.push(`package.jsonのproxy設定を "${BACKEND_URL}" に変更してください`);
      }
    } else {
      console.log(`  ${styles.red}✗${styles.reset} proxy設定がありません`);
      results.issues.push('package.jsonにproxy設定がありません');
      results.recommendations.push(`package.jsonに "proxy": "${BACKEND_URL}" を追加してください`);
    }
    
    // 必要な依存関係の確認
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Axiosの確認
    if (dependencies.axios) {
      console.log(`  ${styles.green}✓${styles.reset} axios: ${dependencies.axios}`);
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} axiosが依存関係に見つかりません`);
      results.issues.push('axiosが依存関係に見つかりません');
      results.recommendations.push('npm install axios を実行してください');
    }
    
    // React Queryの確認
    if (dependencies['react-query']) {
      console.log(`  ${styles.green}✓${styles.reset} react-query: ${dependencies['react-query']}`);
    } else if (dependencies['@tanstack/react-query']) {
      console.log(`  ${styles.green}✓${styles.reset} @tanstack/react-query: ${dependencies['@tanstack/react-query']}`);
    }
    
    // スクリプトコマンドの確認
    if (packageJson.scripts) {
      if (packageJson.scripts.start) {
        console.log(`  ${styles.green}✓${styles.reset} start script: ${packageJson.scripts.start}`);
        
        // ポートが明示的に指定されているか確認
        if (packageJson.scripts.start.includes('PORT=')) {
          const portMatch = packageJson.scripts.start.match(/PORT=(\d+)/);
          if (portMatch) {
            const port = portMatch[1];
            console.log(`  ${styles.green}✓${styles.reset} フロントエンドポート: ${port}`);
            
            // デフォルトでない場合は注意
            if (port !== '3000' && port !== '3001') {
              console.log(`  ${styles.yellow}⚠${styles.reset} 非標準ポート: ${port} (通常は3000または3001)`);
            }
          }
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} ポートが明示的に指定されていません`);
        }
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} start scriptが見つかりません`);
      }
    }
  } catch (err) {
    console.log(`  ${styles.red}✗${styles.reset} package.jsonの解析に失敗: ${err.message}`);
    results.issues.push(`package.jsonの解析に失敗: ${err.message}`);
  }
  
  console.log('');
}

/**
 * 環境変数ファイルの確認
 */
function checkEnvFiles() {
  console.log(`${styles.bright}[2] 環境変数設定診断${styles.reset}`);
  
  const envFiles = [
    { path: path.join(FRONTEND_DIR, '.env'), name: '.env' },
    { path: path.join(FRONTEND_DIR, '.env.development'), name: '.env.development' },
    { path: path.join(FRONTEND_DIR, '.env.local'), name: '.env.local' }
  ];
  
  let foundEnvFile = false;
  
  for (const envFile of envFiles) {
    if (fileExists(envFile.path)) {
      foundEnvFile = true;
      console.log(`  ${styles.green}✓${styles.reset} ${envFile.name}が見つかりました`);
      
      try {
        const content = fs.readFileSync(envFile.path, 'utf8');
        const envVars = {};
        
        // 環境変数を抽出
        content.split('\n').forEach(line => {
          const match = line.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            envVars[key] = value;
          }
        });
        
        results.envFiles.push({
          name: envFile.name,
          path: envFile.path,
          vars: envVars
        });
        
        // REACT_APP_API_URLの確認
        if (envVars.REACT_APP_API_URL) {
          console.log(`  ${styles.green}✓${styles.reset} REACT_APP_API_URL: ${envVars.REACT_APP_API_URL}`);
          
          // APIのURLとバックエンドが一致するか確認
          if (envVars.REACT_APP_API_URL.includes('localhost:5001')) {
            console.log(`  ${styles.green}✓${styles.reset} API URLは正しいバックエンドを指しています`);
          } else if (envVars.REACT_APP_API_URL === '') {
            console.log(`  ${styles.green}✓${styles.reset} API URLは空で、プロキシを使用する構成です`);
          } else {
            console.log(`  ${styles.yellow}⚠${styles.reset} API URL (${envVars.REACT_APP_API_URL}) が想定値と異なります`);
            results.issues.push(`API URL設定が想定と異なります: ${envVars.REACT_APP_API_URL}`);
            results.recommendations.push(`${envFile.name}のREACT_APP_API_URLを空文字列にするか、"http://localhost:5001/api"に設定してください`);
          }
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} REACT_APP_API_URLが設定されていません`);
        }
        
        // NODE_ENVの確認 (通常は.envファイルには設定しない)
        if (envVars.NODE_ENV) {
          console.log(`  ${styles.yellow}⚠${styles.reset} NODE_ENVが.envファイルで設定されています: ${envVars.NODE_ENV}`);
          results.issues.push(`NODE_ENVが.envファイルで設定されています: ${envVars.NODE_ENV}`);
          results.recommendations.push('NODE_ENVは環境変数として設定すべきで、.envファイルには含めないでください');
        }
      } catch (err) {
        console.log(`  ${styles.red}✗${styles.reset} ${envFile.name}の読み込みに失敗: ${err.message}`);
      }
    }
  }
  
  if (!foundEnvFile) {
    console.log(`  ${styles.yellow}⚠${styles.reset} 環境変数ファイルが見つかりません`);
    results.issues.push('環境変数ファイル (.env) が見つかりません');
    results.recommendations.push('.envファイルを作成し、必要な環境変数を設定してください');
  }
  
  console.log('');
}

/**
 * APIクライアント設定の確認
 */
function checkApiClient() {
  console.log(`${styles.bright}[3] APIクライアント設定診断${styles.reset}`);
  
  // 可能性のあるAPIクライアントファイルのパス
  const apiClientPaths = [
    path.join(FRONTEND_SRC_DIR, 'api', 'client.ts'),
    path.join(FRONTEND_SRC_DIR, 'api', 'client.js'),
    path.join(FRONTEND_SRC_DIR, 'api', 'apiClient.ts'),
    path.join(FRONTEND_SRC_DIR, 'api', 'apiClient.js'),
    path.join(FRONTEND_SRC_DIR, 'services', 'api.ts'),
    path.join(FRONTEND_SRC_DIR, 'services', 'api.js')
  ];
  
  let foundApiClient = false;
  let apiClientPath = null;
  
  // APIクライアントファイルを探索
  for (const clientPath of apiClientPaths) {
    if (fileExists(clientPath)) {
      foundApiClient = true;
      apiClientPath = clientPath;
      console.log(`  ${styles.green}✓${styles.reset} APIクライアントが見つかりました: ${path.relative(FRONTEND_DIR, clientPath)}`);
      break;
    }
  }
  
  if (!foundApiClient) {
    console.log(`  ${styles.yellow}⚠${styles.reset} APIクライアントファイルが見つかりません`);
    
    // src/apiディレクトリを確認
    const apiDir = path.join(FRONTEND_SRC_DIR, 'api');
    if (fileExists(apiDir)) {
      try {
        const files = fs.readdirSync(apiDir);
        console.log(`  ${styles.blue}i${styles.reset} api/ディレクトリにあるファイル: ${files.join(', ')}`);
        
        // ファイルが存在する場合、最初のファイルを確認
        if (files.length > 0) {
          const firstApiFile = path.join(apiDir, files[0]);
          apiClientPath = firstApiFile;
          console.log(`  ${styles.yellow}⚠${styles.reset} 代わりに確認するファイル: ${path.relative(FRONTEND_DIR, firstApiFile)}`);
        }
      } catch (err) {
        console.log(`  ${styles.red}✗${styles.reset} api/ディレクトリの読み込みに失敗: ${err.message}`);
      }
    } else {
      results.issues.push('APIクライアントファイルが見つかりません');
      results.recommendations.push('src/api/client.tsファイルを探すか作成してください');
    }
  }
  
  // APIクライアントの内容を解析
  if (apiClientPath) {
    try {
      const content = fs.readFileSync(apiClientPath, 'utf8');
      
      // baseURLの設定を探す
      const baseUrlMatch = content.match(/baseURL\s*:\s*(['"])(.*?)(\1)/);
      if (baseUrlMatch) {
        const baseUrl = baseUrlMatch[2];
        console.log(`  ${styles.green}✓${styles.reset} baseURL設定: ${baseUrl}`);
        
        results.apiClient = {
          path: apiClientPath,
          baseUrl: baseUrl
        };
        
        // baseURLとプロキシ設定の整合性を確認
        if (results.packageJson && results.packageJson.proxy) {
          if (baseUrl === '' || baseUrl === '/' || baseUrl === '/api') {
            console.log(`  ${styles.green}✓${styles.reset} baseURLはプロキシ使用に適しています`);
          } else if (baseUrl.includes('localhost') || baseUrl.includes('http://') || baseUrl.includes('https://')) {
            console.log(`  ${styles.yellow}⚠${styles.reset} baseURLが絶対URLになっています。プロキシが機能しない可能性があります`);
            results.issues.push(`APIクライアントのbaseURL (${baseUrl}) がプロキシと競合する可能性があります`);
            results.recommendations.push('baseURLを空文字列または "/api" に変更して、プロキシを使用するようにしてください');
          }
        }
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} baseURL設定が見つかりません`);
        results.issues.push('APIクライアントでbaseURL設定が見つかりません');
      }
      
      // タイムアウト設定を確認
      const timeoutMatch = content.match(/timeout\s*:\s*(\d+)/);
      if (timeoutMatch) {
        const timeout = parseInt(timeoutMatch[1], 10);
        console.log(`  ${styles.green}✓${styles.reset} タイムアウト設定: ${timeout}ms`);
        
        if (timeout < 5000) {
          console.log(`  ${styles.yellow}⚠${styles.reset} タイムアウトが短すぎる可能性があります: ${timeout}ms`);
          results.recommendations.push('タイムアウト設定を10000ms (10秒) 以上に増やすことを検討してください');
        }
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} タイムアウト設定が見つかりません`);
      }
      
      // Content-Typeヘッダーを確認
      if (content.includes('Content-Type') || content.includes('content-type')) {
        console.log(`  ${styles.green}✓${styles.reset} Content-Typeヘッダーが設定されています`);
        
        // 正しいContent-Typeかどうかを確認
        if (content.includes('application/json')) {
          console.log(`  ${styles.green}✓${styles.reset} application/json Content-Typeが設定されています`);
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} Content-Typeがapplication/jsonかどうか確認できません`);
        }
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} Content-Typeヘッダーが明示的に設定されていません`);
        results.issues.push('APIクライアントでContent-Typeヘッダーが設定されていない可能性があります');
        results.recommendations.push('APIクライアントでContent-Type: application/jsonヘッダーを設定してください');
      }
      
      // エラー処理を確認
      if (content.includes('catch') || content.includes('error') || content.includes('interceptors')) {
        console.log(`  ${styles.green}✓${styles.reset} エラー処理が含まれています`);
        
        // レスポンスインターセプターがあるか確認
        if (content.includes('interceptors.response')) {
          console.log(`  ${styles.green}✓${styles.reset} レスポンスインターセプターが設定されています`);
          
          // JSONパースエラーを処理しているかチェック
          if (content.includes('SyntaxError') || (content.includes('JSON') && content.includes('parse'))) {
            console.log(`  ${styles.green}✓${styles.reset} JSONパースエラー処理が含まれています`);
          } else {
            console.log(`  ${styles.yellow}⚠${styles.reset} JSONパースエラー処理が見つかりません`);
            results.issues.push('JSONパースエラーを明示的に処理していない可能性があります');
            results.recommendations.push('レスポンスインターセプターでJSONパースエラー (SyntaxError) を処理するコードを追加してください');
          }
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} レスポンスインターセプターが見つかりません`);
          results.recommendations.push('axios.interceptors.responseを使用して、APIレスポンスのエラー処理を追加することを検討してください');
        }
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} エラー処理が見つかりません`);
        results.issues.push('APIクライアントでエラー処理が不足している可能性があります');
        results.recommendations.push('APIクライアントで適切なエラー処理を追加してください');
      }
    } catch (err) {
      console.log(`  ${styles.red}✗${styles.reset} APIクライアントの読み込みに失敗: ${err.message}`);
      results.issues.push(`APIクライアントの読み込みに失敗: ${err.message}`);
    }
  }
  
  console.log('');
}

/**
 * APIクライアント拡張版の診断
 */
function checkEnhancedApiClient() {
  console.log(`${styles.bright}[4] 拡張APIクライアント診断${styles.reset}`);
  
  const enhancedClientPath = path.join(FRONTEND_SRC_DIR, 'api', 'enhancedClient.js');
  
  if (fileExists(enhancedClientPath)) {
    console.log(`  ${styles.green}✓${styles.reset} 拡張APIクライアントが見つかりました: api/enhancedClient.js`);
    
    try {
      const content = fs.readFileSync(enhancedClientPath, 'utf8');
      
      // エンハンスト機能を確認
      const hasHTMLErrorHandling = content.includes('<!DOCTYPE') || 
                                  content.includes('<html') || 
                                  content.includes('Unexpected token');
      
      if (hasHTMLErrorHandling) {
        console.log(`  ${styles.green}✓${styles.reset} HTML応答エラー処理が含まれています`);
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} HTML応答エラー処理が見つかりません`);
        results.issues.push('拡張APIクライアントでHTML応答エラー処理が不足している可能性があります');
        results.recommendations.push('enhancedClient.jsにHTMLレスポンスを検出して適切に処理するコードを追加してください');
      }
      
      // インターセプターの確認
      if (content.includes('interceptors.response.use')) {
        console.log(`  ${styles.green}✓${styles.reset} レスポンスインターセプターが設定されています`);
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} レスポンスインターセプターが見つかりません`);
        results.recommendations.push('インターセプターを追加して応答エラーを処理することを推奨します');
      }
    } catch (err) {
      console.log(`  ${styles.red}✗${styles.reset} 拡張APIクライアントの読み込みに失敗: ${err.message}`);
    }
  } else {
    console.log(`  ${styles.yellow}⚠${styles.reset} 拡張APIクライアントが見つかりません: api/enhancedClient.js`);
    
    if (results.issues.some(issue => issue.includes('JSONパース') || issue.includes('HTML応答'))) {
      results.recommendations.push('HTMLレスポンスとJSONパースエラーを処理する拡張APIクライアントを作成することを検討してください');
    }
  }
  
  console.log('');
}

/**
 * 特定のAPIファイルの確認
 */
function checkSpecificApiFiles() {
  console.log(`${styles.bright}[5] 個別APIファイル診断${styles.reset}`);
  
  const apiFiles = [
    { path: path.join(FRONTEND_SRC_DIR, 'api', 'employeeApi.ts'), name: 'employeeApi.ts' },
    { path: path.join(FRONTEND_SRC_DIR, 'api', 'employeeApi.js'), name: 'employeeApi.js' },
    { path: path.join(FRONTEND_SRC_DIR, 'api', 'reportApi.ts'), name: 'reportApi.ts' },
    { path: path.join(FRONTEND_SRC_DIR, 'api', 'reportApi.js'), name: 'reportApi.js' }
  ];
  
  let foundApiFiles = false;
  
  for (const apiFile of apiFiles) {
    if (fileExists(apiFile.path)) {
      foundApiFiles = true;
      console.log(`  ${styles.green}✓${styles.reset} APIファイルが見つかりました: ${apiFile.name}`);
      
      try {
        const content = fs.readFileSync(apiFile.path, 'utf8');
        
        // エンドポイントパスの確認
        const apiCalls = content.match(/get\(['"](.*?)['"]/g) || [];
        apiCalls.push(...(content.match(/post\(['"](.*?)['"]/g) || []));
        apiCalls.push(...(content.match(/put\(['"](.*?)['"]/g) || []));
        apiCalls.push(...(content.match(/delete\(['"](.*?)['"]/g) || []));
        
        if (apiCalls.length > 0) {
          console.log(`  ${styles.green}✓${styles.reset} APIエンドポイント呼び出しが見つかりました: ${apiCalls.length}件`);
          
          // 最初の数個のエンドポイントを表示
          const endpoints = apiCalls.slice(0, 3).map(call => {
            const match = call.match(/\(['"](.+?)['"]/);
            return match ? match[1] : call;
          });
          
          console.log(`  ${styles.blue}i${styles.reset} エンドポイント例: ${endpoints.join(', ')}${apiCalls.length > 3 ? ', ...' : ''}`);
          
          // エンドポイントパスの問題をチェック
          const hasRelativePaths = endpoints.some(ep => !ep.startsWith('/'));
          if (hasRelativePaths) {
            console.log(`  ${styles.yellow}⚠${styles.reset} 相対パスが使用されています - スラッシュで始まるパスを使用することを推奨`);
            results.issues.push('APIエンドポイントに相対パスが使用されています');
            results.recommendations.push('APIエンドポイントパスはスラッシュ (/) で始めてください');
          }
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} APIエンドポイント呼び出しが見つかりません`);
        }
        
        // エラー処理の確認
        const hasTryCatch = (content.match(/try\s*{/g) || []).length;
        const hasCatch = (content.match(/catch\s*\(/g) || []).length;
        
        if (hasTryCatch > 0 && hasCatch > 0) {
          console.log(`  ${styles.green}✓${styles.reset} try-catch エラー処理が見つかりました: ${hasTryCatch}件`);
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} try-catch エラー処理が不足している可能性があります`);
          results.issues.push(`${apiFile.name} でエラー処理が不足している可能性があります`);
          results.recommendations.push('APIリクエストは必ずtry-catchブロックで囲み、エラーをログに記録してください');
        }
        
        // response.dataアクセスの確認
        const hasResponseData = content.includes('response.data');
        
        if (hasResponseData) {
          console.log(`  ${styles.green}✓${styles.reset} response.dataアクセスが見つかりました`);
          
          // response.dataのさらなる検証
          const hasResponseDataData = content.includes('response.data.data');
          if (hasResponseDataData) {
            console.log(`  ${styles.green}✓${styles.reset} response.data.dataアクセスが見つかりました`);
          }
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} response.dataアクセスが見つかりません`);
          results.issues.push(`${apiFile.name} でAPIレスポンスの処理に問題がある可能性があります`);
        }
      } catch (err) {
        console.log(`  ${styles.red}✗${styles.reset} ${apiFile.name}の読み込みに失敗: ${err.message}`);
      }
    }
  }
  
  if (!foundApiFiles) {
    console.log(`  ${styles.yellow}⚠${styles.reset} 個別APIファイルが見つかりません`);
    results.issues.push('個別のAPIファイル (employeeApi.ts, reportApi.tsなど) が見つかりません');
    results.recommendations.push('src/api/ディレクトリに各機能ごとのAPIファイルを作成してください');
  }
  
  console.log('');
}

/**
 * React環境の実行時設定を確認
 */
function checkReactEnvironment() {
  console.log(`${styles.bright}[6] React実行環境確認${styles.reset}`);
  
  // 起動中のReactアプリを確認
  try {
    console.log(`  ${styles.blue}i${styles.reset} フロントエンドの実行状態を確認中...`);
    
    const output = execSync('lsof -i :3000-3001 -P -n', { encoding: 'utf8' });
    
    if (output.includes('node')) {
      console.log(`  ${styles.green}✓${styles.reset} Reactアプリが実行中です`);
      
      const portMatch = output.match(/:(\d+)/);
      if (portMatch) {
        const port = portMatch[1];
        console.log(`  ${styles.green}✓${styles.reset} ポート: ${port}`);
      }
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} Reactアプリが実行されていないようです`);
      results.issues.push('フロントエンドが実行されていません');
      results.recommendations.push('フロントエンドを起動するには: cd frontend && npm start');
    }
  } catch (err) {
    // lsofコマンドが使えないか、何も実行されていない場合
    console.log(`  ${styles.yellow}⚠${styles.reset} 実行状態を確認できませんでした: ${err.message}`);
  }
  
  console.log('');
}

/**
 * index.html、index.tsxでAPI関連の設定を確認
 */
function checkIndexFiles() {
  console.log(`${styles.bright}[7] インデックスファイル診断${styles.reset}`);
  
  // index.tsxを確認
  const indexTsxPath = path.join(FRONTEND_SRC_DIR, 'index.tsx');
  
  if (fileExists(indexTsxPath)) {
    console.log(`  ${styles.green}✓${styles.reset} index.tsxが見つかりました`);
    
    try {
      const content = fs.readFileSync(indexTsxPath, 'utf8');
      
      // ReactQueryProviderの確認
      if (content.includes('QueryClientProvider') || content.includes('ReactQueryProvider')) {
        console.log(`  ${styles.green}✓${styles.reset} QueryClientProviderが見つかりました`);
      } else if (content.includes('QueryClient')) {
        console.log(`  ${styles.yellow}⚠${styles.reset} QueryClientは見つかりましたが、Providerが見つかりません`);
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} QueryClientProviderが見つかりません`);
        results.issues.push('index.tsxにQueryClientProviderが見つかりません');
        results.recommendations.push('React Queryを使用する場合、QueryClientProviderを設定することを推奨します');
      }
      
      // 環境変数設定（windowオブジェクト）の確認
      if (content.includes('window.process') || content.includes('window.env')) {
        console.log(`  ${styles.green}✓${styles.reset} グローバル環境変数設定が見つかりました`);
      }
    } catch (err) {
      console.log(`  ${styles.red}✗${styles.reset} index.tsxの読み込みに失敗: ${err.message}`);
    }
  } else {
    console.log(`  ${styles.yellow}⚠${styles.reset} index.tsxが見つかりません`);
  }
  
  // index.htmlを確認
  const indexHtmlPath = path.join(FRONTEND_DIR, 'public', 'index.html');
  
  if (fileExists(indexHtmlPath)) {
    console.log(`  ${styles.green}✓${styles.reset} index.htmlが見つかりました`);
    
    try {
      const content = fs.readFileSync(indexHtmlPath, 'utf8');
      
      // 環境変数設定の確認
      if (content.includes('process.env') || content.includes('window.env')) {
        console.log(`  ${styles.green}✓${styles.reset} 環境変数設定のスクリプトが見つかりました`);
      }
      
      // CSPの確認
      if (content.includes('content-security-policy')) {
        console.log(`  ${styles.green}✓${styles.reset} Content-Security-Policyが設定されています`);
        
        // APIドメインが許可されているか確認
        if (content.includes('localhost:5001')) {
          console.log(`  ${styles.green}✓${styles.reset} バックエンドドメインがCSPで許可されています`);
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} バックエンドドメインがCSPで明示的に許可されていない可能性があります`);
        }
      }
    } catch (err) {
      console.log(`  ${styles.red}✗${styles.reset} index.htmlの読み込みに失敗: ${err.message}`);
    }
  } else {
    console.log(`  ${styles.yellow}⚠${styles.reset} index.htmlが見つかりません`);
  }
  
  console.log('');
}

/**
 * 診断結果を表示
 */
function displayDiagnosticSummary() {
  console.log(`${styles.bright}${styles.cyan}=====================================${styles.reset}`);
  console.log(`${styles.bright}${styles.cyan}フロントエンド設定診断結果${styles.reset}`);
  console.log(`${styles.bright}${styles.cyan}=====================================${styles.reset}\n`);
  
  // 問題の表示
  if (results.issues.length > 0) {
    console.log(`${styles.bright}[1] 検出された問題:${styles.reset}`);
    results.issues.forEach((issue, i) => {
      console.log(`  ${styles.red}${i + 1}.${styles.reset} ${issue}`);
    });
    console.log('');
  } else {
    console.log(`${styles.green}✓${styles.reset} 重大な問題は検出されませんでした\n`);
  }
  
  // 推奨事項の表示
  if (results.recommendations.length > 0) {
    console.log(`${styles.bright}[2] 推奨される対応:${styles.reset}`);
    results.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    console.log('');
  }
  
  // JSONパースエラーの推奨対応
  if (results.issues.some(issue => issue.includes('JSON') || issue.includes('HTML応答'))) {
    console.log(`${styles.bright}[3] JSONパースエラー修正のための具体的な提案:${styles.reset}`);
    
    console.log(`  1. APIクライアントの拡張機能を追加:`);
    console.log(`     以下のようなenhancedClient.jsを作成し、通常のclient.tsの代わりに使用してください:`);
    console.log(`
    // src/api/enhancedClient.js
    import axios from 'axios';

    const apiClient = axios.create({
      baseURL: '', // 空にしてプロキシを利用
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // レスポンスインターセプター
    apiClient.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // HTMLレスポンスを検出
        if (error.response && error.response.data && 
            typeof error.response.data === 'string' &&
            (error.response.data.includes('<!DOCTYPE') || error.response.data.includes('<html'))) {
          
          console.error('HTMLレスポンスが返されました (JSONではない):', error.response.data.substring(0, 100));
          
          // より明確なエラーに変換
          return Promise.reject({
            ...error,
            message: 'サーバーがJSONの代わりにHTMLを返しました。APIエンドポイントが正しくないか、サーバーエラーが発生した可能性があります。',
            isHtmlResponse: true
          });
        }
        
        // JSONパースエラーの検出
        if (error.message && error.message.includes('Unexpected token')) {
          console.error('JSONパースエラー:', error.message);
          
          // より明確なエラーに変換
          return Promise.reject({
            ...error,
            message: '無効なJSONレスポンスを受信しました。サーバー応答の形式が正しくありません。',
            isJsonParseError: true
          });
        }
        
        return Promise.reject(error);
      }
    );

    export default apiClient;`);
    
    console.log(`\n  2. package.jsonのproxy設定を確認:`);
    console.log(`     "proxy": "http://localhost:5001" がpackage.jsonに追加されていることを確認`);
    
    console.log(`\n  3. コンポーネントでのエラー処理を改善:`);
    console.log(`     try-catchブロックで適切にエラーをハンドリングし、ユーザーに表示してください`);
    
    console.log('');
  }
  
  console.log(`${styles.bright}${styles.cyan}=====================================${styles.reset}`);
  
  // 診断結果をファイルに保存
  const resultsFile = path.join(__dirname, 'frontend-config-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n診断結果を ${resultsFile} に保存しました\n`);
}

/**
 * メイン処理
 */
function main() {
  console.log(`${styles.bright}${styles.cyan}
=============================================
障害者雇用管理システム フロントエンド設定診断
=============================================
${styles.reset}\n`);
  
  // フロントエンドディレクトリの確認
  if (!fileExists(FRONTEND_DIR)) {
    console.log(`${styles.red}✗${styles.reset} フロントエンドディレクトリが見つかりません: ${FRONTEND_DIR}`);
    return;
  }
  
  // 各診断関数を実行
  checkPackageJson();
  checkEnvFiles();
  checkApiClient();
  checkEnhancedApiClient();
  checkSpecificApiFiles();
  checkReactEnvironment();
  checkIndexFiles();
  
  // 診断結果の表示
  displayDiagnosticSummary();
}

main();