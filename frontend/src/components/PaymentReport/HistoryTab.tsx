// HistoryTab.tsx

import React, { useState } from 'react';

interface HistoryTabProps {
  fiscalYear: string;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ fiscalYear }) => {
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

  // 申告履歴のページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 金額の表示フォーマット（単位なし）
  const formatNumber = (num: number) => {
    return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // 調整金・納付金の表示色
  const getPaymentColor = (amount: number) => {
    return amount >= 0 ? '#28a745' : '#dc3545';
  };

  return (
    <div className="history-container">
      <h3 className="tab-title">障害者雇用納付金・調整金申告履歴 ({fiscalYear})</h3>
      <div className="table-responsive">
        <table className="history-table w-full">
          <thead>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">年度</th>
              <th className="p-2 border border-gray-300 bg-gray-100">種別</th>
              <th className="p-2 border border-gray-300 bg-gray-100">金額</th>
              <th className="p-2 border border-gray-300 bg-gray-100">申告日</th>
              <th className="p-2 border border-gray-300 bg-gray-100">支払/受取日</th>
              <th className="p-2 border border-gray-300 bg-gray-100">状態</th>
              <th className="p-2 border border-gray-300 bg-gray-100">操作</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((item) => (
              <tr key={item.id}>
                <td className="p-2 border border-gray-300">{item.year}</td>
                <td className="p-2 border border-gray-300">{item.type}</td>
                <td className="p-2 border border-gray-300 text-right" style={{ 
                  color: getPaymentColor(item.amount)
                }}>
                  {item.amount < 0 ? '-' : ''}{formatNumber(Math.abs(item.amount))}円
                </td>
                <td className="p-2 border border-gray-300">{item.applicationDate}</td>
                <td className="p-2 border border-gray-300">{item.paymentDate}</td>
                <td className="p-2 border border-gray-300">
                  <span className={`status-badge ${item.status === '受取済' ? 'bg-green-100 text-green-800' : 'bg-green-100 text-green-800'} px-2 py-1 rounded-full text-xs font-medium`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-2 border border-gray-300">
                  <div className="flex space-x-2">
                    <button className="detail-btn px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">詳細</button>
                    <button className="document-btn px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">申告書表示</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="pagination flex justify-center mt-4 space-x-2">
        <button 
          className={`pagination-btn w-8 h-8 rounded-full ${currentPage === 1 ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setCurrentPage(1)}
        >
          1
        </button>
        <button 
          className={`pagination-btn w-8 h-8 rounded-full ${currentPage === 2 ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setCurrentPage(2)}
        >
          2
        </button>
        <button className="pagination-btn w-8 h-8 rounded-full bg-gray-100">...</button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <h4 className="text-lg font-semibold mb-2">申告履歴の概要</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1"><span className="font-medium">過去5年の申告件数:</span> {historyData.length}件</p>
            <p className="mb-1"><span className="font-medium">納付金総額:</span> <span className="text-red-600">1,680,000円</span></p>
            <p className="mb-1"><span className="font-medium">調整金総額:</span> <span className="text-green-600">1,020,612円</span></p>
          </div>
          <div>
            <p className="mb-1"><span className="font-medium">納付金申告回数:</span> 3回</p>
            <p className="mb-1"><span className="font-medium">調整金申告回数:</span> 2回</p>
            <p className="mb-1"><span className="font-medium">直近の申告:</span> 2025年5月14日</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;