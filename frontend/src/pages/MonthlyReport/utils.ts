// src/pages/MonthlyReport/utils.ts
import { 
    MonthlyTotal, 
    MonthlyDetailData, 
    Employee, 
    MonthlyDetailDataRow 
  } from './types';
  
  /**
   * nullまたはundefinedの場合は0を返す安全な数値変換関数
   */
  export function safeNumber(value: number | undefined): number {
    return value ?? 0; // nullまたはundefinedの場合は0を返す
  }
  
  /**
   * 年間データをUI表示用に変換する
   */
  export const formatYearlyDataForUI = (yearlyData: MonthlyTotal[]): MonthlyDetailData => {
    // 月別に並べ替え（4月始まり）
    const orderedData = [
      ...yearlyData.filter(d => d.month >= 4).sort((a, b) => a.month - b.month),
      ...yearlyData.filter(d => d.month <= 3).sort((a, b) => a.month - b.month)
    ];
    
    // 各値の合計を計算
    const sumTotalEmployees = orderedData.reduce((sum, d) => sum + d.total_employees, 0);
    const sumFullTimeEmployees = orderedData.reduce((sum, d) => sum + safeNumber(d.full_time_employees), 0);
    const sumPartTimeEmployees = orderedData.reduce((sum, d) => sum + safeNumber(d.part_time_employees), 0);
    const sumDisabledEmployees = orderedData.reduce((sum, d) => sum + Number(d.disabled_employees), 0);
    const avgActualRate = orderedData.reduce((sum, d) => sum + Number(d.actual_rate), 0) / orderedData.length;
    const avgLegalRate = orderedData.reduce((sum, d) => sum + Number(d.legal_rate), 0) / orderedData.length;
    const sumLegalCount = orderedData.reduce((sum, d) => sum + Number(d.legal_count || 0), 0);
    const sumShortage = orderedData.reduce((sum, d) => sum + Number(d.shortage || 0), 0);
    
    // UI表示用のデータ形式に変換
    return {
      months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
      data: [
        { id: 1, item: '従業員数', values: [...orderedData.map(d => d.total_employees), sumTotalEmployees] },
        { id: 2, item: 'フルタイム従業員数', values: [...orderedData.map(d => safeNumber(d.full_time_employees)), sumFullTimeEmployees] },
        { id: 3, item: 'パートタイム従業員数', values: [...orderedData.map(d => safeNumber(d.part_time_employees)), sumPartTimeEmployees] },
        { id: 4, item: 'トータル従業員数', values: [...orderedData.map(d => d.total_employees), sumTotalEmployees] },
        { id: 9, item: 'トータル障がい者数', values: [...orderedData.map(d => Number(d.disabled_employees)), sumDisabledEmployees], isDisability: true },
        { 
          id: 10, 
          item: '実雇用率', 
          values: [...orderedData.map(d => Number(d.actual_rate)), avgActualRate], 
          suffix: '%', 
          isRatio: true, 
          isCalculated: true 
        },
        { 
          id: 11, 
          item: '法定雇用率', 
          values: [...orderedData.map(d => Number(d.legal_rate)), avgLegalRate], 
          suffix: '%', 
          isRatio: true 
        },
        { 
          id: 12, 
          item: '法定雇用者数', 
          values: [...orderedData.map(d => Number(d.legal_count || 0)), sumLegalCount], 
          isCalculated: true 
        },
        { 
          id: 13, 
          item: '超過・未達', 
          values: [...orderedData.map(d => Number(d.shortage || 0)), sumShortage], 
          isNegative: true, 
          isCalculated: true 
        }
      ]
    };
  };
  
  /**
   * 月次データの集計処理を行う（代替実装）
   */
  export function aggregateMonthlyData(monthlyData: any[]) {
    if (monthlyData && monthlyData.length > 0) {
      // 月ごとにデータを整理
      const orderedData = [...monthlyData].sort((a, b) => {
        const monthA = Number(a.month);
        const monthB = Number(b.month);
        return monthA - monthB;
      });
      // 各値の合計を計算
      const sumTotalEmployees = orderedData.reduce((sum, d) => sum + d.total_employees, 0);
      const sumFullTimeEmployees = orderedData.reduce((sum, d) => sum + safeNumber(d.full_time_employees), 0);
      const sumPartTimeEmployees = orderedData.reduce((sum, d) => sum + safeNumber(d.part_time_employees), 0);
      const sumDisabledEmployees = orderedData.reduce((sum, d) => sum + Number(d.disabled_employees), 0);
      const avgActualRate = orderedData.reduce((sum, d) => sum + Number(d.actual_rate), 0) / orderedData.length;
      const avgLegalRate = orderedData.reduce((sum, d) => sum + Number(d.legal_rate), 0) / orderedData.length;
      const sumLegalEmployees = orderedData.reduce((sum, d) => sum + Number(d.legal_employees || d.legal_count || 0), 0);
      const sumOverUnder = orderedData.reduce((sum, d) => sum + Number(d.over_under || d.shortage || 0), 0);
      
      // 月次詳細データを構築
      return {
        months: [...orderedData.map(d => `${d.month}月`), '合計'],
        data: [
          { id: 1, item: '従業員数', values: [...orderedData.map(d => d.total_employees), sumTotalEmployees] },
          { id: 2, item: 'フルタイム従業員数', values: [...orderedData.map(d => safeNumber(d.full_time_employees)), sumFullTimeEmployees] },
          { id: 3, item: 'パートタイム従業員数', values: [...orderedData.map(d => safeNumber(d.part_time_employees)), sumPartTimeEmployees] },
          { id: 4, item: 'トータル従業員数', values: [...orderedData.map(d => d.total_employees), sumTotalEmployees] },
          { id: 9, item: 'トータル障がい者数', values: [...orderedData.map(d => Number(d.disabled_employees)), sumDisabledEmployees], isDisability: true },
          { 
            id: 10, 
            item: '実雇用率', 
            values: [...orderedData.map(d => Number(d.actual_rate)), avgActualRate], 
            suffix: '%', 
            isRatio: true,
            isCalculated: true
          },
          { 
            id: 11, 
            item: '法定雇用率', 
            values: [...orderedData.map(d => Number(d.legal_rate)), avgLegalRate], 
            suffix: '%', 
            isRatio: true
          },
          { 
            id: 12, 
            item: '法定雇用者数', 
            values: [...orderedData.map(d => Number(d.legal_employees || d.legal_count || 0)), sumLegalEmployees],
            isCalculated: true
          },
          { 
            id: 13, 
            item: '超過・未達', 
            values: [...orderedData.map(d => Number(d.over_under || d.shortage || 0)), sumOverUnder],
            isNegative: true,
            isCalculated: true
          }
        ]
      };
    }
    
    return null;
  }
  
  /**
   * 従業員データを処理する
   */
  export const processEmployeeData = (apiEmployeeData: any[], selectedYear: number): Employee[] => {
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
   * 詳細データの値を再計算する
   */
  export const recalculateValues = (data: MonthlyDetailData): MonthlyDetailData => {
    const newData: MonthlyDetailData = {...data, data: [...data.data]};
    
    const totalEmployeesIdx = newData.data.findIndex((row: MonthlyDetailDataRow) => row.id === 4);
    const totalDisabledIdx = newData.data.findIndex((row: MonthlyDetailDataRow) => row.id === 9);
    const actualRateIdx = newData.data.findIndex((row: MonthlyDetailDataRow) => row.id === 10);
    const legalRateIdx = newData.data.findIndex((row: MonthlyDetailDataRow) => row.id === 11);
    const legalCountIdx = newData.data.findIndex((row: MonthlyDetailDataRow) => row.id === 12);
    const shortageIdx = newData.data.findIndex((row: MonthlyDetailDataRow) => row.id === 13);
    
    if (totalEmployeesIdx !== -1 && totalDisabledIdx !== -1 && actualRateIdx !== -1 && 
        legalRateIdx !== -1 && legalCountIdx !== -1 && shortageIdx !== -1) {
      
      const totalEmployeesRow = newData.data[totalEmployeesIdx];
      const totalDisabledRow = newData.data[totalDisabledIdx];
      const legalRateRow = newData.data[legalRateIdx];
      
      // 各月ごとに計算を行う
      for (let i = 0; i < 13; i++) { // 合計も含めて計算
        // 1. 実雇用率の計算（トータル障がい者数 / トータル従業員数）
        if (totalEmployeesRow.values[i] > 0) {
          newData.data[actualRateIdx].values[i] = parseFloat((totalDisabledRow.values[i] / totalEmployeesRow.values[i] * 100).toFixed(2));
        } else {
          newData.data[actualRateIdx].values[i] = 0;
        }
        
        // 2. 法定雇用者数の計算（法定雇用率 * トータル従業員数 / 100）
        newData.data[legalCountIdx].values[i] = Math.round(legalRateRow.values[i] * totalEmployeesRow.values[i] / 100);
        
        // 3. 超過・未達の計算（トータル障がい者数 - 法定雇用者数）
        newData.data[shortageIdx].values[i] = totalDisabledRow.values[i] - newData.data[legalCountIdx].values[i];
      }
    }
    
    return newData;
  };
  
  // タブのアイテム（トップレベルのコンポーネントで使用）
  export const tabItems = [
    { id: 'summary', label: 'サマリー' },
    { id: 'employees', label: '従業員詳細' },
    { id: 'monthly', label: '月次詳細' }
  ];
  
  // ステータスの型ガード
  export const hasStatus = (data: any): data is { status: string } => {
    return data && 'status' in data;
  };