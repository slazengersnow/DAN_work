import React, { useState } from 'react';

// モックデータ
const mockSummary = {
  status: '申告不要（法定雇用率達成）',
  actualRate: 2.65,
  legalRate: 2.3,
};

const mockMonthlyData = [
  { month: '2024年4月', totalEmployees: 510, disabledEmployees: 13.0, actualRate: 2.55, legalDisabledEmployees: 11.7, missingCount: 0.0 },
  { month: '2024年5月', totalEmployees: 515, disabledEmployees: 13.0, actualRate: 2.52, legalDisabledEmployees: 11.8, missingCount: 0.0 },
  { month: '2024年6月', totalEmployees: 520, disabledEmployees: 14.0, actualRate: 2.69, legalDisabledEmployees: 12.0, missingCount: 0.0 },
  { month: '2024年7月', totalEmployees: 523, disabledEmployees: 15.0, actualRate: 2.87, legalDisabledEmployees: 12.0, missingCount: 0.0 },
];

const yearlyAverage = {
  totalEmployees: 517,
  disabledEmployees: 13.7,
  actualRate: 2.65,
  legalDisabledEmployees: 11.9,
  missingCount: 0.0,
};

const PaymentReport: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<string>('2024年度');

  return (
    <div>
      <h2 className="card-header">納付金申告</h2>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label>対象年度</label>
          <select 
            className="form-control" 
            style={{ width: '150px' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2024年度">2024年度</option>
            <option value="2023年度">2023年度</option>
            <option value="2022年度">2022年度</option>
          </select>
          
          <button className="btn btn-primary">表示</button>
          
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }}>申告書ダウンロード</button>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>障害者雇用納付金申告サマリー（2024年度）</h3>
        
        <div style={{ backgroundColor: '#f0f9eb', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>ステータス</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>年間平均実雇用率</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{mockSummary.status}</div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#4169e1' }}>{mockSummary.actualRate}%</span>
              <span style={{ color: '#28a745', marginLeft: '10px' }}>（法定雇用率{mockSummary.legalRate}%）</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', marginBottom: '15px' }}>
          <div 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f0f7ff', 
              borderRadius: '5px 5px 0 0', 
              borderBottom: '2px solid #4169e1',
              cursor: 'pointer',
            }}
          >
            月別データ
          </div>
          <div
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            納付金情報
          </div>
          <div
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            申告履歴
          </div>
        </div>
        
        <table className="table">
          <thead>
            <tr>
              <th>対象月</th>
              <th>常用労働者数</th>
              <th>障害者雇用数</th>
              <th>実雇用率</th>
              <th>法定雇用障害者数</th>
              <th>不足数</th>
            </tr>
          </thead>
          <tbody>
            {mockMonthlyData.map((data, index) => (
              <tr key={index}>
                <td>{data.month}</td>
                <td>{data.totalEmployees}</td>
                <td>{data.disabledEmployees}</td>
                <td>{data.actualRate}%</td>
                <td>{data.legalDisabledEmployees}</td>
                <td>{data.missingCount}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
              <td>年度平均</td>
              <td>{yearlyAverage.totalEmployees}</td>
              <td>{yearlyAverage.disabledEmployees}</td>
              <td style={{ color: '#4169e1' }}>{yearlyAverage.actualRate}%</td>
              <td>{yearlyAverage.legalDisabledEmployees}</td>
              <td style={{ color: '#28a745' }}>{yearlyAverage.missingCount}</td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>
          注意: 年度の平均実雇用率が法定雇用率を上回っていますので、納付金の申告は不要です。
        </div>
      </div>
    </div>
  );
};

export default PaymentReport;