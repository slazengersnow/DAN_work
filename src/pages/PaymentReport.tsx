import React, { useState, useMemo } from 'react';

const PaymentReport: React.FC = () => {
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  const [activeTab, setActiveTab] = useState<string>('monthly');

  // 法定雇用率
  const LEGAL_EMPLOYMENT_RATE = 2.3; // 2.3%
  
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
            <div>対象期間 2024年11月まで</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              {totals.totalPayment < 0 ? '納付金額' : '調整金額'}
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: getPaymentColor(totals.totalPayment)
            }}>
              {totals.totalPayment < 0 ? '-' : ''}
              {formatNumber(Math.abs(totals.totalPayment))}円
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>(法定雇用率{LEGAL_EMPLOYMENT_RATE}%)</div>
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
        <div>
          <p>申告履歴は表示されません。</p>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6c757d' }}>
        注意: このデータは毎月の障害者雇用状況に基づいて計算されています。年度末の確定値と異なる場合があります。
      </div>
      
      <div className="action-buttons">
        <button className="secondary">申告書ダウンロード</button>
      </div>
    </div>
  );
};

export default PaymentReport;