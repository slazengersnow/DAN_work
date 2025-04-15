// frontend/src/api/settingsApi.ts
import apiClient from './client';

// 必要なスキル型定義
export interface Skill {
  name: string;
  level: number;
}

// 職種カテゴリー型定義
export interface JobCategory {
  name: string;
  description: string;
  suitabilityScore: number;
  requiredSkills: Skill[];
}

// 事業所情報型定義
export interface Office {
  id?: number;
  name: string;
  address: string;
  employeeCount: number;
}

// 設定情報の型定義
export interface CompanySettings {
  id?: number;
  company_name: string;  // スネークケース (バックエンド互換)
  company_code: string;
  company_address: string;
  legal_rate: number;
  fiscal_year_start: string;
  fiscal_year_end: string;
  monthly_report_reminder: boolean;
  legal_rate_alert: boolean;
  employment_end_notice: boolean;
  theme: string;
  payment_report_reminder?: boolean;
  
  // フロントエンドのキャメルケース互換プロパティ
  companyName?: string;  // company_nameのエイリアス
  companyAddress?: string;  // company_addressのエイリアス
  representativeName?: string;
  businessContent?: string;
  industryCode?: string;
  
  // 支払い関連
  paymentAmount?: number;
  subsidyAmount?: number;
  rewardAmount?: number;
  exclusionRate?: number;
  
  // 拡張
  legalRates?: { [key: string]: { [key: string]: string } };
  employmentGoals?: { [key: string]: number };
  jobCategories?: JobCategory[];
  offices?: Office[];
}

export interface User {
  id?: number;
  username: string;
  password?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

// キャメルケースとスネークケースの変換ヘルパー
const convertToSnakeCase = (data: any): any => {
  const result: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // キャメルケースをスネークケースに変換
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = data[key];
    }
  }
  return result;
};

const convertToCamelCase = (data: any): any => {
  const result: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // スネークケースをキャメルケースに変換
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = data[key];
      
      // 元のスネークケースも保持 (互換性のため)
      result[key] = data[key];
    }
  }
  return result;
};

export const settingsApi = {
  getCompanySettings: async (): Promise<CompanySettings> => {
    try {
      const response = await apiClient.get('/settings/company');
      // バックエンドのレスポンスに応じてキャメルケースに変換
      const data = convertToCamelCase(response.data.data);
      return data;
    } catch (error) {
      console.log('会社設定は利用できません。デフォルト値を使用します。');
      
      // デフォルト値を返す
      return {
        // APIの既存フィールド
        company_name: "株式会社サンプルカンパニー",
        company_code: "00000",
        company_address: "東京都千代田区〇〇町1-2-3",
        legal_rate: 2.5,
        fiscal_year_start: "04-01",
        fiscal_year_end: "03-31",
        monthly_report_reminder: true,
        legal_rate_alert: true,
        employment_end_notice: true,
        theme: "default",
        payment_report_reminder: true,
        
        // キャメルケース互換フィールド
        companyName: "株式会社サンプルカンパニー",
        companyAddress: "東京都千代田区〇〇町1-2-3",
        
        // 追加フィールド（納付金計算用）
        subsidyAmount: 27000, // 調整金額単価
        paymentAmount: 50000, // 納付金額単価
        rewardAmount: 21000, // 報奨金額単価
        exclusionRate: 0, // 除外率
        
        // 追加の会社情報
        representativeName: "山田 太郎",
        businessContent: "IT・ソフトウェア開発、コンサルティング",
        industryCode: "399（情報サービス）",
        
        // 拡張フィールド
        legalRates: {
          '2024年度': {
            '4月': '2.5', '5月': '2.5', '6月': '2.5', '7月': '2.5', '8月': '2.5', '9月': '2.5',
            '10月': '2.5', '11月': '2.5', '12月': '2.5', '1月': '2.5', '2月': '2.5', '3月': '2.5'
          },
          '2026年度': {
            '4月': '2.5', '5月': '2.5', '6月': '2.5', '7月': '2.7', '8月': '2.7', '9月': '2.7',
            '10月': '2.7', '11月': '2.7', '12月': '2.7', '1月': '2.7', '2月': '2.7', '3月': '2.7'
          }
        },
        employmentGoals: {
          '2023年度': 10,
          '2024年度': 12,
          '2025年度': 15
        },
        jobCategories: [],
        
        // 事業所情報
        offices: [
          {
            id: 1,
            name: "本社",
            address: "東京都千代田区〇〇町1-2-3",
            employeeCount: 350
          },
          {
            id: 2,
            name: "大阪支社",
            address: "大阪府大阪市〇〇区△△町4-5-6",
            employeeCount: 150
          }
        ]
      };
    }
  },
  
  updateCompanySettings: async (settings: CompanySettings): Promise<CompanySettings> => {
    try {
      // キャメルケースをスネークケースに変換してバックエンドに送信
      const snakeCaseData = convertToSnakeCase(settings);
      const response = await apiClient.put('/settings/company', snakeCaseData);
      const data = convertToCamelCase(response.data.data);
      return data;
    } catch (error) {
      console.error('会社設定更新エラー:', error);
      throw error;
    }
  },
  
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get('/settings/users');
      return response.data.data;
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      throw error;
    }
  },
  
  createUser: async (user: User): Promise<User> => {
    try {
      const response = await apiClient.post('/settings/users', user);
      return response.data.data;
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      throw error;
    }
  },
  
  updateUser: async (id: number, user: User): Promise<User> => {
    try {
      const response = await apiClient.put(`/settings/users/${id}`, user);
      return response.data.data;
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      throw error;
    }
  },
  
  deleteUser: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/settings/users/${id}`);
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      throw error;
    }
  },
  
  // パスワード変更メソッドを追加
  changePassword: async (passwordData: any) => {
    try {
      const response = await apiClient.post('/settings/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('パスワード変更エラー:', error);
      throw error;
    }
  }
};

export default settingsApi;