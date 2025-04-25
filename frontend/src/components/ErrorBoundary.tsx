// src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // エラー発生時にステートを更新
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // エラーログ
    console.error('エラーバウンダリーがエラーをキャッチしました:', error, errorInfo);
    
    // エラーハンドラーが提供されている場合は呼び出す
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // フォールバックUIが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // デフォルトのエラーUI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: '#fff8f8',
          border: '1px solid #ffcfcf',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#d32f2f' }}>エラーが発生しました</h2>
          <p>申し訳ありませんが、問題が発生しました。</p>
          <p>詳細: {this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            再試行
          </button>
        </div>
      );
    }

    // エラーがなければ子コンポーネントをレンダリング
    return this.props.children;
  }
}

export default ErrorBoundary;