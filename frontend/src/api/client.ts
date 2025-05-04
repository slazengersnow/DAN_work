import axios from 'axios';

// APIのベースURLを設定
// 開発環境ではproxy設定を使用するため'/api'を使用
// 本番環境では環境変数からURLを取得
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001/api');

console.log(`API クライアント初期化 - BaseURL: ${API_BASE_URL}, 環境: ${process.env.NODE_ENV}`);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'  // JSON応答を明示的に要求
  },
  timeout: 15000, // タイムアウトを15秒に設定（より長く）
  validateStatus: (status) => {
    // すべてのステータスコードをハンドリング（リジェクトしない）
    return true; 
  }
});

// リクエストインターセプター（トークン付与など）
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// レスポンスインターセプター（エラーハンドリングなど）
apiClient.interceptors.response.use(
  (response) => {
    // JSON応答でない場合は警告を出す
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('application/json') && response.status !== 204) {
      console.warn('非JSONレスポンス:', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        contentType: contentType
      });
    }
    return response;
  },
  (error) => {
    // エラーオブジェクトが存在するか確認
    if (!error) {
      console.error('不明なエラーが発生しました（エラーオブジェクトなし）');
      return Promise.reject(new Error('不明なエラーが発生しました'));
    }

    // HTML応答またはJSONパースエラーを検出
    const isHtmlResponse = detectHtmlResponse(error);
    const isJsonParseError = error.message && error.message.includes('Unexpected token');
    
    // HTMLレスポンスの処理
    if (isHtmlResponse) {
      console.error('HTML応答を検出:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status || 'unknown',
        preview: error.request?.responseText ? 
          error.request.responseText.substring(0, 150) + '...' : 
          '(レスポンステキストなし)'
      });
      
      // エラーオブジェクトの拡張
      error.isHtmlResponse = true;
      error.customMessage = 'サーバーがJSONの代わりにHTMLを返しました。APIエンドポイントが正しくないか、サーバーエラーが発生した可能性があります。';
      
      // 404エラーの場合は明確なメッセージ
      if (error.response?.status === 404) {
        error.customMessage = `リクエストされたAPIパス (${error.config?.url}) は存在しません。`;
      }
    }
    
    // JSONパースエラーの処理（HTMLではない場合）
    else if (isJsonParseError && !isHtmlResponse) {
      console.error('JSONパースエラー:', error.message);
      error.customMessage = 'レスポンスデータを解析できませんでした。サーバーが無効なJSONを返しました。';
    }
    
    // 認証エラー処理
    if (error.response && error.response.status === 401) {
      // 認証エラー時の処理（ログアウトなど）
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    // エラーログ出力（開発環境のみ詳細表示）
    if (process.env.NODE_ENV === 'development') {
      console.error('API エラー:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        customMessage: error.customMessage,
        data: error.response?.data
      });
    }
    
    return Promise.reject(error);
  }
);

// HTMLレスポンスを検出するヘルパー関数
function detectHtmlResponse(error) {
  // レスポンステキストからHTMLを検出
  const hasHtmlContent = error.request?.responseText && 
    (error.request.responseText.includes('<!DOCTYPE') || 
     error.request.responseText.includes('<html') ||
     error.request.responseText.includes('<!doctype') ||
     error.request.responseText.includes('<HTML'));
  
  // Content-Typeヘッダーからも検出
  const contentType = error.response?.headers?.['content-type'] || '';
  const hasHtmlContentType = contentType.includes('text/html');
  
  return hasHtmlContent || hasHtmlContentType;
}

export default apiClient;