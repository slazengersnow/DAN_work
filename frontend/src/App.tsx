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
import EmployeeDetailPage from './pages/EmployeeDetailPage'; // 追加
import MonthlyReport from './pages/MonthlyReport';
import MonthlyReportDetail from './pages/MonthlyReportDetail'; // 追加
import PaymentReport from './pages/PaymentReport';
import Settings from './pages/Settings';
import './App.css';

// 環境変数を設定
// これがない場合、window.process.envオブジェクトが存在しない可能性がある
window.process = window.process || {};
window.process.env = window.process.env || {};
window.process.env.REACT_APP_USE_MOCK = 'true'; // 開発中はモックモードを有効化

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
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employee-list" element={<EmployeeList />} />
            
            {/* 社員詳細・編集関連のルート - 修正 */}
            <Route path="/employees/new" element={<div>新規社員追加（未実装）</div>} />
            <Route path="/employee-detail/:id" element={<EmployeeDetailPage />} /> {/* 修正: 詳細画面のパス */}
            <Route path="/employee-edit/:id" element={<div>社員編集（未実装）</div>} /> {/* 修正: 編集画面のパス */}
            
            {/* 以前のパスもバックワードコンパチビリティのために残す */}
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/employees/:id/edit" element={<div>社員編集（未実装）</div>} />
            
            {/* 月次レポート関連のルート */}
            <Route path="/monthly-report" element={<MonthlyReport />} />
            <Route path="/monthly-report/:id" element={<MonthlyReportDetail />} /> {/* 追加: 月次レポート詳細のパス */}
            
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