// fix-monthly-report-endpoints.js
const fs = require('fs');
const path = require('path');

// バックアップ関数
function backupFile(filePath) {
  const backupPath = `${filePath}.backup`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`バックアップ作成: ${backupPath}`);
  }
}

// ------------- フロントエンドの修正 -------------
// CSVImportModal.tsxのパスを設定
const csvImportModalPath = path.resolve('./frontend/src/pages/MonthlyReport/CSVImportModal.tsx');

// ファイルの存在確認
if (!fs.existsSync(csvImportModalPath)) {
  console.error(`エラー: ${csvImportModalPath} が見つかりません。`);
  console.log('プロジェクトのルートディレクトリで実行しているか確認してください。');
  process.exit(1);
}

// バックアップ作成
backupFile(csvImportModalPath);

// ファイルの内容を読み込む
let content = fs.readFileSync(csvImportModalPath, 'utf8');

// APIエンドポイントを修正 - 単数形から複数形へ
let updatedContent = content.replace(/\/api\/monthly-report\//g, '/api/monthly-reports/');

// データ存在確認用URLも修正
if (content !== updatedContent) {
  fs.writeFileSync(csvImportModalPath, updatedContent, 'utf8');
  console.log(`CSVImportModal.tsxのAPIエンドポイントを修正しました: /api/monthly-report/ → /api/monthly-reports/`);
} else {
  console.log(`CSVImportModal.tsxに修正が必要な箇所はありませんでした。`);
}

// MonthlyReportDetail.tsxの探索と修正
const monthlyReportDetailPath = path.resolve('./frontend/src/pages/MonthlyReport/MonthlyReportDetail.tsx');
if (fs.existsSync(monthlyReportDetailPath)) {
  backupFile(monthlyReportDetailPath);
  
  let detailContent = fs.readFileSync(monthlyReportDetailPath, 'utf8');
  let updatedDetailContent = detailContent.replace(/\/api\/monthly-report\//g, '/api/monthly-reports/');
  
  if (detailContent !== updatedDetailContent) {
    fs.writeFileSync(monthlyReportDetailPath, updatedDetailContent, 'utf8');
    console.log(`MonthlyReportDetail.tsxのAPIエンドポイントも修正しました`);
  } else {
    console.log(`MonthlyReportDetail.tsxに修正が必要な箇所はありませんでした。`);
  }
} else {
  console.log(`警告: MonthlyReportDetail.tsxが見つかりません。`);
}

// ------------- バックエンドの修正（オプション） -------------

// バックエンドルートファイルの探索
const backendRoutesPaths = [
  path.resolve('./backend/routes'),
  path.resolve('./backend/src/routes')
];

let routeFilePath = null;
let routeContent = null;

// ルートファイルを探す
for (const routesPath of backendRoutesPaths) {
  if (!fs.existsSync(routesPath)) continue;
  
  const routeFiles = fs.readdirSync(routesPath);
  
  // monthlyReportに関連するルートファイルを探す
  const monthlyReportRouteFile = routeFiles.find(file => 
    file.toLowerCase().includes('monthly') || 
    (file.toLowerCase().includes('report') && !file.toLowerCase().includes('payment'))
  );
  
  if (monthlyReportRouteFile) {
    routeFilePath = path.join(routesPath, monthlyReportRouteFile);
    try {
      routeContent = fs.readFileSync(routeFilePath, 'utf8');
      console.log(`月次レポートのルートファイルを見つけました: ${routeFilePath}`);
      break;
    } catch (err) {
      console.log(`警告: ${routeFilePath} を読み込めませんでした。`);
    }
  }
}

// サーバーファイルの探索
const serverFilePaths = [
  path.resolve('./backend/server.js'),
  path.resolve('./backend/src/server.js'),
  path.resolve('./backend/app.js'),
  path.resolve('./backend/src/app.js')
];

let serverFilePath = null;
let serverContent = null;

// サーバーファイルを探す
for (const filePath of serverFilePaths) {
  if (fs.existsSync(filePath)) {
    try {
      serverFilePath = filePath;
      serverContent = fs.readFileSync(filePath, 'utf8');
      console.log(`サーバーファイルを見つけました: ${serverFilePath}`);
      break;
    } catch (err) {
      console.log(`警告: ${filePath} を読み込めませんでした。`);
    }
  }
}

// サーバーにエイリアスルートを追加
if (serverFilePath && serverContent) {
  backupFile(serverFilePath);
  
  // 既にエイリアスが追加されているか確認
  if (!serverContent.includes('/api/monthly-report') && 
      serverContent.includes('/api/monthly-reports')) {
    
    // 月次レポートルートが登録されている行を探す
    const routeRegistrationRegex = /app\.use\(['"]\/api\/monthly-reports['"],[^\n]+\);/;
    const match = serverContent.match(routeRegistrationRegex);
    
    if (match) {
      const originalLine = match[0];
      // 元のルート登録の直後にエイリアスを追加
      const aliasLine = originalLine.replace('/api/monthly-reports', '/api/monthly-report');
      const updatedServerContent = serverContent.replace(
        originalLine,
        `${originalLine}\n// 互換性のためのエイリアスルート\n${aliasLine} // エイリアスルート`
      );
      
      fs.writeFileSync(serverFilePath, updatedServerContent, 'utf8');
      console.log(`サーバーファイルにエイリアスルートを追加しました: ${serverFilePath}`);
    } else {
      console.log(`警告: サーバーファイル内で月次レポートルートの登録が見つかりませんでした。`);
    }
  } else {
    console.log(`警告: サーバーファイルに既にエイリアスルートがあるか、月次レポートのルート登録が見つかりません。`);
  }
}

console.log('\n修正が完了しました。');
console.log('1. バックエンドサーバーを再起動してください: cd backend && npm run dev');
console.log('2. フロントエンドを再起動してください: cd frontend && npm start');