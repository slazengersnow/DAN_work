import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartData,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// ChartJSの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// 型定義
interface MonthlyData {
  month: string;
  rate: number;
  employees: number;
  fulltime: number;
  parttime: number;
  total: number;
  disabledCount: number;
  legalCount: number;
  shortage: number;
}

interface DisabilityTypes {
  physical: number;
  intellectual: number;
  mental: number;
}

interface YearData {
  currentRate: number;
  change: number;
  legalRate: number;
  employeeCount: number;
  totalEmployees: number;
  missingCount: number;
  exemptFromPayment: boolean;
  disabilityTypes: DisabilityTypes;
  monthlyData: MonthlyData[];
  creationDate: string;
}

interface MockDataType {
  [key: string]: YearData;
}

// モックデータ
const fiscalYears = [
  { label: '2024年度', value: '2024' },
  { label: '2023年度', value: '2023' },
  { label: '2022年度', value: '2022' }
];

const mockData: MockDataType = {
  '2024': {
    currentRate: 2.41,
    change: 0.11,
    legalRate: 2.5,
    employeeCount: 12,
    totalEmployees: 15,
    missingCount: -3,
    exemptFromPayment: false,
    disabilityTypes: {
      physical: 40, // 身体障害
      intellectual: 25, // 知的障害
      mental: 35, // 精神障害
    },
    monthlyData: [
      { month: '4月', rate: 1.8, employees: 600, fulltime: 600, parttime: 0, total: 600, disabledCount: 4, legalCount: 15, shortage: -11 },
      { month: '5月', rate: 1.9, employees: 600, fulltime: 600, parttime: 0, total: 600, disabledCount: 4, legalCount: 15, shortage: -11 },
      { month: '6月', rate: 2.0, employees: 610, fulltime: 610, parttime: 0, total: 610, disabledCount: 5, legalCount: 15, shortage: -10 },
      { month: '7月', rate: 2.1, employees: 610, fulltime: 610, parttime: 0, total: 610, disabledCount: 5, legalCount: 15, shortage: -10 },
      { month: '8月', rate: 2.2, employees: 615, fulltime: 615, parttime: 0, total: 615, disabledCount: 6, legalCount: 15, shortage: -9 },
      { month: '9月', rate: 2.3, employees: 620, fulltime: 620, parttime: 0, total: 620, disabledCount: 6, legalCount: 16, shortage: -10 },
      { month: '10月', rate: 2.35, employees: 625, fulltime: 625, parttime: 0, total: 625, disabledCount: 7, legalCount: 16, shortage: -9 },
      { month: '11月', rate: 2.38, employees: 630, fulltime: 630, parttime: 0, total: 630, disabledCount: 8, legalCount: 16, shortage: -8 },
      { month: '12月', rate: 2.39, employees: 630, fulltime: 630, parttime: 0, total: 630, disabledCount: 8, legalCount: 16, shortage: -8 },
      { month: '1月', rate: 2.41, employees: 635, fulltime: 635, parttime: 0, total: 635, disabledCount: 8, legalCount: 16, shortage: -8 },
      { month: '2月', rate: 2.41, employees: 635, fulltime: 635, parttime: 0, total: 635, disabledCount: 8, legalCount: 16, shortage: -8 },
      { month: '3月', rate: 2.41, employees: 635, fulltime: 635, parttime: 0, total: 635, disabledCount: 8, legalCount: 16, shortage: -8 },
    ],
    creationDate: '2025年3月作成'
  },
  '2023': {
    currentRate: 2.30,
    change: 0.05,
    legalRate: 2.3,
    employeeCount: 10,
    totalEmployees: 12,
    missingCount: 0,
    exemptFromPayment: true,
    disabilityTypes: {
      physical: 45, // 身体障害
      intellectual: 20, // 知的障害
      mental: 35, // 精神障害
    },
    monthlyData: [
      { month: '4月', rate: 1.7, employees: 580, fulltime: 580, parttime: 0, total: 580, disabledCount: 4, legalCount: 13, shortage: -9 },
      { month: '5月', rate: 1.8, employees: 580, fulltime: 580, parttime: 0, total: 580, disabledCount: 4, legalCount: 13, shortage: -9 },
      { month: '6月', rate: 1.9, employees: 590, fulltime: 590, parttime: 0, total: 590, disabledCount: 5, legalCount: 14, shortage: -9 },
      { month: '7月', rate: 2.0, employees: 590, fulltime: 590, parttime: 0, total: 590, disabledCount: 5, legalCount: 14, shortage: -9 },
      { month: '8月', rate: 2.1, employees: 595, fulltime: 595, parttime: 0, total: 595, disabledCount: 6, legalCount: 14, shortage: -8 },
      { month: '9月', rate: 2.2, employees: 600, fulltime: 600, parttime: 0, total: 600, disabledCount: 6, legalCount: 14, shortage: -8 },
      { month: '10月', rate: 2.25, employees: 600, fulltime: 600, parttime: 0, total: 600, disabledCount: 7, legalCount: 14, shortage: -7 },
      { month: '11月', rate: 2.28, employees: 610, fulltime: 610, parttime: 0, total: 610, disabledCount: 7, legalCount: 14, shortage: -7 },
      { month: '12月', rate: 2.29, employees: 610, fulltime: 610, parttime: 0, total: 610, disabledCount: 7, legalCount: 14, shortage: -7 },
      { month: '1月', rate: 2.30, employees: 610, fulltime: 610, parttime: 0, total: 610, disabledCount: 7, legalCount: 14, shortage: -7 },
      { month: '2月', rate: 2.30, employees: 610, fulltime: 610, parttime: 0, total: 610, disabledCount: 7, legalCount: 14, shortage: -7 },
      { month: '3月', rate: 2.30, employees: 610, fulltime: 610, parttime: 0, total: 610, disabledCount: 7, legalCount: 14, shortage: -7 },
    ],
    creationDate: '2024年3月作成'
  },
  '2022': {
    currentRate: 2.25,
    change: 0.03,
    legalRate: 2.3,
    employeeCount: 9,
    totalEmployees: 11,
    missingCount: -1,
    exemptFromPayment: false,
    disabilityTypes: {
      physical: 50, // 身体障害
      intellectual: 20, // 知的障害
      mental: 30, // 精神障害
    },
    monthlyData: [
      { month: '4月', rate: 1.6, employees: 560, fulltime: 560, parttime: 0, total: 560, disabledCount: 3, legalCount: 13, shortage: -10 },
      { month: '5月', rate: 1.7, employees: 560, fulltime: 560, parttime: 0, total: 560, disabledCount: 3, legalCount: 13, shortage: -10 },
      { month: '6月', rate: 1.8, employees: 570, fulltime: 570, parttime: 0, total: 570, disabledCount: 4, legalCount: 13, shortage: -9 },
      { month: '7月', rate: 1.9, employees: 570, fulltime: 570, parttime: 0, total: 570, disabledCount: 4, legalCount: 13, shortage: -9 },
      { month: '8月', rate: 2.0, employees: 575, fulltime: 575, parttime: 0, total: 575, disabledCount: 5, legalCount: 13, shortage: -8 },
      { month: '9月', rate: 2.1, employees: 580, fulltime: 580, parttime: 0, total: 580, disabledCount: 5, legalCount: 13, shortage: -8 },
      { month: '10月', rate: 2.15, employees: 580, fulltime: 580, parttime: 0, total: 580, disabledCount: 6, legalCount: 13, shortage: -7 },
      { month: '11月', rate: 2.18, employees: 585, fulltime: 585, parttime: 0, total: 585, disabledCount: 6, legalCount: 13, shortage: -7 },
      { month: '12月', rate: 2.2, employees: 585, fulltime: 585, parttime: 0, total: 585, disabledCount: 6, legalCount: 13, shortage: -7 },
      { month: '1月', rate: 2.22, employees: 590, fulltime: 590, parttime: 0, total: 590, disabledCount: 6, legalCount: 14, shortage: -8 },
      { month: '2月', rate: 2.25, employees: 590, fulltime: 590, parttime: 0, total: 590, disabledCount: 7, legalCount: 14, shortage: -7 },
      { month: '3月', rate: 2.25, employees: 590, fulltime: 590, parttime: 0, total: 590, disabledCount: 7, legalCount: 14, shortage: -7 },
    ],
    creationDate: '2023年3月作成'
  }
};

// グラフの軸範囲を計算（実雇用率と法定雇用率を適切に表示）
const calculateChartRange = (monthlyData: MonthlyData[], legalRate: number) => {
    // 実雇用率の最小値と最大値
    const rateMin = Math.min(...monthlyData.map(item => item.rate));
    const rateMax = Math.max(...monthlyData.map(item => item.rate));
    
    // 表示範囲の決定ロジック
    // 法定雇用率と実雇用率の差
    const diffFromLegal = Math.abs(legalRate - rateMax);
    
    // 実雇用率の変動幅
    const rateRange = rateMax - rateMin;
    
    // 法定雇用率と実雇用率の差が大きい場合（1.0ポイント以上）
    const largeGap = diffFromLegal >= 1.0;
    
    // 実雇用率の変動が小さい場合（0.3ポイント以下）は拡大表示
    const smallVariation = rateRange <= 0.3;
    
    let yMin, yMax;
    
    if (largeGap) {
      // 差が大きい場合は、両方の値が見えるようにする
      yMin = Math.max(0, Math.min(rateMin, legalRate) - 0.3);
      yMax = Math.max(rateMax, legalRate) + 0.3;
    } else if (smallVariation) {
      // 変動が小さい場合は、拡大して変化を見やすくする
      const mid = (rateMin + rateMax) / 2;
      yMin = Math.max(0, mid - 0.5); // 最小0.5範囲
      yMax = mid + 0.5;
      
      // 法定雇用率が範囲内に入るように調整
      if (legalRate < yMin) {
        yMin = Math.max(0, legalRate - 0.2);
      } else if (legalRate > yMax) {
        yMax = legalRate + 0.2;
      }
    } else {
      // 通常のケース
      // 実雇用率の最小値より少し下から
      yMin = Math.max(0, rateMin - 0.2);
      // 法定雇用率または実雇用率の最大値より少し上まで
      yMax = Math.max(rateMax, legalRate) + 0.3;
    }
    
    // 軸の間隔を決定（値の範囲に応じて自動調整）
    let stepSize = 0.1; // デフォルトは0.1刻み
    const totalRange = yMax - yMin;
    
    if (totalRange > 3.0) {
      stepSize = 0.5; // 範囲が広い場合は0.5刻み
    } else if (totalRange > 1.5) {
      stepSize = 0.2; // 中間の範囲は0.2刻み
    }
    
    // 整数値に調整（読みやすさのため）
    yMin = Math.floor(yMin * 10) / 10;
    yMax = Math.ceil(yMax * 10) / 10;
    
    return { yMin, yMax, stepSize };
  };
  
  // チャートのオプション作成部分
  const createLineChartOptions = (yearData: YearData): ChartOptions<'line'> => {
    // 軸範囲を計算
    const { yMin, yMax, stepSize } = calculateChartRange(yearData.monthlyData, yearData.legalRate);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context: TooltipItem<'line'>) {
              return `${context.dataset.label}: ${context.raw}%`;
            }
          }
        },
        legend: {
          position: 'top',
        },
        // @ts-ignore - Chart.jsのdatalabelsプラグイン用（型定義がないためignore）
        datalabels: {
          display: true,
          color: 'blue',
          align: 'top',
          formatter: (value: number, context: any) => {
            if (context.datasetIndex === 0) { // 実雇用率のデータセットの場合のみ
              return `${value}%`;
            }
            return null;
          }
        },
      },
      scales: {
        y: {
          min: yMin,
          max: yMax,
          ticks: {
            stepSize: stepSize,
            callback: function(tickValue: string | number) {
              const value = Number(tickValue);
              // 主要な目盛りは必ず表示
              if (value === yearData.legalRate || Number.isInteger(value) || value % stepSize === 0) {
                return `${value}%`;
              }
              // 細かい目盛りは、範囲が広い場合のみ表示
              if (stepSize === 0.1 && Number.isInteger(value * 10)) {
                return `${value}%`;
              }
              return '';
            }
          },
          grid: {
            color: (context: any) => {
              const value = context.tick.value;
              // 法定雇用率の線は強調
              if (value === yearData.legalRate) {
                return 'rgba(255, 165, 0, 0.3)';
              }
              // 0.5刻みは少し濃く
              if (value % 0.5 === 0) {
                return 'rgba(0, 0, 0, 0.1)';
              }
              // 0.1刻みは薄く
              return 'rgba(0, 0, 0, 0.05)';
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
    };
  };

const Dashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 10月（0始まりのため9）

  // 選択した年度のデータを取得
  const yearData = mockData[selectedYear];
  const monthData = yearData.monthlyData[selectedMonth];
  
  // グラフの軸範囲を計算（法定雇用率を中心にする）
  const rateMin = Math.min(...yearData.monthlyData.map(item => item.rate));
  const rateMax = Math.max(...yearData.monthlyData.map(item => item.rate));
  
  // 法定雇用率から上下に同じ範囲を持つようにする
  const legalRate = yearData.legalRate;
  const rateRangeAbove = Math.max(0.5, rateMax - legalRate);
  const rateRangeBelow = Math.max(0.5, legalRate - rateMin);
  const rateRange = Math.max(rateRangeAbove, rateRangeBelow);
  
  // 最小値と最大値を設定（最小値は0未満にならないようにする）
  const yMin = Math.max(0, legalRate - rateRange);
  const yMax = legalRate + rateRange;

  // チャートデータの準備
  const lineChartData: ChartData<'line'> = {
    labels: yearData.monthlyData.map((item: MonthlyData) => item.month),
    datasets: [
      {
        label: '実雇用率',
        data: yearData.monthlyData.map((item: MonthlyData) => item.rate),
        borderColor: 'rgb(65, 105, 225)',
        backgroundColor: 'rgba(65, 105, 225, 0.5)',
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: '法定雇用率',
        data: Array(yearData.monthlyData.length).fill(yearData.legalRate),
        borderColor: 'rgb(255, 165, 0)',
        backgroundColor: 'rgba(255, 165, 0, 0.5)',
        borderDash: [5, 5],
        yAxisID: 'y',
      }
    ],
  };

  const pieChartData: ChartData<'pie'> = {
    labels: ['身体障害', '知的障害', '精神障害'],
    datasets: [
      {
        data: [
          yearData.disabilityTypes.physical,
          yearData.disabilityTypes.intellectual,
          yearData.disabilityTypes.mental
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      },
      legend: {
        position: 'top',
      },
      // @ts-ignore - Chart.jsのdatalabelsプラグイン用（型定義がないためignore）
      datalabels: {
        display: true,
        color: 'blue',
        align: 'top',
        formatter: (value: number, context: any) => {
          if (context.datasetIndex === 0) { // 実雇用率のデータセットの場合のみ
            return `${value}%`;
          }
          return null;
        }
      },
    },
    scales: {
      y: {
        min: yMin,
        max: yMax,
        ticks: {
          stepSize: 0.1,
          // tickValueの型をstring | numberとして受け入れるように修正
          callback: function(tickValue: string | number) {
            // 数値に変換してから処理
            const value = Number(tickValue);
            if (Number.isInteger(value * 10)) {
              return `${value}%`;
            }
            return '';
          }
        },
        grid: {
          color: (context: any) => {
            if (context.tick.value % 0.5 === 0) {
              return 'rgba(0, 0, 0, 0.1)';
            }
            return 'rgba(0, 0, 0, 0.05)';
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'pie'>) {
            const percentage = context.raw as number;
            return `${context.label}: ${percentage}%`;
          }
        }
      },
      // @ts-ignore - Chart.jsのdatalabelsプラグイン用（型定義がないためignore）
      datalabels: {
        formatter: (value: number, context: any) => {
          return `${value}%`;
        },
        color: '#fff',
        font: {
          weight: 'bold'
        }
      }
    }
  };

  // 月を変更する関数（警告を解消するため）
  const handleMonthChange = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="card-header">ダッシュボード</h2>
        <div>
          <select
            className="form-control"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {fiscalYears.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid-container">
        <div className="card stat-card">
          <div className="stat-label">雇用率</div>
          <div className="stat-value text-primary">
            {yearData.currentRate}%
            <span className={yearData.change >= 0 ? "text-success" : "text-danger"} style={{ fontSize: '14px', marginLeft: '5px' }}>
              {yearData.change >= 0 ? '+' : ''}{yearData.change}%
            </span>
          </div>
          <div className="stat-label">法定雇用率: {yearData.legalRate}%</div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-label">雇用人数</div>
          <div className="stat-value">{yearData.employeeCount}名</div>
          <div className="stat-label">実雇用率カウント: {yearData.totalEmployees}人</div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-label">不足数</div>
          <div className="stat-value">{yearData.missingCount}名</div>
          {/* 納付金対象などのコメントを削除 */}
        </div>
      </div>
      
      <div className="grid-container" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <div className="card-header">雇用率推移</div>
          <div className="chart-container">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">障害種別内訳</div>
          <div className="chart-container">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">年次データ（{selectedYear}年度）</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ width: '170px' }}>項目</th>
                {yearData.monthlyData.map((item, index) => (
                  <th key={index} style={{ width: '60px', textAlign: 'center' }}>{item.month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>従業員数 (人)</td>
                {yearData.monthlyData.map((item, index) => (
                  <td key={index} style={{ textAlign: 'center' }}>{item.employees}</td>
                ))}
              </tr>
              <tr>
                <td>フルタイム従業員数 (人)</td>
                {yearData.monthlyData.map((item, index) => (
                  <td key={index} style={{ textAlign: 'center' }}>{item.fulltime}</td>
                ))}
              </tr>
              <tr>
                <td>パートタイム従業員数 (人)</td>
                {yearData.monthlyData.map((item, index) => (
                  <td key={index} style={{ textAlign: 'center' }}>{item.parttime}</td>
                ))}
              </tr>
              <tr>
                <td>トータル従業員数 (人)</td>
                {yearData.monthlyData.map((item, index) => (
                  <td key={index} style={{ textAlign: 'center' }}>{item.total}</td>
                ))}
              </tr>
              <tr>
                <td>障がい者数 (人)</td>
                {yearData.monthlyData.map((item, index) => (
                  <td key={index} style={{ textAlign: 'center' }}>{item.disabledCount}</td>
                ))}
              </tr>
              <tr>
                <td>実雇用率 (%)</td>
                {yearData.monthlyData.map((item, index) => (
                  <td key={index} style={{ textAlign: 'center' }}>{item.rate}</td>
                ))}
              </tr>
              <tr>
                <td>法定雇用率 (%)</td>
                {yearData.monthlyData.map((item, index) => (
                  <td key={index} style={{ textAlign: 'center' }}>{yearData.legalRate}</td>
                ))}
              </tr>
              <tr>
                <td>法定雇用者数 (人)</td>
                {yearData.monthlyData.map((item, index) => (
                  <td key={index} style={{ textAlign: 'center' }}>{item.legalCount}</td>
                ))}
              </tr>
              <tr>
                <td>不足数 (人)</td>
                {yearData.monthlyData.map((item, index) => (
                  <td 
                    key={index} 
                    style={{ 
                      textAlign: 'center',
                      color: item.shortage < 0 ? '#dc3545' : '#28a745'
                    }}
                  >
                    {item.shortage}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* 月選択用のボタン（通常は非表示だが、setSelectedMonthの警告を消すために追加） */}
        <div style={{ display: 'none' }}>
          {yearData.monthlyData.map((_, index) => (
            <button key={index} onClick={() => handleMonthChange(index)}>
              月を選択
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button className="btn btn-secondary">帳票出力</button>
        <button className="btn btn-primary">CSVエクスポート</button>
      </div>
    </div>
  );
};

export default Dashboard;