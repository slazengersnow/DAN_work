// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import apiClient from '../api/client';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  
  const loginMutation = useMutation(
    async (loginData: LoginCredentials) => {
      const response = await apiClient.post<LoginResponse>('/auth/login', loginData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // トークンと基本ユーザー情報の保存
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // ダッシュボードへリダイレクト
        navigate('/dashboard');
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || 'ログインに失敗しました');
      }
    }
  );
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!credentials.username || !credentials.password) {
      setError('ユーザー名とパスワードを入力してください');
      return;
    }
    
    // 開発環境かどうかを確認
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK === 'true') {
      // 開発用に認証を通過させる
      localStorage.setItem('isAuthenticated', 'true');
      // ダミーのユーザー情報を保存
      localStorage.setItem('auth_token', 'dummy_token_for_development');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        username: credentials.username || 'admin',
        role: 'admin'
      }));
      // 社員リストページに遷移
      navigate('/employee-list');
      return;
    }
    
    // 本番環境では通常のログインフローを使用
    loginMutation.mutate(credentials);
  };
  
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div className="card" style={{ width: '400px', padding: '20px' }}>
        <h2 className="text-center mb-4">障害者雇用管理システム</h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <div className="form-group mb-3">
            <label htmlFor="username">ユーザー名</label>
            <input
              type="text"
              className="form-control"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="ユーザー名を入力"
              required
            />
          </div>
          
          <div className="form-group mb-4">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="パスワードを入力"
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loginMutation.isLoading}
          >
            {loginMutation.isLoading ? '認証中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;