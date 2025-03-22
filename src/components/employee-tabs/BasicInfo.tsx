// src/components/employee-tabs/BasicInfo.tsx
import React, { useState, ChangeEvent } from 'react';
import { TabProps, EraType } from '../../types/Employee';

const BasicInfo: React.FC<TabProps> = ({ employeeData, onUpdate }) => {
  const [formData, setFormData] = useState({
    employeeId: employeeData.employeeId || '',
    name: employeeData.name || '',
    nameKana: employeeData.nameKana || '',
    gender: employeeData.gender || '1', // 1:男性, 2:女性
    birthYear: employeeData.birthYear || '',
    birthMonth: employeeData.birthMonth || '',
    birthDay: employeeData.birthDay || '',
    eraType: employeeData.eraType || '昭和' as EraType,
    address: employeeData.address || '',
    phone: employeeData.phone || '',
    email: employeeData.email || '',
    managementType: employeeData.managementType || '通常',
    // 以下、緊急連絡先情報
    emergencyContactName: employeeData.emergencyContactName || '',
    emergencyContactRelation: employeeData.emergencyContactRelation || '配偶者',
    emergencyContactPhone: employeeData.emergencyContactPhone || '',
    emergencyContactAddress: employeeData.emergencyContactAddress || '',
    // 以下、責任者情報
    supervisorName: employeeData.supervisorName || '',
    supervisorPosition: employeeData.supervisorPosition || '',
    supervisorPhone: employeeData.supervisorPhone || '',
  });

  // フォーム入力の変更処理
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 親コンポーネントにデータ更新を通知
    onUpdate({ [name]: value });
  };

  return (
    <div className="basic-info-tab">
      <div className="info-section-grid">
        {/* 社員サマリー */}
        <div className="info-summary">
          <h3 className="section-subtitle">社員サマリー</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <label>社員ID</label>
              <div>{formData.employeeId}</div>
            </div>
            <div className="summary-item">
              <label>氏名</label>
              <div>{formData.name}</div>
            </div>
            <div className="summary-item">
              <label>障害種別</label>
              <div>{employeeData.disabilityType}</div>
            </div>
            <div className="summary-item">
              <label>等級</label>
              <div>{employeeData.grade}</div>
            </div>
            <div className="summary-item">
              <label>カウント</label>
              <div>{employeeData.count}</div>
            </div>
            <div className="summary-item">
              <label>ステータス</label>
              <div className={`status-badge ${employeeData.status === '在籍中' ? 'active' : 'inactive'}`}>
                {employeeData.status}
              </div>
            </div>
          </div>
        </div>

        {/* 社員基本情報 */}
        <div className="info-details">
          <h3 className="section-subtitle">社員基本情報</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>社員ID</label>
              <input 
                type="text" 
                name="employeeId" 
                value={formData.employeeId} 
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
                  <option value="1">男：1</option>
                  <option value="2">女：2</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>氏名</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>氏名（カタカナ）</label>
              <input 
                type="text" 
                name="nameKana" 
                value={formData.nameKana} 
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group birthdate-group">
              <label>生年月日</label>
              <div className="date-inputs">
                <div className="select-wrapper era-select">
                  <select 
                    name="eraType" 
                    value={formData.eraType} 
                    onChange={handleChange}
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
                  name="birthYear" 
                  value={formData.birthYear} 
                  onChange={handleChange}
                  className="form-control year-input"
                  min="1"
                  max="99"
                />
                <span>年</span>
                <input 
                  type="number" 
                  name="birthMonth" 
                  value={formData.birthMonth} 
                  onChange={handleChange}
                  className="form-control month-input"
                  min="1"
                  max="12"
                />
                <span>月</span>
                <input 
                  type="number" 
                  name="birthDay" 
                  value={formData.birthDay} 
                  onChange={handleChange}
                  className="form-control day-input"
                  min="1"
                  max="31"
                />
                <span>日</span>
              </div>
            </div>
            <div className="form-group">
              <label>管理区分</label>
              <div className="select-wrapper">
                <select 
                  name="managementType" 
                  value={formData.managementType} 
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="通常">通常</option>
                  <option value="特別">特別</option>
                </select>
              </div>
            </div>
          </div>

          {/* 連絡先情報 */}
          <h4 className="subsection-title">連絡先情報</h4>
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
                type="text" 
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

          {/* 緊急連絡先 */}
          <h4 className="subsection-title">緊急連絡先</h4>
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
              <div className="select-wrapper">
                <select 
                  name="emergencyContactRelation" 
                  value={formData.emergencyContactRelation} 
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="配偶者">配偶者</option>
                  <option value="父親">父親</option>
                  <option value="母親">母親</option>
                  <option value="子供">子供</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>電話番号</label>
              <input 
                type="text" 
                name="emergencyContactPhone" 
                value={formData.emergencyContactPhone} 
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group full-width">
              <label>住所</label>
              <input 
                type="text" 
                name="emergencyContactAddress" 
                value={formData.emergencyContactAddress} 
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>

          {/* 責任者情報 */}
          <h4 className="subsection-title">責任者情報</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>責任者氏名</label>
              <input 
                type="text" 
                name="supervisorName" 
                value={formData.supervisorName} 
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>責任者役職</label>
              <input 
                type="text" 
                name="supervisorPosition" 
                value={formData.supervisorPosition} 
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>責任者連絡先</label>
              <input 
                type="text" 
                name="supervisorPhone" 
                value={formData.supervisorPhone} 
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;