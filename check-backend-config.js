/**
 * check-backend-config.js
 * 障害者雇用管理システム バックエンド設定診断スクリプト
 * 
 * 使用方法:
 * node check-backend-config.js
 * 
 * 目的:
 * - バックエンドの設定を確認し、JSONパースエラーの原因となる問題を特定
 * - ルート設定、CORS設定、ポート設定などの診断
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 設定
const BACKEND_DIR = path.join(__dirname, 'backend');
const EXPECTED_PORT = 5001;
const FRONTEND_ORIGIN = 'http://localhost:3001';

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
  serverFile: null,
  routeFiles: [],
  controllerFiles: [],
  middlewareFiles: [],
  envSettings: null,
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
 * バックエンドディレクトリ構造の確認
 */
function checkBackendStructure() {
  console.log(`${styles.bright}[1] バックエンド構造診断${styles.reset}`);
  
  if (!fileExists(BACKEND_DIR)) {
    console.log(`  ${styles.red}✗${styles.reset} バックエンドディレクトリが見つかりません: ${BACKEND_DIR}`);
    results.issues.push('バックエンドディレクトリが見つかりません');
    results.recommendations.push('正しいプロジェクトディレクトリにいるか確認してください');
    return false;
  }
  
  console.log(`  ${styles.green}✓${styles.reset} バックエンドディレクトリが存在します: ${BACKEND_DIR}`);
  
  // 必要なサブディレクトリの確認
  const subDirs = ['routes', 'controllers', 'models', 'middleware', 'utils'];
  const missingDirs = [];
  
  for (const dir of subDirs) {
    const dirPath = path.join(BACKEND_DIR, dir);
    if (fileExists(dirPath)) {
      console.log(`  ${styles.green}✓${styles.reset} ${dir}/ ディレクトリが存在します`);
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} ${dir}/ ディレクトリが見つかりません`);
      missingDirs.push(dir);
    }
  }
  
  if (missingDirs.length > 0) {
    results.issues.push(`以下のディレクトリが不足しています: ${missingDirs.join(', ')}`);
    results.recommendations.push('標準的なExpressアプリケーション構造を維持するために不足しているディレクトリを作成してください');
  }
  
  // server.jsの確認
  const serverPath = path.join(BACKEND_DIR, 'server.js');
  if (fileExists(serverPath)) {
    console.log(`  ${styles.green}✓${styles.reset} server.jsが存在します`);
    results.serverFile = serverPath;
  } else {
    console.log(`  ${styles.red}✗${styles.reset} server.jsが見つかりません`);
    results.issues.push('server.jsファイルが見つかりません');
    results.recommendations.push('バックエンドのエントリポイントであるserver.jsを作成または確認してください');
  }
  
  console.log('');
  return true;
}

/**
 * server.jsファイルの診断
 */
function checkServerFile() {
  console.log(`${styles.bright}[2] server.js診断${styles.reset}`);
  
  if (!results.serverFile) {
    console.log(`  ${styles.red}✗${styles.reset} server.jsが見つからないため診断をスキップします`);
    return;
  }
  
  try {
    const content = fs.readFileSync(results.serverFile, 'utf8');
    
    // Expressアプリケーションの確認
    if (content.includes('express()') || content.includes('express.')) {
      console.log(`  ${styles.green}✓${styles.reset} Expressアプリケーションが見つかりました`);
    } else {
      console.log(`  ${styles.red}✗${styles.reset} Expressアプリケーションが見つかりません`);
      results.issues.push('server.jsでExpressアプリケーションが見つかりません');
    }
    
    // ポート設定の確認
    const portMatch = content.match(/(?:PORT|port)\s*=\s*(\d+)|\.listen\(\s*(\d+)/);
    if (portMatch) {
      const port = portMatch[1] || portMatch[2];
      console.log(`  ${styles.green}✓${styles.reset} ポート設定: ${port}`);
      
      if (port != EXPECTED_PORT) {
        console.log(`  ${styles.yellow}⚠${styles.reset} ポート番号が期待値 (${EXPECTED_PORT}) と異なります`);
        results.issues.push(`ポート番号 (${port}) が期待値 (${EXPECTED_PORT}) と異なります`);
        results.recommendations.push(`バックエンドのポート番号を ${EXPECTED_PORT} に設定することを推奨します`);
      }
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} 明示的なポート設定が見つかりません`);
      results.issues.push('server.jsで明示的なポート設定が見つかりません');
    }
    
    // CORS設定の確認
    if (content.includes('cors')) {
      console.log(`  ${styles.green}✓${styles.reset} CORSミドルウェアが見つかりました`);
      
      // CORSオプションの確認
      if (content.includes('origin')) {
        console.log(`  ${styles.green}✓${styles.reset} CORSオリジン設定が見つかりました`);
        
        // localhost:3001が許可されているか確認
        if (content.includes('localhost:3001') || content.includes('*')) {
          console.log(`  ${styles.green}✓${styles.reset} フロントエンドオリジンが許可されています`);
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} フロントエンドオリジン (${FRONTEND_ORIGIN}) が明示的に許可されていない可能性があります`);
          results.issues.push('CORSの設定でフロントエンドオリジンが明示的に許可されていない可能性があります');
          results.recommendations.push(`CORSの設定で ${FRONTEND_ORIGIN} を明示的に許可することを推奨します`);
        }
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} CORSオリジン設定が見つかりません`);
        results.issues.push('CORSオリジン設定が見つかりません');
        results.recommendations.push('CORSオプションでorigin設定を追加することを推奨します');
      }
    } else {
      console.log(`  ${styles.red}✗${styles.reset} CORSミドルウェアが見つかりません`);
      results.issues.push('CORSミドルウェアが設定されていません');
      results.recommendations.push('npm install cors を実行し、Expressアプリケーションでcorsミドルウェアを設定してください');
    }
    
    // body-parserの確認
    if (content.includes('body-parser') || content.includes('express.json')) {
      console.log(`  ${styles.green}✓${styles.reset} JSONパーサーミドルウェアが見つかりました`);
    } else {
      console.log(`  ${styles.red}✗${styles.reset} JSONパーサーミドルウェアが見つかりません`);
      results.issues.push('JSONパーサーミドルウェアが設定されていません');
      results.recommendations.push('app.use(express.json()) を追加して、JSONリクエストボディを解析するための設定を追加してください');
    }
    
    // ルート設定の確認
    const routeMatches = content.match(/app\.use\(['"](.*?)['"],\s*(.*?)\)/g) || [];
    if (routeMatches.length > 0) {
      console.log(`  ${styles.green}✓${styles.reset} ルート設定が見つかりました: ${routeMatches.length}件`);
      
      // 一部のルートを表示
      routeMatches.slice(0, 3).forEach(match => {
        console.log(`  ${styles.blue}i${styles.reset} ルート: ${match}`);
      });
      
      // APIプレフィックスの確認
      const apiPrefixMatch = routeMatches.some(m => m.includes('/api'));
      if (apiPrefixMatch) {
        console.log(`  ${styles.green}✓${styles.reset} /api プレフィックスが使用されています`);
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} /api プレフィックスが使用されていない可能性があります`);
        results.issues.push('APIルートに /api プレフィックスが使用されていない可能性があります');
        results.recommendations.push('APIルートに /api プレフィックスを使用することを推奨します');
      }
    } else {
      console.log(`  ${styles.red}✗${styles.reset} ルート設定が見つかりません`);
      results.issues.push('server.jsでルート設定が見つかりません');
      results.recommendations.push('app.use("/api/resource", resourceRouter) のようなルート設定を追加してください');
    }
    
    // エラーハンドリングミドルウェアの確認
    const hasErrorHandler = content.includes('app.use') && 
                         (content.includes('err') || content.includes('error')) && 
                         content.includes('next');
    
    if (hasErrorHandler) {
      console.log(`  ${styles.green}✓${styles.reset} エラーハンドリングミドルウェアが見つかりました`);
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} エラーハンドリングミドルウェアが見つかりません`);
      results.issues.push('エラーハンドリングミドルウェアが見つかりません');
      results.recommendations.push('グローバルエラーハンドリングミドルウェアを追加して、APIエラーを適切に処理してください');
    }
    
    // 404ハンドラーの確認
    const has404Handler = content.includes('404') || 
                       content.includes('Not Found') || 
                       (content.includes('app.use') && content.includes('status') && content.includes('404'));
    
    if (has404Handler) {
      console.log(`  ${styles.green}✓${styles.reset} 404ハンドラーが見つかりました`);
    } else {
      console.log(`  ${styles.yellow}⚠${styles.reset} 404ハンドラーが見つかりません`);
      results.issues.push('404ハンドラーが見つかりません');
      results.recommendations.push('存在しないルートに対するJSON 404レスポンスを返すミドルウェアを追加してください');
    }
  } catch (err) {
    console.log(`  ${styles.red}✗${styles.reset} server.jsの読み込みに失敗: ${err.message}`);
    results.issues.push(`server.jsの読み込みに失敗: ${err.message}`);
  }
  
  console.log('');
}

/**
 * ルートファイルの確認
 */
function checkRouteFiles() {
  console.log(`${styles.bright}[3] ルート設定診断${styles.reset}`);
  
  const routesDir = path.join(BACKEND_DIR, 'routes');
  
  if (!fileExists(routesDir)) {
    console.log(`  ${styles.red}✗${styles.reset} routesディレクトリが見つかりません`);
    return;
  }
  
  try {
    const files = fs.readdirSync(routesDir);
    const routeFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    
    if (routeFiles.length === 0) {
      console.log(`  ${styles.red}✗${styles.reset} ルートファイルが見つかりません`);
      results.issues.push('ルートファイルが見つかりません');
      return;
    }
    
    console.log(`  ${styles.green}✓${styles.reset} ${routeFiles.length}個のルートファイルが見つかりました`);
    
    // 重要なルートファイルを確認
    const importantRoutes = ['employee', 'employees', 'monthly', 'report', 'settings'];
    const foundImportantRoutes = [];
    
    for (const routeFile of routeFiles) {
      const routePath = path.join(routesDir, routeFile);
      console.log(`  ${styles.blue}i${styles.reset} ルートファイル: ${routeFile}`);
      
      // 重要なルートかチェック
      const isImportantRoute = importantRoutes.some(r => routeFile.includes(r));
      if (isImportantRoute) {
        foundImportantRoutes.push(routeFile);
      }
      
      results.routeFiles.push({
        name: routeFile,
        path: routePath,
        isImportant: isImportantRoute
      });
      
      // ファイルの内容を読み込み
      try {
        const content = fs.readFileSync(routePath, 'utf8');
        
        // ルーターの設定を確認
        if (content.includes('express.Router()') || content.includes('express.Router(')) {
          console.log(`    ${styles.green}✓${styles.reset} Expressルーターが見つかりました`);
        } else {
          console.log(`    ${styles.yellow}⚠${styles.reset} Expressルーターが見つかりません`);
          results.issues.push(`${routeFile} でExpressルーターが見つかりません`);
        }
        
        // モジュールのエクスポートを確認
        if (content.includes('module.exports') || content.includes('export default')) {
          console.log(`    ${styles.green}✓${styles.reset} ルーターがエクスポートされています`);
        } else {
          console.log(`    ${styles.red}✗${styles.reset} ルーターがエクスポートされていません`);
          results.issues.push(`${routeFile} でルーターがエクスポートされていません`);
          results.recommendations.push(`${routeFile} でルーターをエクスポートしてください: module.exports = router;`);
        }
        
        // ルートメソッドの確認
        const getCount = (content.match(/\.get\(/g) || []).length;
        const postCount = (content.match(/\.post\(/g) || []).length;
        const putCount = (content.match(/\.put\(/g) || []).length;
        const deleteCount = (content.match(/\.delete\(/g) || []).length;
        
        if (getCount + postCount + putCount + deleteCount > 0) {
          console.log(`    ${styles.green}✓${styles.reset} ルートメソッド: GET=${getCount}, POST=${postCount}, PUT=${putCount}, DELETE=${deleteCount}`);
        } else {
          console.log(`    ${styles.yellow}⚠${styles.reset} ルートメソッドが見つかりません`);
          results.issues.push(`${routeFile} で有効なルートメソッド (get/post/put/delete) が定義されていません`);
        }
        
        // コントローラーの使用確認
        if (content.includes('controller') || content.includes('Controller')) {
          console.log(`    ${styles.green}✓${styles.reset} コントローラーが参照されています`);
        } else {
          console.log(`    ${styles.yellow}⚠${styles.reset} コントローラーが参照されていません`);
          results.issues.push(`${routeFile} でコントローラーが参照されていない可能性があります`);
        }
        
        // ミドルウェアの使用確認
        if (content.includes('middleware') || content.includes('auth')) {
          console.log(`    ${styles.green}✓${styles.reset} ミドルウェアが使用されています`);
        }
      } catch (err) {
        console.log(`    ${styles.red}✗${styles.reset} ファイルの読み込みに失敗: ${err.message}`);
      }
    }
    
    // 重要なルートが不足していないか確認
    const missingImportantRoutes = importantRoutes.filter(r => 
      !foundImportantRoutes.some(found => found.includes(r))
    );
    
    if (missingImportantRoutes.length > 0) {
      console.log(`  ${styles.yellow}⚠${styles.reset} 重要なルートが不足している可能性があります: ${missingImportantRoutes.join(', ')}`);
      results.issues.push(`重要なルートが不足している可能性があります: ${missingImportantRoutes.join(', ')}`);
      results.recommendations.push('必要なルートファイルを追加して、すべての機能にアクセスできるようにしてください');
    }
  } catch (err) {
    console.log(`  ${styles.red}✗${styles.reset} routesディレクトリの読み込みに失敗: ${err.message}`);
    results.issues.push(`routesディレクトリの読み込みに失敗: ${err.message}`);
  }
  
  console.log('');
}

/**
 * コントローラーの確認
 */
function checkControllers() {
  console.log(`${styles.bright}[4] コントローラー診断${styles.reset}`);
  
  const controllersDir = path.join(BACKEND_DIR, 'controllers');
  
  if (!fileExists(controllersDir)) {
    console.log(`  ${styles.red}✗${styles.reset} controllersディレクトリが見つかりません`);
    return;
  }
  
  try {
    const files = fs.readdirSync(controllersDir);
    const controllerFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    
    if (controllerFiles.length === 0) {
      console.log(`  ${styles.red}✗${styles.reset} コントローラーファイルが見つかりません`);
      results.issues.push('コントローラーファイルが見つかりません');
      return;
    }
    
    console.log(`  ${styles.green}✓${styles.reset} ${controllerFiles.length}個のコントローラーファイルが見つかりました`);
    
    // 重要なコントローラーを確認
    const importantControllers = ['employee', 'monthly', 'report', 'settings'];
    const foundImportantControllers = [];
    
    for (const controllerFile of controllerFiles) {
      const controllerPath = path.join(controllersDir, controllerFile);
      console.log(`  ${styles.blue}i${styles.reset} コントローラーファイル: ${controllerFile}`);
      
      // 重要なコントローラーかチェック
      const isImportantController = importantControllers.some(c => controllerFile.includes(c));
      if (isImportantController) {
        foundImportantControllers.push(controllerFile);
      }
      
      results.controllerFiles.push({
        name: controllerFile,
        path: controllerPath,
        isImportant: isImportantController
      });
      
      // ファイルの内容を読み込み
      try {
        const content = fs.readFileSync(controllerPath, 'utf8');
        
        // モジュールのエクスポートを確認
        if (content.includes('module.exports') || content.includes('export')) {
          console.log(`    ${styles.green}✓${styles.reset} コントローラー関数がエクスポートされています`);
        } else {
          console.log(`    ${styles.red}✗${styles.reset} コントローラー関数がエクスポートされていません`);
          results.issues.push(`${controllerFile} でコントローラー関数がエクスポートされていません`);
        }
        
        // req, resパラメータの使用確認
        if (content.includes('req') && content.includes('res')) {
          console.log(`    ${styles.green}✓${styles.reset} req, resパラメータが使用されています`);
        } else {
          console.log(`    ${styles.yellow}⚠${styles.reset} req, resパラメータが使用されていない可能性があります`);
          results.issues.push(`${controllerFile} でreq, resパラメータが使用されていない可能性があります`);
        }
        
        // レスポンス送信の確認
        if (content.includes('res.json') || content.includes('res.send')) {
          console.log(`    ${styles.green}✓${styles.reset} res.json/sendが使用されています`);
          
          // 応答形式を確認
          const hasSuccessFlag = content.includes('success') || content.includes('status');
          const hasDataField = content.includes('data:') || content.includes('data =') || content.includes('.data');
          
          if (hasSuccessFlag && hasDataField) {
            console.log(`    ${styles.green}✓${styles.reset} 一貫したレスポンス形式が使用されています`);
          } else {
            console.log(`    ${styles.yellow}⚠${styles.reset} 一貫したレスポンス形式が見つかりません`);
            results.issues.push(`${controllerFile} で一貫したレスポンス形式が使用されていない可能性があります`);
            results.recommendations.push('すべてのAPIレスポンスで一貫した形式を使用してください: { success: true, data: {...} }');
          }
        } else {
          console.log(`    ${styles.red}✗${styles.reset} res.json/sendが使用されていません`);
          results.issues.push(`${controllerFile} でres.json/sendが使用されていません`);
        }
        
        // エラー処理の確認
        if (content.includes('try') && content.includes('catch')) {
          console.log(`    ${styles.green}✓${styles.reset} try-catchエラー処理が使用されています`);
        } else {
          console.log(`    ${styles.yellow}⚠${styles.reset} try-catchエラー処理が見つかりません`);
          results.issues.push(`${controllerFile} でtry-catchエラー処理が使用されていない可能性があります`);
          results.recommendations.push('コントローラー関数でtry-catchブロックを使用して、エラーを適切に処理してください');
        }
        
        // モデルの使用確認
        if (content.includes('model') || content.includes('Model')) {
          console.log(`    ${styles.green}✓${styles.reset} モデルが参照されています`);
        } else {
          console.log(`    ${styles.yellow}⚠${styles.reset} モデルが参照されていない可能性があります`);
        }
      } catch (err) {
        console.log(`    ${styles.red}✗${styles.reset} ファイルの読み込みに失敗: ${err.message}`);
      }
    }
    
    // 重要なコントローラーが不足していないか確認
    const missingImportantControllers = importantControllers.filter(c => 
      !foundImportantControllers.some(found => found.includes(c))
    );
    
    if (missingImportantControllers.length > 0) {
      console.log(`  ${styles.yellow}⚠${styles.reset} 重要なコントローラーが不足している可能性があります: ${missingImportantControllers.join(', ')}`);
      results.issues.push(`重要なコントローラーが不足している可能性があります: ${missingImportantControllers.join(', ')}`);
      results.recommendations.push('必要なコントローラーファイルを追加してください');
    }
  } catch (err) {
    console.log(`  ${styles.red}✗${styles.reset} controllersディレクトリの読み込みに失敗: ${err.message}`);
    results.issues.push(`controllersディレクトリの読み込みに失敗: ${err.message}`);
  }
  
  console.log('');
}

/**
 * ミドルウェアの確認
 */
function checkMiddleware() {
  console.log(`${styles.bright}[5] ミドルウェア診断${styles.reset}`);
  
  const middlewareDir = path.join(BACKEND_DIR, 'middleware');
  
  if (!fileExists(middlewareDir)) {
    console.log(`  ${styles.red}✗${styles.reset} middlewareディレクトリが見つかりません`);
    return;
  }
  
  try {
    const files = fs.readdirSync(middlewareDir);
    const middlewareFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    
    if (middlewareFiles.length === 0) {
      console.log(`  ${styles.red}✗${styles.reset} ミドルウェアファイルが見つかりません`);
      results.issues.push('ミドルウェアファイルが見つかりません');
      return;
    }
    
    console.log(`  ${styles.green}✓${styles.reset} ${middlewareFiles.length}個のミドルウェアファイルが見つかりました`);
    
    // 重要なミドルウェアを確認
    const importantMiddleware = ['auth', 'error', 'validation'];
    const foundImportantMiddleware = [];
    
    for (const middlewareFile of middlewareFiles) {
      const middlewarePath = path.join(middlewareDir, middlewareFile);
      console.log(`  ${styles.blue}i${styles.reset} ミドルウェアファイル: ${middlewareFile}`);
      
      // 重要なミドルウェアかチェック
      const isImportantMiddleware = importantMiddleware.some(m => middlewareFile.includes(m));
      if (isImportantMiddleware) {
        foundImportantMiddleware.push(middlewareFile);
      }
      
      results.middlewareFiles.push({
        name: middlewareFile,
        path: middlewarePath,
        isImportant: isImportantMiddleware
      });
      
      // ファイルの内容を読み込み
      try {
        const content = fs.readFileSync(middlewarePath, 'utf8');
        
        // エクスポートの確認
        if (content.includes('module.exports') || content.includes('export')) {
          console.log(`    ${styles.green}✓${styles.reset} ミドルウェア関数がエクスポートされています`);
        } else {
          console.log(`    ${styles.red}✗${styles.reset} ミドルウェア関数がエクスポートされていません`);
          results.issues.push(`${middlewareFile} でミドルウェア関数がエクスポートされていません`);
        }
        
        // next関数の使用確認
        if (content.includes('next')) {
          console.log(`    ${styles.green}✓${styles.reset} next関数が使用されています`);
        } else {
          console.log(`    ${styles.yellow}⚠${styles.reset} next関数が使用されていない可能性があります`);
          results.issues.push(`${middlewareFile} でnext関数が使用されていない可能性があります`);
          results.recommendations.push('ミドルウェア関数では必ずnext()を呼び出すか、レスポンスを終了してください');
        }
        
        // 特定のミドルウェアの追加確認
        if (middlewareFile.includes('auth')) {
          if (content.includes('jwt') || content.includes('token')) {
            console.log(`    ${styles.green}✓${styles.reset} JWT認証が使用されています`);
          } else {
            console.log(`    ${styles.yellow}⚠${styles.reset} JWT認証が見つかりません`);
          }
        } else if (middlewareFile.includes('error')) {
          if (content.includes('res.status')) {
            console.log(`    ${styles.green}✓${styles.reset} エラーハンドリングが実装されています`);
            
            // JSONレスポンスの確認
            if (content.includes('res.json')) {
              console.log(`    ${styles.green}✓${styles.reset} JSONエラーレスポンスが返されています`);
            } else {
              console.log(`    ${styles.yellow}⚠${styles.reset} JSONエラーレスポンスが見つかりません`);
              results.issues.push(`${middlewareFile} でJSONエラーレスポンスが返されていない可能性があります`);
              results.recommendations.push('エラーハンドリングミドルウェアではres.jsonを使用してください');
            }
          } else {
            console.log(`    ${styles.yellow}⚠${styles.reset} エラーハンドリングが不足している可能性があります`);
          }
        } else if (middlewareFile.includes('validation')) {
          if (content.includes('validate') || content.includes('check')) {
            console.log(`    ${styles.green}✓${styles.reset} バリデーション機能が実装されています`);
          } else {
            console.log(`    ${styles.yellow}⚠${styles.reset} バリデーション機能が不足している可能性があります`);
          }
        }
      } catch (err) {
        console.log(`    ${styles.red}✗${styles.reset} ファイルの読み込みに失敗: ${err.message}`);
      }
    }
    
    // 重要なミドルウェアが不足していないか確認
    const missingImportantMiddleware = importantMiddleware.filter(m => 
      !foundImportantMiddleware.some(found => found.includes(m))
    );
    
    if (missingImportantMiddleware.length > 0) {
      console.log(`  ${styles.yellow}⚠${styles.reset} 重要なミドルウェアが不足している可能性があります: ${missingImportantMiddleware.join(', ')}`);
      results.issues.push(`重要なミドルウェアが不足している可能性があります: ${missingImportantMiddleware.join(', ')}`);
      results.recommendations.push('必要なミドルウェアファイル（特にエラーハンドリング）を追加してください');
    }
  } catch (err) {
    console.log(`  ${styles.red}✗${styles.reset} middlewareディレクトリの読み込みに失敗: ${err.message}`);
    results.issues.push(`middlewareディレクトリの読み込みに失敗: ${err.message}`);
  }
  
  console.log('');
}

/**
 * 環境変数設定の確認
 */
function checkEnvSettings() {
  console.log(`${styles.bright}[6] 環境変数設定診断${styles.reset}`);
  
  // .envファイルを確認
  const envPaths = [
    path.join(BACKEND_DIR, '.env'),
    path.join(BACKEND_DIR, '.env.development'),
    path.join(BACKEND_DIR, '.env.local')
  ];
  
  let foundEnvFile = false;
  
  for (const envPath of envPaths) {
    if (fileExists(envPath)) {
      foundEnvFile = true;
      console.log(`  ${styles.green}✓${styles.reset} 環境変数ファイルが見つかりました: ${path.basename(envPath)}`);
      
      try {
        const content = fs.readFileSync(envPath, 'utf8');
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
        
        results.envSettings = {
          path: envPath,
          vars: envVars
        };
        
        // PORT設定の確認
        if (envVars.PORT) {
          console.log(`  ${styles.green}✓${styles.reset} PORT設定: ${envVars.PORT}`);
          
          if (envVars.PORT != EXPECTED_PORT) {
            console.log(`  ${styles.yellow}⚠${styles.reset} ポート番号が期待値 (${EXPECTED_PORT}) と異なります`);
            results.issues.push(`環境変数のPORT (${envVars.PORT}) が期待値 (${EXPECTED_PORT}) と異なります`);
            results.recommendations.push(`環境変数のPORT設定を ${EXPECTED_PORT} に変更してください`);
          }
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} PORTが設定されていません`);
        }
        
        // データベース設定の確認
        if (envVars.DB_HOST || envVars.DATABASE_URL) {
          console.log(`  ${styles.green}✓${styles.reset} データベース設定が見つかりました`);
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} データベース設定が見つかりません`);
        }
        
        // JWT設定の確認
        if (envVars.JWT_SECRET) {
          console.log(`  ${styles.green}✓${styles.reset} JWT設定が見つかりました`);
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} JWT_SECRETが設定されていません`);
        }
        
        // CORS設定の確認
        if (envVars.CORS_ORIGIN || envVars.ALLOWED_ORIGINS) {
          console.log(`  ${styles.green}✓${styles.reset} CORS設定が見つかりました`);
          
          const origins = envVars.CORS_ORIGIN || envVars.ALLOWED_ORIGINS;
          if (origins.includes('localhost:3001') || origins === '*') {
            console.log(`  ${styles.green}✓${styles.reset} フロントエンドオリジンが許可されています`);
          } else {
            console.log(`  ${styles.yellow}⚠${styles.reset} フロントエンドオリジン (${FRONTEND_ORIGIN}) が明示的に許可されていない可能性があります`);
            results.issues.push('CORS環境変数設定でフロントエンドオリジンが明示的に許可されていない可能性があります');
          }
        } else {
          console.log(`  ${styles.yellow}⚠${styles.reset} CORS_ORIGIN設定が見つかりません`);
        }
      } catch (err) {
        console.log(`  ${styles.red}✗${styles.reset} 環境変数ファイルの読み込みに失敗: ${err.message}`);
      }
      
      break;
    }
  }
  
  if (!foundEnvFile) {
    console.log(`  ${styles.yellow}⚠${styles.reset} 環境変数ファイルが見つかりません`);
    results.issues.push('環境変数ファイル (.env) が見つかりません');
    results.recommendations.push('バックエンドディレクトリに.envファイルを作成し、必要な環境変数を設定してください');
  }
  
  console.log('');
}

/**
 * バックエンドプロセスの稼働状態確認
 */
function checkBackendProcess() {
  console.log(`${styles.bright}[7] バックエンドプロセス確認${styles.reset}`);
  
  try {
    console.log(`  ${styles.blue}i${styles.reset} バックエンドプロセスの稼働状態を確認中...`);
    
    let output;
    try {
      // lsofコマンドでポートをチェック
      output = execSync(`lsof -i :${EXPECTED_PORT} -P -n`, { encoding: 'utf8' });
    } catch (err) {
      // コマンドがエラーを返した場合（通常はプロセスが見つからない場合）
      output = '';
    }
    
    if (output && output.includes('node')) {
      console.log(`  ${styles.green}✓${styles.reset} バックエンドサーバーが実行中です (ポート ${EXPECTED_PORT})`);
      
      // PIDを取得
      const pidMatch = output.match(/node\s+(\d+)/);
      if (pidMatch) {
        const pid = pidMatch[1];
        console.log(`  ${styles.green}✓${styles.reset} プロセスID: ${pid}`);
        
        // 実行時間を確認
        try {
          const psOutput = execSync(`ps -p ${pid} -o lstart`, { encoding: 'utf8' });
          const startTime = psOutput.split('\n')[1].trim();
          console.log(`  ${styles.green}✓${styles.reset} 起動時刻: ${startTime}`);
        } catch (err) {
          // 無視
        }
      }
    } else {
      console.log(`  ${styles.red}✗${styles.reset} バックエンドサーバーが実行されていません`);
      results.issues.push(`バックエンドサーバー (ポート ${EXPECTED_PORT}) が実行されていません`);
      results.recommendations.push('バックエンドを起動するには: cd backend && npm start');
    }
  } catch (err) {
    console.log(`  ${styles.yellow}⚠${styles.reset} プロセス確認に失敗: ${err.message}`);
  }
  
  console.log('');
}

/**
 * HTML 404エラーレスポンスのチェック
 */
function checkHtml404Response() {
  console.log(`${styles.bright}[8] HTML 404レスポンス診断${styles.reset}`);
  
  // server.jsを確認
  if (results.serverFile) {
    try {
      const content = fs.readFileSync(results.serverFile, 'utf8');
      
      // 404レスポンスのチェック
      const hasJsonNotFound = content.includes('404') && content.includes('json') && 
                          content.includes('status') && 
                          (content.includes('Not found') || content.includes('not found'));
      
      if (hasJsonNotFound) {
        console.log(`  ${styles.green}✓${styles.reset} JSON形式の404レスポンスが設定されています`);
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} JSON形式の404レスポンスが設定されていない可能性があります`);
        
        // HTML 404レスポンスになる可能性のあるパターンをチェック
        const expressStatic = content.includes('express.static');
        const hasWildcardRoute = content.includes('app.use') && content.includes('*');
        
        if (expressStatic && !hasWildcardRoute) {
          console.log(`  ${styles.red}✗${styles.reset} express.staticが設定されているのに、APIのキャッチオールルートがありません`);
          results.issues.push('express.staticが設定されているのに、APIのキャッチオールルートがありません');
          results.recommendations.push('すべての存在しないAPIルートに対してJSON 404レスポンスを返す次のようなミドルウェアを追加してください:');
          results.recommendations.push('app.use("/api/*", (req, res) => { res.status(404).json({ success: false, error: "API route not found" }); });');
        }
      }
      
      // 一般的なフォールバックルートの確認
      const hasFallbackRoute = content.includes('app.use') && 
                            (content.includes('*') || content.includes('(.*)')) &&
                            content.includes('status') && content.includes('404');
      
      if (hasFallbackRoute) {
        console.log(`  ${styles.green}✓${styles.reset} フォールバックルートが設定されています`);
        
        if (content.includes('res.json') && content.includes('404')) {
          console.log(`  ${styles.green}✓${styles.reset} フォールバックルートでJSONレスポンスが返されています`);
        } else if (content.includes('res.sendFile') || content.includes('res.send') && content.includes('html')) {
          console.log(`  ${styles.red}✗${styles.reset} フォールバックルートでHTMLレスポンスが返されている可能性があります`);
          results.issues.push('フォールバックルートでHTMLレスポンスが返されている可能性があります');
          results.recommendations.push('APIルートに対してはJSON形式の404レスポンスを返すように修正してください');
        }
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} フォールバックルートが見つかりません`);
        results.issues.push('フォールバックルートが設定されていません');
        results.recommendations.push('存在しないすべてのルートに対してJSON 404レスポンスを返すフォールバックルートを追加してください');
      }
      
      // JSONパースエラーに関するコード確認
      const hasJsonParseErrorHandling = content.includes('SyntaxError') || 
                                      (content.includes('error') && content.includes('json'));
      
      if (hasJsonParseErrorHandling) {
        console.log(`  ${styles.green}✓${styles.reset} JSONパースエラーハンドリングが設定されています`);
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} JSONパースエラーハンドリングが見つかりません`);
        results.issues.push('JSONパースエラーを明示的に処理するコードが見つかりません');
        results.recommendations.push('express.jsonミドルウェアの後にJSONパースエラーを処理するミドルウェアを追加してください');
      }
    } catch (err) {
      console.log(`  ${styles.red}✗${styles.reset} server.jsの読み込みに失敗: ${err.message}`);
    }
  } else {
    console.log(`  ${styles.red}✗${styles.reset} server.jsが見つからないため診断をスキップします`);
  }
  
  // errorHandler.jsなどのファイルも確認
  const errorHandlerPath = path.join(BACKEND_DIR, 'utils', 'errorHandler.js');
  if (fileExists(errorHandlerPath)) {
    console.log(`  ${styles.green}✓${styles.reset} errorHandler.jsが見つかりました`);
    
    try {
      const content = fs.readFileSync(errorHandlerPath, 'utf8');
      
      if (content.includes('json') && content.includes('status')) {
        console.log(`  ${styles.green}✓${styles.reset} errorHandler.jsでJSONレスポンスが返されています`);
      } else {
        console.log(`  ${styles.yellow}⚠${styles.reset} errorHandler.jsでJSONレスポンスが返されていない可能性があります`);
      }
    } catch (err) {
      console.log(`  ${styles.red}✗${styles.reset} errorHandler.jsの読み込みに失敗: ${err.message}`);
    }
  }
  
  console.log('');
}

/**
 * 診断結果を表示
 */
function displayResults() {
  console.log(`${styles.bright}${styles.cyan}=====================================${styles.reset}`);
  console.log(`${styles.bright}${styles.cyan}バックエンド設定診断結果${styles.reset}`);
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
  
  // HTML 404エラーへの具体的な対応
  const hasHtml404Issue = results.issues.some(issue => issue.includes('HTML') || issue.includes('404'));
  if (hasHtml404Issue) {
    console.log(`${styles.bright}[3] HTML 404エラー修正のための具体的な提案:${styles.reset}`);
    
    console.log(`  1. server.jsにAPI用の404ハンドラーを追加:`);
    console.log(`     最終的なミドルウェアとして以下のコードを追加してください:`);
    console.log(`
    // API用の404ハンドラー - APIルートに対してJSONレスポンスを返す
    app.use('/api/*', (req, res) => {
      res.status(404).json({ 
        success: false, 
        error: 'APIルートが見つかりません' 
      });
    });
    
    // JSONパースエラーハンドラー
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
          success: false, 
          error: '無効なJSONフォーマット',
          details: err.message
        });
      }
      next(err);
    });
    
    // 通常のエラーハンドラー
    app.use((err, req, res, next) => {
      console.error(err.stack);
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: err.message || 'サーバーエラー'
      });
    });
    
    // 最終的なフォールバック用404ハンドラー
    app.use('*', (req, res) => {
      res.status(404).json({ 
        success: false, 
        error: 'リソースが見つかりません' 
      });
    });`);
    
    console.log('\n  2. CORSの設定を追加または修正:');
    console.log(`     server.jsの先頭付近に以下のコードを追加してください:`);
    console.log(`
    const cors = require('cors');
    
    // CORSの設定
    app.use(cors({
      origin: 'http://localhost:3001', // フロントエンドのオリジン
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));`);
    
    console.log('\n  3. レスポンスヘッダーの設定:');
    console.log(`     すべてのAPIレスポンスでContent-Typeを明示的に設定するミドルウェアを追加:`);
    console.log(`
    // APIレスポンス用ミドルウェア
    app.use('/api', (req, res, next) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });`);
    
    console.log('');
  }
  
  console.log(`${styles.bright}${styles.cyan}=====================================${styles.reset}`);
  
  // 診断結果をファイルに保存
  const resultsFile = path.join(__dirname, 'backend-config-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n診断結果を ${resultsFile} に保存しました\n`);
}

/**
 * メイン処理
 */
function main() {
  console.log(`${styles.bright}${styles.cyan}
=============================================
障害者雇用管理システム バックエンド設定診断
=============================================
${styles.reset}\n`);
  
  // ディレクトリ構造の確認
  const isValid = checkBackendStructure();
  if (!isValid) {
    displayResults();
    return;
  }
  
  // 各診断関数を実行
  checkServerFile();
  checkRouteFiles();
  checkControllers();
  checkMiddleware();
  checkEnvSettings();
  checkBackendProcess();
  checkHtml404Response();
  
  // 診断結果の表示
  displayResults();
}

main();