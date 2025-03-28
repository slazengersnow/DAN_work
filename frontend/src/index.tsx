// frontend/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 測定結果をコンソールに出力する場合
// reportWebVitals(console.log);

// または測定しない場合（またはデフォルトの送信先に送る場合）
reportWebVitals();