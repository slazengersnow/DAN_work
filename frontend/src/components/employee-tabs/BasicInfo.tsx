// frontend/src/components/employee-tabs/BasicInfo.tsx
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { TabProps, EraType } from '../../types/Employee';

// 従業員基本情報コンポーネント
const BasicInfo: React.FC<TabProps> = ({ employeeData, onUpdate, isEditing = false }) => {
  // フォームデータの初期状態を設定
  const [formData, setFormData] = useState({
    // 基本情報
    name: employeeData.name || '',
    nameKana: employeeData.nameKana || '',
    gender: employeeData.gender || '1',
    birthDate: {
      era: employeeData.eraType || '昭和' as EraType,
      year: employeeData.birthYear || '',
      month: employeeData.birthMonth || '',
      day: employeeData.birthDay || '',
    },
    
    // 部署・職位情報
    department: employeeData.department || '',
    position: employeeData.position || '',
    
    // 連絡先情報
    address: employeeData.address || '',
    phone: employeeData.phone || '',
    email: employeeData.email || '',
    
    // 例外事由
    exception: employeeData.exception || '',
    
    // 緊急連絡先情報
    emergencyContactName: employeeData.emergencyContactName || '',
    emergencyContactRelation: employeeData.emergencyContactRelation || '',
    emergencyContactPhone: employeeData.emergencyContactPhone || '',
    
    // 責任者情報
    supervisorName: employeeData.supervisorName || '',
    supervisorPosition: employeeData.supervisorPosition || '',
    supervisorPhone: employeeData.supervisorPhone || '',
  });

  // 編集状態の変更を追跡するための参照
  const prevIsEditingRef = useRef(isEditing);
  
  // 編集モードが変更されたときにデータを更新
  useEffect(() => {
    // 編集モードが終了した時にデータを保存
    if (!isEditing && prevIsEditingRef.current) {
      onUpdate(formData);
    }
    prevIsEditingRef.current = isEditing;
  }, [isEditing, formData, onUpdate]);

  // 通常の入力フィールド（テキスト、選択）の変更ハンドラ
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 日付入力の変更ハンドラ（生年月日など）
  const handleDateChange = (dateType: string, field: string, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [dateType]: {
        ...prev[dateType as keyof typeof prev] as Record<string, string>,
        [field]: value
      }
    }));
  };

  // スタイル定義
  const phoneFieldStyle = {
    width: '50%'
  };

  const inputStyle = {
    padding: '6px 8px',
    borderRadius: '4px',
    border: isEditing ? '1px solid #ddd' : '1px solid transparent',
    backgroundColor: isEditing ? 'white' : '#f8f9fa',
    width: '100%'
  };

  return (
    <div className="basic-info-tab">
      {/* 基本情報セクション */}
      <div className="form-section">
        <h3 className="section-title">基本情報</h3>
        
        {/* 氏名とフリガナ */}
        <div className="form-row">
          <div className="form-group">
            <label>氏名</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-group">
            <label>フリガナ</label>
            <input 
              type="text" 
              name="nameKana" 
              value={formData.nameKana} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
        </div>

        {/* 性別と生年月日 */}
        <div className="form-row">
          <div className="form-group" style={{ width: '50%' }}>
            <label>性別</label>
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              disabled={!isEditing}
            >
              <option value="1">男性</option>
              <option value="2">女性</option>
            </select>
          </div>
          <div className="form-group">
            <label>生年月日</label>
            <div className="date-inputs" style={{ opacity: isEditing ? 1 : 0.9 }}>
              <select 
                value={formData.birthDate.era} 
                onChange={(e) => handleDateChange('birthDate', 'era', e.target.value)}
                className="form-control era-select"
                style={{ ...inputStyle, width: '33%' }}
                disabled={!isEditing}
              >
                <option value="明治">明治</option>
                <option value="大正">大正</option>
                <option value="昭和">昭和</option>
                <option value="平成">平成</option>
                <option value="令和">令和</option>
              </select>
              <input 
                type="text" 
                value={formData.birthDate.year} 
                onChange={(e) => handleDateChange('birthDate', 'year', e.target.value)}
                className="form-control year-input"
                placeholder="年"
                maxLength={2}
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>年</span>
              <input 
                type="text" 
                value={formData.birthDate.month} 
                onChange={(e) => handleDateChange('birthDate', 'month', e.target.value)}
                className="form-control month-input"
                placeholder="月"
                maxLength={2}
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>月</span>
              <input 
                type="text" 
                value={formData.birthDate.day} 
                onChange={(e) => handleDateChange('birthDate', 'day', e.target.value)}
                className="form-control day-input"
                placeholder="日"
                maxLength={2}
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>日</span>
            </div>
          </div>
        </div>

        {/* 部署と職位 */}
        <div className="form-row">
          <div className="form-group">
            <label>部署</label>
            <input 
              type="text" 
              name="department" 
              value={formData.department} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-group" style={{ width: '60%' }}>
            <label>職位</label>
            <input 
              type="text" 
              name="position" 
              value={formData.position} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
        </div>
      </div>

      {/* 連絡先情報セクション */}
      <div className="form-section">
        <h3 className="section-title">連絡先情報</h3>
        <div className="form-group full-width">
          <label>住所</label>
          <input 
            type="text" 
            name="address" 
            value={formData.address} 
            onChange={handleChange}
            className="form-control"
            style={inputStyle}
            readOnly={!isEditing}
          />
        </div>
        <div className="form-row">
          <div className="form-group" style={phoneFieldStyle}>
            <label>電話番号</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-group">
            <label>メールアドレス</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
        </div>
      </div>

      {/* 緊急連絡先セクション */}
      <div className="form-section">
        <h3 className="section-title">緊急連絡先</h3>
        <div className="form-row">
          <div className="form-group">
            <label>氏名</label>
            <input 
              type="text" 
              name="emergencyContactName" 
              value={formData.emergencyContactName} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-group" style={{ width: '50%' }}>
            <label>続柄</label>
            <input 
              type="text" 
              name="emergencyContactRelation" 
              value={formData.emergencyContactRelation} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group" style={phoneFieldStyle}>
            <label>電話番号</label>
            <input 
              type="tel" 
              name="emergencyContactPhone" 
              value={formData.emergencyContactPhone} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-group" style={{ width: '50%' }}>
            {/* 空のスペースでバランスを保つ */}
          </div>
        </div>
      </div>

      {/* 責任者情報セクション */}
      <div className="form-section">
        <h3 className="section-title">責任者情報</h3>
        <div className="form-row">
          <div className="form-group">
            <label>氏名</label>
            <input 
              type="text" 
              name="supervisorName" 
              value={formData.supervisorName} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-group" style={{ width: '60%' }}>
            <label>職位</label>
            <input 
              type="text" 
              name="supervisorPosition" 
              value={formData.supervisorPosition} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group" style={phoneFieldStyle}>
            <label>電話番号</label>
            <input 
              type="tel" 
              name="supervisorPhone" 
              value={formData.supervisorPhone} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-group" style={{ width: '50%' }}>
            {/* 空のスペースでバランスを保つ */}
          </div>
        </div>
      </div>

      {/* 例外事由セクション */}
      <div className="form-section">
        <h3 className="section-title">例外事由</h3>
        <div className="form-group full-width">
          <textarea 
            name="exception" 
            value={formData.exception} 
            onChange={handleChange}
            className="textarea-field"
            placeholder="例外事由を入力してください"
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              border: isEditing ? '1px solid #ddd' : '1px solid transparent',
              backgroundColor: isEditing ? 'white' : '#f8f9fa',
              width: '100%',
              minHeight: '80px',
              resize: 'vertical'
            }}
            readOnly={!isEditing}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;