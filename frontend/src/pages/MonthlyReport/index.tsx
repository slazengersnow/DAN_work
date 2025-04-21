// src/pages/MonthlyReport/index.tsx
import React, { useState, useEffect } from 'react';
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
  handleApiError 
} from '../../api/reportApi';
import { safeNumber, processEmployeeData } from './utils';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

// MonthlyReport/index.tsx の最初に追加
console.log('MonthlyReport/index.tsx がロードされました', new Date().toISOString());

// タブスタイル定数
const tabStyle = {
  padding: '10px 20px',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#666'
};

const activeTabStyle = {
  ...tabStyle,
  borderBottom: '2px solid #007bff',
  color: '#007bff',
  fontWeight: 'bold' as const
};

// ボタンスタイル定数
const primaryButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const secondaryButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

// ステータスバッジスタイル
const statusBadgeStyle = {
  display: 'inline-block',
  padding: '2px 6px',
  borderRadius: '3px',
  fontSize: '12px',
  fontWeight: 'normal' as const,
  backgroundColor: '#4caf50',
  color: 'white'
};

// サマリーボックススタイル
const summaryBoxStyle = {
  backgroundColor: '#e9f2ff',
  padding: '15px',
  marginBottom: '20px',
  borderRadius: '4px',
  borderLeft: '4px solid #007bff'
};

// テーブルスタイル
const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: '13px',
  border: '1px solid #dee2e6',
  backgroundColor: 'white'
};

const tableHeaderStyle = {
  padding: '8px',
  borderBottom: '2px solid #dee2e6',
  backgroundColor: '#f8f9fa',
  fontWeight: 'normal' as const,
  textAlign: 'left' as const
};

const tableCellStyle = {
  padding: '8px',
  borderBottom: '1px solid #dee2e6'
};

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
  const avgActualRate = actualRateValues.reduce((sum, val) => sum + val, 0) / (orderedData.length || 1);
  const avgLegalRate = legalRateValues.reduce((sum, val) => sum + val, 0) / (orderedData.length || 1);
  const sumLegalCount = legalCountValues.reduce((sum, val) => sum + val, 0);
  const sumOverUnder = overUnderValues.reduce((sum, val) => sum + val, 0);

  // UI表示用のデータ形式に変換
  return {
    months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
    data: [
      { id: 1, item: '従業員数', values: [...totalEmployeesValues, sumTotalEmployees], suffix: '名' },
      { id: 2, item: 'フルタイム従業員数', values: [...fullTimeEmployeesValues, sumFullTimeEmployees], suffix: '名' },
      { id: 3, item: 'パートタイム従業員数', values: [...partTimeEmployeesValues, sumPartTimeEmployees], suffix: '名' },
      { 
        id: 4, 
        item: 'トータル従業員数', 
        values: [...totalEmployeesValues, sumTotalEmployees], 
        suffix: '名',
        isCalculated: true 
      },
      { id: 5, item: 'Level 1 & 2', values: [...level1_2CountValues, sumLevel1_2Count], suffix: '名', isDisability: true },
      { id: 6, item: 'その他', values: [...otherDisabilityCountValues, sumOtherDisabilityCount], suffix: '名', isDisability: true },
      { id: 7, item: 'Level 1 & 2 (パートタイム)', values: [...level1_2ParttimeCountValues, sumLevel1_2ParttimeCount], suffix: '名', isDisability: true },
      { id: 8, item: 'その他 (パートタイム)', values: [...otherParttimeCountValues, sumOtherParttimeCount], suffix: '名', isDisability: true },
      { 
        id: 9, 
        item: 'トータル障がい者数', 
        values: [...totalDisabilityCountValues, sumTotalDisabilityCount], 
        suffix: '名', 
        isDisability: true,
        isCalculated: true
      },
      { 
        id: 10, 
        item: '実雇用率', 
        values: [...actualRateValues.map(r => parseFloat(r.toFixed(2))), parseFloat(avgActualRate.toFixed(2))], 
        suffix: '%', 
        isRatio: true, 
        isCalculated: true 
      },
      { 
        id: 11, 
        item: '法定雇用率', 
        values: [...legalRateValues.map(r => parseFloat(r.toFixed(2))), parseFloat(avgLegalRate.toFixed(2))], 
        suffix: '%', 
        isRatio: true 
      },
      { 
        id: 12, 
        item: '法定雇用者数', 
        values: [...legalCountValues, sumLegalCount], 
        suffix: '名', 
        isCalculated: true 
      },
      { 
        id: 13, 
        item: '超過・未達', 
        values: [...overUnderValues, sumOverUnder], 
        isNegative: true, 
        isCalculated: true, 
        suffix: '名' 
      }
    ]
  };
};

// 初期データ生成関数
const generateInitialData = (tabType: string): MonthlyDetailData | Employee[] | null => {
  if (tabType === 'monthly') {
    // 月次詳細の初期データを生成
    return {
      months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
      data: [
        { id: 1, item: '従業員数', values: Array(13).fill(0), suffix: '名' },
        { id: 2, item: 'フルタイム従業員数', values: Array(13).fill(0), suffix: '名' },
        { id: 3, item: 'パートタイム従業員数', values: Array(13).fill(0), suffix: '名' },
        { id: 4, item: 'トータル従業員数', values: Array(13).fill(0), suffix: '名', isCalculated: true },
        { id: 5, item: 'Level 1 & 2', values: Array(13).fill(0), suffix: '名', isDisability: true },
        { id: 6, item: 'その他', values: Array(13).fill(0), suffix: '名', isDisability: true },
        { id: 7, item: 'Level 1 & 2 (パートタイム)', values: Array(13).fill(0), suffix: '名', isDisability: true },
        { id: 8, item: 'その他 (パートタイム)', values: Array(13).fill(0), suffix: '名', isDisability: true },
        { id: 9, item: 'トータル障がい者数', values: Array(13).fill(0), suffix: '名', isDisability: true, isCalculated: true },
        { id: 10, item: '実雇用率', values: Array(13).fill(0), suffix: '%', isRatio: true, isCalculated: true },
        { id: 11, item: '法定雇用率', values: Array(13).fill(2.3), suffix: '%', isRatio: true },
        { id: 12, item: '法定雇用者数', values: Array(13).fill(0), suffix: '名', isCalculated: true },
        { id: 13, item: '超過・未達', values: Array(13).fill(0), isNegative: true, isCalculated: true, suffix: '名' }
      ]
    } as MonthlyDetailData;
  } else if (tabType === 'employees') {
    // 従業員詳細の初期データを生成
    return [
      {
        id: 1,
        employee_id: '',
        name: '',
        disability_type: '',
        disability: '',
        grade: '',
        hire_date: '',
        status: '在籍中',
        count: 1,
        memo: '',
        monthlyStatus: Array(12).fill(1)
      }
    ] as Employee[];
  }
  
  return null;
};

const MonthlyReport: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryClient = useQueryClient();
  const tabFromUrl = queryParams.get('tab') || 'summary';

  // 現在のタブ状態
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  
  // 現在選択中の年度と月
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // エラーメッセージ状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 編集モード状態
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

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

  // useEffect 内で状態をデバッグ
  useEffect(() => {
    console.log('currentReport状態:', {
      hasSummary: !!currentReport.summary,
      employeesCount: currentReport.employees?.length,
      hasDetail: !!currentReport.detail
    });
  }, [currentReport]);

  // タブ変更時のURL更新
  useEffect(() => {
    // URLのクエリパラメータを更新
    navigate(`/monthly-report?tab=${activeTab}`, { replace: true });
  }, [activeTab, navigate]);

  // React Query
  const {
    data: reportsList,
    isLoading: isLoadingReportsList,
    error: reportsListError
  } = useQuery(
    ['monthlyReports'],
    () => {
      console.log('月次レポート一覧を取得中...');
      return getMonthlyReports().then(data => {
        console.log('月次レポート一覧の取得結果:', data);
        return data;
      });
    },
    {
      onSuccess: (data) => {
        // 最新のレポートを取得
        if (data && data.length > 0) {
          const latestReport = data[0];
          setSelectedYear(latestReport.fiscal_year);
          setSelectedMonth(latestReport.month);
          // 最新レポートの詳細を取得
          queryClient.invalidateQueries(['monthlyReport', latestReport.fiscal_year, latestReport.month]);
        }
      },
      staleTime: 5 * 60 * 1000, // 5分間はStaleとみなさない
      cacheTime: 10 * 60 * 1000, // 10分間キャッシュを保持
    }
  );

  const {
    data: reportData,
    isLoading: isLoadingReportData,
    error: reportDataError,
    refetch: refetchReportData
  } = useQuery(
    ['monthlyReport', selectedYear, selectedMonth],
    () => {
      // デバッグ追加
      console.log(`API呼び出し: ${selectedYear}年${selectedMonth}月のデータを取得`);
      return getMonthlyReport(selectedYear, selectedMonth)
        .then(data => {
          console.log('API応答:', data); // レスポンスをログ出力
          return data;
        })
        .catch(error => {
          console.error('APIエラー:', error); // エラーをログ出力
          throw error; // エラーを再スロー
        });
    },
    {
      onSuccess: (data) => {
        if (data) {
          // サマリーデータの安全な処理
          const summaryData = data.summary || null;
          let detailData = data.detail || null;
          
          // サマリーデータが存在する場合のみformatYearlyDataForUIを呼び出す
          if (summaryData && !detailData) {
            try {
              detailData = formatYearlyDataForUI([summaryData]);
            } catch (error) {
              console.error("詳細データの生成中にエラーが発生しました:", error);
              detailData = null;
            }
          }
          
          setCurrentReport({
            summary: summaryData,
            employees: data.employees || [],
            detail: detailData
          });
        }
      },
      enabled: !!selectedYear && !!selectedMonth, // 年月が設定されている場合のみクエリを実行
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  // 新規データ作成ハンドラー
  const handleCreateNewData = (tabType: string) => {
    console.log(`${tabType}の新規データを作成します`);
    setIsEditMode(true); // 重要: 編集モードをオンにする
    
    if (tabType === 'summary') {
      // サマリーの初期データ (最小限に)
      const newSummary: MonthlyTotal = {
        id: 0,
        fiscal_year: selectedYear,
        month: selectedMonth,
        employees_count: 0,
        fulltime_count: 0,
        parttime_count: 0,
        level1_2_count: 0,
        other_disability_count: 0,
        level1_2_parttime_count: 0,
        other_parttime_count: 0,
        total_disability_count: 0,
        employment_rate: 0,
        legal_employment_rate: 2.3,
        required_count: 0,
        over_under_count: 0,
        status: '未確定',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setCurrentReport(prev => ({
        ...prev,
        summary: newSummary
      }));
    } 
    else if (tabType === 'employees') {
      // 従業員データの初期化（最小限に）
      const newEmployee: Employee = {
        id: Date.now(),
        no: 1,
        employee_id: '',
        name: '',
        disability_type: '',
        disability: '',
        grade: '',
        hire_date: new Date().toISOString().split('T')[0].split('-').join('/'),
        status: '在籍',
        count: 1,
        monthlyStatus: Array(12).fill(1),
        memo: ''
      };
      
      setCurrentReport(prev => ({
        ...prev,
        employees: [newEmployee]
      }));
    } 
    else if (tabType === 'monthly') {
      // 月次詳細の初期データ（最小限に）
      setCurrentReport(prev => ({
        ...prev,
        detail: {
          months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
          data: [
            // 必要最低限の行
            { id: 1, item: '従業員数', values: Array(13).fill(0), suffix: '名' },
            { id: 11, item: '法定雇用率', values: Array(12).fill(2.3).concat([2.3]), suffix: '%', isRatio: true }
          ]
        }
      }));
    }
  };

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
        const numValue = value === '' ? 0 : Number(value);
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

  // 年月変更ハンドラー
  const handleYearMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    queryClient.invalidateQueries(['monthlyReport', year, month]);
    refetchReportData();
  };

  // 表示ボタンハンドラー
  const handleDisplayClick = () => {
    console.log(`表示ボタンクリック: ${selectedYear}年${selectedMonth}月`);
    queryClient.invalidateQueries(['monthlyReport', selectedYear, selectedMonth]);
    refetchReportData();
  };

  // データ再取得ハンドラー
  const handleRefreshData = () => {
    queryClient.invalidateQueries(['monthlyReport', selectedYear, selectedMonth]);
    refetchReportData();
  };

  // 編集モード切替ハンドラー
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // タブ切り替えハンドラー
  const handleTabChange = (tab: string) => {
    console.log(`タブ切り替え: ${activeTab} → ${tab}`);
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  // ローディングまたはエラー状態の処理
  const isLoading = isLoadingReportsList || isLoadingReportData;
  const hasError = reportsListError || reportDataError;

  if (isLoading && !currentReport.summary) {
    return <Spinner />;
  }

  if (hasError) {
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

  // サマリータブのレンダリング
  const renderSummaryTab = () => {
    if (activeTab === 'summary' && summary) {
      return (
        <SummaryTab
          summaryData={summary}
          onSummaryChange={handleSummaryChange}
          onRefreshData={handleRefreshData}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
        />
      );
    }
    return null;
  };

  // 従業員詳細タブのレンダリング
  const renderEmployeesTab = () => {
    if (activeTab === 'employees' && summary) {
      return (
        <EmployeesTab
          employees={employees}
          onEmployeeChange={handleEmployeeChange}
          summaryData={summary}
          onRefreshData={handleRefreshData}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
        />
      );
    }
    return null;
  };

  // 月次詳細タブのレンダリング
  const renderMonthlyDetailTab = () => {
    if (activeTab === 'monthly' && summary) {
      // 型安全な方法でpropsを渡す
      // 型アサーションを使って一時的にTypeScriptエラーを回避
      const detailProps = {
        // 複数の可能性のあるプロパティ名をすべて含める
        detailData: detail,
        data: detail,
        monthlyDetail: detail,
        reportDetail: detail,
        // その他の必要なプロパティ
        onDetailChange: handleDetailCellChange,
        onRefreshData: handleRefreshData,
        isEditMode,
        setIsEditMode
      } as any; // 一時的にanyを使用

      return <MonthlyReportDetail {...detailProps} />;
    }
    return null;
  };

  // タブコンテンツをレンダリングするための関数
  const renderTabContent = () => {
    // データ存在チェックを追加
    const hasData = activeTab === 'summary' ? !!summary : 
                  activeTab === 'employees' ? (employees && employees.length > 0) : 
                  !!detail;
    
    // データがない場合の処理
    if (!hasData) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#888', marginBottom: '20px' }}>表示するデータがありません。</p>
          <button 
            onClick={() => handleCreateNewData(activeTab)} 
            style={primaryButtonStyle}
          >
            新規作成
          </button>
        </div>
      );
    }
    
    // タブ別コンテンツレンダリング
    if (activeTab === 'summary') {
      return renderSummaryTab();
    } else if (activeTab === 'employees') {
      return renderEmployeesTab();
    } else if (activeTab === 'monthly') {
      return renderMonthlyDetailTab();
    }
    
    return null;
  };

  // 現在のサマリーが存在する場合のみ、サマリー情報を表示
  const summaryInfo = summary ? (
    <div style={summaryBoxStyle}>
      <h3 style={{ margin: 0, marginBottom: '10px', fontSize: '1rem', color: '#007bff' }}>
        {selectedYear}年集計サマリー
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '0.9rem' }}>
        <span>常用労働者数: {summary.employees_count}名</span>
        <span>|</span>
        <span>障害者数: {summary.total_disability_count}名</span>
        <span>|</span>
        <span>雇用カウント: {safeNumber(summary.total_disability_count).toFixed(1)}</span>
        <span>|</span>
        <span>実雇用率: {safeNumber(summary.employment_rate).toFixed(2)}%</span>
        <span>|</span>
        <span>法定雇用率: {safeNumber(summary.legal_employment_rate).toFixed(2)}%</span>
      </div>
    </div>
  ) : null;

  return (
    <YearMonthProvider initialYear={selectedYear} initialMonth={selectedMonth}>
      <div style={{ padding: '20px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>月次報告</h2>
          
          {/* フィルターコンテナ */}
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px', 
            border: '1px solid #dee2e6',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <label htmlFor="year-select" style={{ fontWeight: 'bold' }}>対象月:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '120px' }}
                disabled={isLoading}
              >
                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>

              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '80px' }}
                disabled={isLoading}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDisplayClick}
              style={primaryButtonStyle}
              disabled={isLoading}
            >
              表示
            </button>

            <button
              style={secondaryButtonStyle}
              disabled={isLoading}
            >
              月次確定
            </button>
          </div>
          
          {/* サマリー情報 */}
          {summaryInfo}
          
          {/* エラーメッセージ */}
          {errorMessage && (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              padding: '10px 15px', 
              borderRadius: '4px', 
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              {errorMessage}
            </div>
          )}
          
          {/* ローディングインジケーター */}
          {isLoading && (
            <div style={{ 
              backgroundColor: '#e9ecef', 
              padding: '15px', 
              borderRadius: '4px', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              データを読み込み中...
            </div>
          )}
          
          {/* タブナビゲーション */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #dee2e6', 
            marginBottom: '20px' 
          }}>
            {tabItems.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={activeTab === tab.id ? activeTabStyle : tabStyle}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* タブコンテンツ */}
          <div style={{ minHeight: '400px' }}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </YearMonthProvider>
  );
};

export default MonthlyReport;