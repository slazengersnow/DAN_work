// src/components/employee-tabs/DisabilityInfo.tsx
import React, { useState, ChangeEvent } from 'react';
import { TabProps, EraType } from '../../types/Employee';

const DisabilityInfo: React.FC<TabProps> = ({ employeeData, onUpdate }) => {
  const [disabilityType, setDisabilityType] = useState(employeeData.disabilityType || '身体障害');
  const [formData, setFormData] = useState({
    // 身体障害情報
    physicalGrade: employeeData.physicalGrade || '1級',
    physicalLocation: employeeData.physicalLocation || '視覚',
    physicalCertDate: {
      era: employeeData.physicalCertDateEra || '令和' as EraType,
      year: employeeData.physicalCertDateYear || '',
      month: employeeData.physicalCertDateMonth || '',
      day: employeeData.physicalCertDateDay || ''
    },
    
    // 手帳情報
    certificateNumber: employeeData.certificateNumber || '',
    certificateIssuer: employeeData.certificateIssuer || '東京都',
    certificateExpiry: {
      era: employeeData.certificateExpiryEra || '令和' as EraType,
      year: employeeData.certificateExpiryYear || '',
      month: employeeData.certificateExpiryMonth || '',
      day: employeeData.certificateExpiryDay || ''
    },
    certificateRenewal: {
      era: employeeData.certificateRenewalEra || '令和' as EraType,
      year: employeeData.certificateRenewalYear || '',
      month: employeeData.certificateRenewalMonth || '',
      day: employeeData.certificateRenewalDay || ''
    },
    
    // 配慮事項
    medicalInstructions: employeeData.medicalInstructions || '',
    workplaceConsiderations: employeeData.workplaceConsiderations || ''
  });

  // 障害種別の変更処理
  const handleDisabilityTypeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDisabilityType(e.target.value as any);
    onUpdate({ disabilityType: e.target.value as any });
  };

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
    
    // 親コンポーネントにデータ更新を通知
    onUpdate({ 
      [`${dateType}${field.charAt(0).toUpperCase() + field.slice(1)}`]: value 
    });
  };

  return (
    <div className="disability-info-tab">
      <div className="disability-type-selection">
        <h3 className="section-subtitle">障害種別選択</h3>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="disabilityType"
              value="身体障害"
              checked={disabilityType === '身体障害'}
              onChange={handleDisabilityTypeChange}
            />
            身体障害
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="disabilityType"
              value="知的障害"
              checked={disabilityType === '知的障害'}
              onChange={handleDisabilityTypeChange}
            />
            知的障害
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="disabilityType"
              value="精神障害"
              checked={disabilityType === '精神障害'}
              onChange={handleDisabilityTypeChange}
            />
            精神障害
          </label>
        </div>
      </div>

      {/* 身体障害情報 (条件付きレンダリング) */}
      {disabilityType === '身体障害' && (
        <div className="disability-details">
          <h3 className="section-subtitle">身体障害者情報</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>程度</label>
              <div className="select-wrapper">
                <select 
                  name="physicalGrade" 
                  value={formData.physicalGrade} 
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="1級">1級</option>
                  <option value="2級">2級</option>
                  <option value="3級">3級</option>
                  <option value="4級">4級</option>
                  <option value="5級">5級</option>
                  <option value="6級">6級</option>
                  <option value="7級">7級</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>障害部位</label>
              <div className="select-wrapper">
                <select 
                  name="physicalLocation" 
                  value={formData.physicalLocation} 
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="視覚">視覚</option>
                  <option value="聴覚">聴覚</option>
                  <option value="平衡機能">平衡機能</option>
                  <option value="音声・言語">音声・言語</option>
                  <option value="肢体不自由">肢体不自由</option>
                  <option value="心臓">心臓</option>
                  <option value="腎臓">腎臓</option>
                  <option value="呼吸器">呼吸器</option>
                  <option value="ぼうこう">ぼうこう</option>
                  <option value="直腸">直腸</option>
                  <option value="小腸">小腸</option>
                  <option value="免疫">免疫</option>
                  <option value="肝臓">肝臓</option>
                </select>
              </div>
            </div>
            <div className="form-group date-group">
              <label>確認日</label>
              <div className="date-inputs">
                <div className="select-wrapper era-select">
                  <select 
                    value={formData.physicalCertDate.era} 
                    onChange={(e) => handleDateChange('physicalCertDate', 'era', e.target.value)}
                    className="form-control"
                  >
                    <option value="平成">平成</option>
                    <option value="令和">令和</option>
                  </select>
                </div>
                <input 
                  type="number" 
                  value={formData.physicalCertDate.year} 
                  onChange={(e) => handleDateChange('physicalCertDate', 'year', e.target.value)}
                  className="form-control year-input"
                  min="1"
                  max="99"
                />
                <span>年</span>
                <input 
                  type="number" 
                  value={formData.physicalCertDate.month} 
                  onChange={(e) => handleDateChange('physicalCertDate', 'month', e.target.value)}
                  className="form-control month-input"
                  min="1"
                  max="12"
                />
                <span>月</span>
                <input 
                  type="number" 
                  value={formData.physicalCertDate.day} 
                  onChange={(e) => handleDateChange('physicalCertDate', 'day', e.target.value)}
                  className="form-control day-input"
                  min="1"
                  max="31"
                />
                <span>日</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 手帳情報 */}
      <div className="certificate-info">
        <h3 className="section-subtitle">手帳情報</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>手帳番号</label>
            <input 
              type="text" 
              name="certificateNumber" 
              value={formData.certificateNumber} 
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>交付自治体</label>
            <div className="select-wrapper">
              <select 
                name="certificateIssuer" 
                value={formData.certificateIssuer} 
                onChange={handleChange}
                className="form-control"
              >
                <option value="東京都">東京都</option>
                <option value="神奈川県">神奈川県</option>
                <option value="埼玉県">埼玉県</option>
                <option value="千葉県">千葉県</option>
                {/* その他の都道府県 */}
              </select>
            </div>
          </div>
          <div className="form-group date-group">
            <label>有効期限</label>
            <div className="date-inputs">
              <div className="select-wrapper era-select">
                <select 
                  value={formData.certificateExpiry.era} 
                  onChange={(e) => handleDateChange('certificateExpiry', 'era', e.target.value)}
                  className="form-control"
                >
                  <option value="平成">平成</option>
                  <option value="令和">令和</option>
                </select>
              </div>
              <input 
                type="number" 
                value={formData.certificateExpiry.year} 
                onChange={(e) => handleDateChange('certificateExpiry', 'year', e.target.value)}
                className="form-control year-input"
                min="1"
                max="99"
              />
              <span>年</span>
              <input 
                type="number" 
                value={formData.certificateExpiry.month} 
                onChange={(e) => handleDateChange('certificateExpiry', 'month', e.target.value)}
                className="form-control month-input"
                min="1"
                max="12"
              />
              <span>月</span>
              <input 
                type="number" 
                value={formData.certificateExpiry.day} 
                onChange={(e) => handleDateChange('certificateExpiry', 'day', e.target.value)}
                className="form-control day-input"
                min="1"
                max="31"
              />
              <span>日</span>
            </div>
          </div>
          <div className="form-group date-group">
            <label>等級等変更年月日</label>
            <div className="date-inputs">
              <div className="select-wrapper era-select">
                <select 
                  value={formData.certificateRenewal.era} 
                  onChange={(e) => handleDateChange('certificateRenewal', 'era', e.target.value)}
                  className="form-control"
                >
                  <option value="平成">平成</option>
                  <option value="令和">令和</option>
                </select>
              </div>
              <input 
                type="number" 
                value={formData.certificateRenewal.year} 
                onChange={(e) => handleDateChange('certificateRenewal', 'year', e.target.value)}
                className="form-control year-input"
                min="1"
                max="99"
              />
              <span>年</span>
              <input 
                type="number" 
                value={formData.certificateRenewal.month} 
                onChange={(e) => handleDateChange('certificateRenewal', 'month', e.target.value)}
                className="form-control month-input"
                min="1"
                max="12"
              />
              <span>月</span>
              <input 
                type="number" 
                value={formData.certificateRenewal.day} 
                onChange={(e) => handleDateChange('certificateRenewal', 'day', e.target.value)}
                className="form-control day-input"
                min="1"
                max="31"
              />
              <span>日</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 配慮事項 */}
      <div className="consideration-info">
        <h3 className="section-subtitle">配慮事項</h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>医師の指示事項</label>
            <textarea 
              name="medicalInstructions" 
              value={formData.medicalInstructions} 
              onChange={handleChange}
              className="form-control"
              rows={3}
            />
          </div>
          <div className="form-group full-width">
            <label>職場での配慮点</label>
            <textarea 
              name="workplaceConsiderations" 
              value={formData.workplaceConsiderations} 
              onChange={handleChange}
              className="form-control"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisabilityInfo;