// App.tsx
import React from 'react';
import {
   BrowserRouter as Router,
   Routes,
   Route,
   Navigate
} from 'react-router-dom';

import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
// 明示的なパスでインポート
import MonthlyReport from './pages/MonthlyReport/index';
import MonthlyReportDetail from './pages/MonthlyReport/MonthlyReportDetail';
import PaymentReport from './pages/PaymentReport';
import Settings from './pages/Settings';
import './App.css';

// 環境変数を設定
window.process = window.process || {};
window.process.env = window.process.env || {};
window.process.env.REACT_APP_USE_MOCK = 'false'; // APIと連携するためモックモードを無効化


// 新しいQueryClientを作成
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

// シンプルなルーティング構造
const App: React.FC = () => {
  // デバッグ用に読み込み時にログ出力
  console.log('App.tsx loaded');
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employee-list" element={<EmployeeList />} />
            
            {/* 社員詳細・編集関連のルート */}
            <Route path="/employees/new" element={<div>新規社員追加（未実装）</div>} />
            <Route path="/employee-detail/:id" element={<EmployeeDetailPage />} />
            <Route path="/employee-edit/:id" element={<div>社員編集（未実装）</div>} />
            
            {/* 以前のパスもバックワードコンパチビリティのために残す */}
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/employees/:id/edit" element={<div>社員編集（未実装）</div>} />
            
            {/* 月次レポート関連のルート - 具体的なパスを先に配置 */}
            <Route path="/monthly-report/detail" element={<MonthlyReportDetail />} />
            <Route path="/monthly-report/:id" element={<MonthlyReportDetail />} />
            <Route path="/monthly-report" element={<MonthlyReport />} />
            
            <Route path="/payment-report" element={<PaymentReport />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;