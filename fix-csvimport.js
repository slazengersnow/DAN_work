// fix-csvimport.js
const fs = require('fs');
const path = require('path');

// 正確なファイルパスを設定
const csvImportModalPath = path.resolve('./frontend/src/pages/MonthlyReport/CSVImportModal.tsx');

// ファイルの内容を読み込む
let content = fs.readFileSync(csvImportModalPath, 'utf8');

// バックアップを作成
fs.writeFileSync(`${csvImportModalPath}.backup`, content, 'utf8');
console.log(`バックアップファイルを作成しました: ${csvImportModalPath}.backup`);

// APIエンドポイントを修正 - 単数形から複数形へ
content = content.replace(/\/api\/monthly-report\//g, '/api/monthly-reports/');

// 修正したファイルを保存
fs.writeFileSync(csvImportModalPath, content, 'utf8');
console.log(`CSVImportModal.tsxファイルのAPIエンドポイントを修正しました`);

// MonthlyReportDetail.tsxも探して修正
console.log('MonthlyReportDetail.tsxファイルを探しています...');
// MonthlyReportDetailは同じディレクトリか近くにある可能性が高いので、親ディレクトリから検索
const baseDir = path.dirname(csvImportModalPath);
const parentDir = path.dirname(baseDir);

// 検索対象のディレクトリリスト
const searchDirs = [
  baseDir,
  parentDir,
  path.join(parentDir, 'components'),
  path.join(parentDir, 'pages')
];

let monthlyReportDetailFound = false;

for (const dir of searchDirs) {
  if (!fs.existsSync(dir)) continue;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'MonthlyReportDetail.tsx') {
      const monthlyReportDetailPath = path.join(dir, file);
      console.log(`MonthlyReportDetail.tsxファイルを見つけました: ${monthlyReportDetailPath}`);
      
      let detailContent = fs.readFileSync(monthlyReportDetailPath, 'utf8');
      fs.writeFileSync(`${monthlyReportDetailPath}.backup`, detailContent, 'utf8');
      
      detailContent = detailContent.replace(/\/api\/monthly-report\//g, '/api/monthly-reports/');
      fs.writeFileSync(monthlyReportDetailPath, detailContent, 'utf8');
      console.log(`MonthlyReportDetail.tsxファイルのAPIエンドポイントも修正しました`);
      
      monthlyReportDetailFound = true;
      break;
    }
  }
  if (monthlyReportDetailFound) break;
}

if (!monthlyReportDetailFound) {
  console.log('MonthlyReportDetail.tsxファイルが見つかりませんでした。手動で確認してください。');
}

console.log('修正が完了しました。サーバーとフロントエンドを再起動してください。');