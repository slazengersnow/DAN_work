import React from 'react';

const SummaryComponent = () => {
  // サマリーデータ（実際の実装ではAPIから取得）
  const summaryData = {
    totalEmployees: 1200,
    disabledEmployees: 24,
    employmentRate: 2.0,
    legalRate: 2.3,
    shortfall: 3,
    statusCounts: {
      active: 24,
      onLeave: 2,
      retired: 1
    },
    disabilityTypeCounts: {
      physical: 10,
      intellectual: 5,
      mental: 9
    },
    monthlyTrend: [
      { month: '4月', count: 21 },
      { month: '5月', count: 22 },
      { month: '6月', count: 22 },
      { month: '7月', count: 23 },
      { month: '8月', count: 23 },
      { month: '9月', count: 24 },
      { month: '10月', count: 24 },
      { month: '11月', count: 24 },
      { month: '12月', count: 24 },
      { month: '1月', count: 24 },
      { month: '2月', count: 24 },
      { month: '3月', count: 24 }
    ]
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">障害者雇用サマリー</h2>
        
        {/* 主要指標 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">全従業員数</p>
            <p className="text-2xl font-semibold">{summaryData.totalEmployees}人</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">障害者雇用数</p>
            <p className="text-2xl font-semibold">{summaryData.disabledEmployees}人</p>
          </div>
          <div className={`${summaryData.employmentRate >= summaryData.legalRate ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4`}>
            <p className="text-sm text-gray-500">実雇用率</p>
            <p className="text-2xl font-semibold">{summaryData.employmentRate}%</p>
            <p className="text-xs text-gray-500">法定雇用率: {summaryData.legalRate}%</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">不足数</p>
            <p className="text-2xl font-semibold">{summaryData.shortfall}人</p>
          </div>
        </div>
        
        {/* 障害者の状態内訳 */}
        <h3 className="text-md font-semibold mb-2">障害者の状態</h3>
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">在籍</p>
              <p className="text-xl font-semibold">{summaryData.statusCounts.active}人</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">休職中</p>
              <p className="text-xl font-semibold">{summaryData.statusCounts.onLeave}人</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">退職</p>
              <p className="text-xl font-semibold">{summaryData.statusCounts.retired}人</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">合計</p>
              <p className="text-xl font-semibold">
                {summaryData.statusCounts.active + summaryData.statusCounts.onLeave + summaryData.statusCounts.retired}人
              </p>
            </div>
          </div>
        </div>
        
        {/* 障害種別の内訳 */}
        <h3 className="text-md font-semibold mb-2">障害種別の内訳</h3>
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">身体障害</p>
              <p className="text-xl font-semibold">{summaryData.disabilityTypeCounts.physical}人</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">知的障害</p>
              <p className="text-xl font-semibold">{summaryData.disabilityTypeCounts.intellectual}人</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">精神障害</p>
              <p className="text-xl font-semibold">{summaryData.disabilityTypeCounts.mental}人</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">合計</p>
              <p className="text-xl font-semibold">
                {summaryData.disabilityTypeCounts.physical + 
                  summaryData.disabilityTypeCounts.intellectual + 
                  summaryData.disabilityTypeCounts.mental}人
              </p>
            </div>
          </div>
        </div>
        
        {/* 月次推移テーブル */}
        <h3 className="text-md font-semibold mb-2">月次推移</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {summaryData.monthlyTrend.map(item => (
                  <th 
                    key={item.month} 
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {item.month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {summaryData.monthlyTrend.map(item => (
                  <td 
                    key={item.month} 
                    className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900"
                  >
                    {item.count}
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

export default SummaryComponent;