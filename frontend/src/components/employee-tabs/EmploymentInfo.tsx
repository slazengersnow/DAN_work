// frontend/src/components/employee-tabs/EmploymentInfo.tsx
import React, { useState, ChangeEvent } from 'react';
import { TabProps, EraType } from '../../types/Employee';

const EmploymentInfo: React.FC<TabProps> = ({ employeeData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    // 雇用基本情報
    employmentType: employeeData.employmentType || '正社員',
    countValue: employeeData.countValue || '2.0',
    status: employeeData.status || '在籍中',
    hireDate: {
      era: employeeData.hireDateEra || '令和' as EraType,
      year: employeeData.hireDateYear || '2',
      month: employeeData.hireDateMonth || '4',
      day: employeeData.hireDateDay || '1'
    },
    
    // 職務情報
    department: employeeData.department || '総務部',
    position: employeeData.position || '主任',
    jobDescription: employeeData.jobDescription || 'データ入力、書類整理',
    
    // 転入・転出情報
    transferInDate: {
      era: employeeData.transferInDateEra || '令和' as EraType,
      year: employeeData.transferInDateYear || '',
      month: employeeData.transferInDateMonth || '',
      day: employeeData.transferInDateDay || ''
    },
    previousWorkplace: employeeData.previousWorkplace || '',
    transferOutDate: {
      era: employeeData.transferOutDateEra || '令和' as EraType,
      year: employeeData.transferOutDateYear || '',
      month: employeeData.transferOutDateMonth || '',
      day: employeeData.transferOutDateDay || ''
    },
    nextWorkplace: employeeData.nextWorkplace || '',
    
    // 勤務条件
    workHours: employeeData.workHours || '9:00 - 17:00',
    breakTime: employeeData.breakTime || '12:00 - 13:00',
    workingHours: employeeData.workingHours || '7.0',
    workDaysPerWeek: employeeData.workDaysPerWeek || '5日'
  });

  // 編集モード切り替え
  const toggleEditMode = () => {
    setIsEditing(prev => !prev);
  };

  // 保存ボタンのハンドラー
  const handleSave = () => {
    // 平坦化されたデータオブジェクトを作成
    const updatedData = {
      employmentType: formData.employmentType,
      countValue: formData.countValue,
      status: formData.status,
      department: formData.department,
      position: formData.position,
      jobDescription: formData.jobDescription,
      previousWorkplace: formData.previousWorkplace,
      nextWorkplace: formData.nextWorkplace,
      workHours: formData.workHours,
      breakTime: formData.breakTime,
      workingHours: formData.workingHours,
      workDaysPerWeek: formData.workDaysPerWeek,
      
      // 日付関連のフィールドを平坦化
      hireDateEra: formData.hireDate.era,
      hireDateYear: formData.hireDate.year,
      hireDateMonth: formData.hireDate.month,
      hireDateDay: formData.hireDate.day,
      transferInDateEra: formData.transferInDate.era,
      transferInDateYear: formData.transferInDate.year,
      transferInDateMonth: formData.transferInDate.month,
      transferInDateDay: formData.transferInDate.day,
      transferOutDateEra: formData.transferOutDate.era,
      transferOutDateYear: formData.transferOutDate.year,
      transferOutDateMonth: formData.transferOutDate.month,
      transferOutDateDay: formData.transferOutDate.day
    };
    
    // 親コンポーネントにデータ更新を通知
    onUpdate(updatedData);
    
    setIsEditing(false);
    alert('データを保存しました');
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

  return (
    <div className="employment-info-tab">
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

      {/* 雇用基本情報 */}
      <div className="employment-basic-info">
        <h3 className="section-title">雇用基本情報</h3>
        <div className="form-row">
          <div className="form-group" style={{ width: '60%' }}>
            <label>雇用形態</label>
            <select 
              name="employmentType" 
              value={formData.employmentType} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              disabled={!isEditing}
            >
              <option value="正社員">正社員</option>
              <option value="契約社員">契約社員</option>
              <option value="パートタイム">パートタイム</option>
              <option value="アルバイト">アルバイト</option>
            </select>
          </div>
          <div className="form-group">
            <label>カウント数</label>
            <select 
              name="countValue" 
              value={formData.countValue} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              disabled={!isEditing}
            >
              <option value="2.0">2.0</option>
              <option value="1.0">1.0</option>
              <option value="0.5">0.5</option>
              <option value="0.0">0.0</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>ステータス</label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              disabled={!isEditing}
            >
              <option value="在籍中">在籍中</option>
              <option value="退職">退職</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>雇入れ年月日</label>
            <div className="date-inputs" style={{ opacity: isEditing ? 1 : 0.9 }}>
              <select 
                value={formData.hireDate.era} 
                onChange={(e) => handleDateChange('hireDate', 'era', e.target.value)}
                className="form-control era-select"
                style={{ ...inputStyle, width: '33%' }}
                disabled={!isEditing}
              >
                <option value="平成">平成</option>
                <option value="令和">令和</option>
              </select>
              <input 
                type="text" 
                value={formData.hireDate.year} 
                onChange={(e) => handleDateChange('hireDate', 'year', e.target.value)}
                className="form-control year-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>年</span>
              <input 
                type="text" 
                value={formData.hireDate.month} 
                onChange={(e) => handleDateChange('hireDate', 'month', e.target.value)}
                className="form-control month-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>月</span>
              <input 
                type="text" 
                value={formData.hireDate.day} 
                onChange={(e) => handleDateChange('hireDate', 'day', e.target.value)}
                className="form-control day-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
              />
              <span>日</span>
            </div>
          </div>
        </div>
      </div>

      {/* 職務情報 */}
      <div className="job-info">
        <h3 className="section-title">職務情報</h3>
        <div className="form-row">
          <div className="form-group">
            <label>所属部署</label>
            <select 
              name="department" 
              value={formData.department} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              disabled={!isEditing}
            >
              <option value="総務部">総務部</option>
              <option value="人事部">人事部</option>
              <option value="経理部">経理部</option>
              <option value="営業部">営業部</option>
              <option value="開発部">開発部</option>
            </select>
          </div>
          <div className="form-group">
            <label>職位</label>
            <select 
              name="position" 
              value={formData.position} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              disabled={!isEditing}
            >
              <option value="一般">一般</option>
              <option value="主任">主任</option>
              <option value="係長">係長</option>
              <option value="課長">課長</option>
              <option value="部長">部長</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group full-width">
            <label>業務内容</label>
            <input 
              type="text" 
              name="jobDescription" 
              value={formData.jobDescription} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
        </div>
      </div>

      {/* 転入・転出情報 */}
      <div className="transfer-info">
        <h3 className="section-title">転入・転出情報</h3>
        <div className="form-row">
          <div className="form-group">
            <label>転入年月日</label>
            <div className="date-inputs" style={{ opacity: isEditing ? 1 : 0.9 }}>
              <select 
                value={formData.transferInDate.era} 
                onChange={(e) => handleDateChange('transferInDate', 'era', e.target.value)}
                className="form-control era-select"
                style={{ ...inputStyle, width: '33%' }}
                disabled={!isEditing}
              >
                <option value="平成">平成</option>
                <option value="令和">令和</option>
              </select>
              <input 
                type="text" 
                value={formData.transferInDate.year} 
                onChange={(e) => handleDateChange('transferInDate', 'year', e.target.value)}
                className="form-control year-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
                placeholder=""
              />
              <span>年</span>
              <input 
                type="text" 
                value={formData.transferInDate.month} 
                onChange={(e) => handleDateChange('transferInDate', 'month', e.target.value)}
                className="form-control month-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
                placeholder=""
              />
              <span>月</span>
              <input 
                type="text" 
                value={formData.transferInDate.day} 
                onChange={(e) => handleDateChange('transferInDate', 'day', e.target.value)}
                className="form-control day-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
                placeholder=""
              />
              <span>日</span>
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>転入前の事業所名等</label>
            <input 
              type="text" 
              name="previousWorkplace" 
              value={formData.previousWorkplace} 
              onChange={handleChange}
              className="form-control"
              placeholder="(該当なし)"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>転出年月日</label>
            <div className="date-inputs" style={{ opacity: isEditing ? 1 : 0.9 }}>
              <select 
                value={formData.transferOutDate.era} 
                onChange={(e) => handleDateChange('transferOutDate', 'era', e.target.value)}
                className="form-control era-select"
                style={{ ...inputStyle, width: '33%' }}
                disabled={!isEditing}
              >
                <option value="平成">平成</option>
                <option value="令和">令和</option>
              </select>
              <input 
                type="text" 
                value={formData.transferOutDate.year} 
                onChange={(e) => handleDateChange('transferOutDate', 'year', e.target.value)}
                className="form-control year-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
                placeholder=""
              />
              <span>年</span>
              <input 
                type="text" 
                value={formData.transferOutDate.month} 
                onChange={(e) => handleDateChange('transferOutDate', 'month', e.target.value)}
                className="form-control month-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
                placeholder=""
              />
              <span>月</span>
              <input 
                type="text" 
                value={formData.transferOutDate.day} 
                onChange={(e) => handleDateChange('transferOutDate', 'day', e.target.value)}
                className="form-control day-input"
                style={{ ...inputStyle, width: '40px' }}
                readOnly={!isEditing}
                placeholder=""
              />
              <span>日</span>
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>転出先の事業所名等</label>
            <input 
              type="text" 
              name="nextWorkplace" 
              value={formData.nextWorkplace} 
              onChange={handleChange}
              className="form-control"
              placeholder="(該当なし)"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
        </div>
      </div>

      {/* 勤務条件 */}
      <div className="work-conditions">
        <h3 className="section-title">勤務条件</h3>
        <div className="form-row">
          <div className="form-group">
            <label>勤務時間</label>
            <input 
              type="text" 
              name="workHours" 
              value={formData.workHours} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-group">
            <label>休憩時間</label>
            <input 
              type="text" 
              name="breakTime" 
              value={formData.breakTime} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>労働時間</label>
            <input 
              type="text" 
              name="workingHours" 
              value={formData.workingHours} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-group">
            <label>週勤務日数</label>
            <select 
              name="workDaysPerWeek" 
              value={formData.workDaysPerWeek} 
              onChange={handleChange}
              className="form-control"
              style={inputStyle}
              disabled={!isEditing}
            >
              <option value="5日">5日</option>
              <option value="4日">4日</option>
              <option value="3日">3日</option>
              <option value="2日">2日</option>
              <option value="1日">1日</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmploymentInfo;