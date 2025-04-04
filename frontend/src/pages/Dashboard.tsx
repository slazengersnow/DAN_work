// src/pages/Dashboard.tsx
import React, { useState } from 'react';

const Dashboard: React.FC = () => {
  const [year, setYear] = useState<string>('2024年度');
  
  // モックデータ
  const monthsLabels = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];
  const actualRates = [1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.35, 2.38, 2.39, 2.41, 2.41, 2.41];
  const legalRate = 2.5;
  const forecastRates = [2.43]; // 3ヶ月後のみ
  
  // グラフのサイズと余白
  const svgWidth = 600;
  const svgHeight = 240;
  const marginTop = 30; // 上部にラベルを表示するためマージンを増やす
  const marginRight = 20;
  const marginBottom = 40;
  const marginLeft = 40;
  
  // 描画エリアの計算
  const width = svgWidth - marginLeft - marginRight;
  const height = svgHeight - marginTop - marginBottom;
  
  // Y軸のスケール
  const yMin = 1.6; // グラフの最小値
  const yMax = 3.2; // グラフの最大値
  const yRange = yMax - yMin;
  
  // データポイントからSVG座標への変換関数
  const getX = (index: number, total: number) => {
    return marginLeft + (index * width) / (total - 1);
  };
  
  const getY = (value: number) => {
    return marginTop + height - ((value - yMin) / yRange) * height;
  };
  
  // 実雇用率の折れ線のpath
  const actualLine = actualRates.map((rate, i) => {
    return `${i === 0 ? 'M' : 'L'}${getX(i, actualRates.length)} ${getY(rate)}`;
  }).join(' ');
  
  // 法定雇用率の水平線の座標
  const legalY = getY(legalRate);
  
  // 予測データの折れ線のpath
  const forecastLine = `M${getX(actualRates.length - 1, actualRates.length)} ${getY(actualRates[actualRates.length - 1])} 
    L${getX(actualRates.length + 2, actualRates.length + 3)} ${getY(forecastRates[0])}`;
  
  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>ダッシュボード</h1>
        <select 
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="year-select"
        >
          <option value="2024年度">2024年度</option>
          <option value="2023年度">2023年度</option>
        </select>
      </div>
      
      {/* 対象期間 */}
      <div className="period-display">
        <span>対象期間: 2024年4月 ～ 2025年3月</span>
      </div>
      
      {/* 統計情報 */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stat-title">雇用率</div>
          <div className="stat-value blue">2.41%</div>
          <div className="stat-change positive">+0.11% 法定雇用率: 2.5%</div>
        </div>
        
        <div className="stats-card">
          <div className="stat-title">雇用人数</div>
          <div className="stat-value">12名</div>
          <div className="stat-note">実雇用率カウント: 15人</div>
        </div>
        
        <div className="stats-card">
          <div className="stat-title">不足数</div>
          <div className="stat-value red">-3名</div>
        </div>
      </div>
      
      {/* 雇用率推移と予測グラフ エリア */}
      <div className="chart-container">
        <div className="chart-title">雇用率推移と予測</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* 左側のボックス（グラフ用） - stats-gridと同様の白いボックス */}
          <div className="stats-card" style={{ flex: '1 1 75%', padding: '15px' }}>
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="line-chart">
              {/* グラフ上部のラベル */}
              <g>
                <rect x={marginLeft + 5} y={5} width={90} height={20} rx={3} fill="#e8f0ff" />
                <text x={marginLeft + 50} y={19} textAnchor="middle" fontSize="12" fill="#4285f4" fontWeight="600">
                  実雇用率
                </text>
              </g>
              <g>
                <rect x={marginLeft + 105} y={5} width={90} height={20} rx={3} fill="#fff7e6" />
                <text x={marginLeft + 150} y={19} textAnchor="middle" fontSize="12" fill="#fbbc05" fontWeight="600">
                  法定雇用率
                </text>
              </g>
              
              {/* Y軸のグリッドライン */}
              {[1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2].map((tick, i) => (
                <g key={`y-tick-${i}`}>
                  <line 
                    x1={marginLeft} 
                    y1={getY(tick)} 
                    x2={svgWidth - marginRight} 
                    y2={getY(tick)} 
                    stroke="#eee" 
                    strokeWidth="1"
                  />
                  <text 
                    x={marginLeft - 5} 
                    y={getY(tick)} 
                    textAnchor="end" 
                    dominantBaseline="middle" 
                    fontSize="11"
                    fill="#666"
                  >
                    {tick}%
                  </text>
                </g>
              ))}
              
              {/* X軸 */}
              <line 
                x1={marginLeft} 
                y1={marginTop + height} 
                x2={svgWidth - marginRight} 
                y2={marginTop + height} 
                stroke="#ddd" 
                strokeWidth="1"
              />
              
              {/* X軸のラベル */}
              {monthsLabels.map((month, i) => (
                <text 
                  key={`x-label-${i}`}
                  x={getX(i, monthsLabels.length)} 
                  y={svgHeight - 10} 
                  textAnchor="middle" 
                  fontSize="11"
                  fill="#666"
                >
                  {month}
                </text>
              ))}
              
              {/* 予測期間のラベル - 3ヶ月後のみ */}
              <text 
                x={getX(actualRates.length + 2, actualRates.length + 3)} 
                y={svgHeight - 10} 
                textAnchor="middle" 
                fontSize="11"
                fill="#34a853"
              >
                6月
              </text>
              
              {/* 法定雇用率ライン */}
              <line 
                x1={marginLeft} 
                y1={legalY} 
                x2={svgWidth - marginRight} 
                y2={legalY} 
                stroke="#fbbc05" 
                strokeWidth="2"
              />
              
              {/* 実雇用率の折れ線 */}
              <path 
                d={actualLine} 
                fill="none" 
                stroke="#4285f4" 
                strokeWidth="2"
              />
              
              {/* 実雇用率のデータポイント */}
              {actualRates.map((rate, i) => (
                <circle 
                  key={`point-${i}`}
                  cx={getX(i, actualRates.length)} 
                  cy={getY(rate)} 
                  r="3" 
                  fill="#4285f4"
                >
                  <title>{rate}%</title>
                </circle>
              ))}
              
              {/* 予測データの点線 - 3ヶ月後のみ */}
              <path 
                d={forecastLine} 
                fill="none" 
                stroke="#34a853" 
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              
              {/* 予測データのポイント - 3ヶ月後のみ */}
              <circle 
                cx={getX(actualRates.length + 2, actualRates.length + 3)} 
                cy={getY(forecastRates[0])} 
                r="3" 
                fill="#34a853"
              >
                <title>{forecastRates[0]}%</title>
              </circle>
            </svg>
            
            {/* 凡例 */}
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color dashed"></span>
                <span>予測データ</span>
              </div>
            </div>
          </div>
          
          {/* 右側のボックス（予測データ用） - stats-cardと同じスタイル、少し大きめ */}
          <div className="stats-card" style={{ flex: '0 0 25%', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div className="stat-title" style={{ textAlign: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '15px' }}>
              予測データ (3ヶ月後)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '15px' }}>
                3ヶ月後 (2025年6月):
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px', padding: '5px 0', borderBottom: '1px dashed #f0f0f0' }}>
                <span>雇用率:</span>
                <span style={{ fontWeight: '600' }}>2.43%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px', padding: '5px 0', borderBottom: '1px dashed #f0f0f0' }}>
                <span>障がい者数:</span>
                <span style={{ fontWeight: '600' }}>17名</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px', padding: '5px 0' }}>
                <span>不足数:</span>
                <span style={{ fontWeight: '600', color: '#ea4335' }}>-2名</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 年次データテーブル */}
      <div className="chart-container">
        <div className="chart-title">年次データ (2024年度)</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>項目</th>
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
                <th className="total-column">合計</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>従業員数 (人)</td>
                <td>600</td>
                <td>600</td>
                <td>610</td>
                <td>610</td>
                <td>615</td>
                <td>620</td>
                <td>625</td>
                <td>630</td>
                <td>630</td>
                <td>635</td>
                <td>635</td>
                <td>635</td>
                <td className="total-column">7,445</td>
              </tr>
              <tr>
                <td>フルタイム従業員数 (人)</td>
                <td>600</td>
                <td>600</td>
                <td>610</td>
                <td>610</td>
                <td>615</td>
                <td>620</td>
                <td>625</td>
                <td>630</td>
                <td>630</td>
                <td>635</td>
                <td>635</td>
                <td>635</td>
                <td className="total-column">7,445</td>
              </tr>
              <tr>
                <td>パートタイム従業員数 (人)</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td className="total-column">0</td>
              </tr>
              <tr>
                <td>トータル従業員数 (人)</td>
                <td>600</td>
                <td>600</td>
                <td>610</td>
                <td>610</td>
                <td>615</td>
                <td>620</td>
                <td>625</td>
                <td>630</td>
                <td>630</td>
                <td>635</td>
                <td>635</td>
                <td>635</td>
                <td className="total-column">7,445</td>
              </tr>
              <tr>
                <td>実雇用率 (%)</td>
                <td>1.8</td>
                <td>1.9</td>
                <td>2.0</td>
                <td>2.1</td>
                <td>2.2</td>
                <td>2.3</td>
                <td>2.35</td>
                <td>2.38</td>
                <td>2.39</td>
                <td>2.41</td>
                <td>2.41</td>
                <td>2.41</td>
                <td className="total-column highlight">2.22</td>
              </tr>
              <tr>
                <td>法定雇用率 (%)</td>
                <td>2.5</td>
                <td>2.5</td>
                <td>2.5</td>
                <td>2.5</td>
                <td>2.5</td>
                <td>2.5</td>
                <td>2.5</td>
                <td>2.5</td>
                <td>2.5</td>
                <td>2.5</td>
                <td>2.5</td>
                <td>2.5</td>
                <td className="total-column">2.5</td>
              </tr>
              <tr>
                <td>法定雇用者数 (人)</td>
                <td>15</td>
                <td>15</td>
                <td>15</td>
                <td>15</td>
                <td>15</td>
                <td>16</td>
                <td>16</td>
                <td>16</td>
                <td>16</td>
                <td>16</td>
                <td>16</td>
                <td>16</td>
                <td className="total-column">16</td>
              </tr>
              <tr>
                <td>不足数 (人)</td>
                <td className="negative">-11</td>
                <td className="negative">-11</td>
                <td className="negative">-10</td>
                <td className="negative">-10</td>
                <td className="negative">-9</td>
                <td className="negative">-10</td>
                <td className="negative">-9</td>
                <td className="negative">-8</td>
                <td className="negative">-8</td>
                <td className="negative">-8</td>
                <td className="negative">-8</td>
                <td className="negative">-8</td>
                <td className="negative total-column">-8</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="secondary">帳票出力</button>
          <button className="primary" style={{ marginLeft: '10px' }}>CSVエクスポート</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// CSSスタイル
const styles = `
.page-container {
  padding: 20px;
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.year-select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.period-display {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px 15px;
  margin-bottom: 20px;
  display: inline-block;
}

/* 統計カード */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stats-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 5px;
}

.stat-value.blue {
  color: #4285f4;
}

.stat-value.red {
  color: #ea4335;
}

.stat-change {
  font-size: 14px;
  margin-bottom: 5px;
}

.positive {
  color: #34a853;
}

.negative {
  color: #ea4335;
}

.stat-note {
  font-size: 14px;
  color: #666;
}

/* チャートコンテナ共通スタイル */
.chart-container {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.line-chart {
  background-color: #fff;
  display: block;
  width: 100%;
  max-width: 100%;
}

/* グラフ凡例 */
.chart-legend {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.legend-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 5px;
}

.legend-color.dashed {
  background-color: transparent;
  border-top: 2px dashed #34a853;
  height: 0;
  width: 20px;
}

/* 予測データ - 白い箱 */
.forecast-box {
  flex: 0 0 30%;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  height: 240px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
}

.forecast-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.forecast-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.forecast-date {
  font-size: 12px;
  font-weight: 600;
  margin: 0 0 15px 0;
}

.forecast-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 10px;
  padding: 5px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.forecast-item:last-child {
  border-bottom: none;
}

.forecast-value {
  font-weight: 600;
}

.forecast-value.negative {
  color: #ea4335;
}

/* データテーブル */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th, 
.data-table td {
  border: 1px solid #ddd;
  padding: 4px 6px;
  text-align: center;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
  font-size: 12px;
}

.data-table td:first-child {
  text-align: left;
  background-color: #f8f8f8;
  font-weight: 500;
  color: #333;
}

.total-column {
  background-color: #e8f0fe;
  font-weight: 600;
  color: #4285f4;
}

.highlight {
  font-weight: 700;
}

/* ボタン */
button {
  padding: 8px 15px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
}

button.secondary {
  background-color: #f1f3f4;
  color: #333;
  border: 1px solid #ddd;
}

button.primary {
  background-color: #4285f4;
  color: white;
}

/* モバイル対応 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
`;