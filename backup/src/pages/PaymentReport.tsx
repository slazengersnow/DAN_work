import React, { useState, useMemo } from 'react';

const PaymentReport: React.FC = () => {
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  const [activeTab, setActiveTab] = useState<string>('history'); // 初期値を「申告履歴」に設定
  
  // 法定雇用率
  const LEGAL_EMPLOYMENT_RATE = 2.3; // 2.3%
  
  // 申告履歴データ
  const historyData = [
    { 
      id: 1,
      year: '2024年度', 
      type: '調整金', 
      amount: 533412, 
      applicationDate: '2025/05/14', 
      paymentDate: '2025/07/16', 
      status: '受取済' 
    },
    { 
      id: 2,
      year: '2023年度', 
      type: '調整金', 
      amount: 487200, 
      applicationDate: '2024/05/15', 
      paymentDate: '2024/07/22', 
      status: '受取済' 
    },
    { 
      id: 3,
      year: '2022年度', 
      type: '納付金', 
      amount: -240000, 
      applicationDate: '2023/05/12', 
      paymentDate: '2023/06/30', 
      status: '支払済' 
    },
    { 
      id: 4,
      year: '2021年度', 
      type: '納付金', 
      amount: -600000, 
      applicationDate: '2022/05/16', 
      paymentDate: '2022/07/05', 
      status: '支払済' 
    },
    { 
      id: 5,
      year: '2020年度', 
      type: '納付金', 
      amount: -840000, 
      applicationDate: '2021/05/14', 
      paymentDate: '2021/07/12', 
      status: '支払済' 
    }
  ];

  // 月別データ
  const monthlyData = [
    { month: '4月', employees: 510, disabledEmployees: 13 },
    { month: '5月', employees: 515, disabledEmployees: 13 },
    { month: '6月', employees: 520, disabledEmployees: 14 },
    { month: '7月', employees: 523, disabledEmployees: 15 },
    { month: '8月', employees: 525, disabledEmployees: 15 },
    { month: '9月', employees: 530, disabledEmployees: 15 },
    { month: '10月', employees: 528, disabledEmployees: 14 },
    { month: '11月', employees: 527, disabledEmployees: 14 },
    { month: '12月', employees: 520, disabledEmployees: 13 },
    { month: '1月', employees: 515, disabledEmployees: 13 },
    { month: '2月', employees: 510, disabledEmployees: 12 },
    { month: '3月', employees: 505, disabledEmployees: 12 }
  ];
  
  // 月別のデータを計算
  const calculatedData = useMemo(() => {
    return monthlyData.map(item => {
      // 実雇用率 = 障害者雇用数 / 常用労働者数 * 100
      const employmentRate = (item.disabledEmployees / item.employees) * 100;
      
      // 必要雇用数 = 常用労働者数 * 法定雇用率 / 100
      const requiredEmployees = (item.employees * LEGAL_EMPLOYMENT_RATE) / 100;
      
      // 超過・未達 = 障害者雇用数 - 必要雇用数
      const difference = item.disabledEmployees - requiredEmployees;
      
      // 調整金・納付金（仮の計算、実際の計算式はもっと複雑）
      // 1人あたり月額27,000円として計算
      const payment = difference >= 0 
        ? difference * 27000  // 調整金（プラス）
        : difference * 50000; // 納付金（マイナス）
      
      return {
        ...item,
        employmentRate,
        legalRate: LEGAL_EMPLOYMENT_RATE,
        requiredEmployees,
        difference,
        payment
      };
    });
  }, [monthlyData]);
  
  // 合計値を計算
  const totals = useMemo(() => {
    const totalEmployees = monthlyData.reduce((sum, item) => sum + item.employees, 0);
    const totalDisabled = monthlyData.reduce((sum, item) => sum + item.disabledEmployees, 0);
    const avgEmployees = totalEmployees / monthlyData.length;
    const avgDisabled = totalDisabled / monthlyData.length;
    
    // 年間平均の実雇用率
    const avgEmploymentRate = (avgDisabled / avgEmployees) * 100;
    
    // 年間平均の必要雇用数
    const avgRequiredEmployees = (avgEmployees * LEGAL_EMPLOYMENT_RATE) / 100;
    
    // 超過・未達
    const avgDifference = avgDisabled - avgRequiredEmployees;
    
    // 年間の調整金・納付金
    const totalPayment = calculatedData.reduce((sum, item) => sum + item.payment, 0);
    
    return {
      avgEmployees,
      avgDisabled,
      avgEmploymentRate,
      legalRate: LEGAL_EMPLOYMENT_RATE,
      avgRequiredEmployees,
      avgDifference,
      totalPayment
    };
  }, [calculatedData, monthlyData]);
  
  // 金額の表示フォーマット（単位なし）
  const formatNumber = (num: number, decimals = 0) => {
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // 調整金・納付金の表示色
  const getPaymentColor = (amount: number) => {
    return amount >= 0 ? '#28a745' : '#dc3545';
  };

  // 申告履歴のページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  return (
    <div className="page-container">
      <h1 className="page-title">納付金申告</h1>
      
      <div className="period-selector">
        <span>対象年度</span>
        <select 
          value={fiscalYear}
          onChange={(e) => setFiscalYear(e.target.value)}
          className="year-select"
        >
          <option value="2024年度">2024年度</option>
          <option value="2023年度">2023年度</option>
        </select>
        <button className="display-button">表示</button>
      </div>
      
      <div className="summary-box">
        <h2>障害者雇用納付金申告サマリー (2024年度)</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>ステータス</div>
            <div>対象期間 2024年4月～2025年3月</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              調整金額
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#28a745'
            }}>
              533,412円
            </div>
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
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1200px' }}>
            <thead>
              <tr>
                <th>項目</th>
                {monthlyData.map((item, index) => (
                  <th key={index}>{item.month}</th>
                ))}
                <th>年間平均</th>
              </tr>
            </thead>
            <tbody>
              {/* 常用労働者数 */}
              <tr>
                <td>常用労働者数(人)</td>
                {calculatedData.map((item, index) => (
                  <td key={index}>{formatNumber(item.employees)}</td>
                ))}
                <td><strong>{formatNumber(totals.avgEmployees, 1)}</strong></td>
              </tr>
              
              {/* 障害者雇用数 */}
              <tr>
                <td>障害者雇用数(人)</td>
                {calculatedData.map((item, index) => (
                  <td key={index}>{formatNumber(item.disabledEmployees)}</td>
                ))}
                <td><strong>{formatNumber(totals.avgDisabled, 1)}</strong></td>
              </tr>
              
              {/* 実雇用率 */}
              <tr>
                <td>実雇用率(%)</td>
                {calculatedData.map((item, index) => (
                  <td key={index}>{formatNumber(item.employmentRate, 2)}</td>
                ))}
                <td><strong>{formatNumber(totals.avgEmploymentRate, 2)}</strong></td>
              </tr>
              
              {/* 法定雇用率 */}
              <tr>
                <td>法定雇用率(%)</td>
                {calculatedData.map((item, index) => (
                  <td key={index}>{LEGAL_EMPLOYMENT_RATE.toFixed(1)}</td>
                ))}
                <td><strong>{LEGAL_EMPLOYMENT_RATE.toFixed(1)}</strong></td>
              </tr>
              
              {/* 必要雇用数 */}
              <tr>
                <td>必要雇用数(人)</td>
                {calculatedData.map((item, index) => (
                  <td key={index}>{formatNumber(item.requiredEmployees, 1)}</td>
                ))}
                <td><strong>{formatNumber(totals.avgRequiredEmployees, 1)}</strong></td>
              </tr>
              
              {/* 超過・未達 */}
              <tr>
                <td>超過・未達(人)</td>
                {calculatedData.map((item, index) => (
                  <td key={index}>{item.difference >= 0 ? '+' : ''}{formatNumber(item.difference, 1)}</td>
                ))}
                <td><strong>{totals.avgDifference >= 0 ? '+' : ''}{formatNumber(totals.avgDifference, 1)}</strong></td>
              </tr>
              
              {/* 調整金・納付金 */}
              <tr>
                <td>調整金・納付金(円)</td>
                {calculatedData.map((item, index) => (
                  <td key={index} style={{ color: getPaymentColor(item.payment) }}>
                    {item.payment < 0 ? '-' : ''}{formatNumber(Math.abs(item.payment))}
                  </td>
                ))}
                <td style={{ color: getPaymentColor(totals.totalPayment) }}>
                  <strong>
                    {totals.totalPayment < 0 ? '-' : ''}{formatNumber(Math.abs(totals.totalPayment))}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {activeTab === 'payment' && (
        <div>
          <p>納付金情報は表示されません。</p>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="history-container">
          <h3 className="history-title">障害者雇用納付金・調整金申告履歴</h3>
          <div className="table-responsive">
            <table className="history-table">
              <thead>
                <tr>
                  <th>年度</th>
                  <th>種別</th>
                  <th>金額</th>
                  <th>申告日</th>
                  <th>支払/受取日</th>
                  <th>状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.year}</td>
                    <td>{item.type}</td>
                    <td style={{ 
                      color: getPaymentColor(item.amount),
                      textAlign: 'right'
                    }}>
                      {item.amount < 0 ? '-' : ''}{formatNumber(Math.abs(item.amount))}円
                    </td>
                    <td>{item.applicationDate}</td>
                    <td>{item.paymentDate}</td>
                    <td>
                      <span className={`status-badge ${item.status === '受取済' ? 'received' : 'paid'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button className="detail-btn">詳細</button>
                      <button className="document-btn">申告書表示</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="pagination">
            <button 
              className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(1)}
            >
              1
            </button>
            <button 
              className={`pagination-btn ${currentPage === 2 ? 'active' : ''}`}
              onClick={() => setCurrentPage(2)}
            >
              2
            </button>
            <button className="pagination-btn">...</button>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6c757d' }}>
        注意: このデータは毎月の障害者雇用状況に基づいて計算されています。年度末の確定値と異なる場合があります。
      </div>
    </div>
  );
};

export default PaymentReport;

// スタイル例
const styles = `
.page-container {
  padding: 20px;
  background-color: #f8f9fa;
}

.page-title {
  margin-bottom: 20px;
}

.period-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.year-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.display-button {
  padding: 8px 15px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.summary-box {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.tab-navigation {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #dee2e6;
}

.tab-navigation button {
  padding: 10px 15px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.tab-navigation button.active {
  border-bottom: 2px solid #4285f4;
  color: #4285f4;
  font-weight: bold;
}

.history-title {
  margin-bottom: 15px;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.history-table th, 
.history-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.history-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.received {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.paid {
  background-color: #d4edda;
  color: #155724;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.detail-btn, 
.document-btn {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: #f8f9fa;
  cursor: pointer;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 5px;
}

.pagination-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: #f8f9fa;
  cursor: pointer;
}

.pagination-btn.active {
  background-color: #4285f4;
  color: white;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #ffffff;
}

.data-table th,
.data-table td {
  padding: 8px 10px;
  text-align: center;
  border: 1px solid #dee2e6;
}

.data-table th {
  background-color: #f8f9fa;
}

.data-table tr:nth-child(even) {
  background-color: #f8f9fa;
}

.data-table td:first-child {
  text-align: left;
  font-weight: 500;
}
`;