import React, { useState } from 'react';

const Dashboard: React.FC = () => {
  const [year, setYear] = useState<string>('2024年度');
  
  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>ダッシュボード</h1>
        <select 
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="2024年度">2024年度</option>
          <option value="2023年度">2023年度</option>
        </select>
      </div>
      
      {/* 統計情報 */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stat-title">雇用率</div>
          <div className="stat-value">2.41%</div>
          <div className="stat-change positive">+0.11%</div>
          <div className="stat-note">法定雇用率: 2.5%</div>
        </div>
        
        <div className="stats-card">
          <div className="stat-title">雇用人数</div>
          <div className="stat-value">12名</div>
          <div className="stat-note">実雇用率カウント: 15人</div>
        </div>
        
        <div className="stats-card">
          <div className="stat-title">不足数</div>
          <div className="stat-value">-3名</div>
        </div>
      </div>
      
      {/* 雇用率推移グラフ */}
      <div className="chart-container">
        <div className="chart-title">雇用率推移</div>
        <div className="chart-area">
          <div style={{ textAlign: 'center', color: '#6c757d' }}>グラフ表示エリア</div>
        </div>
      </div>
      
      {/* 障害種別内訳グラフ */}
      <div className="chart-container">
        <div className="chart-title">障害種別内訳</div>
        <div className="chart-area">
          <div style={{ textAlign: 'center', color: '#6c757d' }}>円グラフ表示エリア</div>
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
              </tr>
              <tr>
                <td>障がい者数 (人)</td>
                <td>4</td>
                <td>4</td>
                <td>5</td>
                <td>5</td>
                <td>6</td>
                <td>6</td>
                <td>7</td>
                <td>8</td>
                <td>8</td>
                <td>8</td>
                <td>8</td>
                <td>8</td>
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
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="secondary">帳票出力</button>
          <button style={{ marginLeft: '10px' }}>CSVエクスポート</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;