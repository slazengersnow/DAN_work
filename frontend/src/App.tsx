// frontend/src/App.tsx
import React from 'react';
import { createBrowserRouter, RouterProvider, Link, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import './App.css';

const queryClient = new QueryClient();

// シンプルなコンポーネント
const Home: React.FC = () => (
  <div>
    <h2>ホームページ</h2>
    <p>ルーティングが機能しています！</p>
  </div>
);

const About: React.FC = () => (
  <div>
    <h2>Aboutページ</h2>
    <p>これは別のルートです。</p>
  </div>
);

// レイアウトコンポーネント
const Layout: React.FC = () => {
  return (
    <div className="App" style={{ textAlign: 'center', padding: '20px' }}>
      <header style={{ backgroundColor: '#282c34', padding: '20px', color: 'white' }}>
        <h1>テストアプリケーション</h1>
        <nav style={{ marginTop: '15px' }}>
          <Link to="/" style={{ color: 'white', margin: '0 10px', textDecoration: 'none' }}>
            ホーム
          </Link>
          <Link to="/about" style={{ color: 'white', margin: '0 10px', textDecoration: 'none' }}>
            About
          </Link>
        </nav>
      </header>
      <main style={{ marginTop: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
};

// ルーターの定義
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'about',
        element: <About />,
      },
    ],
  },
]);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;
