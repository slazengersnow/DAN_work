/**
 * ローカルストレージにデータを安全に保存する
 * @param key ストレージのキー
 * @param value 保存する値
 * @returns 保存が成功したかどうか
 */
export const saveToLocalStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('ストレージアクセスエラー:', error);
    // 代替処理をここに追加
    return false;
  }
};

/**
 * ローカルストレージからデータを安全に取得する
 * @param key ストレージのキー
 * @param defaultValue デフォルト値
 * @returns 取得した値またはデフォルト値
 */
export const getFromLocalStorage = (key: string, defaultValue: string | null = null): string | null => {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    console.error('ストレージアクセスエラー:', error);
    return defaultValue;
  }
};

/**
 * ローカルストレージからデータを安全に削除する
 * @param key ストレージのキー
 * @returns 削除が成功したかどうか
 */
export const removeFromLocalStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('ストレージアクセスエラー:', error);
    return false;
  }
};