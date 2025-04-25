// src/utils/storageManager.js

class StorageManager {
  constructor() {
    // ストレージ利用可能性チェック
    this.storageAvailable = this._checkStorageAvailability();
    
    // フォールバックメカニズム
    this.memoryStorage = new Map();
  }
  
  // ストレージ利用可能性チェック機能
  _checkStorageAvailability() {
    try {
      const storage = window.localStorage;
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('ローカルストレージが利用できません:', e);
      return false;
    }
  }
  
  // キーに年度情報を含める（データ分別管理用）
  _getKeyWithYear(key, fiscalYear) {
    return `fy${fiscalYear}_${key}`;
  }
  
  // データ保存
  setItem(key, value, fiscalYear) {
    const yearKey = this._getKeyWithYear(key, fiscalYear);
    
    try {
      if (this.storageAvailable) {
        window.localStorage.setItem(yearKey, JSON.stringify(value));
      } else {
        this.memoryStorage.set(yearKey, value);
      }
      return true;
    } catch (e) {
      console.error('データ保存エラー:', e);
      this.memoryStorage.set(yearKey, value); // フォールバック
      return false;
    }
  }
  
  // データ取得
  getItem(key, fiscalYear) {
    const yearKey = this._getKeyWithYear(key, fiscalYear);
    
    try {
      if (this.storageAvailable) {
        const item = window.localStorage.getItem(yearKey);
        return item ? JSON.parse(item) : null;
      } else {
        return this.memoryStorage.get(yearKey) || null;
      }
    } catch (e) {
      console.error('データ取得エラー:', e);
      return this.memoryStorage.get(yearKey) || null;
    }
  }
  
  // 年度のすべてのデータを取得
  getAllItemsByYear(fiscalYear) {
    const prefix = `fy${fiscalYear}_`;
    const result = {};
    
    try {
      if (this.storageAvailable) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key.startsWith(prefix)) {
            const originalKey = key.substring(prefix.length);
            const value = JSON.parse(window.localStorage.getItem(key));
            result[originalKey] = value;
          }
        }
      } else {
        this.memoryStorage.forEach((value, key) => {
          if (key.startsWith(prefix)) {
            const originalKey = key.substring(prefix.length);
            result[originalKey] = value;
          }
        });
      }
      return result;
    } catch (e) {
      console.error('年度データ取得エラー:', e);
      
      // メモリストレージからフォールバック
      const memoryResult = {};
      this.memoryStorage.forEach((value, key) => {
        if (key.startsWith(prefix)) {
          const originalKey = key.substring(prefix.length);
          memoryResult[originalKey] = value;
        }
      });
      return memoryResult;
    }
  }
  
  // データ削除
  removeItem(key, fiscalYear) {
    const yearKey = this._getKeyWithYear(key, fiscalYear);
    
    try {
      if (this.storageAvailable) {
        window.localStorage.removeItem(yearKey);
      }
      this.memoryStorage.delete(yearKey);
      return true;
    } catch (e) {
      console.error('データ削除エラー:', e);
      this.memoryStorage.delete(yearKey); // フォールバック
      return false;
    }
  }
  
  // 年度データ一括削除
  clearYear(fiscalYear) {
    const prefix = `fy${fiscalYear}_`;
    
    try {
      if (this.storageAvailable) {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        
        // 削除操作は別ループで実行（インデックスがずれるため）
        keysToRemove.forEach(key => {
          window.localStorage.removeItem(key);
        });
      }
      
      // メモリストレージも削除
      const memoryKeysToRemove = [];
      this.memoryStorage.forEach((_, key) => {
        if (key.startsWith(prefix)) {
          memoryKeysToRemove.push(key);
        }
      });
      
      memoryKeysToRemove.forEach(key => {
        this.memoryStorage.delete(key);
      });
      
      return true;
    } catch (e) {
      console.error('年度データ削除エラー:', e);
      return false;
    }
  }
}

// シングルトンとしてエクスポート
export default new StorageManager();