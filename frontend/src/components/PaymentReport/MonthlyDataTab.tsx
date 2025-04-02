import React, { useState, useMemo } from 'react';

interface MonthlyDataTabProps {
  fiscalYear: string;
}

const MonthlyDataTab: React.FC<MonthlyDataTabProps> = ({ fiscalYear }) => {
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
    <div className="table-container" style={{ overflowX: 'auto' }}>
      <h3 className="tab-title">月別データ ({fiscalYear})</h3>
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
      
      {/* 分析またはグラフセクション */}
      <div className="analysis-section" style={{ marginTop: '30px' }}>
        <h4>分析</h4>
        <div className="analysis-card" style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <p>
            <strong>年間平均実雇用率: </strong> 
            {formatNumber(totals.avgEmploymentRate, 2)}%
            {totals.avgEmploymentRate >= LEGAL_EMPLOYMENT_RATE 
              ? ' (法定雇用率達成)' 
              : ' (法定雇用率未達成)'
            }
          </p>
          <p>
            <strong>年間平均超過・未達: </strong>
            {totals.avgDifference >= 0 ? '+' : ''}{formatNumber(totals.avgDifference, 1)}人
          </p>
          <p>
            <strong>年間推定調整金・納付金額: </strong>
            <span style={{ color: getPaymentColor(totals.totalPayment) }}>
              {totals.totalPayment < 0 ? '-' : ''}{formatNumber(Math.abs(totals.totalPayment))}円
            </span>
          </p>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
            注: この分析は概算であり、実際の申告額とは異なる場合があります。
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyDataTab;