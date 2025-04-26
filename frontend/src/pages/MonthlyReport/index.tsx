import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
      { id: 5, item: '重度身体障がい者・重度知的障がい者', values: [...level1_2CountValues, sumLevel1_2Count], suffix: '名', isDisability: true },
      { id: 6, item: 'その他障がい者', values: [...otherDisabilityCountValues, sumOtherDisabilityCount], suffix: '名', isDisability: true },
      { id: 7, item: '重度身体障がい者・重度知的障がい者(パートタイム)', values: [...level1_2ParttimeCountValues, sumLevel1_2ParttimeCount], suffix: '名', isDisability: true },
      { id: 8, item: 'その他障がい者(パートタイム)', values: [...otherParttimeCountValues, sumOtherParttimeCount], suffix: '名', isDisability: true },
      { id: 9, item: '障がい者合計', values: [...totalDisabilityCountValues, sumTotalDisabilityCount], suffix: '名', isDisability: true, isCalculated: true },
      { id: 10, item: '実雇用率', values: [...actualRateValues, avgActualRate], suffix: '%', isRatio: true, isCalculated: true },
      { id: 11, item: '法定雇用率', values: [...legalRateValues, avgLegalRate], suffix: '%', isRatio: true },
      { id: 12, item: '法定雇用者数', values: [...legalCountValues, sumLegalCount], suffix: '名', isCalculated: true },
      { id: 13, item: '超過・未達', values: [...overUnderValues, sumOverUnder], isNegative: true, isCalculated: true, suffix: '名' }
    ]
  };
};

const MonthlyReport: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryClient = useQueryClient();
  const tabFromUrl = queryParams.get('tab') || 'summary';

  // 現在のタブ状態
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  
  // 現在選択中の年度と月（デフォルト値を設定）
  const [selectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth] = useState<number>(new Date().getMonth() + 1);

  // エラーメッセージ状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // React Query
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

  const {
    data: reportData,
    isLoading: isLoadingReportData,
    error: reportDataError,
    refetch: refetchReportData
  } = useQuery(
    ['monthlyReport', selectedYear, selectedMonth],
    () => {
      // 年月が有効値であることを確認
      const validYear = selectedYear || new Date().getFullYear();
      const validMonth = selectedMonth || new Date().getMonth() + 1;
      return getMonthlyReport(validYear, validMonth);
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
        } else {
          // データがない場合は空の状態にリセット
          setCurrentReport({
            summary: null,
            employees: [],
            detail: null
          });
        }
      },
      enabled: !!selectedYear && !!selectedMonth, // 年月が設定されている場合のみクエリを実行
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
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

  // データ再取得ハンドラー
  const handleRefreshData = () => {
    queryClient.invalidateQueries(['monthlyReport', selectedYear, selectedMonth]);
    refetchReportData();
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

  // タブコンテンツをレンダリングするための関数
  const renderTabContent = () => {
    if (activeTab === 'summary') {
      return (
        <SummaryTab 
          summaryData={summary} 
          onSummaryChange={handleSummaryChange}
          onRefreshData={handleRefreshData}
        />
      );
    }
    
    if (activeTab === 'employees' && summary) {
      return (
        <EmployeesTab 
          employees={employees} 
          onEmployeeChange={handleEmployeeChange}
          summaryData={summary}
          onRefreshData={handleRefreshData}
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
          onRefreshData={() => {
            console.log('親コンポーネントでデータ再取得を実行');
            
            // React Query キャッシュを強制的に無効化
            queryClient.invalidateQueries(['monthlyReport', selectedYear, selectedMonth]);
            
            // データを明示的に再取得
            refetchReportData()
              .then(response => {
                console.log('データ再取得成功:', response);
                
                if (response && response.data) {
                  // 直接的にステートを更新
                  setCurrentReport(prev => {
                    // 再取得したデータからdetailを生成（データがない場合は既存データを使用）
                    const newDetail = response.data.detail || 
                                    (response.data.summary ? formatYearlyDataForUI([response.data.summary]) : prev.detail);
                    
                    return {
                      ...prev,
                      summary: response.data.summary || prev.summary,
                      employees: response.data.employees || prev.employees,
                      detail: newDetail
                    };
                  });
                  
                  // React Queryキャッシュを更新
                  queryClient.setQueryData(
                    ['monthlyReport', selectedYear, selectedMonth],
                    response.data
                  );
                  
                  console.log('ステート更新完了');
                }
              })
              .catch(error => {
                console.error('データ再取得エラー:', error);
              });
          }}
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
        
        {errorMessageElement}
        {hasErrorElement}
        {isLoadingElement}
        
        {/* 「対象月」フィルター部分を削除 */}
        
        {summaryElement}
        {/* noSummaryElement 削除 - 「表示するサマリーデータがありません」メッセージを削除 */}
        
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