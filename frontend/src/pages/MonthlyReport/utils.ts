import { 
  MonthlyTotal, 
  MonthlyDetailData, 
  Employee, 
  MonthlyDetailDataRow
} from './types';

/**
 * nullまたはundefinedの場合は0を返す安全な数値変換関数
 */
export function safeNumber(value: number | string | undefined | null): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}

/**
 * processEmployeeData: 従業員データを処理して月次レポート用に整形する
 */
export const processEmployeeData = (apiEmployeeData: any[], selectedYear?: number): Employee[] => {
  return apiEmployeeData.map((emp: any, index: number) => {
    // 月次ステータスを計算
    const monthlyStatus = Array(12).fill(1);
    if (emp.monthlyWork) {
      const monthIndex = emp.monthlyWork.month - 1;
      if (emp.monthlyWork.actual_hours === 0) {
        monthlyStatus[monthIndex] = 0;
      } else if (emp.monthlyWork.actual_hours < emp.monthlyWork.scheduled_hours * 0.8) {
        monthlyStatus[monthIndex] = 0.5;
      }
    }
    
    return {
      ...emp,
      no: index + 1,
      monthlyStatus,
      memo: emp.monthlyWork?.exception_reason || ''
    };
  });
};

/**
 * 年間データをUI表示用に変換する
 */
export const formatYearlyDataForUI = (yearlyData: MonthlyTotal[]): MonthlyDetailData => {
  // 無効なデータをフィルタリング
  const validData = yearlyData.filter(d => d != null);
  
  // 月別に並べ替え（4月始まり会計年度を想定）
  const orderedData = [
    ...validData.filter(d => d.month >= 4).sort((a, b) => a.month - b.month),
    ...validData.filter(d => d.month <= 3).sort((a, b) => a.month - b.month)
  ];

  // 各月のデータが存在するか確認し、不足している月のデータを補完
  const fullYearData: MonthlyTotal[] = [];
  const monthsInFiscalYear = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  
  // 必要に応じて全ての月のデータを用意
  const fiscalYear = orderedData.length > 0 ? orderedData[0].fiscal_year : new Date().getFullYear();
  
  monthsInFiscalYear.forEach(month => {
    const existingData = orderedData.find(d => d.month === month);
    if (existingData) {
      fullYearData.push(existingData);
    } else {
      // 存在しない月のデータを空データで補完
      fullYearData.push({
        id: 0,
        fiscal_year: fiscalYear,
        month: month,
        employees_count: 0,
        fulltime_count: 0,
        parttime_count: 0,
        level1_2_count: 0,
        other_disability_count: 0,
        level1_2_parttime_count: 0,
        other_parttime_count: 0,
        legal_employment_rate: 2.3,
        total_disability_count: 0,
        employment_rate: 0,
        required_count: 0,
        over_under_count: 0,
        status: ''
      });
    }
  });

  // 各値の合計を計算
  const sumTotalEmployees = fullYearData.reduce((sum, d) => sum + safeNumber(d.employees_count), 0);
  const sumFullTimeEmployees = fullYearData.reduce((sum, d) => sum + safeNumber(d.fulltime_count), 0);
  const sumPartTimeEmployees = fullYearData.reduce((sum, d) => sum + safeNumber(d.parttime_count), 0);
  const sumLevel1_2Count = fullYearData.reduce((sum, d) => sum + safeNumber(d.level1_2_count), 0);
  const sumOtherDisabilityCount = fullYearData.reduce((sum, d) => sum + safeNumber(d.other_disability_count), 0);
  const sumLevel1_2ParttimeCount = fullYearData.reduce((sum, d) => sum + safeNumber(d.level1_2_parttime_count), 0);
  const sumOtherParttimeCount = fullYearData.reduce((sum, d) => sum + safeNumber(d.other_parttime_count), 0);
  const sumTotalDisabilityCount = fullYearData.reduce((sum, d) => sum + safeNumber(d.total_disability_count), 0);
  const avgActualRate = parseFloat((fullYearData.reduce((sum, d) => sum + safeNumber(d.employment_rate), 0) / fullYearData.length).toFixed(1));
  const avgLegalRate = parseFloat((fullYearData.reduce((sum, d) => sum + safeNumber(d.legal_employment_rate), 0) / fullYearData.length).toFixed(1));
  const sumLegalCount = fullYearData.reduce((sum, d) => sum + safeNumber(d.required_count), 0);
  const sumOverUnder = fullYearData.reduce((sum, d) => sum + safeNumber(d.over_under_count), 0);

  // UI表示用のデータ形式に変換
  return {
    months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
    data: [
      { id: 1, item: '従業員数', values: [...fullYearData.map(d => safeNumber(d.employees_count)), sumTotalEmployees], suffix: '名' },
      { id: 2, item: 'フルタイム従業員数', values: [...fullYearData.map(d => safeNumber(d.fulltime_count)), sumFullTimeEmployees], suffix: '名' },
      { id: 3, item: 'パートタイム従業員数', values: [...fullYearData.map(d => safeNumber(d.parttime_count)), sumPartTimeEmployees], suffix: '名' },
      { id: 4, item: 'トータル従業員数', values: [...fullYearData.map(d => safeNumber(d.employees_count)), sumTotalEmployees], suffix: '名', isCalculated: true },
      { id: 5, item: '1級・2級の障がい者', values: [...fullYearData.map(d => safeNumber(d.level1_2_count)), sumLevel1_2Count], suffix: '名', isDisability: true },
      { id: 6, item: 'その他障がい者', values: [...fullYearData.map(d => safeNumber(d.other_disability_count)), sumOtherDisabilityCount], suffix: '名', isDisability: true },
      { id: 7, item: '1級・2級の障がい者(パートタイム)', values: [...fullYearData.map(d => safeNumber(d.level1_2_parttime_count)), sumLevel1_2ParttimeCount], suffix: '名', isDisability: true },
      { id: 8, item: 'その他障がい者(パートタイム)', values: [...fullYearData.map(d => safeNumber(d.other_parttime_count)), sumOtherParttimeCount], suffix: '名', isDisability: true },
      { id: 9, item: '障がい者合計', values: [...fullYearData.map(d => safeNumber(d.total_disability_count)), sumTotalDisabilityCount], suffix: '名', isDisability: true, isCalculated: true },
      { id: 10, item: '実雇用率', values: [...fullYearData.map(d => safeNumber(d.employment_rate)), avgActualRate], suffix: '%', isRatio: true, isCalculated: true },
      { id: 11, item: '法定雇用率', values: [...fullYearData.map(d => safeNumber(d.legal_employment_rate)), avgLegalRate], suffix: '%', isRatio: true },
      { id: 12, item: '法定雇用者数', values: [...fullYearData.map(d => safeNumber(d.required_count)), sumLegalCount], suffix: '名', isCalculated: true },
      { id: 13, item: '超過・未達', values: [...fullYearData.map(d => safeNumber(d.over_under_count)), sumOverUnder], isNegative: true, isCalculated: true, suffix: '名' }
    ]
  };
};

// CSVインポート用のデータ構造
export interface MonthlyCSVData {
  fiscal_year: number;
  month: number;
  employees_count: number;
  fulltime_count: number;
  parttime_count: number;
  level1_2_count: number;
  other_disability_count: number;
  level1_2_parttime_count: number;
  other_parttime_count: number;
  legal_employment_rate: number;
  total_disability_count?: number;
  employment_rate?: number;
  required_count?: number;
  over_under_count?: number;
}

/**
 * CSVデータ項目と内部APIフィールドの対応マッピング
 */
const CSV_TO_API_FIELD_MAPPING: { [key: string]: string } = {
  // 従業員データ
  '従業員数': 'employees_count',  
  '従業員数 (名)': 'employees_count',
  'フルタイム従業員数': 'fulltime_count',
  'フルタイム従業員数 (名)': 'fulltime_count',
  'パートタイム従業員数': 'parttime_count',
  'パートタイム従業員数 (名)': 'parttime_count',
  'トータル従業員数': 'total_employees_count',
  'トータル従業員数 (名)': 'total_employees_count',
  
  // 障がい者データ
  '1級・2級の障がい者': 'level1_2_count',
  '1級・2級の障がい者 (名)': 'level1_2_count',
  'その他障がい者': 'other_disability_count',
  'その他障がい者 (名)': 'other_disability_count',
  '1級・2級の障がい者(パートタイム)': 'level1_2_parttime_count',
  '1級・2級の障がい者(パートタイム)(名)': 'level1_2_parttime_count',
  '1級・2級の障がい者（パートタイム）': 'level1_2_parttime_count',
  '1級・2級の障がい者（パートタイム）(名)': 'level1_2_parttime_count',
  'その他障がい者(パートタイム)': 'other_parttime_count',
  'その他障がい者(パートタイム)(名)': 'other_parttime_count',
  'その他障がい者（パートタイム）': 'other_parttime_count',
  'その他障がい者（パートタイム）(名)': 'other_parttime_count',
  '障がい者合計': 'total_disability_count',
  '障がい者合計 (名)': 'total_disability_count',
  
  // 雇用率関連
  '実雇用率': 'employment_rate',
  '実雇用率 (%)': 'employment_rate',
  '法定雇用率': 'legal_employment_rate',
  '法定雇用率 (%)': 'legal_employment_rate',
  '法定雇用者数': 'required_count',
  '法定雇用者数 (名)': 'required_count',
  '超過・未達': 'over_under_count',
  '超過・未達 (名)': 'over_under_count'
};

/**
 * 文字化けを防止するBOMを追加してCSVテンプレートを生成する
 * MonthlyReportDetailの表示項目と一致させた形式に修正
 */
export const generateCSVTemplate = (fiscalYear: number): string => {
  // CSVデータ作成
  let csvContent = '\uFEFF'; // BOMを追加して文字化けを防止
  
  // 年度行を追加 - 年度の値を明示的に指定
  csvContent += `年度,${fiscalYear}\n`;
  
  // 月の行 - 各月を明示的に列挙
  csvContent += '月,4,5,6,7,8,9,10,11,12,1,2,3\n';
  
  // データ行 - 指定された項目のみ含める（自動計算項目を除外）
  const dataRows = [
    ['従業員数 (名)', ...Array(12).fill('0')],
    ['フルタイム従業員数 (名)', ...Array(12).fill('0')],
    ['パートタイム従業員数 (名)', ...Array(12).fill('0')],
    ['1級・2級の障がい者 (名)', ...Array(12).fill('0')],
    ['その他障がい者 (名)', ...Array(12).fill('0')],
    ['1級・2級の障がい者(パートタイム)(名)', ...Array(12).fill('0')],
    ['その他障がい者(パートタイム)(名)', ...Array(12).fill('0')],
    ['法定雇用率 (%)', ...Array(12).fill('2.3')]
  ];
  
  // データ行を追加
  dataRows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
};

/**
 * CSVファイルをダウンロードする
 */
export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 行タイプを識別する関数 - 表記ゆれに対応
 */
const identifyRowType = (rowText: string): string | null => {
  // 表記ゆれや部分一致を考慮した判定ルール
  const patterns = [
    { id: '従業員数 (名)', keywords: ['従業員数'], excludes: ['フルタイム', 'パートタイム', 'トータル'] },
    { id: 'フルタイム従業員数 (名)', keywords: ['フルタイム', '従業員'] },
    { id: 'パートタイム従業員数 (名)', keywords: ['パートタイム', '従業員'] },
    { id: 'トータル従業員数 (名)', keywords: ['トータル', '従業員'] },
    { id: '1級・2級の障がい者 (名)', keywords: ['1級・2級', '障がい者'], excludes: ['パートタイム'] },
    { id: 'その他障がい者 (名)', keywords: ['その他', '障がい者'], excludes: ['パートタイム'] },
    { id: '1級・2級の障がい者(パートタイム)(名)', keywords: ['1級・2級', '障がい者', 'パートタイム'] },
    { id: 'その他障がい者(パートタイム)(名)', keywords: ['その他', '障がい者', 'パートタイム'] },
    { id: '法定雇用率 (%)', keywords: ['法定', '雇用率'] }
  ];

  for (const pattern of patterns) {
    const allKeywordsMatch = pattern.keywords.every(kw => rowText.includes(kw));
    const noExcludesMatch = !pattern.excludes || 
      pattern.excludes.every(ex => !rowText.includes(ex));
    
    if (allKeywordsMatch && noExcludesMatch) {
      return pattern.id;
    }
  }
  
  return null;
};

/**
 * CSVから抽出された障がい者データを正しくAPIデータに変換する関数
 */
const processDisabilityData = (
  level1_2Count: number, 
  otherDisabilityCount: number, 
  level1_2ParttimeCount: number, 
  otherParttimeCount: number
): { 
  level1_2_count: number, 
  other_disability_count: number, 
  level1_2_parttime_count: number, 
  other_parttime_count: number,
  total_disability_count: number
} => {
  // それぞれの値を整数に変換
  const l1_2 = Math.round(level1_2Count);
  const other = Math.round(otherDisabilityCount);
  const l1_2_part = Math.round(level1_2ParttimeCount);
  const other_part = Math.round(otherParttimeCount);
  
  // 合計値を計算（障がい者合計値）
  // 1級・2級は2倍、パートタイムは0.5倍でカウント
  const total = (l1_2 * 2) + other + (l1_2_part * 2 * 0.5) + (other_part * 0.5);
  
  return {
    level1_2_count: l1_2,
    other_disability_count: other,
    level1_2_parttime_count: l1_2_part,
    other_parttime_count: other_part,
    total_disability_count: total
  };
};

/**
 * CSV形式で入力されたテンプレートデータをAPIで使用可能な形式に変換する
 * 改良版: 年度の検出とカラム名の特定を強化、障がい者データのマッピングを修正
 */
export const convertTemplateDataToApiFormat = (csvData: any[], defaultFiscalYear: number): MonthlyCSVData[] => {
  // デバッグ出力
  console.log('テンプレートデータをAPI形式に変換開始:', csvData);
  
  // 年度の取得
  let fiscalYear = defaultFiscalYear; // デフォルト値
  let actualYearDetected = false;     // 実際に年度が検出されたかのフラグ
  
  // CSVのヘッダー行を分析し、数値の年度を検出する
  for (const row of csvData) {
    // 年度キーが存在する行を検索
    if ('年度' in row && row['年度'] !== null && row['年度'] !== '' && row['年度'] !== undefined) {
      const yearValue = row['年度'];
      if (yearValue !== null && yearValue !== '' && yearValue !== undefined) {
        // 文字列や数値にかかわらず、有効な年度値として処理を試みる
        let yearNum: number | null = null;
        
        if (typeof yearValue === 'number') {
          yearNum = yearValue;
        } else if (typeof yearValue === 'string') {
          // 文字列から数値を抽出
          const match = yearValue.match(/\d{4}/);
          if (match) {
            yearNum = parseInt(match[0], 10);
          } else {
            const parsedNum = parseInt(yearValue, 10);
            if (!isNaN(parsedNum)) {
              yearNum = parsedNum;
            }
          }
        }
        
        if (yearNum !== null && !isNaN(yearNum) && yearNum >= 1000 && yearNum <= 9999) {
          // 有効な4桁の年度として認識
          fiscalYear = yearNum;
          actualYearDetected = true;
          console.log(`CSVから年度を検出: ${fiscalYear}`);
          break;
        }
      }
    }
    
    // 年度の列がなければ、列名自体から年度を探す (例: 2024, 2023 などの列名)
    for (const [key, value] of Object.entries(row)) {
      if (typeof key === 'string' && /^20\d{2}$/.test(key)) {
        const yearNum = parseInt(key, 10);
        if (!isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2999) {
          fiscalYear = yearNum;
          actualYearDetected = true;
          console.log(`CSV列名から年度を検出: ${fiscalYear}`);
          break;
        }
      }
    }
    
    if (actualYearDetected) break;
  }
  
  // 年度が検出されなかった場合はデフォルト値を使用
  if (!actualYearDetected) {
    console.log(`年度が検出されませんでした。デフォルト値を使用します: ${defaultFiscalYear}`);
  } else {
    console.log(`使用する年度: ${fiscalYear}`);
  }
  
  // 横型テンプレートの処理（修正版）
  return processHorizontalTemplate(csvData, fiscalYear);
};

/**
 * 横型テンプレート処理の改良版
 * いくつかの特殊な形式に対応し、障がい者データのマッピングを修正
 */
const processHorizontalTemplate = (csvData: any[], fiscalYear: number): MonthlyCSVData[] => {
  console.log('横型テンプレート処理開始:', { rows: csvData.length, fiscalYear });
  
  // 各月のデータを格納する配列
  const monthlyData: MonthlyCSVData[] = [];
  
  // 各月に対応する列の名前と数値
  const monthColumns = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '1', '2', '3'];
  
  if (csvData.length === 0) {
    console.error('CSVデータが空です');
    return [];
  }

  // データを詳細に調査するための状態表示
  console.log('CSVデータの先頭行:', csvData[0]);
  console.log('CSV行の例:', csvData.slice(0, 3));
  
  // すべての行のキーを表示
  const allKeys = new Set<string>();
  csvData.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });
  console.log('すべての列キー:', Array.from(allKeys));

  // ヘッダー行を特定するための改良処理
  let monthKeyMap: {[key: string]: number} = {};
  
  // 月の行を探す - 改良版
  for (const row of csvData) {
    // '月'という値を持つ行を探す (これは元のテンプレート形式)
    const rowValues = Object.values(row).map(v => String(v).trim());
    if (rowValues.includes('月')) {
      console.log('「月」を含む行を検出:', row);
      
      // 月の列と数値の対応関係を作成
      Object.entries(row).forEach(([key, value]) => {
        // 月の値と一致する列を記録
        if (monthColumns.includes(String(value))) {
          monthKeyMap[key] = parseInt(String(value), 10);
        }
      });
      
      if (Object.keys(monthKeyMap).length > 0) {
        console.log('月の列マッピングを検出:', monthKeyMap);
        break;
      }
    }
  }
  
  // 月の行が見つからない場合、最初の行が月の行であると仮定
  if (!monthKeyMap || Object.keys(monthKeyMap).length === 0) {
    console.log('明示的な月行が見つからないため、最初の行を使用します');
    const firstRow = csvData[0];
    
    // 最初の行の数値を月として解釈
    if (firstRow) {  // nullチェックを追加
      Object.entries(firstRow).forEach(([key, value]) => {
        const strValue = String(value).trim();
        // 数値または月の列名に一致する値を探す
        if (monthColumns.includes(strValue) || !isNaN(parseInt(strValue, 10))) {
          // 数値の場合、1-12の範囲に収める
          const monthNum = parseInt(strValue, 10);
          if (monthNum >= 1 && monthNum <= 12) {
            monthKeyMap[key] = monthNum;
          }
        }
      });
    }
    
    console.log('推測された月の列マッピング:', monthKeyMap);
  }
  
  // 月の行が依然として見つからない、またはマッピングが作成できない場合
  if (Object.keys(monthKeyMap).length === 0) {
    console.log('月のマッピングが作成できませんでした。列名から推測を試みます。');
    
    // 列名から月を推測
    const possibleMonthColumns = Array.from(allKeys).filter(key => 
      key !== '年度' && key !== '月'
    );
    
    // 月の順序を推測
    possibleMonthColumns.forEach((key, index) => {
      const monthIndex = index % 12;
      const monthNum = monthIndex >= 9 ? monthIndex - 8 : monthIndex + 4; // 4,5,6,7,8,9,10,11,12,1,2,3
      monthKeyMap[key] = monthNum;
    });
    
    console.log('列名から推測された月のマッピング:', monthKeyMap);
  }
  
  if (Object.keys(monthKeyMap).length === 0) {
    console.error('月行が見つからず、マッピングも作成できません');
    return [];
  }

  // 各行のタイプを特定し、データマッピングを構築
  const dataRowMappings: {[key: string]: any} = {};
  
  // CSVの各行を調査
  for (const row of csvData) {
    // 行のすべての値を連結して検索しやすくする
    const rowText = Object.values(row).map(v => String(v).trim()).join(' ');
    // 行のタイプを特定（従業員数、障がい者数など）
    const rowType = identifyRowType(rowText);
    
    if (rowType) {
      console.log(`「${rowType}」の行を検出:`, row);
      dataRowMappings[rowType] = row;
    }
  }
  
  console.log('検出されたデータ行:', Object.keys(dataRowMappings));
  
  // データの欠落を検出し、警告
  const expectedRows = [
    '従業員数 (名)', 'フルタイム従業員数 (名)', 'パートタイム従業員数 (名)', 
    '1級・2級の障がい者 (名)', 'その他障がい者 (名)', 
    '1級・2級の障がい者(パートタイム)(名)', 'その他障がい者(パートタイム)(名)',
    '法定雇用率 (%)'
  ];
  
  const missingRows = expectedRows.filter(row => !dataRowMappings[row]);
  if (missingRows.length > 0) {
    console.warn('必要なデータ行が見つかりません:', missingRows);
  }
  
  // 各月のデータを抽出
  Object.entries(monthKeyMap).forEach(([columnKey, month]) => {
    if (month < 1 || month > 12) {
      console.log(`無効な月番号: ${month}, スキップします`);
      return;
    }
    
    console.log(`月${month}のデータを処理中... (列キー: ${columnKey})`);
    
    // 値を安全に取得する関数
    const getValueSafely = (rowKey: string, colKey: string): number => {
      const rowMapping = dataRowMappings[rowKey];
      if (!rowMapping) return 0;
      
      const value = rowMapping[colKey];
      if (value === undefined || value === null || value === '') return 0;
      
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      return isNaN(numValue) ? 0 : numValue;
    };
    
    // 各項目の値を取得
    const employeesCount = getValueSafely('従業員数 (名)', columnKey);
    const fulltimeCount = getValueSafely('フルタイム従業員数 (名)', columnKey);
    const parttimeCount = getValueSafely('パートタイム従業員数 (名)', columnKey);
    
    // 障がい者データの取得
    const level1_2Count = getValueSafely('1級・2級の障がい者 (名)', columnKey);
    const otherDisabilityCount = getValueSafely('その他障がい者 (名)', columnKey);
    const level1_2ParttimeCount = getValueSafely('1級・2級の障がい者(パートタイム)(名)', columnKey);
    const otherParttimeCount = getValueSafely('その他障がい者(パートタイム)(名)', columnKey);
    
    // 法定雇用率
    const legalEmploymentRate = getValueSafely('法定雇用率 (%)', columnKey);
    
    // 障がい者データを処理
    const disabilityData = processDisabilityData(
      level1_2Count, 
      otherDisabilityCount, 
      level1_2ParttimeCount, 
      otherParttimeCount
    );
    
    // 月データのオブジェクトを作成
    const monthData: MonthlyCSVData = {
      fiscal_year: fiscalYear,
      month,
      employees_count: Math.round(employeesCount),
      fulltime_count: Math.round(fulltimeCount),
      parttime_count: Math.round(parttimeCount),
      level1_2_count: disabilityData.level1_2_count,
      other_disability_count: disabilityData.other_disability_count,
      level1_2_parttime_count: disabilityData.level1_2_parttime_count,
      other_parttime_count: disabilityData.other_parttime_count,
      legal_employment_rate: legalEmploymentRate,
      total_disability_count: disabilityData.total_disability_count
    };
    
    // 実雇用率を計算（障がい者合計数 / 従業員数 * 100）- 小数点第2位で切り上げ
    if (employeesCount > 0) {
      const rawRate = (disabilityData.total_disability_count / employeesCount) * 100;
      monthData.employment_rate = Math.ceil(rawRate * 10) / 10; // 小数点第2位で切り上げ
    }
    
    // 法定雇用者数を計算（従業員数 * 法定雇用率 / 100）
    if (employeesCount > 0 && legalEmploymentRate > 0) {
      monthData.required_count = Math.ceil(employeesCount * (legalEmploymentRate / 100));
    }
    
    // 超過・未達を計算（障がい者合計数 - 法定雇用者数）
    if (monthData.required_count !== undefined && monthData.total_disability_count !== undefined) {
      monthData.over_under_count = monthData.total_disability_count - monthData.required_count;
    }
    
    console.log(`月${month}のデータ:`, monthData);
    monthlyData.push(monthData);
  });
  
  console.log(`${monthlyData.length}ヶ月分のデータを抽出しました`);
  return monthlyData;
};