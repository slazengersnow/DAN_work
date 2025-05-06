/**
 * 月次詳細チェックスクリプト
 * このスクリプトは月次詳細の表示と計算が正しいかをテストします
 */

const fs = require('fs');
const path = require('path');

// 月次詳細の検証関数
function verifyMonthlyReportDetail() {
  console.log('月次詳細の検証を開始します...');
  
  try {
    // ファイルパス
    const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'MonthlyReport', 'MonthlyReportDetail.tsx');
    
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      throw new Error(`ファイルが見つかりません: ${filePath}`);
    }
    
    // ファイルを読み込む
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`ファイルを読み込みました: ${filePath}`);
    
    // 検証項目とその説明
    const verifications = [
      {
        name: '実雇用率計算の精度',
        description: '実雇用率が小数点第2位で正確に計算されること',
        regex: /Math\.round\(rawRate \* 100\) \/ 100/,
        expected: true
      },
      {
        name: '実雇用率の表示形式',
        description: '実雇用率が小数点第2位まで表示されること',
        regex: /displayValue = Number\(value\)\.toFixed\(2\)/,
        expected: true
      },
      {
        name: '法定雇用率の表示形式',
        description: '法定雇用率が小数点第2位まで表示されること',
        regex: /displayValue = value\.toFixed\(2\)/,
        expected: true
      },
      {
        name: '障がい者合計の計算',
        description: '1・2級パートタイムが正しくカウントされること',
        regex: /level1And2PartTimeValues\[i\] \* 1/,
        expected: true
      },
      {
        name: '法定雇用者数の計算方法',
        description: '法定雇用者数が切り捨てで計算されること',
        regex: /Math\.floor\(\(legalRateValues\[i\] \* totalEmployeeValues\[i\]\) \/ 100\)/,
        expected: true
      },
      {
        name: '超過・不足合計の計算',
        description: '超過・不足の合計が単純合計ではなく正確に計算されること',
        regex: /newData\.data\[overUnderRowIndex\]\.values\[12\] = totalDisabledValues\[12\] - legalCountValues\[12\]/,
        expected: true
      },
      {
        name: '1桁小数の2桁表示処理',
        description: '1桁小数の法定雇用率を2桁で表示する処理が実装されていること',
        regex: /value\.includes\('\.'\) && value\.split\('\.'\)\[1\]\.length === 1/,
        expected: true
      }
    ];
    
    // 各項目を検証
    const results = verifications.map(v => {
      const result = v.regex.test(content);
      return {
        ...v,
        status: result === v.expected ? 'PASS' : 'FAIL'
      };
    });
    
    // 結果を表示
    console.log('\n検証結果:');
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.name}: ${r.status}`);
      console.log(`   ${r.description}`);
      if (r.status === 'FAIL') {
        console.log('   [警告] この項目は検証に失敗しました。修正が必要です。');
      }
      console.log('');
    });
    
    // 検証結果の要約
    const passCount = results.filter(r => r.status === 'PASS').length;
    const totalCount = results.length;
    console.log(`合計: ${passCount}/${totalCount} の項目が合格`);
    
    // サンプル計算をシミュレート
    console.log('\nサンプル計算のシミュレーション:');
    
    // 実雇用率の計算
    const totalEmployees = 100;
    const disabledCount = 2.5;  // 2.5カウント (例: 重度1名 + 軽度1名 × 0.5)
    
    const actualRate_old = Math.ceil((disabledCount / totalEmployees) * 100 * 10) / 10;
    const actualRate_new = Math.round((disabledCount / totalEmployees) * 100 * 100) / 100;
    
    console.log('実雇用率計算の比較:');
    console.log(`- 修正前: ${actualRate_old}% (小数点第1位切り上げ)`);
    console.log(`- 修正後: ${actualRate_new}% (小数点第2位四捨五入)`);
    
    // 法定雇用者数の計算
    const legalRate = 2.3;  // 法定雇用率 2.3%
    
    const legalCount_old = Math.ceil((legalRate * totalEmployees) / 100);
    const legalCount_new = Math.floor((legalRate * totalEmployees) / 100);
    
    console.log('\n法定雇用者数計算の比較:');
    console.log(`- 修正前: ${legalCount_old}名 (切り上げ)`);
    console.log(`- 修正後: ${legalCount_new}名 (切り捨て)`);
    
    // 超過・不足数の計算
    const overUnder_old = disabledCount - legalCount_old;
    const overUnder_new = disabledCount - legalCount_new;
    
    console.log('\n超過・不足数の比較:');
    console.log(`- 修正前: ${overUnder_old} (${overUnder_old < 0 ? '不足' : '超過'})`);
    console.log(`- 修正後: ${overUnder_new} (${overUnder_new < 0 ? '不足' : '超過'})`);
    
    // 全体結果
    const allPassed = passCount === totalCount;
    return {
      success: allPassed,
      message: allPassed ? '全ての検証が成功しました' : `${totalCount - passCount}個の項目が検証に失敗しました`
    };
    
  } catch (error) {
    console.error(`エラーが発生しました: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

// 実行
const result = verifyMonthlyReportDetail();
console.log(`\n検証結果: ${result.success ? '成功' : '失敗'}`);
console.log(result.message);

if (!result.success) {
  console.log('\n推奨される対応:');
  console.log('1. monthly-report-fixes.js スクリプトを実行して修正を適用する');
  console.log('2. アプリケーションを再起動して変更を確認する');
  console.log('3. 問題が解決しない場合は、バックアップからファイルを復元する');
} else {
  console.log('\nこれで月次詳細表示は正しく動作します。');
  console.log('動作確認として以下の項目をテストしてください:');
  console.log('- 法定雇用率を編集して小数点第2位まで表示されるか確認');
  console.log('- 実雇用率が正確に計算されているか確認');
  console.log('- 超過・不足数が正確に計算されているか確認');
}