import React, { useState, useEffect } from 'react';
import { MonthlyTotal } from './types';
import { useYearMonth } from './YearMonthContext';
import { 
  updateMonthlySummary, 
  confirmMonthlyReport,
  createMonthlyReport,
  handleApiError 
} from '../../api/reportApi';

// 親コンポーネントから受け取るpropsの型定義
interface SummaryTabProps {
  summaryData: MonthlyTotal | null;
  onSummaryChange: (data: MonthlyTotal) => void;
  onRefreshData?: () => void;
  isEditing?: boolean;
  onToggleEditMode?: () => void;
  onSaveSuccess?: () => void;
  editingStyles?: any;
  buttonStyles?: any;
}

// デフォルトのサマリーデータ
const defaultSummaryData: MonthlyTotal = {
  id: 0,
  fiscal_year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  employees_count: 0,
  fulltime_count: 0,
  parttime_count: 0,
  level1_2_count: 0,
  other_disability_count: 0,
  level1_2_parttime_count: 0,
  other_parttime_count: 0,
  total_disability_count: 0,
  employment_rate: 0,
  legal_employment_rate: 2.3,
  required_count: 0,
  over_under_count: 0,
  status: '未確定',
  created_at: '',
  updated_at: ''
};

const SummaryTab: React.FC<SummaryTabProps> = ({ 
  summaryData, 
  onSummaryChange, 
  onRefreshData,
  isEditing: propIsEditing = false,
  onToggleEditMode = () => {},
  onSaveSuccess = () => {},
  editingStyles = {},
  buttonStyles = {}
}) => {
  console.log('SummaryTab.tsx loaded at:', new Date().toISOString());
  
  const { fiscalYear, month } = useYearMonth();
  
  const [isEditing, setIsEditing] = useState<boolean>(propIsEditing);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const [localData, setLocalData] = useState<MonthlyTotal>(summaryData || defaultSummaryData);

  useEffect(() => {
    if (summaryData) {
      setLocalData(summaryData);
      setIsCreating(false);
    } else {
      setLocalData({
        ...defaultSummaryData,
        fiscal_year: fiscalYear,
        month: month
      });
      setIsCreating(true);
    }
  }, [summaryData, fiscalYear, month]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleFieldChange = (field: keyof MonthlyTotal, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    setLocalData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'status' ? 
        (isNaN(numValue) ? 0 : numValue) : value
    }));
  };

  const toggleEditMode = () => {
    if (isEditing) {
      if (summaryData) {
        setLocalData(summaryData);
      } else {
        setLocalData({
          ...defaultSummaryData,
          fiscal_year: fiscalYear,
          month: month
        });
      }
      setErrorMessage(null);
    }
    setIsEditing(!isEditing);
    onToggleEditMode();
  };

  const toggleCreateMode = () => {
    setIsCreating(true);
    setIsEditing(true);
    setLocalData({
      ...defaultSummaryData,
      fiscal_year: fiscalYear,
      month: month
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      if (localData.legal_employment_rate <= 0) {
        throw new Error('法定雇用率は0より大きい値を入力してください');
      }
      
      let updatedData;
      const dataToSend = {
        employees_count: localData.employees_count,
        fulltime_count: localData.fulltime_count,
        parttime_count: localData.parttime_count,
        level1_2_count: localData.level1_2_count,
        other_disability_count: localData.other_disability_count,
        level1_2_parttime_count: localData.level1_2_parttime_count,
        other_parttime_count: localData.other_parttime_count,
        legal_employment_rate: localData.legal_employment_rate
      };
      
      if (isCreating) {
        updatedData = await createMonthlyReport(fiscalYear, month, dataToSend);
        setIsCreating(false);
      } else {
        updatedData = await updateMonthlySummary(fiscalYear, month, dataToSend);
      }
      
      onSummaryChange(updatedData);
      
      if (onRefreshData) {
        onRefreshData();
      }
      
      setIsEditing(false);
      onSaveSuccess();
      
      setSuccessMessage(`サマリーデータを${isCreating ? '作成' : '保存'}しました`);
    } catch (error) {
      console.error('サマリーデータ保存エラー:', error);
      setErrorMessage(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (window.confirm('このレポートを確定しますか？確定後は編集できなくなります。')) {
      setIsConfirming(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      try {
        const confirmedData = await confirmMonthlyReport(fiscalYear, month);
        
        onSummaryChange(confirmedData);
        
        if (onRefreshData) {
          onRefreshData();
        }
        
        setSuccessMessage('レポートを確定しました');
      } catch (error) {
        console.error('レポート確定エラー:', error);
        setErrorMessage(handleApiError(error));
      } finally {
        setIsConfirming(false);
      }
    }
  };

  const status = localData?.status || '未確定';
  const isConfirmed = status === '確定済';

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 数値の安全な表示関数を追加
  const safeToFixed = (value: any, decimals: number = 2): string => {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals);
  };

  if (!summaryData && !isCreating) {
    return (
      <div className="summary-tab-container">
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>月次レポートサマリー</h3>
          <button 
            type="button"
            onClick={toggleCreateMode}
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            新規作成
          </button>
        </div>
        
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center', 
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <p>データがありません。新規作成ボタンからデータを作成してください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-tab-container">
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>月次レポートサマリー</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isCreating && (
            <button 
              type="button"
              onClick={toggleEditMode}
              style={isEditing ? 
                { ...buttonStyles.secondary || { backgroundColor: '#dc3545' }} : 
                { ...buttonStyles.primary || { backgroundColor: '#6c757d' }}
              }
              disabled={isLoading || isConfirming || isConfirmed}
              aria-label={isEditing ? '編集中止' : '編集開始'}
            >
              {isEditing ? '編集中止' : '編集'}
            </button>
          )}
          
          {isEditing && (
            <button 
              type="button"
              onClick={handleSave}
              style={{ 
                ...(buttonStyles.success || { backgroundColor: '#3a66d4' }),
                padding: '8px 16px',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={isLoading}
              aria-label="変更を保存"
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          )}
          
          {!isEditing && !isConfirmed && !isCreating && (
            <button 
              type="button"
              onClick={handleConfirm}
              style={{ 
                ...(buttonStyles.success || { backgroundColor: '#28a745' }),
                padding: '8px 16px',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={isConfirming}
              aria-label="レポートを確定"
            >
              {isConfirming ? '確定中...' : '確定する'}
            </button>
          )}
        </div>
      </div>
      
      {successMessage && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          transition: 'all 0.3s ease'
        }} role="status" aria-live="polite">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px' 
        }} role="alert">
          {errorMessage}
        </div>
      )}
      
      {(isLoading || isConfirming) && (
        <div style={{ 
          backgroundColor: '#e9ecef', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          textAlign: 'center'
        }} role="status" aria-live="polite">
          データを処理中...
        </div>
      )}
      
      {!isCreating && (
        <div style={{ 
          marginBottom: '1rem', 
          backgroundColor: isConfirmed ? '#d1e7dd' : '#fff3cd',
          color: isConfirmed ? '#0f5132' : '#664d03',
          padding: '10px', 
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-between'
        }} role="status">
          <div>
            <strong>ステータス:</strong> {status || '未確定'}
          </div>
          <div>
            <strong>更新日時:</strong> {formatDate(localData.updated_at)}
          </div>
        </div>
      )}
      
      <div style={{ 
        ...(editingStyles.container || {}),
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
            <label style={{ display: 'block', marginBottom: '5px' }} htmlFor="employees-count">従業員数</label>
            {isEditing ? (
              <input 
                id="employees-count"
                type="number"
                value={localData.employees_count}
                min="0"
                onChange={(e) => handleFieldChange('employees_count', e.target.value)}
                style={{ 
                  ...(editingStyles.input || {}),
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
                aria-required="true"
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }} aria-label="従業員数">
                {localData.employees_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }} htmlFor="fulltime-count">フルタイム従業員数</label>
            {isEditing ? (
              <input 
                id="fulltime-count"
                type="number"
                value={localData.fulltime_count}
                min="0"
                onChange={(e) => handleFieldChange('fulltime_count', e.target.value)}
                style={{ 
                  ...(editingStyles.input || {}),
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
                aria-required="true"
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }} aria-label="フルタイム従業員数">
                {localData.fulltime_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }} htmlFor="parttime-count">パートタイム従業員数</label>
            {isEditing ? (
              <input 
                id="parttime-count"
                type="number"
                value={localData.parttime_count}
                min="0"
                onChange={(e) => handleFieldChange('parttime_count', e.target.value)}
                style={{ 
                  ...(editingStyles.input || {}),
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
                aria-required="true"
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }} aria-label="パートタイム従業員数">
                {localData.parttime_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }} htmlFor="legal-rate">法定雇用率</label>
            {isEditing ? (
              <input 
                id="legal-rate"
                type="number"
                value={localData.legal_employment_rate}
                min="0.1"
                step="0.1"
                onChange={(e) => handleFieldChange('legal_employment_rate', e.target.value)}
                style={{ 
                  ...(editingStyles.input || {}),
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
                aria-required="true"
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }} aria-label="法定雇用率">
                {localData.legal_employment_rate} %
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ 
        ...(editingStyles.container || {}),
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
            <label style={{ display: 'block', marginBottom: '5px' }} htmlFor="level1-2-count">1級・2級の障がい者</label>
            {isEditing ? (
              <input 
                id="level1-2-count"
                type="number"
                value={localData.level1_2_count}
                min="0"
                onChange={(e) => handleFieldChange('level1_2_count', e.target.value)}
                style={{ 
                  ...(editingStyles.input || {}),
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
                aria-required="true"
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }} aria-label="重度身体障がい者・重度知的障がい者">
                {localData.level1_2_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }} htmlFor="other-disability-count">その他障がい者</label>
            {isEditing ? (
              <input 
                id="other-disability-count"
                type="number"
                value={localData.other_disability_count}
                min="0"
                onChange={(e) => handleFieldChange('other_disability_count', e.target.value)}
                style={{ 
                  ...(editingStyles.input || {}),
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
                aria-required="true"
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }} aria-label="その他障がい者">
                {localData.other_disability_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }} htmlFor="level1-2-parttime-count">1級・2級の障がい者（パートタイム）</label>
            {isEditing ? (
              <input 
                id="level1-2-parttime-count"
                type="number"
                value={localData.level1_2_parttime_count}
                min="0"
                onChange={(e) => handleFieldChange('level1_2_parttime_count', e.target.value)}
                style={{ 
                  ...(editingStyles.input || {}),
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
                aria-required="true"
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }} aria-label="重度身体障がい者・重度知的障がい者（パートタイム）">
                {localData.level1_2_parttime_count} 名
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }} htmlFor="other-parttime-count">その他障がい者（パートタイム）</label>
            {isEditing ? (
              <input 
                id="other-parttime-count"
                type="number"
                value={localData.other_parttime_count}
                min="0"
                onChange={(e) => handleFieldChange('other_parttime_count', e.target.value)}
                style={{ 
                  ...(editingStyles.input || {}),
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
                aria-required="true"
              />
            ) : (
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }} aria-label="その他障がい者（パートタイム）">
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
            }} aria-label="障がい者合計">
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
            }} aria-label="実雇用率">
              {safeToFixed(localData.employment_rate, 2)} %
            </div>
          </div>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px' }}>法定雇用者数</label>
            <div style={{ 
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }} aria-label="法定雇用者数">
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
            }} aria-label="超過・未達">
              {localData.over_under_count < 0 ? '-' : '+'}{Math.abs(localData.over_under_count)} 名
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;