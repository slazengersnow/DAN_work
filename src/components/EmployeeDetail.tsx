import React, { useState } from 'react';

// 元号の定義
const eraOptions = [
  { value: '5', label: '令和', startYear: 2019 },
  { value: '4', label: '平成', startYear: 1989 },
  { value: '3', label: '昭和', startYear: 1926 }
];

// 障害の確認区分
const disabilityVerificationOptions = {
  physical: [
    { value: 'A', label: 'A' }
  ],
  intellectual: [
    { value: 'D', label: 'D' }
  ],
  mental: [
    { value: 'P', label: 'P' },
    { value: 'Q', label: 'Q' },
    { value: 'R', label: 'R' }
  ]
};

interface MonthlyData {
  month: string;
  scheduledHours: number;
  actualHours: number;
  exceptionReason: string;
}

interface FormData {
    // 他のフォームプロパティ
    monthlyData: MonthlyData[];
  }

interface EmployeeDetailProps {
  employee: any;
  onSave: (employee: any) => void;
  onCancel: () => void;
  isNew?: boolean;
}



// 西暦から元号と年を計算する関数
const getEraYearFromDate = (dateStr: string) => {
  if (!dateStr) return { era: '5', year: '' };
  
  const date = new Date(dateStr);
  const year = date.getFullYear();
  
  for (const era of eraOptions) {
    if (year >= era.startYear) {
      return {
        era: era.value,
        year: (year - era.startYear + 1).toString()
      };
    }
  }
  
  return { era: '5', year: '' };
};

// 元号と年から西暦を計算する関数
const getDateFromEraYear = (era: string, year: string, month: string = '1', day: string = '1') => {
  if (!era || !year) return '';
  
  const selectedEra = eraOptions.find(e => e.value === era);
  if (!selectedEra) return '';
  
  const westernYear = selectedEra.startYear + parseInt(year) - 1;
  return `${westernYear}/${month}/${day}`;
};

// 日付をYYYY/MM/DD形式に変換する関数
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  } catch (e) {
    return dateStr;
  }
};

const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employee, onSave, onCancel, isNew = false }) => {
  const [formData, setFormData] = useState({
    // 基本情報
    id: employee.id || '',
    name: employee.name || '',
    nameKana: employee.nameKana || '',
    gender: employee.gender || '1',
    
    // 障害情報
    disabilityType: employee.type || '身体障害',
    
    // 身体障害者情報
    physicalVerification: employee.physicalVerification || 'A',
    physicalDegree: {
      current: employee.physicalDegreeCurrent || '',
      previous: employee.physicalDegreePrevious || ''
    },
    physicalVerified: employee.physicalVerified || false,
    
    // 知的障害者情報
    intellectualVerification: employee.intellectualVerification || 'D',
    intellectualDegree: {
      current: employee.intellectualDegreeCurrent || '',
      previous: employee.intellectualDegreePrevious || ''
    },
    intellectualVerified: employee.intellectualVerified || false,
    
    // 精神障害者情報
    mentalVerification: employee.mentalVerification || 'P',
    mentalDegree: {
      current: employee.mentalDegreeCurrent || '',
      previous: employee.mentalDegreePrevious || ''
    },
    mentalVerified: employee.mentalVerified || false,
    
    // 日付情報（西暦形式で保存）
    birthDate: formatDate(employee.birthDate) || '',
    birthDateEra: getEraYearFromDate(employee.birthDate).era,
    birthDateYear: getEraYearFromDate(employee.birthDate).year,
    birthDateMonth: employee.birthDate ? new Date(employee.birthDate).getMonth() + 1 : '',
    birthDateDay: employee.birthDate ? new Date(employee.birthDate).getDate() : '',
    
    certificateNumber: employee.certificateNumber || '',
    
    hireDate: formatDate(employee.hireDate) || '',
    hireDateEra: getEraYearFromDate(employee.hireDate).era,
    hireDateYear: getEraYearFromDate(employee.hireDate).year,
    hireDateMonth: employee.hireDate ? new Date(employee.hireDate).getMonth() + 1 : '',
    hireDateDay: employee.hireDate ? new Date(employee.hireDate).getDate() : '',
    
    previousHireDate: formatDate(employee.previousHireDate) || '',
    previousHireDateEra: getEraYearFromDate(employee.previousHireDate).era,
    previousHireDateYear: getEraYearFromDate(employee.previousHireDate).year,
    previousHireDateMonth: employee.previousHireDate ? new Date(employee.previousHireDate).getMonth() + 1 : '',
    previousHireDateDay: employee.previousHireDate ? new Date(employee.previousHireDate).getDate() : '',
    
    transferInDate: formatDate(employee.transferInDate) || '',
    transferInDateEra: getEraYearFromDate(employee.transferInDate).era,
    transferInDateYear: getEraYearFromDate(employee.transferInDate).year,
    transferInDateMonth: employee.transferInDate ? new Date(employee.transferInDate).getMonth() + 1 : '',
    transferInDateDay: employee.transferInDate ? new Date(employee.transferInDate).getDate() : '',
    
    previousOffice: employee.previousOffice || '',
    
    disabilityStartDate: formatDate(employee.disabilityStartDate) || '',
    disabilityStartDateEra: getEraYearFromDate(employee.disabilityStartDate).era,
    disabilityStartDateYear: getEraYearFromDate(employee.disabilityStartDate).year,
    disabilityStartDateMonth: employee.disabilityStartDate ? new Date(employee.disabilityStartDate).getMonth() + 1 : '',
    disabilityStartDateDay: employee.disabilityStartDate ? new Date(employee.disabilityStartDate).getDate() : '',
    
    degreeChangeDate: formatDate(employee.degreeChangeDate) || '',
    degreeChangeDateEra: getEraYearFromDate(employee.degreeChangeDate).era,
    degreeChangeDateYear: getEraYearFromDate(employee.degreeChangeDate).year,
    degreeChangeDateMonth: employee.degreeChangeDate ? new Date(employee.degreeChangeDate).getMonth() + 1 : '',
    degreeChangeDateDay: employee.degreeChangeDate ? new Date(employee.degreeChangeDate).getDate() : '',
    
    transferOutDate: formatDate(employee.transferOutDate) || '',
    transferOutDateEra: getEraYearFromDate(employee.transferOutDate).era,
    transferOutDateYear: getEraYearFromDate(employee.transferOutDate).year,
    transferOutDateMonth: employee.transferOutDate ? new Date(employee.transferOutDate).getMonth() + 1 : '',
    transferOutDateDay: employee.transferOutDate ? new Date(employee.transferOutDate).getDate() : '',
    
    nextOffice: employee.nextOffice || '',
    
    resignationDate: formatDate(employee.resignationDate) || '',
    resignationDateEra: getEraYearFromDate(employee.resignationDate).era,
    resignationDateYear: getEraYearFromDate(employee.resignationDate).year,
    resignationDateMonth: employee.resignationDate ? new Date(employee.resignationDate).getMonth() + 1 : '',
    resignationDateDay: employee.resignationDate ? new Date(employee.resignationDate).getDate() : '',
    
    previousResignationDate: formatDate(employee.previousResignationDate) || '',
    previousResignationDateEra: getEraYearFromDate(employee.previousResignationDate).era,
    previousResignationDateYear: getEraYearFromDate(employee.previousResignationDate).year,
    previousResignationDateMonth: employee.previousResignationDate ? new Date(employee.previousResignationDate).getMonth() + 1 : '',
    previousResignationDateDay: employee.previousResignationDate ? new Date(employee.previousResignationDate).getDate() : '',
    
    expiryDate: formatDate(employee.expiryDate) || '',
    expiryDateEra: getEraYearFromDate(employee.expiryDate).era,
    expiryDateYear: getEraYearFromDate(employee.expiryDate).year,
    expiryDateMonth: employee.expiryDate ? new Date(employee.expiryDate).getMonth() + 1 : '',
    expiryDateDay: employee.expiryDate ? new Date(employee.expiryDate).getDate() : '',
    
    // 月次情報
    monthlyData: employee.monthlyData || Array(12).fill(0).map((_, idx) => ({
      month: `${idx < 9 ? idx + 4 : idx - 8}月`,
      scheduledHours: 160,
      actualHours: 160,
      exceptionReason: ''
    })),
    
    // その他の設定
    workHoursChanging: employee.workHoursChanging || false,
    discrepancyError: employee.discrepancyError || false,
    discrepancyPattern: employee.discrepancyPattern || '',
    
    // カウント情報
    count: employee.count || 1.0,
    status: employee.status || '在籍中'
  });

// 値の変更ハンドラー
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // チェックボックスの場合
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    // 通常のフィールド
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ネストされたオブジェクトの変更ハンドラー
  const handleNestedChange = (parent: string, key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [key]: value
      }
    }));
  };

  // 月次データの変更ハンドラー
  const handleMonthlyDataChange = (index: number, field: string, value: string | number) => {
    const newMonthlyData = [...formData.monthlyData];
    newMonthlyData[index] = {
      ...newMonthlyData[index],
      [field]: field === 'exceptionReason' ? value : Number(value)
    };
    
    setFormData(prev => ({
      ...prev,
      monthlyData: newMonthlyData
    }));
  };

  // フォームの送信ハンドラー
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 日付情報を更新（元号から西暦に変換）
    const convertedData = {
      ...formData,
      birthDate: getDateFromEraYear(
        formData.birthDateEra, 
        formData.birthDateYear, 
        formData.birthDateMonth.toString(), 
        formData.birthDateDay.toString()
      ),
      hireDate: getDateFromEraYear(
        formData.hireDateEra, 
        formData.hireDateYear, 
        formData.hireDateMonth.toString(), 
        formData.hireDateDay.toString()
      ),
      // その他の日付変換...
      expiryDate: getDateFromEraYear(
        formData.expiryDateEra, 
        formData.expiryDateYear, 
        formData.expiryDateMonth.toString(), 
        formData.expiryDateDay.toString()
      ),
    };
    
    onSave(convertedData);
  };

  return (
    <div className="employee-detail-form" style={{ padding: '20px' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>{isNew ? '新規社員登録' : '社員詳細編集'}</h2>
          <div>
            <button type="submit" className="btn btn-primary" style={{ marginRight: '10px' }}>保存</button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>キャンセル</button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <ul className="nav nav-tabs" style={{ marginBottom: '20px' }}>
          <li className="nav-item">
            <a className="nav-link active" data-bs-toggle="tab" href="#basic">基本情報</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" data-bs-toggle="tab" href="#disability">障害情報</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" data-bs-toggle="tab" href="#employment">雇用情報</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" data-bs-toggle="tab" href="#monthly">月次情報</a>
          </li>
        </ul>

        <div className="tab-content">
          {/* 基本情報タブ */}
          <div className="tab-pane fade show active" id="basic">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">社員ID:</label>
                <input
                  type="text"
                  className="form-control"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  readOnly={!isNew}
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">性別:</label>
                <select
                  className="form-control"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="1">男</option>
                  <option value="2">女</option>
                </select>
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">氏名:</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="例: 山田 太郎"
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">氏名（カタカナ）:</label>
                <input
                  type="text"
                  className="form-control"
                  name="nameKana"
                  value={formData.nameKana}
                  onChange={handleChange}
                  placeholder="例: ヤマダ タロウ"
                />
                <small className="form-text text-muted">姓と名の間を一文字空けてください</small>
              </div>
              
              <div className="col-md-12 mb-3">
                <label className="form-label">生年月日:</label>
                <div className="row g-2">
                  <div className="col-md-3">
                    <select
                      className="form-control"
                      name="birthDateEra"
                      value={formData.birthDateEra}
                      onChange={handleChange}
                    >
                      {eraOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="birthDateYear"
                      value={formData.birthDateYear}
                      onChange={handleChange}
                      placeholder="年"
                      min="1"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="birthDateMonth"
                      value={formData.birthDateMonth}
                      onChange={handleChange}
                      placeholder="月"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="birthDateDay"
                      value={formData.birthDateDay}
                      onChange={handleChange}
                      placeholder="日"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>
                <small className="form-text text-muted">内部では西暦で保存されます</small>
              </div>
            </div>
          </div>

          {/* 障害情報タブ */}
          <div className="tab-pane fade" id="disability">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">障害種別:</label>
                <select
                  className="form-control"
                  name="disabilityType"
                  value={formData.disabilityType}
                  onChange={handleChange}
                >
                  <option value="身体障害">身体障害</option>
                  <option value="知的障害">知的障害</option>
                  <option value="精神障害">精神障害</option>
                </select>
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">手帳番号:</label>
                <input
                  type="text"
                  className="form-control"
                  name="certificateNumber"
                  value={formData.certificateNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="row mb-4">
              <div className="col-md-12">
                <label className="form-label">有効期限:</label>
                <div className="row g-2">
                  <div className="col-md-3">
                    <select
                      className="form-control"
                      name="expiryDateEra"
                      value={formData.expiryDateEra}
                      onChange={handleChange}
                    >
                      {eraOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="expiryDateYear"
                      value={formData.expiryDateYear}
                      onChange={handleChange}
                      placeholder="年"
                      min="1"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="expiryDateMonth"
                      value={formData.expiryDateMonth}
                      onChange={handleChange}
                      placeholder="月"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="expiryDateDay"
                      value={formData.expiryDateDay}
                      onChange={handleChange}
                      placeholder="日"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 身体障害者情報 */}
            <div className="card mb-4">
              <div className="card-header">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="physicalVerified"
                    checked={formData.physicalVerified}
                    onChange={(e) => handleChange({
                      ...e,
                      target: {
                        ...e.target,
                        name: 'physicalVerified',
                        value: e.target.checked ? 'true' : 'false',
                        type: 'checkbox'
                      }
                    })}
                    id="physicalVerified"
                  />
                  <label className="form-check-label" htmlFor="physicalVerified">
                    身体障害者
                  </label>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">確認方法:</label>
                    <select
                      className="form-control"
                      name="physicalVerification"
                      value={formData.physicalVerification}
                      onChange={handleChange}
                      disabled={!formData.physicalVerified}
                    >
                      {disabilityVerificationOptions.physical.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">程度:</label>
                    <div className="row">
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text">現</span>
                          <select
                            className="form-control"
                            value={formData.physicalDegree.current}
                            onChange={(e) => handleNestedChange('physicalDegree', 'current', e.target.value)}
                            disabled={!formData.physicalVerified}
                          >
                            <option value="">選択してください</option>
                            <option value="1級">1級</option>
                            <option value="2級">2級</option>
                            <option value="3級">3級</option>
                            <option value="4級">4級</option>
                            <option value="5級">5級</option>
                            <option value="6級">6級</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text">前</span>
                          <select
                            className="form-control"
                            value={formData.physicalDegree.previous}
                            onChange={(e) => handleNestedChange('physicalDegree', 'previous', e.target.value)}
                            disabled={!formData.physicalVerified}
                          >
                            <option value="">選択してください</option>
                            <option value="1級">1級</option>
                            <option value="2級">2級</option>
                            <option value="3級">3級</option>
                            <option value="4級">4級</option>
                            <option value="5級">5級</option>
                            <option value="6級">6級</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 知的障害者情報 */}
            <div className="card mb-4">
              <div className="card-header">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="intellectualVerified"
                    checked={formData.intellectualVerified}
                    onChange={(e) => handleChange({
                      ...e,
                      target: {
                        ...e.target,
                        name: 'intellectualVerified',
                        value: e.target.checked ? 'true' : 'false',
                        type: 'checkbox'
                      }
                    })}
                    id="intellectualVerified"
                  />
                  <label className="form-check-label" htmlFor="intellectualVerified">
                    知的障害者
                  </label>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">確認方法:</label>
                    <select
                      className="form-control"
                      name="intellectualVerification"
                      value={formData.intellectualVerification}
                      onChange={handleChange}
                      disabled={!formData.intellectualVerified}
                    >
                      {disabilityVerificationOptions.intellectual.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">程度:</label>
                    <div className="row">
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text">現</span>
                          <select
                            className="form-control"
                            value={formData.intellectualDegree.current}
                            onChange={(e) => handleNestedChange('intellectualDegree', 'current', e.target.value)}
                            disabled={!formData.intellectualVerified}
                          >
                            <option value="">選択してください</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text">前</span>
                          <select
                            className="form-control"
                            value={formData.intellectualDegree.previous}
                            onChange={(e) => handleNestedChange('intellectualDegree', 'previous', e.target.value)}
                            disabled={!formData.intellectualVerified}
                          >
                            <option value="">選択してください</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 精神障害者情報 */}
            <div className="card mb-4">
              <div className="card-header">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="mentalVerified"
                    checked={formData.mentalVerified}
                    onChange={(e) => handleChange({
                      ...e,
                      target: {
                        ...e.target,
                        name: 'mentalVerified',
                        value: e.target.checked ? 'true' : 'false',
                        type: 'checkbox'
                      }
                    })}
                    id="mentalVerified"
                  />
                  <label className="form-check-label" htmlFor="mentalVerified">
                    精神障害者
                  </label>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">確認方法:</label>
                    <select
                      className="form-control"
                      name="mentalVerification"
                      value={formData.mentalVerification}
                      onChange={handleChange}
                      disabled={!formData.mentalVerified}
                    >
                      {disabilityVerificationOptions.mental.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">等級:</label>
                    <div className="row">
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text">現</span>
                          <select
                            className="form-control"
                            value={formData.mentalDegree.current}
                            onChange={(e) => handleNestedChange('mentalDegree', 'current', e.target.value)}
                            disabled={!formData.mentalVerified}
                          >
                            <option value="">選択してください</option>
                            <option value="1級">1級</option>
                            <option value="2級">2級</option>
                            <option value="3級">3級</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text">前</span>
                          <select
                            className="form-control"
                            value={formData.mentalDegree.previous}
                            onChange={(e) => handleNestedChange('mentalDegree', 'previous', e.target.value)}
                            disabled={!formData.mentalVerified}
                          >
                            <option value="">選択してください</option>
                            <option value="1級">1級</option>
                            <option value="2級">2級</option>
                            <option value="3級">3級</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-12 mb-3">
                <label className="form-label">年度内に身体障害者又は精神障害者となった年月日:</label>
                <div className="row g-2">
                  <div className="col-md-3">
                    <select
                      className="form-control"
                      name="disabilityStartDateEra"
                      value={formData.disabilityStartDateEra}
                      onChange={handleChange}
                    >
                      {eraOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="disabilityStartDateYear"
                      value={formData.disabilityStartDateYear}
                      onChange={handleChange}
                      placeholder="年"
                      min="1"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="disabilityStartDateMonth"
                      value={formData.disabilityStartDateMonth}
                      onChange={handleChange}
                      placeholder="月"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="disabilityStartDateDay"
                      value={formData.disabilityStartDateDay}
                      onChange={handleChange}
                      placeholder="日"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>
              </div>
              
              <div className="col-md-12 mb-3">
                <label className="form-label">年度内等級等変更年月日:</label>
                <div className="row g-2">
                  <div className="col-md-3">
                    <select
                      className="form-control"
                      name="degreeChangeDateEra"
                      value={formData.degreeChangeDateEra}
                      onChange={handleChange}
                    >
                      {eraOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="degreeChangeDateYear"
                      value={formData.degreeChangeDateYear}
                      onChange={handleChange}
                      placeholder="年"
                      min="1"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="degreeChangeDateMonth"
                      value={formData.degreeChangeDateMonth}
                      onChange={handleChange}
                      placeholder="月"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="degreeChangeDateDay"
                      value={formData.degreeChangeDateDay}
                      onChange={handleChange}
                      placeholder="日"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 雇用情報タブ */}
          <div className="tab-pane fade" id="employment">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">雇用カウント:</label>
                <select
                  className="form-control"
                  name="count"
                  value={formData.count}
                  onChange={handleChange}
                >
                  <option value={0.5}>0.5</option>
                  <option value={1.0}>1.0</option>
                  <option value={2.0}>2.0</option>
                </select>
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">ステータス:</label>
                <select
                  className="form-control"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="在籍中">在籍中</option>
                  <option value="退職">退職</option>
                </select>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-12 mb-3">
                <label className="form-label">雇入れ年月日:</label>
                <div className="row g-2">
                  <div className="col-md-3">
                    <select
                      className="form-control"
                      name="hireDateEra"
                      value={formData.hireDateEra}
                      onChange={handleChange}
                    >
                      {eraOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="hireDateYear"
                      value={formData.hireDateYear}
                      onChange={handleChange}
                      placeholder="年"
                      min="1"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="hireDateMonth"
                      value={formData.hireDateMonth}
                      onChange={handleChange}
                      placeholder="月"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="hireDateDay"
                      value={formData.hireDateDay}
                      onChange={handleChange}
                      placeholder="日"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>
                <small className="form-text text-muted">現在の雇用開始日</small>
              </div>
              
              <div className="col-md-12 mb-3">
                <label className="form-label">転入年月日:</label>
                <div className="row g-2">
                  <div className="col-md-3">
                    <select
                      className="form-control"
                      name="transferInDateEra"
                      value={formData.transferInDateEra}
                      onChange={handleChange}
                    >
                      {eraOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="transferInDateYear"
                      value={formData.transferInDateYear}
                      onChange={handleChange}
                      placeholder="年"
                      min="1"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="transferInDateMonth"
                      value={formData.transferInDateMonth}
                      onChange={handleChange}
                      placeholder="月"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="transferInDateDay"
                      value={formData.transferInDateDay}
                      onChange={handleChange}
                      placeholder="日"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>
              </div>
              
              <div className="col-md-12 mb-3">
                <label className="form-label">転入前の事業所名等:</label>
                <input
                  type="text"
                  className="form-control"
                  name="previousOffice"
                  value={formData.previousOffice}
                  onChange={handleChange}
                />
              </div>
              
              <div className="col-md-12 mb-3">
                <label className="form-label">転出年月日:</label>
                <div className="row g-2">
                  <div className="col-md-3">
                    <select
                      className="form-control"
                      name="transferOutDateEra"
                      value={formData.transferOutDateEra}
                      onChange={handleChange}
                    >
                      {eraOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="transferOutDateYear"
                      value={formData.transferOutDateYear}
                      onChange={handleChange}
                      placeholder="年"
                      min="1"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="transferOutDateMonth"
                      value={formData.transferOutDateMonth}
                      onChange={handleChange}
                      placeholder="月"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="transferOutDateDay"
                      value={formData.transferOutDateDay}
                      onChange={handleChange}
                      placeholder="日"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>
              </div>
              
              <div className="col-md-12 mb-3">
                <label className="form-label">転出先の事業所名等:</label>
                <input
                  type="text"
                  className="form-control"
                  name="nextOffice"
                  value={formData.nextOffice}
                  onChange={handleChange}
                />
              </div>
              
              <div className="col-md-12 mb-3">
                <label className="form-label">離職年月日:</label>
                <div className="row g-2">
                  <div className="col-md-3">
                    <select
                      className="form-control"
                      name="resignationDateEra"
                      value={formData.resignationDateEra}
                      onChange={handleChange}
                    >
                      {eraOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="resignationDateYear"
                      value={formData.resignationDateYear}
                      onChange={handleChange}
                      placeholder="年"
                      min="1"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="resignationDateMonth"
                      value={formData.resignationDateMonth}
                      onChange={handleChange}
                      placeholder="月"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      name="resignationDateDay"
                      value={formData.resignationDateDay}
                      onChange={handleChange}
                      placeholder="日"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 月次情報タブ */}
          <div className="tab-pane fade" id="monthly">
            <div className="card mb-4">
              <div className="card-header">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-check form-check-inline">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        name="workHoursChanging"
                        checked={formData.workHoursChanging}
                        onChange={(e) => handleChange({
                          ...e,
                          target: {
                            ...e.target,
                            name: 'workHoursChanging',
                            value: e.target.checked ? 'true' : 'false',
                            type: 'checkbox'
                          }
                        })}
                        id="workHoursChanging"
                      />
                      <label className="form-check-label" htmlFor="workHoursChanging">
                        所定労働時間変動の有無
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check form-check-inline">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        name="discrepancyError"
                        checked={formData.discrepancyError}
                        onChange={(e) => handleChange({
                          ...e,
                          target: {
                            ...e.target,
                            name: 'discrepancyError',
                            value: e.target.checked ? 'true' : 'false',
                            type: 'checkbox'
                          }
                        })}
                        id="discrepancyError"
                      />
                      <label className="form-check-label" htmlFor="discrepancyError">
                        乖離エラー有無
                      </label>
                    </div>
                    
                    {formData.discrepancyError && (
                      <div className="mt-2">
                        <label className="form-label">乖離エラー理由パターン:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="discrepancyPattern"
                          value={formData.discrepancyPattern}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-12">
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th rowSpan={2}>申告申請年月</th>
                            {formData.monthlyData.map((data: MonthlyData) => (
                              <th key={data.month}>{data.month}</th>
                            ))}
                            <th>計</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>月毎の所定労働時間</td>
                            {formData.monthlyData.map((data: MonthlyData, idx: number) => (
                              <td key={`scheduled-${idx}`}>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={data.scheduledHours}
                                  onChange={(e) => handleMonthlyDataChange(idx, 'scheduledHours', e.target.value)}
                                  style={{ width: '60px' }}
                                />
                              </td>
                            ))}
                            
                            

                            <td>
                              {formData.monthlyData.reduce((sum: number, data: MonthlyData) => sum + data.scheduledHours, 0)}
                            </td>
                          </tr>
                          <tr>
                            <td>月毎の実労働時間</td>
                            {formData.monthlyData.map((data: MonthlyData, idx: number) => (

                              <td key={`actual-${idx}`}>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={data.actualHours}
                                  onChange={(e) => handleMonthlyDataChange(idx, 'actualHours', e.target.value)}
                                  style={{ width: '60px' }}
                                />
                              </td>
                            ))}
                            <td>
                              {formData.monthlyData.reduce((sum: number, data: MonthlyData) => sum + data.actualHours, 0)}
                            </td>
                          </tr>
                          <tr>
                            <td>例外対応事由</td>
                            {formData.monthlyData.map((data: MonthlyData, idx: number) => (

                              <td key={`exception-${idx}`}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={data.exceptionReason || ''}
                                  onChange={(e) => handleMonthlyDataChange(idx, 'exceptionReason', e.target.value)}
                                  style={{ width: '60px' }}
                                />
                              </td>
                            ))}
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>キャンセル</button>
          <button type="submit" className="btn btn-primary">保存</button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeDetail;