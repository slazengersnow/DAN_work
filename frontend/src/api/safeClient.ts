// frontend/src/api/safeClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// 開発環境では '/api' を使用し、プロキシが処理する
// 本番環境では環境変数または既定値を使用する
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001/api');

// === HTML応答検出ヘルパー関数 ===
function isHtmlResponse(data: any, headers: any): boolean {
  // 1. Content-Typeヘッダーから検出
  const contentType = headers?.['content-type'] || '';
  const hasHtmlContentType = contentType.includes('text/html');
  
  // 2. 応答テキストが存在し、HTMLパターンを含む場合
  const isStringData = typeof data === 'string';
  const hasHtmlContent = isStringData && (
    data.includes('<!DOCTYPE') || 
    data.includes('<html') ||
    data.includes('<!doctype') ||
    data.includes('<HTML') ||
    data.trimStart().startsWith('<')
  );
  
  return hasHtmlContentType || hasHtmlContent;
}

// === セーフAPIクライアント ===
interface SafeClient extends AxiosInstance {
  safeGet: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  safePost: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
  safePut: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
  safeDelete: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>;
}

// クライアントの作成
const createSafeClient = (): SafeClient => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 15000,
    // すべてのステータスコードを処理（リジェクトしない）
    validateStatus: () => true
  }) as SafeClient;
  
  // === リクエストインターセプター ===
  instance.interceptors.request.use(
    (config) => {
      // 認証トークンの追加
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // デバッグ情報
      if (process.env.NODE_ENV === 'development') {
        console.log(`API リクエスト: ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // === レスポンスインターセプター ===
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // 1. HTML応答の検出
      if (isHtmlResponse(response.data, response.headers)) {
        console.error('警告: JSONの代わりにHTMLが返されました', {
          url: response.config.url,
          method: response.config.method,
          status: response.status
        });
        
        // レスポンスを変換
        const error: any = new Error('サーバーが不正なHTMLレスポンスを返しました');
        error.isHtmlResponse = true;
        error.status = response.status;
        error.originalResponse = response;
        
        // エラーとして扱う
        return Promise.reject(error);
      }
      
      // 2. エラーステータスコードを検出してエラーに変換
      if (response.status >= 400) {
        const error: any = new Error(`HTTP Error: ${response.status}`);
        error.status = response.status;
        error.data = response.data;
        error.isApiError = true;
        
        // エラーメッセージの取得
        if (response.data && response.data.message) {
          error.message = response.data.message;
        } else if (response.data && typeof response.data === 'string') {
          error.message = response.data;
        } else {
          error.message = `HTTPエラー: ${response.status} ${response.statusText}`;
        }
        
        return Promise.reject(error);
      }
      
      // 3. 正常なレスポンス - データを直接返す
      return response.data;
    },
    (error: AxiosError) => {
      // 通信自体のエラー（サーバー接続不可など）
      const errorObj: any = {
        message: 'ネットワークエラー',
        originalError: error
      };
      
      // Axiosエラーの場合、詳細情報を追加
      if (error.response) {
        // レスポンスありのエラー
        errorObj.status = error.response.status;
        errorObj.headers = error.response.headers;
        
        // HTML応答の検出
        if (isHtmlResponse(error.response.data, error.response.headers)) {
          errorObj.isHtmlResponse = true;
          errorObj.message = 'サーバーがJSONの代わりにHTMLを返しました';
        } else if (error.response.data && typeof error.response.data === 'object') {
          // TypeScriptエラーを回避するため型アサーションを使用
          const responseData = error.response.data as Record<string, any>;
          if (responseData.message) {
            errorObj.message = responseData.message;
          }
        }
      } else if (error.request) {
        // リクエスト送信後にレスポンスなし
        errorObj.message = 'サーバーから応答がありませんでした';
        errorObj.isTimeout = error.code === 'ECONNABORTED';
      }
      
      // エラーログ
      if (process.env.NODE_ENV === 'development') {
        console.error('API エラー:', {
          message: errorObj.message,
          url: error.config?.url,
          method: error.config?.method,
          status: errorObj.status,
          isHtmlResponse: errorObj.isHtmlResponse
        });
      }
      
      return Promise.reject(errorObj);
    }
  );
  
  // === セーフメソッド定義 ===
  // データを直接返すショートカットメソッド
  instance.safeGet = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return await instance.get(url, config);
  };
  
  instance.safePost = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return await instance.post(url, data, config);
  };
  
  instance.safePut = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return await instance.put(url, data, config);
  };
  
  instance.safeDelete = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return await instance.delete(url, config);
  };
  
  return instance;
};

// クライアントインスタンスを作成して公開
const safeClient = createSafeClient();
export default safeClient;