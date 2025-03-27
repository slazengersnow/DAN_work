// frontend/src/api/settingsApi.ts
import apiClient from './client';

export interface CompanySettings {
  id?: number;
  company_name: string;
  company_code: string;
  company_address: string;
  legal_rate: number;
  fiscal_year_start: string;
  fiscal_year_end: string;
  monthly_report_reminder: boolean;
  legal_rate_alert: boolean;
  employment_end_notice: boolean;
  theme: string;
}

export interface User {
  id?: number;
  username: string;
  password?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export const settingsApi = {
  getCompanySettings: async (): Promise<CompanySettings> => {
    try {
      const response = await apiClient.get('/settings/company');
      return response.data.data;
    } catch (error) {
      console.error('会社設定取得エラー:', error);
      throw error;
    }
  },
  
  updateCompanySettings: async (settings: CompanySettings): Promise<CompanySettings> => {
    try {
      const response = await apiClient.put('/settings/company', settings);
      return response.data.data;
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
  }
};