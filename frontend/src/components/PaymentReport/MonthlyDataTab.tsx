import React, { useState, useEffect, useMemo } from 'react';
import { paymentReportApi } from '../../api/paymentReportApi';

interface MonthlyDataTabProps {
  fiscalYear: string;
  reportData?: any; // データがない場合もあるので optional (?) にします
}

const MonthlyDataTab: React.FC<MonthlyDataTabProps> = ({ fiscalYear, reportData }) => {
  // 法定雇用率
  const LEGAL_EMPLOYMENT_RATE = 2.3; // 2.3%
  
  // コンポーネントの先頭で定数として定義
  const defaultMonthlyData = [
    { month: '4月', employees: 0, disabledEmployees: 0 },
    { month: '5月', employees: 0, disabledEmployees: 0 },
    { month: '6月', employees: 0, disabledEmployees: 0 },
    { month: '7月', employees: 0, disabledEmployees: 0 },
    { month: '8月', employees: 0, disabledEmployees: 0 },
    { month: '9月', employees: 0, disabledEmployees: 0 },
    { month: '10月', employees: 0, disabledEmployees: 0 },
    { month: '11月', employees: 0, disabledEmployees: 0 },
    { month: '12月', employees: 0, disabledEmployees: 0 },
    { month: '1月', employees: 0, disabledEmployees: 0 },
    { month: '2月', employees: 0, disabledEmployees: 0 },
    { month: '3月', employees: 0, disabledEmployees: 0 }
  ];
  
  // API連携用の状態
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 月別データ
  const [monthlyData, setMonthlyData] = useState([
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
  ]);
  
  // 年度数値を取得する
  const getYearValue = () => {
    if (fiscalYear.includes('年度')) {
      return parseInt(fiscalYear.replace('年度', ''));
    }
    return new Date().getFullYear();
  };
  
  // 標準形式のデータを処理する関数
  const processStandardFormat = (monthlyData: any) => {
    const months = [
      '4月', '5月', '6月', '7月', '8月', '9月', 
      '10月', '11月', '12月', '1月', '2月', '3月'
    ];
    const monthKeys = [
      'april', 'may', 'june', 'july', 'august', 'september',
      'october', 'november', 'december', 'january', 'february', 'march'
    ];
    
    console.log('標準形式のデータを処理します');
    
    return months.map((month, index) => {
      const key = monthKeys[index];
      return {
        month: month,
        employees: monthlyData.totalRegularEmployees?.[key] || 0,
        disabledEmployees: monthlyData.disabledEmployees?.[key] || 0
      };
    });
  };
  
  // シンプル形式のデータを処理する関数（すべての月で同じ値）
  const processSimpleFormat = (totalEmployees: number, disabledEmployees: number) => {
    const months = [
      '4月', '5月', '6月', '7月', '8月', '9月', 
      '10月', '11月', '12月', '1月', '2月', '3月'
    ];
    
    console.log('シンプル形式のデータを処理します', { totalEmployees, disabledEmployees });
    
    // すべての月で同じ値を使用
    return months.map(month => ({
      month,
      employees: totalEmployees,
      disabledEmployees: disabledEmployees
    }));
  };
  
  // フィールド直接アクセスの形式を処理する関数
  const processDirectFields = (data: any) => {
    const months = [
      '4月', '5月', '6月', '7月', '8月', '9月', 
      '10月', '11月', '12月', '1月', '2月', '3月'
    ];
    const monthKeys = [
      'april', 'may', 'june', 'july', 'august', 'september',
      'october', 'november', 'december', 'january', 'february', 'march'
    ];
    
    console.log('フィールド直接アクセス形式のデータを処理します');
    
    return months.map((month, index) => {
      const key = monthKeys[index];
      return {
        month: month,
        employees: data[`employees_${key}`] || 0,
        disabledEmployees: data[`disabled_${key}`] || 0
      };
    });
  };
  
  // 適応的なデータ処理関数を追加
  const adaptiveProcessMonthlyData = (data: any) => {
    console.log('適応的データ処理を開始:', data);
    
    // データなしの場合
    if (!data) {
      console.warn('データがありません');
      return defaultMonthlyData;
    }
    
    try {
      // 複数の可能なデータ構造をチェック
      
      // ケース1: 標準形式の月次データ
      if (data.monthly_data) {
        const monthlyData = typeof data.monthly_data === 'string' 
          ? JSON.parse(data.monthly_data)
          : data.monthly_data;
        
        if (monthlyData.totalRegularEmployees && monthlyData.disabledEmployees) {
          // 標準形式処理
          return processStandardFormat(monthlyData);
        }
      }
      
      // ケース2: フラットな構造の月次データ
      if (data.total_employees && data.disabled_employees) {
        // フラット構造処理 (すべての月で同じ値)
        return processSimpleFormat(data.total_employees, data.disabled_employees);
      }
      
      // ケース3: フィールド直接アクセス
      const monthKeys = ['april', 'may', 'june', 'july', 'august', 'september',
                        'october', 'november', 'december', 'january', 'february', 'march'];
      
      const hasDirectMonthFields = monthKeys.some(key => 
        data[`employees_${key}`] !== undefined || data[`disabled_${key}`] !== undefined
      );
      
      if (hasDirectMonthFields) {
        // 直接フィールドアクセス処理
        return processDirectFields(data);
      }
      
      // どの形式にも当てはまらない場合はデフォルト値を使用
      console.warn('認識できるデータ構造ではありません。デフォルト値を使用します。');
      return defaultMonthlyData;
      
    } catch (error) {
      console.error('データ処理エラー:', error);
      return defaultMonthlyData;
    }
  };
  
  // データ処理関数を修正
  const processReportData = (data: any) => {
    if (data && data.monthly_data) {
      try {
        let monthlyDataObj: {
          totalRegularEmployees?: { [key: string]: number };
          disabledEmployees?: { [key: string]: number };
          [key: string]: any;
        };
        
        monthlyDataObj = typeof data.monthly_data === 'string' 
          ? JSON.parse(data.monthly_data)
          : data.monthly_data;
        
        console.log('処理する月次データ:', monthlyDataObj);
        
        // データが存在するか明示的に検証
        if (monthlyDataObj && typeof monthlyDataObj === 'object') {
          const months = [
            '4月', '5月', '6月', '7月', '8月', '9月', 
            '10月', '11月', '12月', '1月', '2月', '3月'
          ];
          const monthKeys = [
            'april', 'may', 'june', 'july', 'august', 'september',
            'october', 'november', 'december', 'january', 'february', 'march'
          ];
          
          // 有効なデータ構造かを確認し、必要に応じてデフォルト値を使用
          const hasValidData = monthlyDataObj.totalRegularEmployees && 
                              monthlyDataObj.disabledEmployees;
          
          console.log('有効なデータ構造ですか？', hasValidData);
          
          if (hasValidData) {
            const formattedData = months.map((month, index) => {
              const key = monthKeys[index];
              return {
                month: month,
                employees: monthlyDataObj.totalRegularEmployees?.[key] || 0,
                disabledEmployees: monthlyDataObj.disabledEmployees?.[key] || 0
              };
            });
            
            console.log('フォーマット済みデータ:', formattedData);
            setMonthlyData(formattedData);
          } else {
            console.warn('月次データの構造が期待と異なります:', monthlyDataObj);
            
            // 適応的な処理を試みる
            const adaptiveData = adaptiveProcessMonthlyData(data);
            setMonthlyData(adaptiveData);
          }
        } else {
          console.warn('月次データがオブジェクトではありません:', monthlyDataObj);
          
          // 適応的な処理を試みる
          const adaptiveData = adaptiveProcessMonthlyData(data);
          setMonthlyData(adaptiveData);
        }
      } catch (parseError) {
        console.error('月次データのパースエラー:', parseError);
        
        // パースエラーでも適応的な処理を試みる
        const adaptiveData = adaptiveProcessMonthlyData(data);
        setMonthlyData(adaptiveData);
      }
    } else {
      console.warn('月次データがありません');
      
      // 適応的な処理を試みる
      const adaptiveData = adaptiveProcessMonthlyData(data);
      setMonthlyData(adaptiveData);
    }
    
    // いずれの場合もローディング状態を解除
    setLoading(false);
  };
  
  // API からデータを取得する関数
  const fetchPaymentReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const year = getYearValue();
      const report = await paymentReportApi.getPaymentReport(year);
      
      // データ処理関数を呼び出し
      processReportData(report);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '月次データの取得に失敗しました');
      console.error('月次データの取得エラー:', err);
      
      // データがない場合はデフォルト値を使用
      setMonthlyData(defaultMonthlyData);
    }
  };
  
  // useEffect を修正
  useEffect(() => {
    console.log('MonthlyDataTab: fiscalYear/reportData変更検知', fiscalYear, reportData);
    
    if (reportData) {
      console.log('親コンポーネントから受け取ったデータを処理します:', reportData);
      setLoading(true); // 親コンポーネントからのデータ処理中もローディング状態に
      processReportData(reportData);
      return; // reportData が存在する場合は API 呼び出しをスキップ
    }
    
    // reportData がない場合のみ API 呼び出し
    console.log('MonthlyDataTab: APIからデータを取得します', fiscalYear);
    fetchPaymentReport();
  }, [fiscalYear, reportData]);
  
  // 月別のデータを計算
  const calculatedData = useMemo(() => {
    return monthlyData.map(item => {
      // 実雇用率 = 障害者雇用数 / 常用労働者数 * 100
      const employmentRate = item.employees > 0 
        ? (item.disabledEmployees / item.employees) * 100
        : 0;
      
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
      {loading && (
        <div style={{ 
          padding: '12px', 
          textAlign: 'center', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          データを読み込み中...
        </div>
      )}
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '8px 12px', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

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
              {monthlyData.map((item, idx) => (
                <th key={`month-header-${item.month}-${idx}`} style={{ 
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
            {/* 常用労働者数の行 */}
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
              {calculatedData.map((item, idx) => (
                <td key={`employees-${item.month}-${idx}`} style={{ 
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
            
            {/* 障がい者雇用者数の行 */}
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
              {calculatedData.map((item, idx) => (
                <td key={`disabled-${item.month}-${idx}`} style={{ 
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
            
            {/* 超過・未達の行 */}
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
              {calculatedData.map((item, idx) => (
                <td key={`difference-${item.month}-${idx}`} style={{ 
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
            
            {/* 調整金・納付金の行 */}
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
              {calculatedData.map((item, idx) => (
                <td key={`payment-${item.month}-${idx}`} style={{ 
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