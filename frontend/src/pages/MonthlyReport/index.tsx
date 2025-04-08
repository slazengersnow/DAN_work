// src/pages/MonthlyReport/index.tsx
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
  // 月別に並べ替え（4月始まり会計年度を想定）
  const orderedData = [
    ...yearlyData.filter(d => d.month >= 4).sort((a, b) => a.month - b.month),
    ...yearlyData.filter(d => d.month <= 3).sort((a, b) => a.month - b.month)
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
      { id: 5, item: '重度身体障がい者・重度知的障がい者', values: [...level1_2CountValues, sumLevel1_2Count], suffix: '名', isDisability: true },
      { id: 6, item: 'その他障がい者', values: [...otherDisabilityCountValues, sumOtherDisabilityCount], suffix: '名', isDisability: true },
      { id: 7, item: '重度身体障がい者・重度知的障がい者(パートタイム)', values: [...level1_2ParttimeCountValues, sumLevel1_2ParttimeCount], suffix: '名', isDisability: true },
      { id: 8, item: 'その他障がい者(パートタイム)', values: [...otherParttimeCountValues, sumOtherParttimeCount], suffix: '名', isDisability: true },
      { id: 9, item: '障がい者合計', values: [...totalDisabilityCountValues, sumTotalDisabilityCount], suffix: '名', isDisability: true },
      { id: 10, item: '実雇用率', values: [...actualRateValues.map(r => parseFloat(r.toFixed(2))), parseFloat(avgActualRate.toFixed(2))], suffix: '%', isRatio: true, isCalculated: true },
      { id: 11, item: '法定雇用率', values: [...legalRateValues.map(r => parseFloat(r.toFixed(2))), parseFloat(avgLegalRate.toFixed(2))], suffix: '%', isRatio: true },
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
  
  // 現在選択中の年度と月
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

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
    () => getMonthlyReport(selectedYear, selectedMonth),
    {
      onSuccess: (data) => {
        if (data) {
          setCurrentReport({
            summary: data.summary,
            employees: data.employees,
            detail: data.detail || formatYearlyDataForUI([data.summary]) // 詳細データがなければサマリーから生成
          });
        }
      },
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  // 月次確定Mutation
  const confirmMutation = useMutation(
    // updateMonthlySummaryとconfirmMonthlyReportはAPIとして提供されていないので、
    // この部分は削除するか、別のコンポーネントから提供される関数を使用する
    () => import('../../api/reportApi').then(module => module.confirmMonthlyReport(selectedYear, selectedMonth)),
    {
      onSuccess: (data) => {
        // 成功したら関連クエリを無効化して最新データを再取得
        queryClient.invalidateQueries(['monthlyReport', selectedYear, selectedMonth]);
        queryClient.invalidateQueries(['monthlyReports']);
        setCurrentReport(prev => ({
          ...prev,
          summary: data
        }));
        alert('月次データを確定しました。');
      },
      onError: (error: any) => {
        console.error("月次確定エラー:", error);
        setErrorMessage(`月次データの確定に失敗しました: ${handleApiError(error)}`);
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

  // 確定ボタンハンドラー
  const handleConfirm = () => {
    if (window.confirm(`${selectedYear}年${selectedMonth}月の月次データを確定しますか？この操作は元に戻せません。`)) {
      confirmMutation.mutate();
    }
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
  const isLoading = isLoadingReportsList || isLoadingReportData || confirmMutation.isLoading;
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

  // MonthlyReportContentコンポーネントを作成して単一の子要素として返す
  const MonthlyReportContent = () => {
    return (
      <div className="monthly-report-container" style={{ padding: '20px' }}>
        <h1 style={{ marginBottom: '20px' }}>月次報告</h1>
        
        {/* エラーメッセージ表示 */}
        {errorMessage && (
          <div className="error-message" style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {errorMessage}
          </div>
        )}
        
        
        {/* 標準エラー表示 */}
        {hasError && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            データの取得中にエラーが発生しました。
          </div>
        )}
        
        {/* ローディングインジケーター */}
        {isLoading && (
          <div style={{ 
            backgroundColor: '#e9ecef', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            データを読み込み中...
          </div>
        )}
        
        {/* 年月選択 & 操作ボタン */}
        <div className="filter-container" style={{ 
          marginBottom: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          flexWrap: 'wrap' 
        }}>
          <label htmlFor="year-select" style={{ fontWeight: 'bold' }}>対象月:</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            disabled={isLoading}
          >
            {/* 前後5年分くらい表示 */}
            {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>

          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            disabled={isLoading}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <option key={month} value={month}>{month}月</option>
            ))}
          </select>

          <button
            onClick={handleDisplayClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
            disabled={isLoading}
          >
            表示
          </button>

          {reportsList && reportsList.length > 0 && (
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-').map(Number);
                handleYearMonthChange(year, month);
              }}
              style={{ 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ced4da',
                minWidth: '200px'
              }}
              disabled={isLoading}
            >
              {reportsList.map((report: { fiscal_year: number; month: number; status?: string }) => (
                <option 
                  key={`${report.fiscal_year}-${report.month}`} 
                  value={`${report.fiscal_year}-${report.month}`}
                >
                  {report.fiscal_year}年度 {report.month}月 ({report.status || '未確定'})
                </option>
              ))}
            </select>
          )}
          
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: isConfirmed || confirmMutation.isLoading ? 0.6 : 1,
              transition: 'background-color 0.2s, opacity 0.2s',
            }}
            disabled={isConfirmed || confirmMutation.isLoading || !summary}
            onMouseOver={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#218838')}
            onMouseOut={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#28a745')}
          >
            {confirmMutation.isLoading ? '確定中...' : '月次確定'}
          </button>
          
          {isConfirmed && (
            <span style={{ color: '#28a745', fontWeight: 'bold', marginLeft:'5px' }}> (確定済)</span>
          )}

          <button 
            onClick={handleRefreshData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
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
        
        {/* サマリーボックス */}
        {summary && (
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
        )}
        
        {!summary && !isLoading && (
          <div style={{ padding: '20px', textAlign:'center', color:'#888'}}>
            表示するサマリーデータがありません。
          </div>
        )}
        
        {/* タブナビゲーション */}
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
        
        {/* タブコンテンツ */}
        <div className="tab-content">
          {/* サマリータブ */}
          {activeTab === 'summary' && summary && (
            <SummaryTab 
              summaryData={summary} 
              onSummaryChange={handleSummaryChange}
              onRefreshData={handleRefreshData}
            />
          )}
          
          {/* 従業員タブ */}
          {activeTab === 'employees' && summary && (
            <EmployeesTab 
              employees={employees} 
              onEmployeeChange={handleEmployeeChange}
              summaryData={summary}
              onRefreshData={handleRefreshData}
            />
          )}
          
          {/* 月次詳細タブ */}
          {activeTab === 'monthly' && summary && detail && (
            <MonthlyReportDetail 
              isEmbedded={true}
              summaryData={summary}
              monthlyDetailData={detail}
              onDetailCellChange={handleDetailCellChange}
              onRefreshData={handleRefreshData}
            />
          )}
          
          {/* データがない場合 */}
          {activeTab === 'monthly' && !detail && !isLoading && (
            <div style={{ padding: '20px', textAlign:'center', color:'#888'}}>月次詳細データがありません。</div>
          )}
          
          {activeTab === 'employees' && employees.length === 0 && !isLoading && (
            <div style={{ padding: '20px', textAlign:'center', color:'#888'}}>従業員データがありません。</div>
          )}
          
          {!isLoading && !summary && (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }}>
              表示するデータがありません。
            </div>
          )}
        </div>
      </div>
    );
  };

  // 実際の返り値を単一のコンポーネントにする
  return (
    <YearMonthProvider initialYear={selectedYear} initialMonth={selectedMonth}>
      <MonthlyReportContent />
    </YearMonthProvider>
  );
};

export default MonthlyReport;