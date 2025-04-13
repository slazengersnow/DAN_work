// paymentReportApi.ts
import client from './client';

// 納付金レポートの型定義
export interface PaymentReport {
  id?: number;
  year?: number;
  fiscal_year?: number;
  company_name?: string;
  company_address?: string;
  representative_name?: string;
  total_employees?: number;
  disabled_employees?: number;
  employment_rate?: number;
  legal_employment_rate?: number;
  shortage_count?: number;
  payment_amount?: number;
  status?: string;
  notes?: string;
  company_data?: any;
  monthly_data?: any;
  bank_info?: any;
  type?: string;
  application_date?: string;
  payment_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Axiosエラーの型定義
interface AxiosError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
  config?: {
    url?: string;
    baseURL?: string;
  };
}

// 全ての納付金レポートを取得
export const getAllPaymentReports = async (): Promise<PaymentReport[]> => {
  try {
    const response = await client.get('/payment-reports'); // 修正済みパス
    return response.data;
  } catch (error) {
    console.error('納付金レポート取得エラー:', error);
    throw error;
  }
};

// 特定年度の納付金レポートを取得
export const getPaymentReport = async (year: number): Promise<PaymentReport> => {
  try {
    // 実際のAPIパスをコンソールに出力して確認
    console.log(`APIパス: /payment-reports/${year}`);
    const response = await client.get(`/payment-reports/${year}`);
    return response.data;
  } catch (error) {
    console.error(`${year}年度の納付金レポート取得エラー:`, error);
    
    // APIパスのデバッグ
    if (error && typeof error === 'object' && 'config' in error) {
      const axiosError = error as AxiosError;
      console.log('リクエストURL:', axiosError.config?.url);
      console.log('リクエストベースURL:', axiosError.config?.baseURL);
    }
    
    throw error;
  }
};

// 納付金レポートを保存
export const savePaymentReport = async (year: number, data: any): Promise<PaymentReport> => {
  try {
    console.log(`${year}年度のデータを保存します:`, data);
    
    // データの整形 - monthly_dataの処理
    let processedData = { ...data };
    
    // monthly_dataフィールドの処理
    if (processedData.monthly_data) {
      // monthly_dataが文字列の場合
      if (typeof processedData.monthly_data === 'string') {
        try {
          // 既にJSON文字列かチェック
          JSON.parse(processedData.monthly_data);
          // 有効なJSONならそのまま使用
        } catch (e) {
          // パースエラーなら文字列化が必要
          console.log('monthly_dataの文字列が不正なため再変換します');
          processedData.monthly_data = JSON.stringify(processedData.monthly_data);
        }
      } 
      // monthly_dataがオブジェクトの場合は文字列化
      else if (typeof processedData.monthly_data === 'object') {
        console.log('monthly_dataをJSON文字列に変換します');
        processedData.monthly_data = JSON.stringify(processedData.monthly_data);
      }
    }
    
    // company_dataフィールドの処理
    if (processedData.company_data && typeof processedData.company_data === 'object') {
      console.log('company_dataをJSON文字列に変換します');
      processedData.company_data = JSON.stringify(processedData.company_data);
    }
    
    // bank_infoフィールドの処理
    if (processedData.bank_info && typeof processedData.bank_info === 'object') {
      console.log('bank_infoをJSON文字列に変換します');
      processedData.bank_info = JSON.stringify(processedData.bank_info);
    }
    
    // データ型の調整
    if (processedData.year && typeof processedData.year === 'string') {
      processedData.year = parseInt(processedData.year.replace('年度', ''), 10);
    }
    
    if (processedData.fiscal_year && typeof processedData.fiscal_year === 'string') {
      processedData.fiscal_year = parseInt(processedData.fiscal_year.replace('年度', ''), 10);
    }
    
    console.log('整形後のデータ:', processedData);
    
    // 既存のレポートを更新する場合はPUT、新規作成の場合はPOSTを使用
    let response;
    try {
      // 既存のレポートを確認
      await getPaymentReport(year);
      // 既存のレポートがある場合は更新
      console.log(`${year}年度のデータを更新します`);
      console.log(`APIパス: /payment-reports/${year}`);
      response = await client.put(`/payment-reports/${year}`, processedData);
    } catch (e) {
      // 既存のレポートがない場合は新規作成
      console.log(`${year}年度のデータを新規作成します`);
      console.log(`APIパス: /payment-reports/${year}`);
      response = await client.post(`/payment-reports/${year}`, processedData);
    }
    
    return response.data;
  } catch (error: unknown) {
    console.error('保存エラー詳細:', error);
    
    // APIパスのデバッグ
    if (error && typeof error === 'object' && 'config' in error) {
      const axiosError = error as AxiosError;
      console.log('リクエストURL:', axiosError.config?.url);
      console.log('リクエストベースURL:', axiosError.config?.baseURL);
    }
    
    // エラーの型を絞り込む
    if (error && typeof error === 'object') {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 500) {
        throw new Error('サーバーでエラーが発生しました。しばらく経ってから再度お試しください。');
      } else if (axiosError.response?.status === 400) {
        throw new Error('入力データに問題があります。データ形式を確認してください。');
      } else if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else if ('message' in axiosError && typeof axiosError.message === 'string') {
        throw new Error(axiosError.message);
      }
    }
    
    // デフォルトのエラーメッセージ
    throw new Error('納付金レポートの保存に失敗しました。');
  }
};

// 納付金レポートの状態を「確定済み」に更新
export const finalizePaymentReport = async (year: number): Promise<PaymentReport> => {
  try {
    console.log(`APIパス: /payment-reports/${year}/finalize`);
    const response = await client.put(`/payment-reports/${year}/finalize`);
    return response.data;
  } catch (error) {
    console.error(`${year}年度の納付金レポート確定処理エラー:`, error);
    
    // APIパスのデバッグ
    if (error && typeof error === 'object' && 'config' in error) {
      const axiosError = error as AxiosError;
      console.log('リクエストURL:', axiosError.config?.url);
      console.log('リクエストベースURL:', axiosError.config?.baseURL);
    }
    
    throw error;
  }
};

// 納付金レポートのCSVインポート
export const importPaymentReports = async (csvData: any[]): Promise<void> => {
  try {
    console.log(`APIパス: /payment-reports/import`);
    await client.post('/payment-reports/import', { data: csvData });
  } catch (error) {
    console.error('納付金レポートCSVインポートエラー:', error);
    
    // APIパスのデバッグ
    if (error && typeof error === 'object' && 'config' in error) {
      const axiosError = error as AxiosError;
      console.log('リクエストURL:', axiosError.config?.url);
      console.log('リクエストベースURL:', axiosError.config?.baseURL);
    }
    
    throw error;
  }
};

// paymentReportApiオブジェクトの作成
export const paymentReportApi = {
  getAllPaymentReports,
  getPaymentReport,
  savePaymentReport,
  finalizePaymentReport,
  importPaymentReports
};

export default paymentReportApi;