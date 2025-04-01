// frontend/src/components/employee-tabs/DisabilityInfo.tsx
import React, { useState, ChangeEvent } from 'react';
import { TabProps, EraType } from '../../types/Employee';

// 47都道府県リスト
const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const DisabilityInfo: React.FC<TabProps> = ({ employeeData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [disabilityType, setDisabilityType] = useState(employeeData.disabilityType || '身体障害');
  const [formData, setFormData] = useState({
    // 身体障害情報
    physicalGrade: employeeData.physicalGrade || '1級',
    physicalLocation: employeeData.physicalLocation || '視覚',
    physicalCertDate: {
      era: employeeData.physicalCertDateEra || '令和' as EraType,
      year: employeeData.physicalCertDateYear || '2',
      month: employeeData.physicalCertDateMonth || '4',
      day: employeeData.physicalCertDateDay || '1'
    },
    
    // 知的障害情報
    intellectualGrade: employeeData.intellectualGrade || 'B',
    intellectualLocation: employeeData.intellectualLocation || '',
    intellectualCertDate: {
      era: employeeData.intellectualCertDateEra || '令和' as EraType,
      year: employeeData.intellectualCertDateYear || '2',
      month: employeeData.intellectualCertDateMonth || '4',
      day: employeeData.intellectualCertDateDay || '1'
    },
    
    // 精神障害情報
    mentalGrade: employeeData.mentalGrade || '2級',
    mentalLocation: employeeData.mentalLocation || '',
    mentalCertDate: {
      era: employeeData.mentalCertDateEra || '令和' as EraType,
      year: employeeData.mentalCertDateYear || '2',
      month: employeeData.mentalCertDateMonth || '4',
      day: employeeData.mentalCertDateDay || '1'
    },
    
    // 手帳情報
    certificateNumber: employeeData.certificateNumber || '第A123456号',
    certificateIssuer: employeeData.certificateIssuer || '東京都',
    certificateExpiry: {
      era: employeeData.certificateExpiryEra || '令和' as EraType,
      year: employeeData.certificateExpiryYear || '10',
      month: employeeData.certificateExpiryMonth || '6',
      day: employeeData.certificateExpiryDay || '3'
    },
    certificateRenewal: {
      era: employeeData.certificateRenewalEra || '令和' as EraType,
      year: employeeData.certificateRenewalYear || '2',
      month: employeeData.certificateRenewalMonth || '4',
      day: employeeData.certificateRenewalDay || '1'
    },
    
    // 配慮事項
    medicalInstructions: employeeData.medicalInstructions || '長時間の作業を避け、2時間ごとに休憩をとること',
    workplaceConsiderations: employeeData.workplaceConsiderations || '画面拡大ソフトの使用、照明の調整が必要'
  });

  // 編集モード切り替え
  const toggleEditMode = () => {
    setIsEditing(prev => !prev);
  };

  // 保存ボタンのハンドラー
  const handleSave = () => {
    // 親コンポーネントにデータ更新を通知
    onUpdate({
      disabilityType,
      ...formData,
      // 日付関連のフィールドを平坦化
      physicalCertDateEra: formData.physicalCertDate.era,
      physicalCertDateYear: formData.physicalCertDate.year,
      physicalCertDateMonth: formData.physicalCertDate.month,
      physicalCertDateDay: formData.physicalCertDate.day,
      intellectualCertDateEra: formData.intellectualCertDate.era,
      intellectualCertDateYear: formData.intellectualCertDate.year,
      intellectualCertDateMonth: formData.intellectualCertDate.month,
      intellectualCertDateDay: formData.intellectualCertDate.day,
      mentalCertDateEra: formData.mentalCertDate.era,
      mentalCertDateYear: formData.mentalCertDate.year,
      mentalCertDateMonth: formData.mentalCertDate.month,
      mentalCertDateDay: formData.mentalCertDate.day,
      certificateExpiryEra: formData.certificateExpiry.era,
      certificateExpiryYear: formData.certificateExpiry.year,
      certificateExpiryMonth: formData.certificateExpiry.month,
      certificateExpiryDay: formData.certificateExpiry.day,
      certificateRenewalEra: formData.certificateRenewal.era,
      certificateRenewalYear: formData.certificateRenewal.year,
      certificateRenewalMonth: formData.certificateRenewal.month,
      certificateRenewalDay: formData.certificateRenewal.day,
    });
    
    setIsEditing(false);
    alert('データを保存しました');
  };

  // 障害種別の変更処理
  const handleDisabilityTypeChange = (value: string): void => {
    setDisabilityType(value);
  };

  // フォーム入力の変更処理
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
  };

  // 入力フィールドの共通スタイル - セレクトスタイルを削除
  const inputStyle = {
    padding: '6px 8px',
    borderRadius: '4px',
    border: isEditing ? '1px solid #ddd' : '1px solid transparent',
    backgroundColor: isEditing ? 'white' : '#f8f9fa',
    width: '100%'
  };

  // テキストエリアの共通スタイル
  const textareaStyle = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical' as const
  };

  // ラジオボタンスタイル
  const radioStyle = {
    marginRight: '5px',
    cursor: isEditing ? 'pointer' : 'default',
    opacity: isEditing ? 1 : 0.8
  };

  // ラジオラベルスタイル
  const radioLabelStyle = {
    marginRight: '15px',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: isEditing ? 'pointer' : 'default',
    opacity: isEditing ? 1 : 0.8
  };

  return (
    <div className="disability-info-tab">
      {/* 編集ボタンと保存ボタン */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
        <button 
          type="button"
          onClick={toggleEditMode}
          style={{
            padding: '6px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isEditing ? '編集中止' : '編集'}
        </button>
        
        <button 
          type="button"
          onClick={handleSave}
          style={{
            padding: '6px 12px',
            backgroundColor: '#3a66d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: isEditing ? 'block' : 'none'
          }}
        >
          保存
        </button>
      </div>

      <div className="disability-type-selection">
        <h3 className="section-title">障害種別選択</h3>
        <div className="radio-group">
          <label className="radio-label" style={radioLabelStyle}>
            <input
              type="radio"
              name="disabilityType"
              value="身体障害"
              checked={disabilityType === '身体障害'}
              onChange={() => handleDisabilityTypeChange('身体障害')}
              disabled={!isEditing}
              style={radioStyle}
            />
            身体障害
          </label>
          <label className="radio-label" style={radioLabelStyle}>
            <input
              type="radio"
              name="disabilityType"
              value="知的障害"
              checked={disabilityType === '知的障害'}
              onChange={() => handleDisabilityTypeChange('知的障害')}
              disabled={!isEditing}
              style={radioStyle}
            />
            知的障害
          </label>
          <label className="radio-label" style={radioLabelStyle}>
            <input
              type="radio"
              name="disabilityType"
              value="精神障害"
              checked={disabilityType === '精神障害'}
              onChange={() => handleDisabilityTypeChange('精神障害')}
              disabled={!isEditing}
              style={radioStyle}
            />
            精神障害
          </label>
        </div>
      </div>

      {/* 身体障害情報 */}
      {disabilityType === '身体障害' && (
        <div className="disability-details">
          <h3 className="section-title">身体障害者情報</h3>
          <div className="form-row">
            <div className="form-group">
              <label>程度</label>
              <select 
                name="physicalGrade" 
                value={formData.physicalGrade} 
                onChange={handleChange}
                className="form-control"
                style={inputStyle}
                disabled={!isEditing}
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
            <div className="form-group" style={{ width: '50%' }}>
              <label>障害部位</label>
              <input 
                type="text" 
                name="physicalLocation" 
                value={formData.physicalLocation} 
                onChange={handleChange}
                className="form-control"
                placeholder="例: 視覚、聴覚、肢体不自由など"
                style={inputStyle}
                readOnly={!isEditing}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>確認日</label>
              <div className="date-inputs" style={{ opacity: isEditing ? 1 : 0.9 }}>
                <select 
                  value={formData.physicalCertDate.era} 
                  onChange={(e) => handleDateChange('physicalCertDate', 'era', e.target.value)}
                  className="form-control era-select"
                  style={{ ...inputStyle, width: '33%' }}
                  disabled={!isEditing}
                >
                  <option value="平成">平成</option>
                  <option value="令和">令和</option>
                </select>
                <input 
                  type="text" 
                  value={formData.physicalCertDate.year} 
                  onChange={(e) => handleDateChange('physicalCertDate', 'year', e.target.value)}
                  className="form-control year-input"
                  style={{ ...inputStyle, width: '40px' }}
                  readOnly={!isEditing}
                />
                <span>年</span>
                <input 
                  type="text" 
                  value={formData.physicalCertDate.month} 
                  onChange={(e) => handleDateChange('physicalCertDate', 'month', e.target.value)}
                  className="form-control month-input"
                  style={{ ...inputStyle, width: '40px' }}
                  readOnly={!isEditing}
                />
                <span>月</span>
                <input 
                  type="text" 
                  value={formData.physicalCertDate.day} 
                  onChange={(e) => handleDateChange('physicalCertDate', 'day', e.target.value)}
                  className="form-control day-input"
                  style={{ ...inputStyle, width: '40px' }}
                  readOnly={!isEditing}
                />
                <span>日</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 知的障害情報 */}
      {disabilityType === '知的障害' && (
        <div className="disability-details">
          <h3 className="section-title">知的障害者情報</h3>
          <div className="form-row">
            <div className="form-group">
              <label>程度</label>
              <select 
                name="intellectualGrade" 
                value={formData.intellectualGrade} 
                onChange={handleChange}
                className="form-control"
                style={inputStyle}
                disabled={!isEditing}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div className="form-group" style={{ width: '50%' }}>
              <label>障害内容</label>
              <input 
                type="text" 
                name="intellectualLocation" 
                value={formData.intellectualLocation} 
                onChange={handleChange}
                className="form-control"
                placeholder="必要に応じて入力"
                style={inputStyle}
                readOnly={!isEditing}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>確認日</label>
              <div className="date-inputs" style={{ opacity: isEditing ? 1 : 0.9 }}>
                <select 
                  value={formData.intellectualCertDate.era} 
                  onChange={(e) => handleDateChange('intellectualCertDate', 'era', e.target.value)}
                  className="form-control era-select"
                  style={{ ...inputStyle, width: '33%' }}
                  disabled={!isEditing}
                >
                  <option value="平成">平成</option>
                  <option value="令和">令和</option>
                </select>
                <input 
                  type="text" 
                  value={formData.intellectualCertDate.year} 
                  onChange={(e) => handleDateChange('intellectualCertDate', 'year', e.target.value)}
                  className="form-control year-input"
                  style={{ ...inputStyle, width: '40px' }}
                  readOnly={!isEditing}
                />
                <span>年</span>
                <input 
                  type="text" 
                  value={formData.intellectualCertDate.month} 
                  onChange={(e) => handleDateChange('intellectualCertDate', 'month', e.target.value)}
                  className="form-control month-input"
                  style={{ ...inputStyle, width: '40px' }}
                  readOnly={!isEditing}
                />
                <span>月</span>
                <input 
                  type="text" 
                  value={formData.intellectualCertDate.day} 
                  onChange={(e) => handleDateChange('intellectualCertDate', 'day', e.target.value)}
                  className="form-control day-input"
                  style={{ ...inputStyle, width: '40px' }}
                  readOnly={!isEditing}
                />
                <span>日</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 精神障害情報 */}
      {disabilityType === '精神障害' && (
        <div className="disability-details">
          <h3 className="section-title">精神障害者情報</h3>
          <div className="form-row">
            <div className="form-group">
              <label>程度</label>
              <select 
                name="mentalGrade" 
                value={formData.mentalGrade} 
                onChange={handleChange}
                className="form-control"
                style={inputStyle}
                disabled={!isEditing}
              >
                <option value="1級">1級</option>
                <option value="2級">2級</option>
                <option value="3級">3級</option>
              </select>
            </div>
            <div className="form-group" style={{ width: '50%' }}>
              <label>障害内容</label>
              <input 
                type="text" 
                name="mentalLocation" 
                value={formData.mentalLocation} 
                onChange={handleChange}
                className="form-control"
                placeholder="必要に応じて入力"
                style={inputStyle}
                readOnly={!isEditing}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>確認日</label>
              <div className="date-inputs" style={{ opacity: isEditing ? 1 : 0.9 }}>
                <select 
                  value={formData.mentalCertDate.era} 
                  onChange={(e) => handleDateChange('mentalCertDate', 'era', e.target.value)}
                  className="form-control era-select"
                  style={{ ...inputStyle, width: '33%' }}
                  disabled={!isEditing}
                >
                  <option value="平成">平成</option>
                  <option value="令和">令和</option>
                </select>
                <input 
                  type="text" 
                  value={formData.mentalCertDate.year} 
                  onChange={(e) => handleDateChange('mentalCertDate', 'year', e.target.value)}
                  className="form-control year-input"
                  style={{ ...inputStyle, width: '40px' }}
                  readOnly={!isEditing}
                />
                <span>年</span>
                <input 
                  type="text" 
                  value={formData.mentalCertDate.month} 
                  onChange={(e) => handleDateChange('mentalCertDate', 'month', e.target.value)}
                  className="form-control month-input"
                  style={{ ...inputStyle, width: '40px' }}
                  readOnly={!isEditing}
                />
                <span>月</span>
                <input 
                  type="text" 
                  value={formData.mentalCertDate.day} 
                  onChange={(e) => handleDateChange('mentalCertDate', 'day', e.target.value)}
                  className="form-control day-input"
                  style={{ ...inputStyle, width: '40px' }}
                  readOnly={!isEditing}
                />
                <span>日</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 手帳情報 */}
      <div className="certificate-info">
        <h3 className="section-title">手帳情報</h3>
        <div className="form-row">
          <div className="form-group">
            <label>手帳番号</label>
            <input 
              type="text" 
              name="certificateNumber" 
              value={formData.certificateNumber} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-group" style={{ width: '66.7%' }}>
            <label>交付自治体</label>
            <select 
              name="certificateIssuer" 
              value={formData.certificateIssuer} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              disabled={!isEditing}
            >
              {prefectures.map(prefecture => (
                <option key={prefecture} value={prefecture}>{prefecture}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>有効期限</label>
            <div className="date-inputs" style={{ opacity: isEditing ? 1 : 0.9 }}>
              <select 
                value={formData.certificateExpiry.era} 
                onChange={(e) => handleDateChange('certificateExpiry', 'era', e.target.value)}
                className="form-control era-select"
                style={{ ...inputStyle, width: '33%' }}
                disabled={!isEditing}
              >
                <option value="平成">平成</option>
                <option value="令和">令和</option>
              </select>
              <input 
                type="text" 
                value={formData.certificateExpiry.year} 
                onChange={(e) => handleDateChange('certificateExpiry', 'year', e.target.value)}
                className="form-control year-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>年</span>
              <input 
                type="text" 
                value={formData.certificateExpiry.month} 
                onChange={(e) => handleDateChange('certificateExpiry', 'month', e.target.value)}
                className="form-control month-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>月</span>
              <input 
                type="text" 
                value={formData.certificateExpiry.day} 
                onChange={(e) => handleDateChange('certificateExpiry', 'day', e.target.value)}
                className="form-control day-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>日</span>
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>等級等変更年月日</label>
            <div className="date-inputs" style={{ opacity: isEditing ? 1 : 0.9 }}>
              <select 
                value={formData.certificateRenewal.era} 
                onChange={(e) => handleDateChange('certificateRenewal', 'era', e.target.value)}
                className="form-control era-select"
                style={{ ...inputStyle, width: '33%' }}
                disabled={!isEditing}
              >
                <option value="平成">平成</option>
                <option value="令和">令和</option>
              </select>
              <input 
                type="text" 
                value={formData.certificateRenewal.year} 
                onChange={(e) => handleDateChange('certificateRenewal', 'year', e.target.value)}
                className="form-control year-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>年</span>
              <input 
                type="text" 
                value={formData.certificateRenewal.month} 
                onChange={(e) => handleDateChange('certificateRenewal', 'month', e.target.value)}
                className="form-control month-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>月</span>
              <input 
                type="text" 
                value={formData.certificateRenewal.day} 
                onChange={(e) => handleDateChange('certificateRenewal', 'day', e.target.value)}
                className="form-control day-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>日</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 配慮事項 */}
      <div className="consideration-info">
        <h3 className="section-title">配慮事項</h3>
        <div className="form-group">
          <label>医師の指示事項</label>
          <textarea 
            name="medicalInstructions" 
            value={formData.medicalInstructions} 
            onChange={handleChange}
            className="form-control textarea-field"
            rows={3}
            style={textareaStyle}
            readOnly={!isEditing}
          />
        </div>
        <div className="form-group">
          <label>職場での配慮点</label>
          <textarea 
            name="workplaceConsiderations" 
            value={formData.workplaceConsiderations} 
            onChange={handleChange}
            className="form-control textarea-field"
            rows={3}
            style={textareaStyle}
            readOnly={!isEditing}
          />
        </div>
      </div>
    </div>
  );
};

export default DisabilityInfo;