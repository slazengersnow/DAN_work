import React, { useState } from 'react';

const MonthlyDetailComponent = () => {
  // 選択中の年度
  const [selectedYear, setSelectedYear] = useState('2024');
  
  // 月次データ
  const monthlyData = {
    '2024': {
      months: ['4', '5', '6', '7', '8', '9', '10', '11', '12', '1', '2', '3', '合計'],
      totalEmployees: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822],
      fullTimeEmployees: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822],
      partTimeEmployees: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      reportEmployees: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822],
      disabilityLevel12: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 24],
      disabilityOther: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 33],
      disabilityLevel12PartTime: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      disabilityOtherPartTime: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      totalDisability: [4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 57],
      actualRate: [0.7, 0.7, 0.6, 0.8, 0.8, 0.8, 0.8, 0.7, 0.8, 0.7, 0.7, 0.7, 0.7],
      legalRate: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5],
      legalEmployees: [15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 18, 196],
      oversAndShorts: [-11, -11, -12, -11, -11, -11, -12, -12, -12, -12, -12, -13, -139]
    },
    '2023': {
      months: ['4', '5', '6', '7', '8', '9', '10', '11', '12', '1', '2', '3', '合計'],
      totalEmployees: [580, 585, 590, 595, 600, 600, 595, 590, 595, 600, 595, 600, 7125],
      fullTimeEmployees: [580, 585, 590, 595, 600, 600, 595, 590, 595, 600, 595, 600, 7125],
      partTimeEmployees: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      reportEmployees: [580, 585, 590, 595, 600, 600, 595, 590, 595, 600, 595, 600, 7125],
      disabilityLevel12: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 24],
      disabilityOther: [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 20],
      disabilityLevel12PartTime: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      disabilityOtherPartTime: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      totalDisability: [3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 44],
      actualRate: [0.5, 0.5, 0.5, 0.5, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.6],
      legalRate: [2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3],
      legalEmployees: [13, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 166],
      oversAndShorts: [-10, -10, -11, -11, -10, -10, -10, -10, -10, -10, -10, -10, -122]
    }
  };

  // 選択された年度のデータ
  const currentYearData = monthlyData[selectedYear];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">月次詳細</h2>
          
          {/* 年度選択 */}
          <div className="flex items-center">
            <label htmlFor="year-select" className="mr-2 text-sm text-gray-600">年度:</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="2024">2024年度</option>
              <option value="2023">2023年度</option>
            </select>
          </div>
        </div>
        
        {/* 月次データテーブル */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left text-xs font-medium text-gray-500">項目</th>
                {currentYearData.months.map((month) => (
                  <th key={month} className="border p-2 text-center text-xs font-medium text-gray-500">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2 text-sm font-medium">従業員数</td>
                {currentYearData.totalEmployees.map((count, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {count}
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="border p-2 text-sm" colSpan={14}></td>
              </tr>

              <tr>
                <td className="border p-2 text-sm">フルタイム従業員数</td>
                {currentYearData.fullTimeEmployees.map((count, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {count}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="border p-2 text-sm">パートタイム従業員数</td>
                {currentYearData.partTimeEmployees.map((count, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {count}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="border p-2 text-sm">トータル従業員数</td>
                {currentYearData.reportEmployees.map((count, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {count}
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="border p-2 text-sm font-medium" colSpan={14}>障がい者</td>
              </tr>

              <tr>
                <td className="border p-2 text-sm">Level1 and Level2</td>
                {currentYearData.disabilityLevel12.map((count, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {count}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="border p-2 text-sm">Other than above</td>
                {currentYearData.disabilityOther.map((count, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {count}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="border p-2 text-sm">トータル障がい者数</td>
                {currentYearData.totalDisability.map((count, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {count}
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="border p-2 text-sm" colSpan={14}></td>
              </tr>

              <tr>
                <td className="border p-2 text-sm">実雇用率</td>
                {currentYearData.actualRate.map((rate, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {rate}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="border p-2 text-sm">法定雇用率</td>
                {currentYearData.legalRate.map((rate, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {rate}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="border p-2 text-sm">法定雇用者数</td>
                {currentYearData.legalEmployees.map((count, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {count}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="border p-2 text-sm">過不足</td>
                {currentYearData.oversAndShorts.map((count, idx) => (
                  <td key={idx} className={`border p-2 text-center text-sm text-red-600 ${idx === 12 ? 'bg-gray-50 font-medium' : ''}`}>
                    {count}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyDetailComponent;