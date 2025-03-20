import React, { useState } from 'react';

const PaymentReport: React.FC = () => {
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  const [activeTab, setActiveTab] = useState<string>('monthly');

  return (
    <div className="page-container">
      <h1 className="page-title">納付金申告</h1>
      
      <div className="period-selector">
        <span>対象年度</span>
        <select 
          value={fiscalYear}
          onChange={(e) => setFiscalYear(e.target.value)}
        >
          <option value="2024年度">2024年度</option>
          <option value="2023年度">2023年度</option>
        </select>
        <button>表示</button>
      </div>
      
      <div className="summary-box">
        <h2>障害者雇用納付金申告サマリー (2024年度)</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>ステータス</div>
            <div>申告不要 (法定雇用率達成)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>年間平均実雇用率</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>2.65%</div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>(法定雇用率2.3%)</div>
          </div>
        </div>
      </div>
      
      <div className="tab-navigation">
        <button 
          className={activeTab === 'monthly' ? 'active' : ''} 
          onClick={() => setActiveTab('monthly')}
        >
          月別データ
        </button>
        <button 
          className={activeTab === 'payment' ? 'active' : ''} 
          onClick={() => setActiveTab('payment')}
        >
          納付金情報
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => setActiveTab('history')}
        >
          申告履歴
        </button>
      </div>
      
      {activeTab === 'monthly' && (
        <table className="data-table">
          <thead>
            <tr>
              <th>対象月</th>
              <th>常用労働者数</th>
              <th>障害者雇用数</th>
              <th>実雇用率</th>
              <th>必要雇用数</th>
              <th>法定雇用率</th>
              <th>不足数</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2024年4月</td>
              <td>510</td>
              <td>13</td>
              <td>2.55%</td>
              <td>11.7</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>2024年5月</td>
              <td>515</td>
              <td>13</td>
              <td>2.52%</td>
              <td>11.8</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>2024年6月</td>
              <td>520</td>
              <td>14</td>
              <td>2.69%</td>
              <td>12</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>2024年7月</td>
              <td>523</td>
              <td>15</td>
              <td>2.87%</td>
              <td>12</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>年度平均</td>
              <td>517</td>
              <td>13.7</td>
              <td>2.65%</td>
              <td>11.9</td>
              <td>0</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      )}
      
      {activeTab === 'payment' && (
        <div>
          <p>納付金情報は表示されません。</p>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div>
          <p>申告履歴は表示されません。</p>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6c757d' }}>
        注意: 年度の平均実雇用率が法定雇用率を上回っていますので、納付金の申告は不要です。
      </div>
      
      <div className="action-buttons">
        <button className="secondary">申告書ダウンロード</button>
      </div>
    </div>
  );
};

export default PaymentReport;