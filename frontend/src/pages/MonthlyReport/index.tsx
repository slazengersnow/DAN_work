// src/pages/MonthlyReport/index.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reportApi } from '../../api/reportApi';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

// 各タブのインポート
import SummaryTab from './SummaryTab';
import EmployeesTab from './EmployeesTab';
import MonthlyTab from './MonthlyTab';

// 型と関数のインポート
import { 
  Employee, 
  MonthlyTotal, 
  MonthlyDetailData, 
  HistoryItem 
} from './types';
import { 
  formatYearlyDataForUI, 
  processEmployeeData
} from './utils';

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
  const [summaryData, setSummaryData] = useState<MonthlyTotal>(mockSummary);

  // Query Client
  const queryClient = useQueryClient();

  // タブ定義
  const tabItems = [
    { id: 'summary', label: 'サマリー' },
    { id: 'employees', label: '従業員詳細' },
    { id: 'monthly', label: '月次詳細' }
  ];

  // タブが変更されたらURLも更新
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('tab', activeTab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [activeTab, location.pathname, location.search, navigate]);

  // URLからタブパラメータが変更された場合、状態を更新
  useEffect(() => {
    const tabParam = queryParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [location.search, activeTab, queryParams]);

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
  };

  // 表示ボタンのハンドラー
  const handleDisplayClick = () => {
    queryClient.invalidateQueries(['monthlyData', selectedYear, selectedMonth]);
    queryClient.invalidateQueries(['monthlyEmployees', selectedYear, selectedMonth]);
    queryClient.invalidateQueries(['yearlyData', selectedYear]);
    console.log(`${selectedYear}年${selectedMonth}月のデータを取得`);
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
      
      {/* サマリーボックス */}
      <div style={{ 
        backgroundColor: '#e9f2ff', 
        padding: '15px 20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        borderLeft: '4px solid #3a66d4'
      }}>
        <h2>{summaryData.year}年{summaryData.month}月集計サマリー</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '10px' }}>
          <span>常用労働者数: {summaryData.total_employees}名</span>
          <span>|</span>
          <span>障害者数: {summaryData.disabled_employees}名</span>
          <span>|</span>
          <span>実雇用率: {summaryData.actual_rate}%</span>
          <span>|</span>
          <span>法定雇用率: {summaryData.legal_rate}%</span>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #ddd', 
        marginBottom: '20px' 
      }}>
        {tabItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
            historyData={[]} // 履歴データの実装が必要
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
          <MonthlyTab 
            monthlyDetailData={monthlyDetailData}
            onDetailCellChange={handleDetailCellChange}
            summaryData={summaryData}
          />
        )}
      </div>
    </div>
  );
};

export default MonthlyReport;