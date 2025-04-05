// フロントエンドのsrc/utils/apiConfig.ts（なければ作成）
export const API_BASE_URL = 'http://localhost:5001/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const fetchData = async (endpoint: string, options: RequestOptions = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};