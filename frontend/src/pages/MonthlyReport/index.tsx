// src/pages/MonthlyReport/index.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reportApi } from '../../api/reportApi';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

// 各タブのインポート - 正しいパス
import SummaryTab from './SummaryTab';
import EmployeesTab from './EmployeesTab';
import MonthlyReportDetail from './MonthlyReportDetail';

// 型と関数のインポート
import { 
  Employee, 
  MonthlyTotal, 
  MonthlyDetailData, 
  HistoryItem 
} from './types';
import { 
  safeNumber,
  processEmployeeData
} from './utils';

// formatYearlyDataForUI関数を修正して直接インポートする代わりにここで定義
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
  
  // 障がい者詳細データの設定（APIからデータが取得できるようになったら、この部分は実際のデータで置き換える）
  // 現状は固定値だが、将来的にはAPIから取得する
  const level1Values = Array(12).fill(2); // 全月2人と仮定
  const otherValues = [...Array(6).fill(2), ...Array(6).fill(3)]; // 前半2人、後半3人と仮定
  const level1PartTimeValues = Array(12).fill(0); // 全月0人と仮定
  const otherPartTimeValues = Array(12).fill(0); // 全月0人と仮定
  
  const sumLevel1 = level1Values.reduce((a, b) => a + b, 0);
  const sumOther = otherValues.reduce((a, b) => a + b, 0);
  const sumLevel1PartTime = level1PartTimeValues.reduce((a, b) => a + b, 0);
  const sumOtherPartTime = otherPartTimeValues.reduce((a, b) => a + b, 0);
  
  // UI表示用のデータ形式に変換
  return {
    months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
    data: [
      { id: 1, item: '従業員数', values: [...orderedData.map(d => d.total_employees), sumTotalEmployees] },
      { id: 2, item: 'フルタイム従業員数', values: [...orderedData.map(d => safeNumber(d.full_time_employees)), sumFullTimeEmployees] },
      { id: 3, item: 'パートタイム従業員数', values: [...orderedData.map(d => safeNumber(d.part_time_employees)), sumPartTimeEmployees] },
      { id: 4, item: 'トータル従業員数', values: [...orderedData.map(d => d.total_employees), sumTotalEmployees] },
      { id: 5, item: 'Level 1 & 2', values: [...level1Values, sumLevel1] },
      { id: 6, item: 'その他', values: [...otherValues, sumOther] },
      { id: 7, item: 'Level 1 & 2 (パートタイム)', values: [...level1PartTimeValues, sumLevel1PartTime] },
      { id: 8, item: 'その他 (パートタイム)', values: [...otherPartTimeValues, sumOtherPartTime] },
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

// モックデータ（型に厳密に合わせる）
const mockSummary: MonthlyTotal = {
  year: 2024,
  month: 11,
  total_employees: 525,
  full_time_employees: 520,
  part_time_employees: 5,
  disabled_employees: 5,
  actual_rate: 2.43,
  legal_rate: 2.3,
  legal_count: 15,
  shortage: -10,
  status: '確定済'
};

const mockEmployees: Employee[] = [
  { 
    no: 1, 
    id: 1, 
    employee_id: 1001, 
    name: '山田 太郎', 
    disability_type: '身体障害', 
    disability: '視覚', 
    grade: '1級', 
    hire_date: '2020/04/01', 
    status: '在籍', 
    count: 2.0, 
    monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
    memo: '特記事項なし' 
  },
  { 
    no: 2, 
    id: 2, 
    employee_id: 2222, 
    name: '鈴木 花子', 
    disability_type: '身体障害', 
    disability: '聴覚', 
    grade: '4級', 
    hire_date: '2020/04/01', 
    status: '在籍', 
    count: 1.0, 
    monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
    memo: '' 
  }
];

const initialMonthlyDetailData: MonthlyDetailData = {
  months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
  data: [
    { id: 1, item: '従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 2, item: 'フルタイム従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 3, item: 'パートタイム従業員数', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 4, item: 'トータル従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 5, item: 'Level 1 & 2', values: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 24] },
    { id: 6, item: 'その他', values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 33] },
    { id: 7, item: 'Level 1 & 2 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 8, item: 'その他 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 9, item: 'トータル障がい者数', values: [4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 57], isDisability: true },
    { 
      id: 10, 
      item: '実雇用率', 
      values: [0.7, 0.7, 0.6, 0.8, 0.8, 0.8, 0.8, 0.7, 0.8, 0.7, 0.7, 0.7, 0.7], 
      suffix: '%', 
      isRatio: true, 
      isCalculated: true 
    },
    { 
      id: 11, 
      item: '法定雇用率', 
      values: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5], 
      suffix: '%', 
      isRatio: true 
    },
    { 
      id: 12, 
      item: '法定雇用者数', 
      values: [15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 18, 196], 
      isCalculated: true 
    },
    { 
      id: 13, 
      item: '超過・未達', 
      values: [-11, -11, -12, -11, -11, -11, -12, -12, -12, -12, -12, -13, -139], 
      isNegative: true, 
      isCalculated: true 
    }
  ]
};

const MonthlyReport: React.FC = () => {
  // React Router Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // URLからタブパラメータを取得（デフォルトは'summary'）
  const tabFromUrl = queryParams.get('tab') || 'summary';

  // 基本的な状態管理
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);

  // データ状態
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [monthlyDetailData, setMonthlyDetailData] = useState<MonthlyDetailData>(initialMonthlyDetailData);
  const [summaryData, setSummaryData] = useState<MonthlyTotal>({
    ...mockSummary,
    year: selectedYear,
    month: selectedMonth
  });

  // サマリーデータを選択された年月で更新
  useEffect(() => {
    setSummaryData(prev => ({
      ...prev,
      year: selectedYear,
      month: selectedMonth
    }));
  }, [selectedYear, selectedMonth]);

  // Query Client
  const queryClient = useQueryClient();

  // タブ定義
  const tabItems = [
    { id: 'summary', label: 'サマリー' },
    { id: 'employees', label: '従業員詳細' },
    { id: 'monthly', label: '月次詳細' }
  ];

  // タブ切り替えハンドラー (修正済み)
  const handleTabChange = (tabId: string) => {
    console.log('タブ変更:', tabId); // デバッグ用
    // 無条件で状態を更新
    setActiveTab(tabId);
    // URLパラメータも更新
    const params = new URLSearchParams(location.search);
    params.set('tab', tabId);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    // 強制的にコンポーネントの再レンダリングを促す
    setTimeout(() => {
      console.log('タブ変更完了:', tabId);
    }, 0);
  };

  // URLから直接タブが変更された場合の処理
  useEffect(() => {
    const tabParam = queryParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // 月次詳細データからサマリーデータを更新する関数
  const updateSummaryFromMonthlyData = () => {
    // 選択した月のインデックスを取得 (4月始まり会計年度を考慮)
    const monthIndex = selectedMonth >= 4 ? selectedMonth - 4 : selectedMonth + 8;
    
    // 必要なデータの行インデックスを取得
    const totalEmployeesRowIndex = monthlyDetailData.data.findIndex(row => row.id === 4);
    const totalDisabledRowIndex = monthlyDetailData.data.findIndex(row => row.id === 9);
    const actualRateRowIndex = monthlyDetailData.data.findIndex(row => row.id === 10);
    const legalRateRowIndex = monthlyDetailData.data.findIndex(row => row.id === 11);
    
    if (totalEmployeesRowIndex !== -1 && totalDisabledRowIndex !== -1 && 
        actualRateRowIndex !== -1 && legalRateRowIndex !== -1) {
      
      // 選択した月のデータを取得
      const totalEmployees = monthlyDetailData.data[totalEmployeesRowIndex].values[monthIndex];
      const disabledEmployees = monthlyDetailData.data[totalDisabledRowIndex].values[monthIndex];
      const actualRate = monthlyDetailData.data[actualRateRowIndex].values[monthIndex];
      const legalRate = monthlyDetailData.data[legalRateRowIndex].values[monthIndex];
      
      // サマリーデータを更新
      setSummaryData(prev => ({
        ...prev,
        total_employees: totalEmployees,
        disabled_employees: disabledEmployees,
        actual_rate: actualRate,
        legal_rate: legalRate,
        year: selectedYear,
        month: selectedMonth
      }));
    }
  };

  // 月次詳細データが変更されたときにサマリーを更新
  useEffect(() => {
    updateSummaryFromMonthlyData();
  }, [monthlyDetailData, selectedYear, selectedMonth]);

  // データ取得用クエリ
  const { 
    data: apiMonthlyData, 
    isLoading: isLoadingMonthlyData, 
    error: monthlyError 
  } = useQuery(
    ['monthlyData', selectedYear, selectedMonth],
    () => reportApi.getMonthlyData(selectedYear, selectedMonth),
    { 
      enabled: !process.env.REACT_APP_USE_MOCK,
      onSuccess: (data) => {
        if (data) {
          setSummaryData(data);
        }
      }
    }
  );

  const { 
    data: apiEmployeeData, 
    isLoading: isLoadingEmployeeData, 
    error: employeeError 
  } = useQuery(
    ['monthlyEmployees', selectedYear, selectedMonth],
    () => reportApi.getEmployeesByMonth(selectedYear, selectedMonth),
    { 
      enabled: !process.env.REACT_APP_USE_MOCK,
      onSuccess: (data) => {
        if (data) {
          const formattedEmployees = processEmployeeData(data, selectedYear);
          setEmployees(formattedEmployees);
        }
      }
    }
  );

  const { 
    data: apiYearlyData, 
    isLoading: isLoadingYearlyData, 
    error: yearlyError 
  } = useQuery(
    ['yearlyData', selectedYear],
    () => reportApi.getYearlyData(selectedYear),
    { 
      enabled: !process.env.REACT_APP_USE_MOCK,
      onSuccess: (data) => {
        if (data) {
          const formattedDetailData = formatYearlyDataForUI(data);
          setMonthlyDetailData(formattedDetailData);
        }
      }
    }
  );

  // データ更新ハンドラー
  const handleEmployeeDataChange = (id: number, field: string, value: string) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === id 
          ? { 
              ...emp, 
              [field]: value,
              // 特別なロジック（例：身体障害の等級に応じたカウント調整）
              ...(field === 'disability_type' || field === 'grade') && 
                emp.disability_type === '身体障害' && 
                (emp.grade === '1級' || emp.grade === '2級')
                ? { count: 2.0 }
                : {}
            }
          : emp
      )
    );
  };

  const handleDetailCellChange = (rowId: number, colIndex: number, value: string) => {
    setMonthlyDetailData(prev => {
      const newData = {...prev};
      const rowIndex = newData.data.findIndex(row => row.id === rowId);
      
      if (rowIndex !== -1 && colIndex < 12) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          const updatedValues = [...newData.data[rowIndex].values];
          updatedValues[colIndex] = numValue;
          
          // 合計の再計算
          updatedValues[12] = updatedValues.slice(0, 12).reduce((a, b) => a + b, 0);
          
          newData.data[rowIndex].values = updatedValues;
        }
      }
      
      return newData;
    });
    
    // 月次詳細データが変更されたらサマリーも更新
    updateSummaryFromMonthlyData();
  };

  // 表示ボタンのハンドラー
  const handleDisplayClick = () => {
    queryClient.invalidateQueries(['monthlyData', selectedYear, selectedMonth]);
    queryClient.invalidateQueries(['monthlyEmployees', selectedYear, selectedMonth]);
    queryClient.invalidateQueries(['yearlyData', selectedYear]);
    console.log(`${selectedYear}年${selectedMonth}月のデータを取得`);
    
    // 選択した年月でサマリーデータを更新
    updateSummaryFromMonthlyData();
  };

  // レンダリング前のローディングとエラー処理
  if (isLoadingMonthlyData || isLoadingEmployeeData || isLoadingYearlyData) {
    return <Spinner />;
  }

  if (monthlyError || employeeError || yearlyError) {
    return <ErrorMessage message="データの読み込み中にエラーが発生しました" />;
  }

  return (
    <div className="monthly-report-container">
      <h1>月次報告</h1>

      {/* 年月選択 */}
      <div className="filter-container" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ fontWeight: 'bold' }}>対象月:</label>
        <select 
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
            <option key={year} value={year}>{year}年</option>
          ))}
        </select>
        
        <select 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
            <option key={month} value={month}>{month}月</option>
          ))}
        </select>
        
        <button 
          onClick={handleDisplayClick}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#3a66d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          表示
        </button>

        <button 
          onClick={() => {
            if (window.confirm('月次データを確定しますか？')) {
              // 確定処理のロジックを追加
              console.log('月次データ確定');
            }
          }}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#3a66d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: summaryData.status === '確定済' ? 0.5 : 1
          }}
          disabled={summaryData.status === '確定済'}
        >
          月次確定
        </button>
      </div>
      
      {/* サマリーボックス - フォントサイズを修正 */}
      <div style={{ 
        backgroundColor: '#e9f2ff', 
        padding: '15px 20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        borderLeft: '4px solid #3a66d4'
      }}>
        <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0' }}>集計サマリー</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <span>常用労働者数: {summaryData.total_employees}名</span>
          <span>|</span>
          <span>障害者数: {summaryData.disabled_employees}名</span>
          <span>|</span>
          <span>実雇用率: {summaryData.actual_rate}%</span>
          <span>|</span>
          <span>法定雇用率: {summaryData.legal_rate}%</span>
        </div>
      </div>

      {/* タブナビゲーション - クリックハンドラーを修正 */}
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
              borderBottom: activeTab === tab.id ? '2px solid #3a66d4' : '2px solid transparent',
              color: activeTab === tab.id ? '#3a66d4' : '#666',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="tab-content">
        {activeTab === 'summary' && (
          <SummaryTab 
            employees={employees}
            historyData={[]} 
            onEmployeeChange={handleEmployeeDataChange}
            summaryData={summaryData}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeesTab 
            employees={employees}
            onEmployeeChange={handleEmployeeDataChange}
            summaryData={summaryData}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyReportDetail 
            key="monthlyDetail" // keyを追加して再マウントを防止
            monthlyDetailData={monthlyDetailData}
            onDetailCellChange={handleDetailCellChange}
            summaryData={summaryData}
            isEmbedded={true} // 埋め込みモードを示すプロパティ追加
          />
        )}
      </div>
    </div>
  );
};

export default MonthlyReport;