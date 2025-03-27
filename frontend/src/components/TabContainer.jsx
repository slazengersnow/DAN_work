import React, { useState } from 'react';
import SummaryComponent from './SummaryComponent';
import EmployeeDetailComponent from './EmployeeDetailComponent';
import MonthlyDetailComponent from './MonthlyDetailComponent';

const TabContainer = () => {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* タブナビゲーション */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex">
            <button
              className={`px-6 py-4 text-sm font-medium ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('summary')}
            >
              サマリー
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium ${activeTab === 'employeeDetail' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('employeeDetail')}
            >
              従業員詳細
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium ${activeTab === 'monthlyDetail' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('monthlyDetail')}
            >
              月次詳細
            </button>
          </div>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'summary' && <SummaryComponent />}
        {activeTab === 'employeeDetail' && <EmployeeDetailComponent />}
        {activeTab === 'monthlyDetail' && <MonthlyDetailComponent />}
      </div>
    </div>
  );
};

export default TabContainer;