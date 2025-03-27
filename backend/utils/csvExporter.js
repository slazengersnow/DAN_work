// backend/utils/csvExporter.js
const { Parser } = require('json2csv');

// 従業員データのCSVエクスポート
exports.exportEmployeesToCsv = (employees) => {
  const fields = [
    { label: '社員ID', value: 'employee_id' },
    { label: '氏名', value: 'name' },
    { label: '氏名カナ', value: 'name_kana' },
    { label: '性別', value: row => row.gender === '1' ? '男性' : '女性' },
    { label: '生年月日', value: 'birth_date' },
    { label: '障害種別', value: 'disability_type' },
    { label: '等級', value: row => {
      if (row.physical_verified && row.physical_degree_current) {
        return row.physical_degree_current;
      } else if (row.intellectual_verified && row.intellectual_degree_current) {
        return row.intellectual_degree_current;
      } else if (row.mental_verified && row.mental_degree_current) {
        return row.mental_degree_current;
      }
      return '';
    }},
    { label: '採用日', value: 'hire_date' },
    { label: '状態', value: 'status' },
    { label: 'カウント', value: 'count' }
  ];
  
  const parser = new Parser({ fields });
  return parser.parse(employees);
};

// 月次レポートデータのCSVエクスポート
exports.exportMonthlyReportToCsv = (monthlyData, employees) => {
  // 基本情報
  const basicInfo = [
    { year: monthlyData.year, month: monthlyData.month },
    { '対象年月': `${monthlyData.year}年${monthlyData.month}月` },
    { '常用労働者数': monthlyData.total_employees },
    { '障害者数': monthlyData.disabled_employees },
    { '実雇用率': `${monthlyData.actual_rate}%` },
    { '法定雇用率': `${monthlyData.legal_rate}%` },
    { '法定雇用者数': monthlyData.legal_count },
    { '不足数': monthlyData.shortage },
    {}
  ];
  
  // 従業員データのフィールド
  const employeeFields = [
    { label: 'No.', value: (row, i) => i + 1 },
    { label: '社員ID', value: 'employee_id' },
    { label: '氏名', value: 'name' },
    { label: '障害区分', value: 'disability_type' },
    { label: '等級', value: 'grade' },
    { label: '採用日', value: 'hire_date' },
    { label: 'カウント', value: 'count' },
    { label: '状態', value: 'status' },
    { label: `${monthlyData.month}月フラグ`, value: row => row.monthlyWork && row.monthlyWork.actual_hours >= row.monthlyWork.scheduled_hours ? 1 : 0 },
    { label: 'コメント', value: row => row.monthlyWork?.exception_reason || '' }
  ];
  
  // 従業員データをパース
  const employeeParser = new Parser({ fields: employeeFields });
  const employeeCsv = employeeParser.parse(employees);
  
  // 基本情報をCSV形式に変換
  let basicInfoCsv = '';
  basicInfo.forEach(item => {
    const key = Object.keys(item)[0];
    if (key) {
      basicInfoCsv += `${key},${item[key]}\n`;
    } else {
      basicInfoCsv += '\n';
    }
  });
  
  // 基本情報と従業員データを結合
  return basicInfoCsv + employeeCsv;
};

// 納付金申告データのCSVエクスポート
exports.exportPaymentReportToCsv = (yearlyData) => {
  const fields = [
    { label: '対象月', value: row => `${row.year}年${row.month}月` },
    { label: '常用労働者数', value: 'total_employees' },
    { label: '障害者雇用数', value: 'disabled_employees' },
    { label: '実雇用率', value: row => `${row.actual_rate}%` },
    { label: '法定雇用障害者数', value: 'legal_count' },
    { label: '不足数', value: 'shortage' }
  ];
  
  const parser = new Parser({ fields });
  return parser.parse(yearlyData);
};