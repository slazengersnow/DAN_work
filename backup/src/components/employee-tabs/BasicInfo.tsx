import React, { useState, ChangeEvent } from 'react';
import { TabProps, EraType } from '../../types/Employee';

const BasicInfo: React.FC<TabProps> = ({ employeeData, onUpdate }) => {
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

  // フォーム入力の変更処理
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 親コンポーネントにデータ更新を通知
    onUpdate({ [name]: value });
  };

  // 日付入力の変更処理
  const handleDateChange = (dateType: string, field: string, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [dateType]: {
        ...prev[dateType as keyof typeof prev] as Record<string, string>,
        [field]: value
      }
    }));
    
    // 生年月日のフィールド名を変換して親コンポーネントに通知
    const fieldMapping: Record<string, string> = {
      'era': 'eraType',
      'year': 'birthYear',
      'month': 'birthMonth',
      'day': 'birthDay',
    };
    
    onUpdate({ 
      [fieldMapping[field] || field]: value 
    });
  };

  return (
    <div className="basic-info-tab">
      {/* 基本情報 */}
      <div className="personal-info">
        <h3 className="section-subtitle">基本情報</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>氏名</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              className="form-control"
              required
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
            />
          </div>
          <div className="form-group">
            <label>性別</label>
            <div className="select-wrapper">
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange}
                className="form-control"
              >
                <option value="1">男性</option>
                <option value="2">女性</option>
              </select>
            </div>
          </div>
          <div className="form-group date-group">
            <label>生年月日</label>
            <div className="date-inputs">
              <div className="select-wrapper era-select">
                <select 
                  value={formData.birthDate.era} 
                  onChange={(e) => handleDateChange('birthDate', 'era', e.target.value)}
                  className="form-control"
                >
                  <option value="明治">明治</option>
                  <option value="大正">大正</option>
                  <option value="昭和">昭和</option>
                  <option value="平成">平成</option>
                  <option value="令和">令和</option>
                </select>
              </div>
              <input 
                type="number" 
                value={formData.birthDate.year} 
                onChange={(e) => handleDateChange('birthDate', 'year', e.target.value)}
                className="form-control year-input"
                placeholder="年"
                min="1"
                max="99"
              />
              <span>年</span>
              <input 
                type="number" 
                value={formData.birthDate.month} 
                onChange={(e) => handleDateChange('birthDate', 'month', e.target.value)}
                className="form-control month-input"
                placeholder="月"
                min="1"
                max="12"
              />
              <span>月</span>
              <input 
                type="number" 
                value={formData.birthDate.day} 
                onChange={(e) => handleDateChange('birthDate', 'day', e.target.value)}
                className="form-control day-input"
                placeholder="日"
                min="1"
                max="31"
              />
              <span>日</span>
            </div>
          </div>
        </div>
      </div>

      {/* 連絡先情報 */}
      <div className="contact-info">
        <h3 className="section-subtitle">連絡先情報</h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>住所</label>
            <input 
              type="text" 
              name="address" 
              value={formData.address} 
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>電話番号</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange}
              className="form-control"
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
            />
          </div>
        </div>
      </div>

      {/* 緊急連絡先情報 */}
      <div className="emergency-contact">
        <h3 className="section-subtitle">緊急連絡先</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>氏名</label>
            <input 
              type="text" 
              name="emergencyContactName" 
              value={formData.emergencyContactName} 
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>続柄</label>
            <input 
              type="text" 
              name="emergencyContactRelation" 
              value={formData.emergencyContactRelation} 
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>電話番号</label>
            <input 
              type="tel" 
              name="emergencyContactPhone" 
              value={formData.emergencyContactPhone} 
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
      </div>

      {/* 責任者情報 */}
      <div className="supervisor-info">
        <h3 className="section-subtitle">責任者情報</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>氏名</label>
            <input 
              type="text" 
              name="supervisorName" 
              value={formData.supervisorName} 
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>職位</label>
            <input 
              type="text" 
              name="supervisorPosition" 
              value={formData.supervisorPosition} 
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>電話番号</label>
            <input 
              type="tel" 
              name="supervisorPhone" 
              value={formData.supervisorPhone} 
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
      </div>

      {/* 例外事由 - 最下部に移動 */}
      <div className="exception-section">
        <h3 className="section-subtitle">例外事由</h3>
        <div className="form-group full-width">
          <textarea 
            name="exception" 
            value={formData.exception} 
            onChange={handleChange}
            className="form-control exception-textarea"
            placeholder="例外事由を入力してください"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;