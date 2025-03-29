// frontend/src/pages/Login.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  // 通常のフォーム送信ではなく、単にユーザーをダッシュボードにリダイレクト
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };
  
  return (
    <div className="login-container" style={{ 
      maxWidth: '400px', 
      margin: '100px auto', 
      padding: '20px', 
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>ログイン</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>ユーザー名</label>
          <input
            type="text"
            placeholder="ユーザー名を入力"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>パスワード</label>
          <input
            type="password"
            placeholder="パスワードを入力"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <button
          type="submit"
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#4285f4', 
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ログイン
        </button>
      </form>
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        開発モード: ユーザー名とパスワードは任意の値で進めます
      </div>
    </div>
  );
};

export default Login;