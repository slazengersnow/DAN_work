// src/api/enhancedClient.js

import axios from 'axios';
import databaseValidator from '../utils/databaseValidator';

// API基本設定
// 開発環境ではproxy設定を使用するため、'/api'とする
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001/api');

// デフォルトのタイムアウト設定
const DEFAULT_TIMEOUT = 15000; // 15秒

// 再試行設定
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1秒

// 強化されたAPIクライアント
const enhancedClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// リクエストインターセプター - データ送信前に検証・修正
enhancedClient.interceptors.request.use(
  async (config) => {
    try {
      // URLからテーブル名を推測
      const urlParts = config.url.split('/');
      let tableName = null;
      
      if (urlParts.includes('monthly-reports')) {
        tableName = 'monthly_reports';
      }
      
      // データ変換が必要な場合
      if (tableName && config.data && (config.method === 'post' || config.method === 'put')) {
        config.data = databaseValidator.transformDataForAPI(config.data, tableName);
      }
      
      // デバッグ情報
      if (process.env.NODE_ENV === 'development') {
        console.log(`${config.method.toUpperCase()} リクエスト: ${config.url}`, config.data);
      }
      
      return config;
    } catch (error) {
      console.error('リクエスト前処理エラー:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター - エラーハンドリング強化
enhancedClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 再試行カウンターの初期化
    if (originalRequest.retryCount === undefined) {
      originalRequest.retryCount = 0;
    }
    
    // HTMLレスポンスの検出と処理（JSONParse Error の原因）
    const isHtmlResponse = error.request && 
      error.request.responseText && 
      (error.request.responseText.includes('<!DOCTYPE') || 
       error.request.responseText.includes('<html') ||
       error.request.responseText.includes('<!doctype') ||
       error.request.responseText.includes('<HTML'));
    
    // Content-Type ヘッダーもチェック
    const contentType = error.response?.headers?.['content-type'] || '';
    const isHtmlContentType = contentType.includes('text/html');
    
    if (isHtmlResponse || isHtmlContentType) {
      console.error('HTML形式のレスポンスを検出しました (JSONが期待される場所):', {
        url: originalRequest.url,
        method: originalRequest.method,
        status: error.response?.status || 'unknown',
        contentType: contentType,
        responsePreview: error.request.responseText ? 
          error.request.responseText.substring(0, 200) + '...' : 
          '(レスポンステキストなし)'
      });
      
      error.isHtmlResponse = true;
      error.userMessage = '無効なAPIレスポンス: サーバーがJSONの代わりにHTMLを返しました。';
      
      // 404エラーの場合は、より明確なメッセージを提供
      if (error.response && error.response.status === 404) {
        error.userMessage = `APIエンドポイントが見つかりません: ${originalRequest.url}`;
        console.error(`存在しないAPIエンドポイント: ${originalRequest.url}`);
        
        // リクエストを修正して再試行する可能性を確認
        if (originalRequest.url && !originalRequest.retryWithFixedUrl) {
          // URLの形式を修正して再試行
          const fixedUrl = originalRequest.url.replace(/\/+/g, '/').replace(/^\/?/, '/');
          if (fixedUrl !== originalRequest.url) {
            console.log(`URL形式を修正して再試行: ${originalRequest.url} → ${fixedUrl}`);
            originalRequest.url = fixedUrl;
            originalRequest.retryWithFixedUrl = true;
            return enhancedClient(originalRequest);
          }
        }
      }
      
      return Promise.reject(error);
    }
    
    // JSONパースエラーの特別処理
    if (error.message && error.message.includes('Unexpected token')) {
      console.error('JSONパースエラー:', error.message);
      error.isJsonParseError = true;
      error.userMessage = 'レスポンスデータを解析できませんでした。サーバーレスポンスが不正です。';
      return Promise.reject(error);
    }
    
    // サーバーエラー（500）と再試行回数が上限以下の場合
    if (error.response && error.response.status === 500 && 
        originalRequest.retryCount < MAX_RETRIES) {
      
      originalRequest.retryCount += 1;
      
      // 再試行前にしばらく待機
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      console.log(`API再試行 (${originalRequest.retryCount}/${MAX_RETRIES}):`, originalRequest.url);
      
      return enhancedClient(originalRequest);
    }
    
    // エラーの詳細を整形
    let errorMessage = '通信エラーが発生しました';
    
    if (error.response) {
      // サーバーからのレスポンスがある場合
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data && typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else {
        errorMessage = `サーバーエラー (${error.response.status})`;
      }
      
      // データベースエラーの詳細（PostgreSQLなど）
      if (error.response.data && error.response.data.error) {
        console.error('データベースエラー詳細:', error.response.data.error);
        
        // カラム 'notes' が存在しないエラーを特別に処理
        if (error.response.data.error.includes('column "notes" of relation "monthly_reports" does not exist')) {
          // データを修正して再度リクエスト
          if (originalRequest.data) {
            const data = JSON.parse(originalRequest.data);
            if (data.notes !== undefined) {
              const { notes, ...fixedData } = data;
              originalRequest.data = JSON.stringify(fixedData);
              
              console.log('notesフィールドを除外して再試行します');
              return enhancedClient(originalRequest);
            }
          }
        }
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない
      errorMessage = 'サーバーに接続できません。ネットワーク接続を確認してください。';
    } else {
      // リクエスト設定時にエラーが発生
      errorMessage = error.message;
    }
    
    error.userMessage = errorMessage;
    return Promise.reject(error);
  }
);

export default enhancedClient;