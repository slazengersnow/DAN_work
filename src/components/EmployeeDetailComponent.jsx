import React, { useState } from 'react';

const EmployeeDetailComponent = () => {
  // 従業員データ
  const employees = [
    { 
      id: '1001', 
      name: '山田 太郎', 
      disabilityType: '身体障害', 
      grade: '1級', 
      hireDate: '2020/04/01', 
      count: 2, 
      status: '在籍', 
      monthlyData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 4月から3月まで
      comments: '-' 
    },
    { 
      id: '2222', 
      name: '鈴木 花子', 
      disabilityType: '身体障害', 
      grade: '4級', 
      hireDate: '2020/04/01', 
      count: 1, 
      status: '在籍', 
      monthlyData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      comments: '-' 
    },
    { 
      id: '3333', 
      name: '佐藤 一郎', 
      disabilityType: '知的障害', 
      grade: 'B', 
      hireDate: '2020/04/01', 
      count: 1, 
      status: '在籍', 
      monthlyData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      comments: '-' 
    },
    { 
      id: '4444', 
      name: '高橋 勇太', 
      disabilityType: '精神障害', 
      grade: '3級', 
      hireDate: '2020/04/01', 
      count: 1, 
      status: '在籍', 
      monthlyData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      comments: '-' 
    },
    { 
      id: '5555', 
      name: '田中 美咲', 
      disabilityType: '精神障害', 
      grade: '2級', 
      hireDate: '2021/04/01', 
      count: 1, 
      status: '在籍', 
      monthlyData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      comments: '-' 
    },
  ];

  // 月のラベル
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">障害者雇用者詳細</h2>
      </div>

      {/* 従業員テーブル */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">社員ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">障害区分</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">等級</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">採用日</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">カウント</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
              {/* 4月から3月までの列 */}
              {months.map((month) => (
                <th key={month} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {month}
                </th>
              ))}
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">コメント</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee, index) => (
              <tr key={employee.id}>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{employee.id}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{employee.name}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{employee.disabilityType}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{employee.grade}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{employee.hireDate}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{employee.count}</td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {employee.status}
                  </span>
                </td>
                {/* 各月のデータ */}
                {employee.monthlyData.map((value, idx) => (
                  <td key={idx} className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    {value}
                  </td>
                ))}
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{employee.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeDetailComponent;