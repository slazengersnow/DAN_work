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
      const requiredEmployees = Math.floor(item.employees * LEGAL_EMPLOYMENT_RATE / 100);
      
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
    
    const totalRequiredEmployees = calculatedData.reduce((sum, item) => sum + item.requiredEmployees, 0);
    const totalDifference = totalDisabled - totalRequiredEmployees;
    const totalPayment = calculatedData.reduce((sum, item) => sum + item.payment, 0);
    
    return {
      totalEmployees,
      totalDisabled,
      totalRequiredEmployees,
      totalDifference,
      totalPayment
    };
  }, [calculatedData, monthlyData]);
  
  // 金額の表示フォーマット
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div style={{ padding: '0', marginTop: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '6px', fontSize: '16px' }}>対象月:</label>
        <select style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ced4da', marginRight: '8px', fontSize: '16px' }}>
          <option value="2024年">2024年</option>
          <option value="2025年">2025年</option>
        </select>
        <select style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ced4da', marginRight: '8px', fontSize: '16px' }}>
          <option value="4月">4月</option>
          <option value="5月">5月</option>
          <option value="6月">6月</option>
          <option value="7月">7月</option>
          <option value="8月">8月</option>
          <option value="9月">9月</option>
          <option value="10月">10月</option>
          <option value="11月">11月</option>
          <option value="12月">12月</option>
          <option value="1月">1月</option>
          <option value="2月">2月</option>
          <option value="3月">3月</option>
        </select>
        <button style={{ 
          backgroundColor: '#4a77e5', 
          color: 'white', 
          padding: '4px 16px', 
          border: 'none', 
          borderRadius: '4px',
          fontSize: '16px'
        }}>
          表示
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
              <th style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6', 
                whiteSpace: 'nowrap',
                width: '150px'
              }}>項目</th>
              {monthlyData.map((item) => (
                <th key={item.month} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  fontWeight: 'normal', 
                  backgroundColor: '#f8f9fa', 
                  borderBottom: '1px solid #dee2e6', 
                  whiteSpace: 'nowrap' 
                }}>
                  {item.month}
                </th>
              ))}
              <th style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6', 
                whiteSpace: 'nowrap' 
              }}>
                合計
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6' 
              }}>
                常用労働者数(人)
              </td>
              {calculatedData.map((item, index) => (
                <td key={index} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6' 
                }}>
                  {formatNumber(item.employees)}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold' 
              }}>
                {formatNumber(totals.totalEmployees)}
              </td>
            </tr>
            
            <tr>
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6' 
              }}>
                障がい者雇用者数(人)
              </td>
              {calculatedData.map((item, index) => (
                <td key={index} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6' 
                }}>
                  {item.disabledEmployees}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold' 
              }}>
                {totals.totalDisabled}
              </td>
            </tr>
            
            <tr>
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6' 
              }}>
                超過・未達(人)
              </td>
              {calculatedData.map((item, index) => (
                <td key={index} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6',
                  color: item.difference < 0 ? '#dc3545' : 'inherit'
                }}>
                  {item.difference > 0 ? '+' + item.difference : item.difference}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold',
                color: totals.totalDifference < 0 ? '#dc3545' : 'inherit'
              }}>
                {totals.totalDifference > 0 ? '+' + totals.totalDifference : totals.totalDifference}
              </td>
            </tr>
            
            <tr>
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'left', 
                fontWeight: 'normal', 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6' 
              }}>
                調整金・納付金(円)
              </td>
              {calculatedData.map((item, index) => (
                <td key={index} style={{ 
                  padding: '6px 4px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #dee2e6',
                  color: item.payment < 0 ? '#dc3545' : '#28a745'
                }}>
                  {formatNumber(item.payment)}
                </td>
              ))}
              <td style={{ 
                padding: '6px 4px', 
                textAlign: 'center', 
                borderBottom: '1px solid #dee2e6', 
                fontWeight: 'bold',
                color: totals.totalPayment < 0 ? '#dc3545' : '#28a745'
              }}>
                {formatNumber(totals.totalPayment)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyDataTab;