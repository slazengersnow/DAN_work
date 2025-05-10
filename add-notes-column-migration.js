// add-notes-column-migration.js
const { Pool } = require('pg');
// configディレクトリを参照
const config = require('./config');

// PostgreSQLへの接続設定
const pool = new Pool({
  user: config.db.user || 'postgres',
  host: config.db.host || 'localhost',
  database: config.db.database || 'disability_employment',
  password: config.db.password || 'password',
  port: config.db.port || 5432
});

async function addNotesColumn() {
  const client = await pool.connect();
  
  try {
    console.log('マイグレーション開始: notesカラムの追加...');
    
    // テーブル一覧を取得して従業員テーブルの正確な名前を確認
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('データベース内のテーブル一覧:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // 従業員テーブルを特定（employee または employees の可能性が高い）
    let employeeTableName = null;
    for (const row of tablesResult.rows) {
      if (row.table_name.includes('employee')) {
        employeeTableName = row.table_name;
        break;
      }
    }
    
    if (!employeeTableName) {
      console.log('従業員テーブルが見つかりませんでした。テーブル名を手動で指定してください。');
      // 代替手段として、エラーが発生しているテーブルのカラム一覧を確認
      const columnsResult = await client.query(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
      `);
      
      console.log('全テーブルのカラム一覧:');
      columnsResult.rows.forEach(row => {
        console.log(`テーブル: ${row.table_name}, カラム: ${row.column_name}`);
      });
      
      return;
    }
    
    console.log(`従業員テーブルを特定しました: ${employeeTableName}`);
    
    // 現在のカラム一覧を確認
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `, [employeeTableName]);
    
    console.log(`テーブル ${employeeTableName} の現在のカラム一覧:`);
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}`);
    });
    
    // notesカラムが既に存在するか確認
    const notesExists = columnsResult.rows.some(row => row.column_name === 'notes');
    
    if (notesExists) {
      console.log('notesカラムは既に存在します。マイグレーションをスキップします。');
      return;
    }
    
    // notesカラムを追加
    await client.query(`
      ALTER TABLE ${employeeTableName} ADD COLUMN notes TEXT
    `);
    
    console.log(`テーブル ${employeeTableName} に notesカラムを追加しました。`);
    console.log('マイグレーション完了');
    
  } catch (err) {
    console.error('マイグレーション中にエラーが発生しました:', err);
  } finally {
    client.release();
    // 接続プールを終了
    await pool.end();
  }
}

// マイグレーションを実行
addNotesColumn().catch(err => {
  console.error('予期せぬエラーが発生しました:', err);
});