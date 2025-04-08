// src/pages/MonthlyReport/SummaryTab.tsx
import React, { useState, useEffect, useContext } from 'react';
import { MonthlyTotal } from './types';
import { YearMonthContext } from './YearMonthContext';
import { 
  updateMonthlySummary, 
  confirmMonthlyReport, 
  handleApiError 
} from '../../api/reportApi';

interface SummaryTabProps {
  summaryData: MonthlyTotal;
  onSummaryChange: (data: MonthlyTotal) => void;
  onRefreshData?: () => void;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ summaryData, onSummaryChange, onRefreshData }) => {
  console.log('SummaryTab.tsx loaded at:', new Date().toISOString());
  
  // 年月コンテキストから現在の年月を取得
  const { fiscalYear, month } = useContext(YearMonthContext);
  
  // 編集モード状態
  const [isEditing, setIsEditing] = useState<boolean>(false);
  console.log("SummaryTab コンポーネントがマウントされました。isEditing初期値:", false);
  
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // エラーメッセージ状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 確定処理中状態
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // ローカルデータ
  const [localData, setLocalData] = useState<MonthlyTotal>(summaryData);

  // props変更時にローカルデータを更新
  useEffect(() => {
    setLocalData(summaryData);
  }, [summaryData]);

  // フィールド更新ハンドラー
  const handleFieldChange = (field: keyof MonthlyTotal, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    setLocalData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'status' ? 
        (isNaN(numValue) ? 0 : numValue) : value
    }));
  };

  // 編集モード切り替え
  const toggleEditMode = () => {
    if (isEditing) {
      // 編集モードを終了する場合、ローカルデータを元に戻す
      setLocalData(summaryData);
      setErrorMessage(null);
    }
    setIsEditing(!isEditing);
  };

  // 保存ボタンのハンドラー
  const handleSave = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // フォームデータの検証
      if (localData.legal_employment_rate <= 0) {
        throw new Error('法定雇用率は0より大きい値を入力してください');
      }
      
      // API呼び出し
      const updatedData = await updateMonthlySummary(fiscalYear, month, {
        employees_count: localData.employees_count,
        fulltime_count: localData.fulltime_count,
        parttime_count: localData.parttime_count,
        level1_2_count: localData.level1_2_count,
        other_disability_count: localData.other_disability_count,
        level1_2_parttime_count: localData.level1_2_parttime_count,
        other_parttime_count: localData.other_parttime_count,
        legal_employment_rate: localData.legal_employment_rate
      });
      
      // 更新されたデータを親コンポーネントに通知
      onSummaryChange(updatedData);
      
      // データ更新後に親コンポーネントに通知
      if (onRefreshData) {
        onRefreshData();
      }
      
      setIsEditing(false);
      alert('サマリーデータを保存しました');
    } catch (error) {
      console.error('サマリーデータ保存エラー:', error);
      setErrorMessage(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // 確定ボタンのハンドラー
  const handleConfirm = async () => {
    if (window.confirm('このレポートを確定しますか？確定後は編集できなくなります。')) {
      setIsConfirming(true);
      setErrorMessage(null);
      
      try {
        // API呼び出し
        const confirmedData = await confirmMonthlyReport(fiscalYear, month);
        
        // 更新されたデータを親コンポーネントに通知
        onSummaryChange(confirmedData);
        
        // データ更新後に親コンポーネントに通知
        if (onRefreshData) {
          onRefreshData();
        }
        
        alert('レポートを確定しました');
      } catch (error) {
        console.error('レポート確定エラー:', error);
        setErrorMessage(handleApiError(error));
      } finally {
        setIsConfirming(false);
      }
    }
  };

  // 状態の取得
  const { status } = localData;
  const isConfirmed = status === '確定済';

  // 日付フォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="summary-tab-container">
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>月次レポートサマリー</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button"
            onClick={toggleEditMode}
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={isLoading || isConfirming || isConfirmed}
          >
            {isEditing ? '編集中止' : '編集'}
          </button>
          
          {isEditing && (
            <button 
              type="button"
              onClick={handleSave}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#3a66d4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          )}
          
          {!isEditing && !isConfirmed && (
            <button 
              type="button"
              onClick={handleConfirm}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={isConfirming}
            >
              {isConfirming ? '確定中...' : '確定する'}
            </button>
          )}
        </div>
      </div>
      
      {/* エラーメッセージ */}
      {errorMessage && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px' 
        }}>
          {errorMessage}
        </div>
      )}
      
      {/* ローディングインジケーター */}
      {(isLoading || isConfirming) && (
        <div style={{ 
          backgroundColor: '#e9ecef', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          データを処理中...
        </div>
      )}
      
      {/* ステータス表示 */}
      <div style={{ 
        marginBottom: '1rem', 
        backgroundColor: isConfirmed ? '#d1e7dd' : '#fff3cd',
        color: isConfirmed ? '#0f5132' : '#664d03',
        padding: '10px', 
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <div>
          <strong>ステータス:</strong> {status || '未確定'}
        </div>
        <div>
          <strong>更新日時:</strong> {formatDate(localData.updated_at)}
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #dee2e6', 
        borderRadius: '4px', 
        padding: '20px',
        marginBottom: '1rem'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>基本情報</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '20px'
        }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>従業員数</label>
            {isEditing ? (
              <input 
                type="number"
                value={localData.employees_count}
                min="0"
                onChange={(e) => handleFieldChange('employees_count', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                {localData.employees_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>フルタイム従業員数</label>
            {isEditing ? (
              <input 
                type="number"
                value={localData.fulltime_count}
                min="0"
                onChange={(e) => handleFieldChange('fulltime_count', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                {localData.fulltime_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>パートタイム従業員数</label>
            {isEditing ? (
              <input 
                type="number"
                value={localData.parttime_count}
                min="0"
                onChange={(e) => handleFieldChange('parttime_count', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                {localData.parttime_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>法定雇用率</label>
            {isEditing ? (
              <input 
                type="number"
                value={localData.legal_employment_rate}
                min="0"
                step="0.1"
                onChange={(e) => handleFieldChange('legal_employment_rate', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                {localData.legal_employment_rate} %
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #dee2e6', 
        borderRadius: '4px', 
        padding: '20px'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>障がい者雇用情報</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '20px'
        }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>重度身体障がい者・重度知的障がい者</label>
            {isEditing ? (
              <input 
                type="number"
                value={localData.level1_2_count}
                min="0"
                onChange={(e) => handleFieldChange('level1_2_count', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                {localData.level1_2_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>その他障がい者</label>
            {isEditing ? (
              <input 
                type="number"
                value={localData.other_disability_count}
                min="0"
                onChange={(e) => handleFieldChange('other_disability_count', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                {localData.other_disability_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>重度身体障がい者・重度知的障がい者（パートタイム）</label>
            {isEditing ? (
              <input 
                type="number"
                value={localData.level1_2_parttime_count}
                min="0"
                onChange={(e) => handleFieldChange('level1_2_parttime_count', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                {localData.level1_2_parttime_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>その他障がい者（パートタイム）</label>
            {isEditing ? (
              <input 
                type="number"
                value={localData.other_parttime_count}
                min="0"
                onChange={(e) => handleFieldChange('other_parttime_count', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                {localData.other_parttime_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>障がい者合計</label>
            <div style={{ 
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
              fontWeight: 'bold'
            }}>
              {localData.total_disability_count} 名
            </div>
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>実雇用率</label>
            <div style={{ 
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
              fontWeight: 'bold',
              color: localData.employment_rate < localData.legal_employment_rate ? 'red' : 'green'
            }}>
              {localData.employment_rate.toFixed(2)} %
            </div>
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>法定雇用者数</label>
            <div style={{ 
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}>
              {localData.required_count} 名
            </div>
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>超過・未達</label>
            <div style={{ 
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
              color: localData.over_under_count < 0 ? 'red' : 'green'
            }}>
              {localData.over_under_count} 名
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;