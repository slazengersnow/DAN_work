/**
 * パッチ適用スクリプト - monthlyReportController.js 修正
 * 
 * このスクリプトは monthlyReportController.js の fallbackQuery 内の
 * "notes as memo" を "NULL as memo" に変更して、notes カラムが存在しない場合でも
 * エラーが発生しないようにします。
 * 
 * 使用方法: node patch_controller.js
 */

const fs = require('fs');
const path = require('path');

// パス設定
const controllerPath = path.join(__dirname, 'backend', 'controllers', 'monthlyReportController.js');
const backupPath = path.join(__dirname, 'backend', 'controllers', 'monthlyReportController.backup.js');

// メイン関数
async function applyPatch() {
  console.log('monthlyReportController.js パッチ適用を開始します...');
  
  try {
    // ファイルの存在確認
    if (!fs.existsSync(controllerPath)) {
      console.error('エラー: コントローラファイルが見つかりません:', controllerPath);
      return;
    }
    
    // バックアップを作成
    console.log('バックアップを作成中...');
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(controllerPath, backupPath);
      console.log(`バックアップを作成しました: ${backupPath}`);
    } else {
      console.log(`バックアップは既に存在します: ${backupPath}`);
    }
    
    // ファイル内容を読み込み
    const content = fs.readFileSync(controllerPath, 'utf8');
    
    // fallbackQuery を検索
    const fallbackQueryPattern = /const\s+fallbackQuery\s+=\s+`[\s\S]+?FROM\s+employees[\s\S]+?`/;
    const fallbackQueryMatch = content.match(fallbackQueryPattern);
    
    if (!fallbackQueryMatch) {
      console.error('エラー: fallbackQueryが見つかりませんでした');
      return;
    }
    
    // 元のクエリを取得
    const originalQuery = fallbackQueryMatch[0];
    console.log('修正前のクエリ:');
    console.log(originalQuery);
    
    // NULL as memo への修正バージョンを作成
    const modifiedQuery = originalQuery.replace(
      /notes\s+as\s+memo/i,
      'NULL as memo'
    );
    
    // 実際に変更があったか確認
    if (originalQuery === modifiedQuery) {
      console.log('変更不要: "notes as memo" が見つかりませんでした。既に "NULL as memo" が使用されているか、クエリの形式が異なります。');
      return;
    }
    
    // ファイル内容を更新
    const updatedContent = content.replace(originalQuery, modifiedQuery);
    
    // 更新された内容を書き込み
    fs.writeFileSync(controllerPath, updatedContent, 'utf8');
    
    console.log('修正後のクエリ:');
    console.log(modifiedQuery);
    console.log('\n修正が完了しました！');
    console.log(`コントローラファイルを更新しました: ${controllerPath}`);
    console.log('このパッチにより、データベースに notes カラムがない場合でもエラーは発生しなくなります。');
    
  } catch (error) {
    console.error('パッチ適用中にエラーが発生しました:', error);
  }
}

// スクリプト実行
applyPatch().catch(err => {
  console.error('スクリプト実行エラー:', err);
});