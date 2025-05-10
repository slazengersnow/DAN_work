/**
 * ImportNotificationEnhancer.js - CSVインポート完了通知改善モジュール
 * 
 * このモジュールはCSVインポート成功時の通知を改善し、ユーザーに
 * より明確なフィードバックを提供します。
 * 
 * 主な機能:
 * 1. インポート成功時に明確なフィードバックを提供
 * 2. 更新された年度・月を明示的に表示
 * 3. 更新された月のリストをわかりやすく表示
 * 4. トースト通知とモーダルの両方をサポート
 * 
 * 使用方法:
 * CSVImportModal コンポーネントと統合して使用します。
 * 
 * 作成: 2025年5月
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ImportNotificationEnhancer.css'; // スタイルシートのインポート（後で作成）

/**
 * トースト通知コンポーネント
 */
export const ImportToast = ({ 
  message, 
  type = 'success', 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef(null);
  
  // 自動的に非表示にする
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, onClose]);
  
  // 早期に閉じる
  const handleClose = () => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (onClose) onClose();
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`import-toast import-toast-${type}`}>
      <div className="import-toast-content">
        <div className="import-toast-icon">
          {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </div>
        <div className="import-toast-message">{message}</div>
      </div>
      <button className="import-toast-close" onClick={handleClose}>×</button>
    </div>
  );
};

/**
 * インポート詳細モーダル
 */
export const ImportDetailModal = ({ 
  isOpen, 
  onClose, 
  importDetails 
}) => {
  if (!isOpen) return null;
  
  const {
    year,
    months,
    importedCount,
    updatedCount,
    errorCount,
    totalCount,
    timestamp
  } = importDetails;
  
  // 月のリスト文字列を作成
  const monthsList = months.map(m => {
    const status = m.status === 'new' ? '新規' : m.status === 'updated' ? '更新' : '不明';
    return `${m.month}月 (${status})`;
  }).join(', ');
  
  // 成功率を計算
  const successRate = totalCount > 0 
    ? Math.round(((importedCount + updatedCount) / totalCount) * 100) 
    : 0;
  
  // 日付をフォーマット
  const formattedDate = new Date(timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return (
    <div className="import-detail-overlay">
      <div className="import-detail-modal">
        <div className="import-detail-header">
          <h3>インポート完了レポート</h3>
          <button className="import-detail-close" onClick={onClose}>×</button>
        </div>
        
        <div className="import-detail-body">
          <div className="import-detail-summary">
            <div className="import-detail-year">
              <strong>{year}年度</strong>のデータをインポートしました
            </div>
            
            <div className="import-detail-stats">
              <div className="import-stat">
                <span className="import-stat-label">合計:</span>
                <span className="import-stat-value">{totalCount}件</span>
              </div>
              <div className="import-stat">
                <span className="import-stat-label">新規:</span>
                <span className="import-stat-value">{importedCount}件</span>
              </div>
              <div className="import-stat">
                <span className="import-stat-label">更新:</span>
                <span className="import-stat-value">{updatedCount}件</span>
              </div>
              {errorCount > 0 && (
                <div className="import-stat import-stat-error">
                  <span className="import-stat-label">エラー:</span>
                  <span className="import-stat-value">{errorCount}件</span>
                </div>
              )}
              <div className="import-stat import-stat-percentage">
                <span className="import-stat-label">成功率:</span>
                <span className="import-stat-value">{successRate}%</span>
              </div>
            </div>
          </div>
          
          <div className="import-detail-months">
            <h4>処理された月:</h4>
            <div className="import-months-list">
              {monthsList}
            </div>
          </div>
          
          <div className="import-detail-timestamp">
            <span className="import-timestamp-label">インポート時刻:</span>
            <span className="import-timestamp-value">{formattedDate}</span>
          </div>
        </div>
        
        <div className="import-detail-footer">
          <button className="import-detail-close-btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * インポート通知管理のカスタムフック
 */
export const useImportNotification = () => {
  const [toasts, setToasts] = useState([]);
  const [detailModal, setDetailModal] = useState({ isOpen: false, details: null });
  
  // 一意なIDを生成
  const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // トースト通知を追加
  const addToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);
  
  // トースト通知を削除
  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  // インポート成功通知を表示
  const notifyImportSuccess = useCallback((details) => {
    // デフォルト値
    const importDetails = {
      year: new Date().getFullYear(),
      months: [],
      importedCount: 0,
      updatedCount: 0,
      errorCount: 0,
      totalCount: 0,
      timestamp: new Date(),
      ...details
    };
    
    // 処理された月の数
    const processedMonths = importDetails.months.length;
    
    // トーストメッセージ
    const toastMessage = `${importDetails.year}年度の${processedMonths}ヶ月分のデータをインポートしました`;
    addToast(toastMessage, 'success');
    
    // 詳細モーダルを表示
    setDetailModal({
      isOpen: true,
      details: importDetails
    });
    
    // インポート履歴を保存
    try {
      const importHistory = JSON.parse(localStorage.getItem('importHistory') || '[]');
      const updatedHistory = [
        { ...importDetails, id: generateId() },
        ...importHistory
      ].slice(0, 10); // 最大10件保存
      
      localStorage.setItem('importHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('インポート履歴の保存に失敗しました:', error);
    }
    
    return importDetails;
  }, [addToast]);
  
  // インポートエラー通知を表示
  const notifyImportError = useCallback((errorMessage, errorDetails = {}) => {
    addToast(`インポートエラー: ${errorMessage}`, 'error');
    
    // エラー情報をログに記録
    console.error('CSVインポートエラー:', errorMessage, errorDetails);
    
    return { success: false, message: errorMessage, ...errorDetails };
  }, [addToast]);
  
  // 詳細モーダルを閉じる
  const closeDetailModal = useCallback(() => {
    setDetailModal(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  // インポート詳細から月のリストを生成
  const getMonthsFromImportData = useCallback((importData) => {
    if (!Array.isArray(importData)) return [];
    
    return importData.map(item => {
      return {
        month: item.month,
        status: item.isNew ? 'new' : 'updated'
      };
    });
  }, []);
  
  // インポート処理結果からサマリーを構築
  const createImportSummary = useCallback((results, year) => {
    // results は { newItems, updatedItems, errorItems } または配列
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let months = [];
    let totalCount = 0;
    
    if (Array.isArray(results)) {
      // 配列の場合は各項目の状態から集計
      totalCount = results.length;
      
      results.forEach(item => {
        if (item.error) {
          errorCount++;
        } else if (item.isNew) {
          importedCount++;
        } else {
          updatedCount++;
        }
        
        months.push({
          month: item.month,
          status: item.error ? 'error' : item.isNew ? 'new' : 'updated'
        });
      });
    } else {
      // オブジェクトの場合は各カテゴリから集計
      importedCount = results.newItems?.length || 0;
      updatedCount = results.updatedItems?.length || 0;
      errorCount = results.errorItems?.length || 0;
      totalCount = importedCount + updatedCount + errorCount;
      
      // 月リストを構築
      if (results.newItems) {
        months = months.concat(results.newItems.map(m => ({ month: m.month, status: 'new' })));
      }
      
      if (results.updatedItems) {
        months = months.concat(results.updatedItems.map(m => ({ month: m.month, status: 'updated' })));
      }
      
      if (results.errorItems) {
        months = months.concat(results.errorItems.map(m => ({ month: m.month, status: 'error' })));
      }
    }
    
    return {
      year: year || new Date().getFullYear(),
      months,
      importedCount,
      updatedCount,
      errorCount,
      totalCount,
      timestamp: new Date()
    };
  }, []);
  
  return {
    addToast,
    removeToast,
    notifyImportSuccess,
    notifyImportError,
    closeDetailModal,
    getMonthsFromImportData,
    createImportSummary,
    // コンポーネント描画用
    Toasts: ({ position = 'top-right' }) => (
      <div className={`import-toasts-container import-toasts-${position}`}>
        {toasts.map(toast => (
          <ImportToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    ),
    DetailModal: () => (
      <ImportDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        importDetails={detailModal.details}
      />
    ),
    // 現在の状態
    state: {
      toasts,
      detailModal
    }
  };
};

/**
 * CSVImportModal との統合方法
 * 
 * CSVImportModal.tsx のインポート部分に追加:
 * ```tsx
 * import { useImportNotification } from './ImportNotificationEnhancer';
 * ```
 * 
 * コンポーネント内で:
 * ```tsx
 * const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onImportSuccess, fiscalYear }) => {
 *   // 通知機能を初期化
 *   const importNotification = useImportNotification();
 *   const { Toasts, DetailModal } = importNotification;
 *   
 *   // 既存のimportCSVData関数内で、成功時に:
 *   const importSummary = importNotification.createImportSummary(results, fiscalYear);
 *   importNotification.notifyImportSuccess(importSummary);
 *   
 *   // エラー時:
 *   importNotification.notifyImportError(errorMessage, errorDetails);
 *   
 *   // 戻り値の最後に通知コンポーネントを追加:
 *   return (
 *     <>
 *       <div className="csv-import-modal-overlay">
 *         {/* 既存のモーダル内容 */}
 *       </div>
 *       <Toasts position="top-right" />
 *       <DetailModal />
 *     </>
 *   );
 * };
 * ```
 * 
 * また、スタイルシートが必要です。
 * `ImportNotificationEnhancer.css` を作成してください。
 */

// スタイルシートの内容
const cssContent = `
/* トースト通知のスタイル */
.import-toasts-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.import-toasts-top-right {
  top: 20px;
  right: 20px;
}

.import-toasts-top-left {
  top: 20px;
  left: 20px;
}

.import-toasts-bottom-right {
  bottom: 20px;
  right: 20px;
}

.import-toasts-bottom-left {
  bottom: 20px;
  left: 20px;
}

.import-toast {
  min-width: 280px;
  max-width: 400px;
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  animation: slideIn 0.3s ease forwards;
}

.import-toast-success {
  border-left: 4px solid #52c41a;
}

.import-toast-error {
  border-left: 4px solid #f5222d;
}

.import-toast-info {
  border-left: 4px solid #1890ff;
}

.import-toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.import-toast-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.import-toast-message {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.import-toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  padding: 0;
  margin-left: 8px;
}

.import-toast-close:hover {
  color: #666;
}

/* インポート詳細モーダルのスタイル */
.import-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.import-detail-modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.import-detail-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.import-detail-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.import-detail-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #999;
}

.import-detail-body {
  padding: 20px;
  flex-grow: 1;
}

.import-detail-summary {
  margin-bottom: 20px;
}

.import-detail-year {
  font-size: 16px;
  margin-bottom: 12px;
}

.import-detail-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.import-stat {
  display: flex;
  flex-direction: column;
  min-width: 80px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.import-stat-error {
  background: #fff2f0;
}

.import-stat-percentage {
  background: #e6f7ff;
}

.import-stat-label {
  font-size: 12px;
  color: #666;
}

.import-stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-top: 4px;
}

.import-detail-months {
  margin-bottom: 20px;
}

.import-detail-months h4 {
  font-size: 14px;
  margin: 0 0 8px 0;
  color: #333;
}

.import-months-list {
  background: #f9f9f9;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
}

.import-detail-timestamp {
  font-size: 12px;
  color: #888;
  display: flex;
  gap: 8px;
}

.import-detail-footer {
  padding: 12px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.import-detail-close-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.import-detail-close-btn:hover {
  background: #e8e8e8;
}

@keyframes slideIn {
  from {
    transform: translateX(50px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`;

// スタイルシートを動的に適用（開発用）
if (typeof document !== 'undefined') {
  try {
    const styleId = 'import-notification-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = cssContent;
      document.head.appendChild(styleEl);
    }
  } catch (error) {
    console.warn('スタイルシートの動的適用に失敗しました:', error);
  }
}

export default useImportNotification;