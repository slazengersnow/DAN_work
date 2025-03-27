// frontend/src/pages/MonthlyReport.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reportApi } from '../api/reportApi'; // APIクライアントをインポート
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';

// 型定義
interface Employee {
  id: number;
  employee_id: number;
  name: string;
  name_kana?: string;
  gender?: string;
  birth_date?: string;
  hire_date: string;
  disability_type?: string;
  grade?: string;
  physical_verified?: boolean;
  intellectual_verified?: boolean;
  mental_verified?: boolean;
  physical_degree_current?: string;
  intellectual_degree_current?: string;
  mental_degree_current?: string;
  status: string;
  count: number;
  disability?: string;
  no?: number;
  monthlyStatus?: number[];
  memo?: string;
  monthlyWork?: {
    scheduled_hours: number;
    actual_hours: number;
    exception_reason?: string;
  };
}

interface MonthlyTotal {
  id?: number;
  year: number;
  month: number;
  total_employees: number;
  full_time_employees: number;
  part_time_employees: number;
  disabled_employees: number;
  actual_rate: number;
  legal_rate: number;
  legal_count: number;
  shortage: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface MonthlyDetailData {
  months: string[];
  data: Array<{
    id: number;
    item: string;
    values: number[];
    suffix?: string;
    isDisability?: boolean;
    isRatio?: boolean;
    isCalculated?: boolean;
    isNegative?: boolean;
  }>;
}

// モックデータ（開発・フォールバック用）
const mockSummary = {
  year: 2024,
  month: 11,
  totalEmployees: 525,
  disabledEmployees: 5,
  employmentCount: 12.75,
  actualRate: 2.43,
  legalRate: 2.3,
};

const mockEmployees = [
  { no: 1, id: 1, employee_id: 1001, name: '山田 太郎', disability_type: '身体障害', disability: '視覚', grade: '1級', hire_date: '2020/04/01', status: '在籍', 
    count: 2.0, monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], memo: '特記事項なし' },
  { no: 2, id: 2, employee_id: 2222, name: '鈴木 花子', disability_type: '身体障害', disability: '聴覚', grade: '4級', hire_date: '2020/04/01', status: '在籍', 
    count: 1.0, monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], memo: '' },
  { no: 3, id: 3, employee_id: 3333, name: '佐藤 一郎', disability_type: '知的障害', disability: '-', grade: 'B', hire_date: '2020/04/01', status: '在籍', 
    count: 1.0, monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], memo: '' },
  { no: 4, id: 4, employee_id: 4444, name: '高橋 勇太', disability_type: '精神障害', disability: 'ADHD', grade: '3級', hire_date: '2020/04/01', status: '在籍', 
    count: 1.0, monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], memo: '月1回面談実施' },
  { no: 5, id: 5, employee_id: 5555, name: '田中 美咲', disability_type: '精神障害', disability: 'うつ病', grade: '2級', hire_date: '2021/04/01', status: '在籍', 
    count: 1.0, monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], memo: '短時間勤務' },
];

const mockHistory = [
  { yearMonth: '2024/11', totalEmployees: 525, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.75, actualRate: 2.43, status: '確定済' },
  { yearMonth: '2024/10', totalEmployees: 525, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.5, actualRate: 2.38, status: '確定済' },
  { yearMonth: '2024/09', totalEmployees: 520, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.0, actualRate: 2.31, status: '確定済' },
];

// 月次詳細データ
const initialMonthlyDetailData = {
  months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
  data: [
    { id: 1, item: '従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 2, item: 'フルタイム従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 3, item: 'パートタイム従業員数', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 4, item: 'トータル従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 5, item: 'Level 1 & 2', values: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 24], isDisability: true },
    { id: 6, item: 'その他', values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 33], isDisability: true },
    { id: 7, item: 'Level 1 & 2 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], isDisability: true },
    { id: 8, item: 'その他 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], isDisability: true },
    { id: 9, item: 'トータル障がい者数', values: [4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 57], isDisability: true },
    { id: 10, item: '実雇用率', values: [0.7, 0.7, 0.6, 0.8, 0.8, 0.8, 0.8, 0.7, 0.8, 0.7, 0.7, 0.7, 0.7], suffix: '%', isRatio: true, isCalculated: true },
    { id: 11, item: '法定雇用率', values: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5], suffix: '%', isRatio: true },
    { id: 12, item: '法定雇用者数', values: [15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 18, 196], isCalculated: true },
    { id: 13, item: '超過・未達', values: [-11, -11, -12, -11, -11, -11, -12, -12, -12, -12, -12, -13, -139], isNegative: true, isCalculated: true }
  ]
};

const MonthlyReport: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [editingDetailRow, setEditingDetailRow] = useState<number | null>(null);
  const [editingDetailCol, setEditingDetailCol] = useState<number | null>(null);
  const [activeCell, setActiveCell] = useState<{row: number | null, col: number | null}>({row: null, col: null});
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editingSummary, setEditingSummary] = useState<boolean>(false);
  
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const queryClient = useQueryClient();

  const tabItems = [
    { id: 'summary', label: 'サマリー' },
    { id: 'employees', label: '従業員詳細' },
    { id: 'monthly', label: '月次詳細' }
  ];

  // React Query: 月次データの取得
  const { 
    data: monthlyData, 
    isLoading: isLoadingMonthlyData, 
    error: monthlyError 
  } = useQuery(
    ['monthlyData', selectedYear, selectedMonth],
    () => reportApi.getMonthlyData(selectedYear, selectedMonth),
    { enabled: !process.env.REACT_APP_USE_MOCK }
  );
  
  // React Query: 従業員データの取得
  const { 
    data: apiEmployeeData, 
    isLoading: isLoadingEmployeeData, 
    error: employeeError 
  } = useQuery(
    ['monthlyEmployees', selectedYear, selectedMonth],
    () => reportApi.getEmployeesByMonth(selectedYear, selectedMonth),
    { enabled: !process.env.REACT_APP_USE_MOCK }
  );
  
  // React Query: 年間データの取得
  const { 
    data: apiYearlyData, 
    isLoading: isLoadingYearlyData, 
    error: yearlyError 
  } = useQuery(
    ['yearlyData', selectedYear],
    () => reportApi.getYearlyData(selectedYear),
    { enabled: !process.env.REACT_APP_USE_MOCK }
  );

  // Mutation: 従業員データの更新
  const updateEmployeeMutation = useMutation(
    (employee: Partial<Employee>) => reportApi.updateEmployee(employee.id!, employee),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['monthlyEmployees', selectedYear, selectedMonth]);
        queryClient.invalidateQueries(['monthlyData', selectedYear, selectedMonth]);
      }
    }
  );

  // Mutation: 月次データの確定
  const confirmMutation = useMutation(
    () => reportApi.confirmMonthlyData(selectedYear, selectedMonth),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['monthlyData', selectedYear, selectedMonth]);
        queryClient.invalidateQueries(['yearlyData', selectedYear]);
        alert('月次データを確定しました');
      }
    }
  );

  // Mutation: 月次詳細データの保存
  const saveMonthlyDetailMutation = useMutation(
    (data: any) => reportApi.updateMonthlyDetail(selectedYear, selectedMonth, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['yearlyData', selectedYear]);
        queryClient.invalidateQueries(['monthlyData', selectedYear, selectedMonth]);
      }
    }
  );

  // APIデータとモックデータのマージ
  const [employees, setEmployees] = useState<Employee[]>([...mockEmployees]);
  const [monthlyDetailData, setMonthlyDetailData] = useState<MonthlyDetailData>({...initialMonthlyDetailData});
  const [historyData, setHistoryData] = useState<any[]>([...mockHistory]);

  // APIデータの加工とローカルステートへの反映
  useEffect(() => {
    if (process.env.REACT_APP_USE_MOCK) return;
    
    // 従業員データの処理
    if (apiEmployeeData) {
      const formattedEmployees = apiEmployeeData.map((emp: any, index: number) => {
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
      
      setEmployees(formattedEmployees);
    }
    
    // 年間データの処理
    if (apiYearlyData) {
      const formattedData = formatYearlyDataForUI(apiYearlyData);
      setMonthlyDetailData(formattedData);
    }
    
    // 履歴データの処理
    if (apiYearlyData) {
      const historyItems = apiYearlyData.map((item: MonthlyTotal) => {
        // 障害タイプの集計は実装しない場合はダミーデータを使用
        return {
          yearMonth: `${item.year}/${item.month.toString().padStart(2, '0')}`,
          totalEmployees: item.total_employees,
          disabledCount: item.disabled_employees,
          physical: 0, // ダミーデータ
          intellectual: 0, // ダミーデータ
          mental: 0, // ダミーデータ
          employmentCount: item.disabled_employees,
          actualRate: item.actual_rate,
          status: item.status
        };
      });
      
      // 降順に並べ替えて最新の3件のみを使用
      setHistoryData(historyItems.sort((a, b) => 
        b.yearMonth.localeCompare(a.yearMonth)
      ).slice(0, 3));
    }
  }, [apiEmployeeData, apiYearlyData]);

  // 年間データをUI用に変換
  const formatYearlyDataForUI = (yearlyData: MonthlyTotal[]): MonthlyDetailData => {
    // 月別に並べ替え（4月始まり）
    const orderedData = [
      ...yearlyData.filter(d => d.month >= 4).sort((a, b) => a.month - b.month),
      ...yearlyData.filter(d => d.month <= 3).sort((a, b) => a.month - b.month)
    ];
    
    // 各値の合計を計算
    const sumTotalEmployees = orderedData.reduce((sum, d) => sum + d.total_employees, 0);
    const sumFullTimeEmployees = orderedData.reduce((sum, d) => sum + d.full_time_employees, 0);
    const sumPartTimeEmployees = orderedData.reduce((sum, d) => sum + d.part_time_employees, 0);
    const sumDisabledEmployees = orderedData.reduce((sum, d) => sum + Number(d.disabled_employees), 0);
    const avgActualRate = orderedData.reduce((sum, d) => sum + Number(d.actual_rate), 0) / orderedData.length;
    const avgLegalRate = orderedData.reduce((sum, d) => sum + Number(d.legal_rate), 0) / orderedData.length;
    const sumLegalCount = orderedData.reduce((sum, d) => sum + Number(d.legal_count), 0);
    const sumShortage = orderedData.reduce((sum, d) => sum + Number(d.shortage), 0);
    
    // UI表示用のデータ形式に変換
    // 既存のデータ構造を維持しながら必要最小限の列のみ更新
    return {
      months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
      data: [
        { id: 1, item: '従業員数', values: [...orderedData.map(d => d.total_employees), sumTotalEmployees] },
        { id: 2, item: 'フルタイム従業員数', values: [...orderedData.map(d => d.full_time_employees), sumFullTimeEmployees] },
        { id: 3, item: 'パートタイム従業員数', values: [...orderedData.map(d => d.part_time_employees), sumPartTimeEmployees] },
        { id: 4, item: 'トータル従業員数', values: [...orderedData.map(d => d.total_employees), sumTotalEmployees] },
        // APIからのデータにLevel 1 & 2のような詳細な分類がない場合は省略
        { id: 9, item: 'トータル障がい者数', values: [...orderedData.map(d => Number(d.disabled_employees)), sumDisabledEmployees], isDisability: true },
        { id: 10, item: '実雇用率', values: [...orderedData.map(d => Number(d.actual_rate)), avgActualRate], suffix: '%', isRatio: true, isCalculated: true },
        { id: 11, item: '法定雇用率', values: [...orderedData.map(d => Number(d.legal_rate)), avgLegalRate], suffix: '%', isRatio: true },
        { id: 12, item: '法定雇用者数', values: [...orderedData.map(d => Number(d.legal_count)), sumLegalCount], isCalculated: true },
        { id: 13, item: '超過・未達', values: [...orderedData.map(d => Number(d.shortage)), sumShortage], isNegative: true, isCalculated: true }
      ]
    };
  };

  // 従業員データの更新ハンドラー
  const handleEmployeeDataChange = (id: number, field: string, value: string) => {
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        const updatedEmp = { ...emp, [field]: value };
        
        // 身体障害で1級または2級の場合、自動的にカウントを2にする
        if (field === 'disability_type' || field === 'grade') {
          if (updatedEmp.disability_type === '身体障害' && (updatedEmp.grade === '1級' || updatedEmp.grade === '2級')) {
            updatedEmp.count = 2.0;
          }
        }
        
        return updatedEmp;
      }
      return emp;
    }));
  };

  // 従業員の月次ステータス更新ハンドラー
  const handleMonthlyStatusChange = (id: number, monthIndex: number, value: string) => {
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        const newMonthlyStatus = [...(emp.monthlyStatus || [])];
        newMonthlyStatus[monthIndex] = Number(value);
        return { ...emp, monthlyStatus: newMonthlyStatus };
      }
      return emp;
    }));
  };

  // 月次詳細データの編集ハンドラー
  const handleDetailCellEdit = (rowId: number, colIndex: number) => {
    if (isCalculatedField(rowId)) return; // 自動計算フィールドは編集不可
    
    setEditingDetailRow(rowId);
    setEditingDetailCol(colIndex);
    
    // 遅延してフォーカスを設定
    setTimeout(() => {
      const inputKey = `input-${rowId}-${colIndex}`;
      if (inputRefs.current[inputKey]) {
        inputRefs.current[inputKey]?.focus();
      }
    }, 10);
  };

  // 月次詳細データの更新ハンドラー
  const handleDetailCellChange = (rowId: number, colIndex: number, value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;

    setMonthlyDetailData(prev => {
      const newData = {...prev, data: [...prev.data]};
      const rowIndex = newData.data.findIndex(row => row.id === rowId);
      
      if (rowIndex !== -1 && colIndex < 12) { // 合計列は編集不可
        const updatedRow = {...newData.data[rowIndex]};
        const newValues = [...updatedRow.values];
        newValues[colIndex] = numValue;
        
        // 合計を再計算
        newValues[12] = newValues.slice(0, 12).reduce((acc, val) => acc + val, 0);
        
        updatedRow.values = newValues;
        newData.data[rowIndex] = updatedRow;
      }
      
      // 自動計算フィールドの更新
      return recalculateValues(newData);
    });
  };

  // 自動計算フィールドの確認
  const isCalculatedField = (rowId: number): boolean => {
    const row = monthlyDetailData.data.find(row => row.id === rowId);
    return !!row?.isCalculated;
  };

  // 計算の依存関係を考慮した全ての値の再計算
  const recalculateValues = (data: MonthlyDetailData) => {
    const newData = {...data, data: [...data.data]};
    
    // インデックスで各行を取得
    const totalEmployeesIdx = newData.data.findIndex(row => row.id === 4);
    const totalDisabledIdx = newData.data.findIndex(row => row.id === 9);
    const actualRateIdx = newData.data.findIndex(row => row.id === 10);
    const legalRateIdx = newData.data.findIndex(row => row.id === 11);
    const legalCountIdx = newData.data.findIndex(row => row.id === 12);
    const shortageIdx = newData.data.findIndex(row => row.id === 13);
    
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

  // 月次詳細データの保存ハンドラー
  const handleDetailCellSave = () => {
    setEditingDetailRow(null);
    setEditingDetailCol(null);
  };

  // キーボードナビゲーション用のハンドラー
  const handleKeyDown = (e: React.KeyboardEvent, rowId: number, colIndex: number) => {
    if (isCalculatedField(rowId)) return; // 自動計算フィールドは移動のみ許可
    
    // Enter キーを押した場合は編集を保存して下の行へ
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDetailCellSave();
      
      // 次の編集可能なセルを探して移動
      const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
      let nextRowId = null;
      
      for (let i = currentRowIndex + 1; i < monthlyDetailData.data.length; i++) {
        if (!isCalculatedField(monthlyDetailData.data[i].id)) {
          nextRowId = monthlyDetailData.data[i].id;
          break;
        }
      }
      
      if (nextRowId !== null) {
        handleDetailCellEdit(nextRowId, colIndex);
      }
    }
    // Tab キーを押した場合は次のセルへ
    else if (e.key === 'Tab') {
      e.preventDefault();
      handleDetailCellSave();
      
      if (e.shiftKey) {
        // Shift+Tab で左へ移動
        if (colIndex > 0) {
          handleDetailCellEdit(rowId, colIndex - 1);
        } else {
          // 前の行の最後の列へ
          const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
          if (currentRowIndex > 0) {
            let prevRowId = null;
            for (let i = currentRowIndex - 1; i >= 0; i--) {
              if (!isCalculatedField(monthlyDetailData.data[i].id)) {
                prevRowId = monthlyDetailData.data[i].id;
                break;
              }
            }
            if (prevRowId !== null) {
              handleDetailCellEdit(prevRowId, 11); // 最後の月 (12番目のセル)
            }
          }
        }
      } else {
        // Tab で右へ移動
        if (colIndex < 11) {
          handleDetailCellEdit(rowId, colIndex + 1);
        } else {
          // 次の行の最初の列へ
          const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
          if (currentRowIndex < monthlyDetailData.data.length - 1) {
            let nextRowId = null;
            for (let i = currentRowIndex + 1; i < monthlyDetailData.data.length; i++) {
              if (!isCalculatedField(monthlyDetailData.data[i].id)) {
                nextRowId = monthlyDetailData.data[i].id;
                break;
              }
            }
            if (nextRowId !== null) {
              handleDetailCellEdit(nextRowId, 0); // 最初の月
            }
          }
        }
      }
    }
    // 矢印キーでの移動
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleDetailCellSave();
      
      const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
      
      if (e.key === 'ArrowUp' && currentRowIndex > 0) {
        let prevRowId = null;
        for (let i = currentRowIndex - 1; i >= 0; i--) {
          if (!isCalculatedField(monthlyDetailData.data[i].id)) {
            prevRowId = monthlyDetailData.data[i].id;
            break;
          }
        }
        if (prevRowId !== null) {
          handleDetailCellEdit(prevRowId, colIndex);
        }
      }
      else if (e.key === 'ArrowDown' && currentRowIndex < monthlyDetailData.data.length - 1) {
        let nextRowId = null;
        for (let i = currentRowIndex + 1; i < monthlyDetailData.data.length; i++) {
          if (!isCalculatedField(monthlyDetailData.data[i].id)) {
            nextRowId = monthlyDetailData.data[i].id;
            break;
          }
        }
        if (nextRowId !== null) {
          handleDetailCellEdit(nextRowId, colIndex);
        }
      }
      else if (e.key === 'ArrowLeft' && colIndex > 0) {
        handleDetailCellEdit(rowId, colIndex - 1);
      }
      else if (e.key === 'ArrowRight' && colIndex < 11) {
        handleDetailCellEdit(rowId, colIndex + 1);
      }
    }
  };

  // セルクリック時にアクティブセルを設定
  const handleCellClick = (rowId: number, colIndex: number) => {
    if (colIndex >= 12) return; // 合計列はクリック不可
    setActiveCell({row: rowId, col: colIndex});
    
    if (!isCalculatedField(rowId)) {
      handleDetailCellEdit(rowId, colIndex);
    }
  };

  // 編集フォーム以外をクリックした時に保存
  const handleOutsideClick = () => {
    if (editingDetailRow !== null) {
      handleDetailCellSave();
    }
  };

  // 従業員データの編集モード切り替え
  const toggleEditMode = () => {
    if (editMode) {
      // 編集完了時：保存処理
      const updatePromises = employees.map(employee => {
        // API更新用のデータを構築
        const updateData = {
          id: employee.id,
          employee_id: employee.employee_id,
          name: employee.name,
          disability_type: employee.disability_type,
          status: employee.status,
          count: employee.count,
          hire_date: employee.hire_date,
          // 月次ステータス情報を適切な形式で送信
          monthlyWork: employee.monthlyStatus?.map((status, idx) => {
            const month = idx >= 9 ? idx - 8 : idx + 4; // 4月始まりに変換
            const year = idx >= 9 ? selectedYear + 1 : selectedYear;
            
            return {
              year,
              month,
              scheduled_hours: 160, // デフォルト値
              actual_hours: status * 160, // ステータスから実働時間を算出
              exception_reason: employee.memo
            };
          })
        };
        
        // モックモードの場合は更新をシミュレート
        if (process.env.REACT_APP_USE_MOCK) {
          return Promise.resolve(updateData);
        } else {
          return updateEmployeeMutation.mutateAsync(updateData);
        }
      });
      
      Promise.all(updatePromises)
        .then(() => {
          setEditMode(false);
        })
        .catch(error => {
          console.error('従業員データの更新に失敗しました', error);
        });
    } else {
      // 編集開始
      setEditMode(true);
    }
  };

  // サマリー編集モードの切り替え
  const toggleSummaryEditMode = () => {
    if (editingSummary) {
      // 編集完了時：保存処理
      const updatePromises = employees.map(employee => {
        const updateData = {
          id: employee.id,
          count: employee.count,
          // メモは月次勤務データのexception_reasonとして保存
          monthlyWork: {
            year: selectedYear,
            month: selectedMonth,
            exception_reason: employee.memo
          }
        };
        
        // モックモードの場合は更新をシミュレート
        if (process.env.REACT_APP_USE_MOCK) {
          return Promise.resolve(updateData);
        } else {
          return updateEmployeeMutation.mutateAsync(updateData);
        }
      });
      
      Promise.all(updatePromises)
        .then(() => {
          setEditingSummary(false);
        })
        .catch(error => {
          console.error('サマリーデータの更新に失敗しました', error);
        });
    } else {
      // 編集開始
      setEditingSummary(true);
    }
  };

  // 従業員メモの更新ハンドラー
  const handleMemoChange = (id: number, value: string) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, memo: value } : emp
    ));
  };

  // カウント更新ハンドラー
  const handleCountChange = (id: number, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, count: numValue } : emp
    ));
  };

  // 月次データ表示ボタンのハンドラー
  const handleDisplayClick = () => {
    // キャッシュの更新をトリガー
    queryClient.invalidateQueries(['monthlyData', selectedYear, selectedMonth]);
    queryClient.invalidateQueries(['monthlyEmployees', selectedYear, selectedMonth]);
    queryClient.invalidateQueries(['yearlyData', selectedYear]);
  };

  // 月次確定ボタンのハンドラー
  const handleConfirmClick = () => {
    if (window.confirm('月次データを確定しますか？確定後は編集できなくなります。')) {
      confirmMutation.mutate();
    }
  };

  // 月次詳細データの保存
  const handleSaveMonthlyDetail = () => {
    // APIに送信するデータを構築
    const apiData = monthlyDetailData.data.map(row => {
      return {
        id: row.id,
        item: row.item,
        values: row.values
      };
    });
    
    // モックモードの場合は更新をシミュレート
    if (process.env.REACT_APP_USE_MOCK) {
      console.log('月次詳細データ保存（モックモード）', apiData);
      alert('月次詳細データを保存しました');
    } else {
      saveMonthlyDetailMutation.mutate(apiData);
    }
  };

  // CSVエクスポートボタンのハンドラー
  const handleExportCsv = () => {
    // モックモードの場合はダミー処理
    if (process.env.REACT_APP_USE_MOCK) {
      console.log('CSVエクスポート（モックモード）');
      alert('CSVエクスポート機能はAPIが必要です');
      return;
    }

    // APIを呼び出してCSVファイルをダウンロード
    reportApi.exportCsv(selectedYear, selectedMonth)
      .then(response => {
        // Blobとして受け取り、ダウンロードリンクを作成
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `月次報告_${selectedYear}年${selectedMonth}月.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error('CSVエクスポートに失敗しました', error);
        alert('CSVエクスポートに失敗しました');
      });
  };

  // 印刷ボタンのハンドラー
  const handlePrint = () => {
    // モックモードの場合はページを印刷
    if (process.env.REACT_APP_USE_MOCK) {
      window.print();
      return;
    }

    // APIを呼び出してPDF生成とダウンロード
    reportApi.generatePdf(selectedYear, selectedMonth)
      .then(response => {
        // Blobとして受け取り、新しいウィンドウで開く
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        window.open(url, '_blank');
      })
      .catch(error => {
        console.error('印刷用PDFの生成に失敗しました', error);
        alert('印刷用PDFの生成に失敗しました');
      });
  };

  // 入力参照用関数
  const setInputRef = useCallback((element: HTMLInputElement | null, key: string) => {
    if (element) {
      inputRefs.current[key] = element;
    }
  }, []);

  // ローディング表示
  const isLoading = !process.env.REACT_APP_USE_MOCK && (
    isLoadingMonthlyData || isLoadingEmployeeData || isLoadingYearlyData || 
    updateEmployeeMutation.isLoading || confirmMutation.isLoading || saveMonthlyDetailMutation.isLoading
  );

  if (isLoading) {
    return <Spinner />;
  }

  // エラー表示
  const hasError = !process.env.REACT_APP_USE_MOCK && (monthlyError || employeeError || yearlyError);
  if (hasError) {
    return <ErrorMessage message="データの読み込み中にエラーが発生しました" />;
  }

  // サマリーデータの取得
  const summaryData = monthlyData || {
    year: selectedYear,
    month: selectedMonth,
    total_employees: mockSummary.totalEmployees,
    disabled_employees: mockSummary.disabledEmployees,
    actual_rate: mockSummary.actualRate,
    legal_rate: mockSummary.legalRate
  };

  return (
    <div className="section monthly-section" onClick={handleOutsideClick}>
      <h2 className="section-title">月次報告</h2>
      
      {activeTab === 'summary' && (
        <div className="filter-container">
          <div className="filter-group">
            <label>対象期間</label>
            <div className="filter-controls">
              <select 
                className="select-input"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[...Array(5)].map((_, idx) => {
                  const year = new Date().getFullYear() - 2 + idx;
                  return <option key={year} value={year}>{year}年</option>;
                })}
              </select>
              
              <select 
                className="select-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
            </div>
            
            <button 
              className="btn primary-btn"
              onClick={handleDisplayClick}
            >
              表示
            </button>
            
            <button 
              className="btn secondary-btn"
              onClick={handleConfirmClick}
              disabled={confirmMutation.isLoading || (summaryData.status === '確定済')}
            >
              {confirmMutation.isLoading ? '処理中...' : '月次確定'}
            </button>
          </div>
        </div>
      )}
      
      <div className="summary-box">
        <h3 className="summary-title">{selectedYear}年集計サマリー</h3>
        <div className="summary-content">
          常用労働者数: {summaryData.total_employees}名 | 
          障害者数: {summaryData.disabled_employees}名 | 
          雇用カウント: {summaryData.disabled_employees} | 
          実雇用率: {summaryData.actual_rate}% | 
          法定雇用率: {summaryData.legal_rate}%
        </div>
      </div>

      <div className="tab-container">
        <div className="tabs">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="content-wrapper">
        {activeTab === 'summary' && (
          <>
            <div className="data-container">
              <div className="data-header">
                <h3 className="data-title">障害者雇用者詳細</h3>
                <div className="header-actions">
                  {editingSummary ? (
                    <button 
                      className="btn primary-btn" 
                      onClick={toggleSummaryEditMode}
                      disabled={summaryData.status === '確定済'}
                    >
                      保存
                    </button>
                  ) : (
                    <button 
                      className="btn action-btn" 
                      onClick={toggleSummaryEditMode}
                      disabled={summaryData.status === '確定済'}
                    >
                      編集
                    </button>
                  )}
                </div>
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>社員ID</th>
                      <th>氏名</th>
                      <th>障害区分</th>
                      <th>障害</th>
                      <th>等級</th>
                      <th>採用日</th>
                      <th>状態</th>
                      <th>カウント</th>
                      <th>備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.no}</td>
                        <td>{employee.employee_id}</td>
                        <td>{employee.name}</td>
                        <td>{employee.disability_type}</td>
                        <td>{employee.disability}</td>
                        <td>{employee.grade}</td>
                        <td>{employee.hire_date}</td>
                        <td>
                          <span className="status-badge active">{employee.status}</span>
                        </td>
                        <td>
                          {editingSummary ? (
                            <input 
                              type="number" 
                              step="0.5" 
                              min="0" 
                              max="2" 
                              value={employee.count} 
                              onChange={(e) => handleCountChange(employee.id, e.target.value)}
                              className="editable-input small-input"
                            />
                          ) : (
                            employee.count
                          )}
                        </td>
                        <td>
                          {editingSummary ? (
                            <input 
                              type="text" 
                              value={employee.memo || ''} 
                              onChange={(e) => handleMemoChange(employee.id, e.target.value)}
                              className="editable-input"
                            />
                          ) : (
                            employee.memo
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="data-container">
              <h3 className="data-title">月別実績履歴</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>年月</th>
                      <th>常用労働者数</th>
                      <th>障害者数</th>
                      <th>身体障害</th>
                      <th>知的障害</th>
                      <th>精神障害</th>
                      <th>雇用カウント</th>
                      <th>実雇用率</th>
                      <th>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((record, index) => (
                      <tr key={index}>
                        <td>{record.yearMonth}</td>
                        <td>{record.totalEmployees}</td>
                        <td>{record.disabledCount}</td>
                        <td>{record.physical}</td>
                        <td>{record.intellectual}</td>
                        <td>{record.mental}</td>
                        <td>{record.employmentCount}</td>
                        <td>{record.actualRate}%</td>
                        <td>
                          <span className="status-badge confirmed">{record.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'employees' && (
          <div className="data-container">
            <div className="data-header">
              <h3 className="data-title">従業員詳細</h3>
              <div className="header-actions">
                {editMode ? (
                  <button 
                    className="btn primary-btn" 
                    onClick={toggleEditMode}
                    disabled={summaryData.status === '確定済'}
                  >
                    保存
                  </button>
                ) : (
                  <button 
                    className="btn action-btn" 
                    onClick={toggleEditMode}
                    disabled={summaryData.status === '確定済'}
                  >
                    編集
                  </button>
                )}
              </div>
            </div>
            <div className="data-table-wrapper">
              <div className="horizontal-scroll-container">
                <table className="data-table employee-detail-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>社員ID</th>
                      <th>氏名</th>
                      <th>障害区分</th>
                      <th>障害</th>
                      <th>等級</th>
                      <th>採用日</th>
                      <th>状態</th>
                      <th>4月</th>
                      <th>5月</th>
                      <th>6月</th>
                      <th>7月</th>
                      <th>8月</th>
                      <th>9月</th>
                      <th>10月</th>
                      <th>11月</th>
                      <th>12月</th>
                      <th>1月</th>
                      <th>2月</th>
                      <th>3月</th>
                      <th>備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.no}</td>
                        <td>
                          {editMode ? (
                            <input 
                              type="text" 
                              value={employee.employee_id}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'employee_id', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input"
                            />
                          ) : (
                            employee.employee_id
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <input 
                              type="text" 
                              value={employee.name}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'name', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input"
                            />
                          ) : (
                            employee.name
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <select 
                              value={employee.disability_type || ''}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'disability_type', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-select"
                            >
                              <option value="">なし</option>
                              <option value="身体障害">身体障害</option>
                              <option value="知的障害">知的障害</option>
                              <option value="精神障害">精神障害</option>
                            </select>
                          ) : (
                            employee.disability_type
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <input 
                              type="text" 
                              value={employee.disability || ''}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'disability', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input"
                            />
                          ) : (
                            employee.disability
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <input 
                              type="text" 
                              value={employee.grade || ''}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'grade', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input"
                            />
                          ) : (
                            employee.grade
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <input 
                              type="date"
                              value={employee.hire_date.split('/').join('-')}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'hire_date', e.target.value.split('-').join('/'))}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input"
                            />
                          ) : (
                            employee.hire_date
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <select 
                              value={employee.status}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'status', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-select"
                            >
                              <option value="在籍">在籍</option>
                              <option value="休職">休職</option>
                              <option value="退職">退職</option>
                            </select>
                          ) : (
                            <span className="status-badge active">{employee.status}</span>
                          )}
                        </td>
                        {(employee.monthlyStatus || Array(12).fill(1)).map((status, monthIndex) => (
                          <td key={`${employee.id}-month-${monthIndex}`}>
                            {editMode ? (
                              <select 
                                value={status}
                                onChange={(e) => handleMonthlyStatusChange(employee.id, monthIndex, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="editable-select"
                              >
                                <option value="0">0</option>
                                <option value="0.5">0.5</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                              </select>
                            ) : (
                              status
                            )}
                          </td>
                        ))}
                        <td>
                          {editMode ? (
                            <input 
                              type="text" 
                              value={employee.memo || ''}
                              onChange={(e) => handleMemoChange(employee.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input memo-input"
                            />
                          ) : (
                            employee.memo
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'monthly' && (
          <div className="data-container">
            <div className="data-header">
              <h3 className="data-title">月次詳細</h3>
              <div className="header-actions">
                <button 
                  className="btn primary-btn" 
                  onClick={handleSaveMonthlyDetail}
                  disabled={summaryData.status === '確定済'}
                >
                  保存
                </button>
              </div>
            </div>
            <div className="data-table-wrapper">
              <div className="horizontal-scroll-container">
                <table className="data-table monthly-detail-table">
                  <thead>
                    <tr>
                      <th className="fixed-column"></th>
                      {monthlyDetailData.months.map(month => (
                        <th key={month}>{month}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyDetailData.data.map((row) => {
                      // 特定の行の前にスペーサー行を追加
                      const needsSpacerBefore = row.id === 5 || row.id === 10;
                      const isHeaderRow = row.id === 5;
                      
                      return (
                        <React.Fragment key={`row-${row.id}`}>
                          {needsSpacerBefore && (
                            <tr className="spacer-row">
                              <td colSpan={14}></td>
                            </tr>
                          )}
                          {isHeaderRow && (
                            <tr className="header-row">
                              <th colSpan={14}>障がい者</th>
                            </tr>
                          )}
                          <tr className={row.isCalculated ? 'calculated-row' : ''}>
                            <td className="fixed-column item-column">{row.item}</td>
                            {row.values.map((value, colIndex) => {
                              let className = 'cell';
                              if (row.isNegative && value < 0) className += ' negative-value';
                              else if (row.isRatio) className += ' ratio-value';
                              if (row.isCalculated) className += ' calculated-cell';
                              if (activeCell.row === row.id && activeCell.col === colIndex) className += ' active-cell';
                              
                              return (
                                <td 
                                  key={`value-${row.id}-${colIndex}`} 
                                  className={className}
                                  onClick={() => handleCellClick(row.id, colIndex)}
                                >
                                  {editingDetailRow === row.id && editingDetailCol === colIndex && summaryData.status !== '確定済' ? (
                                    <input
                                      ref={(el) => setInputRef(el, `input-${row.id}-${colIndex}`)}
                                      type="text"
                                      value={value}
                                      onChange={(e) => handleDetailCellChange(row.id, colIndex, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
                                      className="cell-input"
                                    />
                                  ) : (
                                    <span className={colIndex < 12 && !row.isCalculated && summaryData.status !== '確定済' ? 'editable-cell' : ''}>
                                      {value}{row.suffix || ''}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="spreadsheet-help">
              <p>注: 矢印キー、Tab キー、Enter キーでセル間を移動できます。 「実雇用率」「法定雇用者数」「超過・未達」は自動計算されます。</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="action-buttons">
        <button className="btn secondary-btn" onClick={handlePrint}>印刷</button>
        <button className="btn primary-btn" onClick={handleExportCsv}>CSVエクスポート</button>
      </div>
    </div>
  );
};

// API呼び出しを行うクライアント（サンプル実装）
// src/api/reportApi.ts として別ファイルに実装することを推奨
/*
export const reportApi = {
  // 月次データ取得
  getMonthlyData: async (year: number, month: number) => {
    const response = await fetch(`/api/reports/monthly/${year}/${month}`);
    if (!response.ok) throw new Error('APIエラー');
    return response.json();
  },
  
  // 従業員データ取得
  getEmployeesByMonth: async (year: number, month: number) => {
    const response = await fetch(`/api/reports/monthly/${year}/${month}/employees`);
    if (!response.ok) throw new Error('APIエラー');
    return response.json();
  },
  
  // 年間データ取得
  getYearlyData: async (year: number) => {
    const response = await fetch(`/api/reports/yearly/${year}`);
    if (!response.ok) throw new Error('APIエラー');
    return response.json();
  },
  
  // 従業員データ更新
  updateEmployee: async (id: number, data: any) => {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('APIエラー');
    return response.json();
  },
  
  // 月次データ確定
  confirmMonthlyData: async (year: number, month: number) => {
    const response = await fetch(`/api/reports/monthly/${year}/${month}/confirm`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('APIエラー');
    return response.json();
  },
  
  // 月次詳細データ更新
  updateMonthlyDetail: async (year: number, month: number, data: any) => {
    const response = await fetch(`/api/reports/monthly/${year}/${month}/detail`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('APIエラー');
    return response.json();
  },
  
  // CSVエクスポート
  exportCsv: async (year: number, month: number) => {
    const response = await fetch(`/api/reports/monthly/${year}/${month}/export`, {
      method: 'GET',
      headers: { 'Accept': 'text/csv' }
    });
    if (!response.ok) throw new Error('APIエラー');
    return response;
  },
  
  // PDF生成
  generatePdf: async (year: number, month: number) => {
    const response = await fetch(`/api/reports/monthly/${year}/${month}/print`, {
      method: 'GET',
      headers: { 'Accept': 'application/pdf' }
    });
    if (!response.ok) throw new Error('APIエラー');
    return response;
  }
};
*/

export default MonthlyReport;