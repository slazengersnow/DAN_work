import apiClient from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

export interface User {
  id: number;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    }
  },
  
  register: async (user: LoginCredentials & { role?: string }): Promise<User> => {
    try {
      const response = await apiClient.post<{ success: boolean, data: User }>('/auth/register', user);
      return response.data.data;
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      throw error;
    }
  },
  
  getProfile: async (): Promise<User> => {
    try {
      const response = await apiClient.get<{ success: boolean, data: User }>('/auth/profile');
      return response.data.data;
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      throw error;
    }
  }
};
