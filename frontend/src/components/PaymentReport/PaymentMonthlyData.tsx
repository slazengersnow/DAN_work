// PaymentMonthlyData.tsx

import React from 'react';

interface PaymentMonthlyDataProps {
  formData: any;
}

const PaymentMonthlyData: React.FC<PaymentMonthlyDataProps> = ({ formData }) => {
  // 月別データの配列化（表示用）
  const getMonthlyData = (dataKey: string) => {
    const keys = ['april', 'may', 'june', 'july', 'august', 'september', 
                 'october', 'november', 'december', 'january', 'february', 'march'];
    return keys.map(month => formData[dataKey][month]);
  };
  
  // 月別の法定雇用障害者数の計算
  const calculateMonthlyLegalEmployment = () => {
    const keys = ['april', 'may', 'june', 'july', 'august', 'september', 
                 'october', 'november', 'december', 'january', 'february', 'march'];
    return keys.map(month => Math.floor(formData.workerBaseCount[month] * formData.legalEmploymentRate / 100));
  };
  
  // 合計値の計算
  const calculateTotal = (dataKey: string) => {
    const months = ['april', 'may', 'june', 'july', 'august', 'september', 
                  'october', 'november', 'december', 'january', 'february', 'march'];
    return months.reduce((sum, month) => sum + formData[dataKey][month], 0);
  };
  
  // 法定雇用障害者数の年間合計
  const getTotalLegalEmployment = () => {
    return Math.floor(calculateTotal('workerBaseCount') * formData.legalEmploymentRate / 100);
  };
  
  // 月名の変換
  const getMonthName = (index: number) => {
    const months = ['４月', '５月', '６月', '７月', '８月', '９月', '10月', '11月', '12月', '１月', '２月', '３月'];
    return months[index];
  };

  return (
    <div className="border border-gray-800 mb-6">
      <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">障害者雇用納付金・障害者雇用調整金の算定内訳</div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-800 p-1 w-48">区分</th>
              {Array.from({ length: 12 }, (_, i) => (
                <th key={i} className="border border-gray-800 p-1 w-16">{getMonthName(i)}</th>
              ))}
              <th className="border border-gray-800 p-1 w-20">合計</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-800 p-1 text-sm">常用雇用労働者の総数<br/>(N)</td>
              {getMonthlyData('totalRegularEmployees').map((value, i) => (
                <td key={i} className="border border-gray-800 p-1 text-center">{value}</td>
              ))}
              <td className="border border-gray-800 p-1 text-center font-bold">{calculateTotal('totalRegularEmployees')}</td>
            </tr>
            <tr>
              <td className="border border-gray-800 p-1 text-sm">法定雇用障害者数の算定の基礎となる労働者の数<br/>(O)</td>
              {getMonthlyData('workerBaseCount').map((value, i) => (
                <td key={i} className="border border-gray-800 p-1 text-center">{value}</td>
              ))}
              <td className="border border-gray-800 p-1 text-center font-bold">{calculateTotal('workerBaseCount')}</td>
            </tr>
            <tr>
              <td className="border border-gray-800 p-1 text-sm">法定雇用障害者の数（納付金申告）<br/>4月～3月：((O)×{formData.legalEmploymentRate}/100)</td>
              {calculateMonthlyLegalEmployment().map((value: number, i: number) => (
                <td key={i} className="border border-gray-800 p-1 text-center">{value}</td>
              ))}
              <td className="border border-gray-800 p-1 text-center font-bold">{getTotalLegalEmployment()}</td>
            </tr>
            <tr>
              <td className="border border-gray-800 p-1 text-sm">身体障害者、知的障害者及び精神障害者の合計数<br/>(P)</td>
              {getMonthlyData('disabledEmployees').map((value, i) => (
                <td key={i} className="border border-gray-800 p-1 text-center">{value}</td>
              ))}
              <td className="border border-gray-800 p-1 text-center font-bold">{calculateTotal('disabledEmployees')}</td>
            </tr>
            <tr>
              <td className="border border-gray-800 p-1 text-sm">週労働時間が10時間以上20時間未満の雇用障害者の数<br/>(Q)</td>
              {getMonthlyData('shortTimeDisabledEmployees').map((value, i) => (
                <td key={i} className="border border-gray-800 p-1 text-center">{value}</td>
              ))}
              <td className="border border-gray-800 p-1 text-center font-bold">{calculateTotal('shortTimeDisabledEmployees')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentMonthlyData;