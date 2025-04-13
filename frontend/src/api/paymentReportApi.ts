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
  average_employee_count?: number;
  actual_employment_count?: number;
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
  isAxiosError?: boolean;
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
export const savePaymentReport = async (year: number, data: any): Promise<any> => {
  try {
    console.log(`${year}年度のデータを保存します:`, data);
    
    // データの前処理
    const processedData = { ...data };
    
    // 数値型の変換 - 小数点を保持するように数値フィールドを確実に数値型に
    if (processedData.total_employees !== undefined) {
      processedData.total_employees = Number(processedData.total_employees);
    }
    
    if (processedData.disabled_employees !== undefined) {
      processedData.disabled_employees = Number(processedData.disabled_employees);
    }
    
    if (processedData.average_employee_count !== undefined) {
      processedData.average_employee_count = Number(processedData.average_employee_count);
    }
    
    if (processedData.actual_employment_count !== undefined) {
      processedData.actual_employment_count = Number(processedData.actual_employment_count);
    }
    
    if (processedData.employment_rate !== undefined) {
      processedData.employment_rate = Number(processedData.employment_rate);
    }
    
    // monthly_dataがオブジェクト形式であることを確認
    if (processedData.monthly_data) {
      // 文字列の場合はすでにパースされているかもしれないので、チェックする
      if (typeof processedData.monthly_data === 'string') {
        try {
          processedData.monthly_data = JSON.parse(processedData.monthly_data);
        } catch (error) {
          console.error('monthly_dataのパースエラー:', error);
        }
      }
    }
    
    // company_dataの処理
    if (processedData.company_data && typeof processedData.company_data === 'string') {
      try {
        processedData.company_data = JSON.parse(processedData.company_data);
      } catch (error) {
        console.error('company_dataのパースエラー:', error);
      }
    }
    
    // bank_infoの処理
    if (processedData.bank_info && typeof processedData.bank_info === 'string') {
      try {
        processedData.bank_info = JSON.parse(processedData.bank_info);
      } catch (error) {
        console.error('bank_infoのパースエラー:', error);
      }
    }
    
    // JSON形式を維持するために一部のフィールドを削除
    // id などバックエンドで自動生成されるフィールドは削除
    if (processedData.id) {
      delete processedData.id;
    }
    
    console.log('整形後のデータ:', processedData);
    console.log('APIパス:', `/payment-reports/${year}`);
    
    // 既存データの取得を試みる
    try {
      const checkData = await client.get(`/payment-reports/${year}`);
      
      if (checkData.data) {
        // 既存データが存在する場合は更新（PUT）
        console.log(`${year}年度のデータを更新します`);
        const response = await client.put(`/payment-reports/${year}`, processedData);
        return response.data;
      }
    } catch (error) {
      // データが存在しない場合は作成（POST）
      console.log(`${year}年度のデータを新規作成します`);
      const response = await client.post(`/payment-reports/${year}`, processedData);
      return response.data;
    }
  } catch (error: any) {
    console.error('保存エラー詳細:', error);
    
    if (error.response) {
      console.error('エラーレスポンス:', error.response.status, error.response.data);
    }
    
    throw new Error('サーバーでエラーが発生しました。しばらく経ってから再度お試しください。');
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