// src/pages/MonthlyReport/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import SummaryTab from './SummaryTab';
import EmployeesTab from './EmployeesTab';
import MonthlyReportDetail from './MonthlyReportDetail';
import { MonthlyTotal, Employee, MonthlyDetailData } from './types';
import { YearMonthProvider } from './YearMonthContext';
import { 
  getMonthlyReport, 
  getMonthlyReports, 
  handleApiError,
  createMonthlyReport
} from '../../api/reportApi';
import { safeNumber, processEmployeeData } from './utils';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import axios from 'axios';
import CSVImportModal from './CSVImportModal';
import { generateCSVTemplate, downloadCSV } from './utils';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// サンプル従業員データ（デフォルト表示用）
const sampleEmployees: Employee[] = [
  {
    id: 1,
    no: 1,
    employee_id: '1001',
    name: '山田 太郎',
    disability_type: '身体障害',
    disability: '視覚',
    grade: '1級',
    hire_date: '2020/04/01',
    status: '在籍',
    monthlyStatus: Array(12).fill(1),
    memo: '',
    count: 0
  },
  {
    id: 2,
    no: 2,
    employee_id: '2222',
    name: '鈴木 花子',
    disability_type: '身体障害',
    disability: '聴覚',
    grade: '4級',
    hire_date: '2020/04/01',
    status: '在籍',
    monthlyStatus: Array(12).fill(1),
    memo: '',
    count: 0
  },
  {
    id: 3,
    no: 3,
    employee_id: '3333',
    name: '佐藤 一郎',
    disability_type: '知的障害',
    disability: '',
    grade: 'B',
    hire_date: '2020/04/01',
    status: '在籍',
    monthlyStatus: Array(12).fill(1),
    memo: '',
    count: 0
  }
];

// 年間データをUI用の月次詳細形式に変換する関数
export const formatYearlyDataForUI = (yearlyData: MonthlyTotal[]): MonthlyDetailData => {
  // 無効なデータをフィルタリング
  const validData = yearlyData.filter(d => d != null);
  
  // 月別に並べ替え（4月始まり会計年度を想定）
  const orderedData = [
    ...validData.filter(d => d.month >= 4).sort((a, b) => a.month - b.month),
    ...validData.filter(d => d.month <= 3).sort((a, b) => a.month - b.month)
  ];

  // 各月のデータを取得、存在しない月はデフォルト値（例: 0）を設定
  const monthsInFiscalYear = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  const getMonthlyValue = (data: MonthlyTotal[], month: number, key: keyof MonthlyTotal, defaultValue: number = 0): number => {
    const report = data.find(d => d.month === month);
    
    // 特定のキーが法定雇用率の場合、小数点以下2桁で表示
    if (key === 'legal_employment_rate' || key === 'employment_rate') {
      const value = report ? safeNumber(report[key]) : defaultValue;
      // 小数点以下2桁まで保持
      return parseFloat(value.toFixed(2));
    }
    
    return report ? safeNumber(report[key]) : defaultValue;
  };

  const totalEmployeesValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'employees_count'));
  const fullTimeEmployeesValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'fulltime_count'));
  const partTimeEmployeesValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'parttime_count'));
  const level1_2CountValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'level1_2_count'));
  const otherDisabilityCountValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'other_disability_count'));
  const level1_2ParttimeCountValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'level1_2_parttime_count'));
  const otherParttimeCountValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'other_parttime_count'));
  const totalDisabilityCountValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'total_disability_count'));
  const actualRateValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'employment_rate', 0.0));
  const legalRateValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'legal_employment_rate', 0.0));
  const legalCountValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'required_count'));
  const overUnderValues = monthsInFiscalYear.map(m => getMonthlyValue(orderedData, m, 'over_under_count'));

  // 各値の合計または平均を計算
  const sumTotalEmployees = totalEmployeesValues.reduce((sum, val) => sum + val, 0);
  const sumFullTimeEmployees = fullTimeEmployeesValues.reduce((sum, val) => sum + val, 0);
  const sumPartTimeEmployees = partTimeEmployeesValues.reduce((sum, val) => sum + val, 0);
  const sumLevel1_2Count = level1_2CountValues.reduce((sum, val) => sum + val, 0);
  const sumOtherDisabilityCount = otherDisabilityCountValues.reduce((sum, val) => sum + val, 0);
  const sumLevel1_2ParttimeCount = level1_2ParttimeCountValues.reduce((sum, val) => sum + val, 0);
  const sumOtherParttimeCount = otherParttimeCountValues.reduce((sum, val) => sum + val, 0);
  const sumTotalDisabilityCount = totalDisabilityCountValues.reduce((sum, val) => sum + val, 0);
  const avgActualRate = parseFloat((actualRateValues.reduce((sum, val) => sum + val, 0) / (orderedData.length || 1)).toFixed(2));
  const avgLegalRate = parseFloat((legalRateValues.reduce((sum, val) => sum + val, 0) / (orderedData.length || 1)).toFixed(2));
  const sumLegalCount = legalCountValues.reduce((sum, val) => sum + val, 0);
  const sumOverUnder = overUnderValues.reduce((sum, val) => sum + val, 0);

  // UI表示用のデータ形式に変換
  return {
    months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
    data: [
      { id: 1, item: '従業員数', values: [...totalEmployeesValues, sumTotalEmployees], suffix: '名' },
      { id: 2, item: 'フルタイム従業員数', values: [...fullTimeEmployeesValues, sumFullTimeEmployees], suffix: '名' },
      { id: 3, item: 'パートタイム従業員数', values: [...partTimeEmployeesValues, sumPartTimeEmployees], suffix: '名' },
      { id: 4, item: 'トータル従業員数', values: [...totalEmployeesValues.map((v, i) => v + (partTimeEmployeesValues[i] * 0.5)), sumTotalEmployees + (sumPartTimeEmployees * 0.5)], suffix: '名', isCalculated: true },
      { id: 5, item: '1級・2級の障がい者', values: [...level1_2CountValues, sumLevel1_2Count], suffix: '名', isDisability: true },
      { id: 6, item: 'その他障がい者', values: [...otherDisabilityCountValues, sumOtherDisabilityCount], suffix: '名', isDisability: true },
      { id: 7, item: '1級・2級の障がい者(パートタイム)', values: [...level1_2ParttimeCountValues, sumLevel1_2ParttimeCount], suffix: '名', isDisability: true },
      { id: 8, item: 'その他障がい者(パートタイム)', values: [...otherParttimeCountValues, sumOtherParttimeCount], suffix: '名', isDisability: true },
      { id: 9, item: '障がい者合計', values: [...totalDisabilityCountValues, sumTotalDisabilityCount], suffix: '名', isDisability: true, isCalculated: true },
      { id: 10, item: '実雇用率', values: [...actualRateValues, avgActualRate], suffix: '%', isRatio: true, isCalculated: true },
      { id: 11, item: '法定雇用率', values: [...legalRateValues, avgLegalRate], suffix: '%', isRatio: true },
      { id: 12, item: '法定雇用者数', values: [...legalCountValues, sumLegalCount], suffix: '名', isCalculated: true },
      { id: 13, item: '超過・未達', values: [...overUnderValues, sumOverUnder], isNegative: true, isCalculated: true, suffix: '名' }
    ]
  };
};

// デフォルトの月次レポートを作成する関数
const createDefaultMonthlyReport = async (year: number, month: number) => {
  try {
    const defaultData = {
      fiscal_year: year,
      month: month,
      employees_count: 0,
      fulltime_count: 0,
      parttime_count: 0,
      level1_2_count: 0,
      other_disability_count: 0,
      level1_2_parttime_count: 0,
      other_parttime_count: 0,
      legal_employment_rate: 2.3 // デフォルト値
    };
    
    console.log(`${year}年度${month}月のデータを新規作成します`);
    const response = await createMonthlyReport(year, month, defaultData);
    console.log(`${year}年度${month}月のデータを新規作成しました:`, response);
    return response;
  } catch (error) {
    console.error('新規レポート作成エラー:', error);
    throw error;
  }
};

// 指定した年月のレポートが存在するかチェックする関数
const checkReportExists = async (year: number, month: number): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/monthly-reports/${year}/${month}`);
    return !!response.data && !!response.data.success;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    console.error('データ存在チェックエラー:', error);
    return false;
  }
};

// MonthlyReport コンポーネント
const MonthlyReport: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryClient = useQueryClient();
  const tabFromUrl = queryParams.get('tab') || 'summary';

  // 現在のタブ状態
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  
  // 現在の日付から正しい年度と月を取得
  const currentDate = new Date();
  const currentMonthNumber = currentDate.getMonth() + 1; // JavaScriptは0から始まる
  
  // 現在選択中の年度と月（デフォルト値を設定）
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNumber);

  // エラーメッセージ状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 新規作成フラグ
  const [isCreatingNewReport, setIsCreatingNewReport] = useState<boolean>(false);
  // データがキャッシュから使用されているかどうかのフラグ
  const [isUsingCachedData, setIsUsingCachedData] = useState<boolean>(false);

  // 年度ごとのデータキャッシュ
  const [dataCache, setDataCache] = useState<{[key: string]: any}>({});

  // データ状態
  const [currentReport, setCurrentReport] = useState<{
    summary: MonthlyTotal | null;
    employees: Employee[];
    detail: MonthlyDetailData | null;
  }>({
    summary: null,
    employees: [],
    detail: null
  });

  // タブ変更時のURL更新
  useEffect(() => {
    // URLのクエリパラメータを更新
    navigate(`/monthly-report?tab=${activeTab}`, { replace: true });
  }, [activeTab, navigate]);

  // React Query - レポート一覧
  const {
    data: reportsList,
    isLoading: isLoadingReportsList,
    error: reportsListError
  } = useQuery(
    ['monthlyReports'],
    () => getMonthlyReports(),
    {
      onSuccess: (data) => {
        // 最新のレポートを取得
        if (data && data.length > 0) {
          const latestReport = data[0];
          // 最新レポートの詳細を取得
          queryClient.invalidateQueries(['monthlyReport', latestReport.fiscal_year, latestReport.month]);
        }
      },
      staleTime: 5 * 60 * 1000, // 5分間はStaleとみなさない
      cacheTime: 10 * 60 * 1000, // 10分間キャッシュを保持
    }
  );

  // React Query - 月次レポート取得（エラーハンドリング強化）
  const {
    data: reportData,
    isLoading: isLoadingReportData,
    error: reportDataError,
    refetch: refetchReportData
  } = useQuery(
    ['monthlyReport', selectedYear, selectedMonth],
    async () => {
      // 年月が有効値であることを確認
      const validYear = selectedYear || currentDate.getFullYear();
      const validMonth = selectedMonth || currentMonthNumber;
      
      console.log(`年度${validYear}、月${validMonth}のデータ取得開始`);
      
      try {
        // キャッシュキーを生成
        const cacheKey = `${validYear}-${validMonth}`;
        
        // まず、キャッシュに既にデータがあるか確認
        if (dataCache[cacheKey] && !isUsingCachedData) {
          console.log(`${validYear}年${validMonth}月のキャッシュデータを使用します`);
          setIsUsingCachedData(true);
          return dataCache[cacheKey];
        }
        
        // データ取得
        const data = await getMonthlyReport(validYear, validMonth);
        console.log('API応答:', data);
        
        // キャッシュを更新
        setDataCache(prev => ({
          ...prev,
          [cacheKey]: data
        }));
        
        setIsUsingCachedData(false);
        return data;
      } catch (error) {
        // 404エラーの場合は新規作成モードに切り替え
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          console.log(`${validYear}年${validMonth}月のデータが存在しません。新規作成モードに切替`);
          setIsCreatingNewReport(true);
          
          // デフォルトの空データを自動生成（オプション）
          try {
            await createDefaultMonthlyReport(validYear, validMonth);
            // 再度データを取得
            return await getMonthlyReport(validYear, validMonth);
          } catch (createError) {
            console.error('デフォルトデータの作成に失敗しました:', createError);
            // 空のデータを返す
            return {
              success: true,
              message: 'デフォルトデータを表示',
              data: {
                summary: null,
                employees: [],
                detail: null
              }
            };
          }
        }
        
        // その他のエラーは再スロー
        throw error;
      }
    },
    {
      onSuccess: (data) => {
        // 新規作成モードの場合はリセット
        if (isCreatingNewReport && data && data.success) {
          setIsCreatingNewReport(false);
        }
        
        if (data) {
          // サマリーデータの安全な処理
          const summaryData = data.data?.summary || null;
          let detailData = data.data?.detail || null;
          
          // サマリーデータが存在する場合のみformatYearlyDataForUIを呼び出す
          if (summaryData && !detailData) {
            try {
              detailData = formatYearlyDataForUI([summaryData]);
            } catch (error) {
              console.error("詳細データの生成中にエラーが発生しました:", error);
              detailData = null;
            }
          }
          
          // 従業員データが空の場合でもサンプルデータを使用してUIを表示
          const employeesData = data.data?.employees && data.data.employees.length > 0 
            ? data.data.employees 
            : [];
          
          setCurrentReport({
            summary: summaryData,
            employees: employeesData,
            detail: detailData
          });
        } else {
          // データがない場合は空の状態にリセット
          setCurrentReport({
            summary: null,
            employees: [],
            detail: null
          });
        }
      },
      onError: (error) => {
        console.error("月次レポートデータ取得エラー:", error);
        setErrorMessage('データの取得中にエラーが発生しました。');
        setTimeout(() => setErrorMessage(null), 5000);
      },
      enabled: !!selectedYear && !!selectedMonth, // 年月が設定されている場合のみクエリを実行
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        // 404エラーの場合はリトライしない（存在しないデータ）
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return false;
        }
        // その他のエラーは3回までリトライ
        return failureCount < 3;
      }
    }
  );

  // サマリーデータ更新ハンドラー
  const handleSummaryChange = (updatedSummary: MonthlyTotal) => {
    setCurrentReport(prev => ({
      ...prev,
      summary: updatedSummary
    }));
  };

  // 従業員データ更新ハンドラー
  const handleEmployeeChange = (id: number, field: string, value: string) => {
    setCurrentReport(prev => {
      if (!prev.employees) return prev;
      
      return {
        ...prev,
        employees: prev.employees.map(emp => 
          emp.id === id 
            ? { 
                ...emp, 
                [field]: field === 'monthlyStatus' ? JSON.parse(value) : value 
              } 
            : emp
        )
      };
    });
  };

  // 月次詳細更新ハンドラー
  const handleDetailCellChange = (rowId: number, colIndex: number, value: string) => {
    setCurrentReport(prev => {
      if (!prev.detail) return prev;
      
      const newDetail = {...prev.detail};
      const rowIndex = newDetail.data.findIndex(row => row.id === rowId);
      
      if (rowIndex !== -1 && colIndex < 12) {
        // 法定雇用率フィールドの特別処理
        const isLegalRateField = rowId === 11;
        let numValue: number;
        
        if (isLegalRateField) {
          // 小数点を含む値の処理
          if (value === '' || value === '.') {
            numValue = 0;
          } else if (value.endsWith('.')) {
            numValue = parseFloat(value + '0');
          } else {
            numValue = parseFloat(value);
          }
        } else {
          // 通常の数値変換
          numValue = value === '' ? 0 : Number(value);
        }
        
        if (!isNaN(numValue)) {
          const updatedValues = [...newDetail.data[rowIndex].values];
          updatedValues[colIndex] = numValue;
          
          // 合計の再計算
          updatedValues[12] = updatedValues.slice(0, 12).reduce((a, b) => a + b, 0);
          
          newDetail.data[rowIndex].values = updatedValues;
        }
      }
      
      return {
        ...prev,
        detail: newDetail
      };
    });
  };

  // データ再取得ハンドラー - 改善版
  const handleRefreshData = useCallback(() => {
    // 現在の年月のキャッシュのみをクリア
    const cacheKey = `${selectedYear}-${selectedMonth}`;
    setDataCache(prev => {
      const newCache = {...prev};
      delete newCache[cacheKey];
      return newCache;
    });
    
    setIsUsingCachedData(false);
    
    // キャッシュを強制的に無効化
    queryClient.invalidateQueries(['monthlyReport', selectedYear, selectedMonth]);
    
    // データを明示的に再取得
    refetchReportData().catch(error => {
      console.error('データ再取得エラー:', error);
      setErrorMessage('データの再取得中にエラーが発生しました。');
      setTimeout(() => setErrorMessage(null), 5000);
    });
  }, [selectedYear, selectedMonth, queryClient, refetchReportData]);

  // 年度変更ハンドラー - 改善版
  const handleYearChange = async (year: number) => {
    console.log(`親コンポーネントで年度変更を検知: ${selectedYear} → ${year}`);
    
    // 年度を更新
    setSelectedYear(year);
    
    try {
      // 指定した年度のデータが存在するかチェック
      const exists = await checkReportExists(year, selectedMonth);
      
      if (!exists) {
        // データが存在しない場合は新規作成
        console.log(`${year}年度${selectedMonth}月のデータが存在しないため、新規作成します`);
        
        // デフォルトデータを作成
        try {
          await createDefaultMonthlyReport(year, selectedMonth);
          console.log(`${year}年度${selectedMonth}月のデータを新規作成しました`);
        } catch (error) {
          console.error('新規レポート作成エラー:', error);
          // エラーを無視して続行
        }
      }
      
      // 現在表示中のキャッシュをクリア
      const cacheKey = `${year}-${selectedMonth}`;
      setDataCache(prev => {
        const newCache = {...prev};
        delete newCache[cacheKey];
        return newCache;
      });
      
      setIsUsingCachedData(false);
      
      // キャッシュを強制的に無効化して再取得
      queryClient.invalidateQueries(['monthlyReport', year, selectedMonth]);
      queryClient.invalidateQueries(['monthlyReports']);
      
      // 明示的にデータを再取得
      refetchReportData().then(response => {
        if (response && response.data) {
          // 状態を更新
          setCurrentReport(prev => {
            const newDetail = response.data.detail || 
                           (response.data.summary ? formatYearlyDataForUI([response.data.summary]) : null);
            
            // 従業員データが空の場合でもUIを表示するため
            const employeesData = response.data.data?.employees && response.data.data.employees.length > 0 
              ? response.data.data.employees 
              : [];
            
            return {
              summary: response.data.data?.summary || null,
              employees: employeesData,
              detail: newDetail
            };
          });
        } else {
          // データが取得できなかった場合はデフォルト状態を設定
          setCurrentReport({
            summary: null,
            employees: [],
            detail: null
          });
        }
      }).catch(error => {
        console.error('データ再取得エラー:', error);
        
        // エラーメッセージを表示
        setErrorMessage('データの読み込みに失敗しました。');
        setTimeout(() => setErrorMessage(null), 5000);
        
        // デフォルト状態を設定
        setCurrentReport({
          summary: null,
          employees: [],
          detail: null
        });
      });
    } catch (error) {
      console.error('年度変更処理中にエラーが発生しました:', error);
      
      // エラーメッセージを表示
      setErrorMessage('年度切り替え中にエラーが発生しました。');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };
  
  // 月変更ハンドラー
  const handleMonthChange = async (month: number) => {
    console.log(`月変更を検知: ${selectedMonth} → ${month}`);
    
    // 月を更新
    setSelectedMonth(month);
    
    try {
      // 指定した年月のデータを再取得
      const cacheKey = `${selectedYear}-${month}`;
      setDataCache(prev => {
        const newCache = {...prev};
        delete newCache[cacheKey];
        return newCache;
      });
      
      setIsUsingCachedData(false);
      
      // キャッシュを強制的に無効化して再取得
      queryClient.invalidateQueries(['monthlyReport', selectedYear, month]);
      
      // 明示的にデータを再取得
      refetchReportData().catch(error => {
        console.error('データ再取得エラー:', error);
        setErrorMessage('データの再取得中にエラーが発生しました。');
        setTimeout(() => setErrorMessage(null), 5000);
      });
    } catch (error) {
      console.error('月変更処理中にエラーが発生しました:', error);
      setErrorMessage('月の切り替え中にエラーが発生しました。');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // タブ切り替えハンドラー
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  // ローディングまたはエラー状態の処理
  const isLoading = isLoadingReportsList || isLoadingReportData;
  const hasError = reportsListError || reportDataError;

  if (isLoading && !currentReport.summary && !currentReport.employees.length) {
    return <Spinner />;
  }

  if (hasError && !currentReport.employees.length) {
    console.error("データ取得エラー:", { reportsListError, reportDataError });
    return <ErrorMessage message="データの読み込み中にエラーが発生しました。" />;
  }

  const { summary, employees, detail } = currentReport;
  const isConfirmed = summary?.status === '確定済';

  // タブ定義
  const tabItems = [
    { id: 'summary', label: 'サマリー' },
    { id: 'employees', label: '従業員詳細' },
    { id: 'monthly', label: '月次詳細' }
  ];

  // デフォルトのMonthlyTotal型オブジェクト
  const defaultSummary: MonthlyTotal = {
    fiscal_year: selectedYear,
    month: selectedMonth,
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
    status: '未確定'
  };

  // 月選択用オプション
  const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // タブコンテンツをレンダリングするための関数
  const renderTabContent = () => {
    console.log('タブレンダリング:', {
      activeTab,
      employeesCount: employees?.length || 0,
      hasSummary: !!summary
    });

    if (activeTab === 'summary') {
      return (
        <SummaryTab 
          summaryData={summary} 
          onSummaryChange={handleSummaryChange}
          onRefreshData={handleRefreshData}
        />
      );
    }
    
    if (activeTab === 'employees') {
      return (
        <EmployeesTab 
          employees={(employees || []).map(emp => ({
            ...emp,
            employee_id: String(emp.employee_id), // number型をstring型に変換
            disability_type: emp.disability_type || '', // undefinedの場合は空文字列に変換
            disability: emp.disability || '', // 念のため
            grade: emp.grade || '', // 念のため
            name: emp.name || '', // 念のため
            status: emp.status || '在籍', // 念のため
            hire_date: emp.hire_date || new Date().toISOString().split('T')[0].replace(/-/g, '/') // 念のため
          }))} 
          onEmployeeChange={handleEmployeeChange}
          summaryData={summary || defaultSummary}
          onRefreshData={handleRefreshData}
          onYearChange={handleYearChange}
        />
      );
    }
    
    if (activeTab === 'monthly') {
      return (
        <MonthlyReportDetail 
          isEmbedded={true}
          summaryData={summary || undefined}
          monthlyDetailData={detail || undefined}
          onDetailCellChange={handleDetailCellChange}
          onYearChange={handleYearChange}
          onRefreshData={handleRefreshData}
        />
      );
    }
    
    // データがない場合、各タブで新規作成UIを表示するためにnullを返す
    return null;
  };

  // 条件付きレンダリング要素を事前に作成
  const errorMessageElement = errorMessage ? (
    <div className="error-message" style={{ 
      backgroundColor: '#f8d7da', 
      color: '#721c24', 
      padding: '10px', 
      borderRadius: '4px', 
      marginBottom: '15px' 
    }}>
      {errorMessage}
    </div>
  ) : null;

  const hasErrorElement = hasError ? (
    <div style={{ 
      backgroundColor: '#f8d7da', 
      color: '#721c24', 
      padding: '10px', 
      borderRadius: '4px', 
      marginBottom: '15px' 
    }}>
      データの取得中にエラーが発生しました。
    </div>
  ) : null;

  const isLoadingElement = isLoading ? (
    <div style={{ 
      backgroundColor: '#e9ecef', 
      padding: '10px', 
      borderRadius: '4px', 
      marginBottom: '15px',
      textAlign: 'center'
    }}>
      データを読み込み中...
    </div>
  ) : null;

  const summaryElement = summary ? (
    <div style={{
      backgroundColor: '#e9f2ff',
      padding: '15px 20px',
      borderRadius: '8px',
      marginBottom: '20px',
      borderLeft: '4px solid #3a66d4',
      fontSize: '0.9rem'
    }}>
      <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', color: '#3a66d4' }}>
        {summary.fiscal_year}年 {summary.month}月 サマリー
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px' }}>
        <span>常用労働者数: <strong>{summary.employees_count}</strong>名</span>
        <span>|</span>
        <span>うちフルタイム: {summary.fulltime_count}名</span>
        <span>|</span>
        <span>うちパートタイム: {summary.parttime_count}名</span>
        <br />
        <span>障害者数 (カウント): <strong>{safeNumber(summary.total_disability_count).toFixed(1)}</strong>名</span>
        <span>|</span>
        <span>実雇用率: <strong>{safeNumber(summary.employment_rate).toFixed(2)}</strong>%</span>
        <span>|</span>
        <span>法定雇用率: {safeNumber(summary.legal_employment_rate).toFixed(2)}%</span>
        <span>|</span>
        <span>法定雇用障害者数: {safeNumber(summary.required_count).toFixed(1)}名</span>
        <span>|</span>
        <span>不足数: <strong style={{ color: safeNumber(summary.over_under_count) < 0 ? 'red' : 'inherit' }}>{safeNumber(summary.over_under_count).toFixed(1)}</strong>名</span>
      </div>
    </div>
  ) : null;

  const isConfirmedElement = isConfirmed ? (
    <span style={{ color: '#28a745', fontWeight: 'bold', marginLeft:'5px' }}> (確定済)</span>
  ) : null;

  return (
    <YearMonthProvider initialYear={selectedYear} initialMonth={selectedMonth}>
      <div className="monthly-report-container" style={{ padding: '20px' }}>
        <h1 style={{ marginBottom: '20px' }}>月次報告</h1>
        
        {/* 年月選択パネル */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          backgroundColor: '#f8f9fa',
          padding: '10px 15px',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
          <div>
            <label style={{ marginRight: '8px', fontSize: '0.9rem' }}>年度:</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: '0.9rem'
              }}
            >
              {Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ marginRight: '8px', fontSize: '0.9rem' }}>月:</label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: '0.9rem'
              }}
            >
              {monthOptions.map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleRefreshData}
            style={{
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={isLoading}
          >
            更新
          </button>
        </div>
        
        {errorMessageElement}
        {hasErrorElement}
        {isLoadingElement}
        
        {summaryElement}
        
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #ddd',
          marginBottom: '20px'
        }}>
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #007bff' : '3px solid transparent',
                marginBottom: '-1px',
                color: activeTab === tab.id ? '#007bff' : '#666',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'color 0.2s, border-bottom-color 0.2s',
                fontSize: '1rem',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </YearMonthProvider>
  );
};

export default MonthlyReport;