import React, { useState } from 'react';

// モックデータ
const mockSummary = {
  year: 2024,
  month: 11,
  totalEmployees: 525,
  disabledEmployees: 5,
  employmentCount: 12.75,
  actualRate: 2.43,
  legalRate: 2.3,
};

const mockEmployees = [
  { no: 1, id: 1001, name: '山田 太郎', type: '身体障害', disability: '視覚', grade: '1級', hireDate: '2020/04/01', status: '在籍', 
    monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { no: 2, id: 2222, name: '鈴木 花子', type: '身体障害', disability: '聴覚', grade: '4級', hireDate: '2020/04/01', status: '在籍', 
    monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { no: 3, id: 3333, name: '佐藤 一郎', type: '知的障害', disability: '-', grade: 'B', hireDate: '2020/04/01', status: '在籍', 
    monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { no: 4, id: 4444, name: '高橋 勇太', type: '精神障害', disability: 'ADHD', grade: '3級', hireDate: '2020/04/01', status: '在籍', 
    monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { no: 5, id: 5555, name: '田中 美咲', type: '精神障害', disability: 'うつ病', grade: '2級', hireDate: '2021/04/01', status: '在籍', 
    monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
];

const mockHistory = [
  { yearMonth: '2024/11', totalEmployees: 525, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.75, actualRate: 2.43, status: '確定済' },
  { yearMonth: '2024/10', totalEmployees: 525, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.5, actualRate: 2.38, status: '確定済' },
  { yearMonth: '2024/09', totalEmployees: 520, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.0, actualRate: 2.31, status: '確定済' },
];

// 月次詳細データ
const initialMonthlyDetailData = {
  months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
  data: [
    { id: 1, item: '従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 2, item: 'フルタイム従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 3, item: 'パートタイム従業員数', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 4, item: 'トータル従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 5, item: '等級1級および2級', values: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 24], isDisability: true },
    { id: 6, item: 'その他', values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 33], isDisability: true },
    { id: 7, item: '等級1級および2級 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], isDisability: true },
    { id: 8, item: 'その他 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], isDisability: true },
    { id: 9, item: 'トータル障がい者数', values: [4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 57], isDisability: true },
    { id: 10, item: '実雇用率', values: [0.7, 0.7, 0.6, 0.8, 0.8, 0.8, 0.8, 0.7, 0.8, 0.7, 0.7, 0.7, 0.7], suffix: '%', isRatio: true },
    { id: 11, item: '法定雇用率', values: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5], suffix: '%', isRatio: true },
    { id: 12, item: '法定雇用者数', values: [15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 18, 196] },
    { id: 13, item: 'Overs and Shorts', values: [-11, -11, -12, -11, -11, -11, -12, -12, -12, -12, -12, -13, -139], isNegative: true }
  ]
};

const MonthlyReport: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedMonth, setSelectedMonth] = useState<number>(11);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [employees, setEmployees] = useState([...mockEmployees]);
  const [monthlyDetailData, setMonthlyDetailData] = useState({...initialMonthlyDetailData});
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [editingDetailRow, setEditingDetailRow] = useState<number | null>(null);
  const [editingDetailCol, setEditingDetailCol] = useState<number | null>(null);

  const tabItems = [
    { id: 'summary', label: 'サマリー' },
    { id: 'employees', label: '従業員詳細' },
    { id: 'monthly', label: '月次詳細' }
  ];

  // 従業員情報の編集ハンドラー
  const handleEmployeeEdit = (employeeId: number) => {
    setEditingEmployeeId(employeeId);
  };

  // 従業員情報の保存ハンドラー
  const handleEmployeeSave = () => {
    setEditingEmployeeId(null);
  };

  // 従業員データの更新ハンドラー
  const handleEmployeeDataChange = (id: number, field: string, value: string) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    ));
  };

  // 従業員の月次ステータス更新ハンドラー
  const handleMonthlyStatusChange = (id: number, monthIndex: number, value: number) => {
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        const newMonthlyStatus = [...emp.monthlyStatus];
        newMonthlyStatus[monthIndex] = value;
        return { ...emp, monthlyStatus: newMonthlyStatus };
      }
      return emp;
    }));
  };

  // 月次詳細データの編集ハンドラー
  const handleDetailCellEdit = (rowId: number, colIndex: number) => {
    setEditingDetailRow(rowId);
    setEditingDetailCol(colIndex);
  };

  // 月次詳細データの更新ハンドラー
  const handleDetailCellChange = (rowId: number, colIndex: number, value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;

    setMonthlyDetailData(prev => {
      const newData = {...prev};
      const rowIndex = newData.data.findIndex(row => row.id === rowId);
      
      if (rowIndex !== -1 && colIndex < 12) { // 合計列は編集不可
        newData.data[rowIndex].values[colIndex] = numValue;
        
        // 合計を再計算
        newData.data[rowIndex].values[12] = newData.data[rowIndex].values.slice(0, 12).reduce((acc, val) => acc + val, 0);
      }
      
      return newData;
    });
  };

  // 月次詳細データの保存ハンドラー
  const handleDetailCellSave = () => {
    setEditingDetailRow(null);
    setEditingDetailCol(null);
  };

  // 編集フォーム以外をクリックした時に保存
  const handleOutsideClick = () => {
    if (editingEmployeeId !== null) {
      handleEmployeeSave();
    }
    if (editingDetailRow !== null) {
      handleDetailCellSave();
    }
  };

  return (
    <div className="section monthly-section" onClick={handleOutsideClick}>
      <h2 className="section-title">月次報告</h2>
      
      {activeTab === 'summary' && (
        <div className="filter-container">
          <div className="filter-group">
            <label>対象期間</label>
            <div className="filter-controls">
              <select 
                className="select-input"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                <option value={2024}>2024年</option>
                <option value={2023}>2023年</option>
                <option value={2022}>2022年</option>
              </select>
              
              <select 
                className="select-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
            </div>
            
            <button className="btn primary-btn">表示</button>
            <button className="btn secondary-btn">月次確定</button>
          </div>
        </div>
      )}
      
      <div className="summary-box">
        <h3 className="summary-title">2024年集計サマリー</h3>
        <div className="summary-content">
          常用労働者数: {mockSummary.totalEmployees}名 | 障害者数: {mockSummary.disabledEmployees}名 | 雇用カウント: {mockSummary.employmentCount} | 実雇用率: {mockSummary.actualRate}% | 法定雇用率: {mockSummary.legalRate}%
        </div>
      </div>

      <div className="tab-container">
        <div className="tabs">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="tab-content">
        {activeTab === 'summary' && (
          <>
            <div className="data-container">
              <h3 className="data-title">障害者雇用者詳細</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>社員ID</th>
                      <th>氏名</th>
                      <th>障害区分</th>
                      <th>障害</th>
                      <th>等級</th>
                      <th>採用日</th>
                      <th>状態</th>
                      <th>11月フラグ</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.no}</td>
                        <td>{employee.id}</td>
                        <td>{employee.name}</td>
                        <td>{employee.type}</td>
                        <td>{employee.disability}</td>
                        <td>{employee.grade}</td>
                        <td>{employee.hireDate}</td>
                        <td>
                          <span className="status-badge active">{employee.status}</span>
                        </td>
                        <td>1</td>
                        <td>
                          <button className="btn action-btn">編集</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="data-container">
              <h3 className="data-title">月別実績履歴</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>年月</th>
                      <th>常用労働者数</th>
                      <th>障害者数</th>
                      <th>身体障害</th>
                      <th>知的障害</th>
                      <th>精神障害</th>
                      <th>雇用カウント</th>
                      <th>実雇用率</th>
                      <th>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockHistory.map((record, index) => (
                      <tr key={index}>
                        <td>{record.yearMonth}</td>
                        <td>{record.totalEmployees}</td>
                        <td>{record.disabledCount}</td>
                        <td>{record.physical}</td>
                        <td>{record.intellectual}</td>
                        <td>{record.mental}</td>
                        <td>{record.employmentCount}</td>
                        <td>{record.actualRate}%</td>
                        <td>
                          <span className="status-badge confirmed">{record.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'employees' && (
          <div className="data-container">
            <h3 className="data-title">従業員詳細</h3>
            <div className="data-table-wrapper">
              <div className="horizontal-scroll-container">
                <table className="data-table employee-detail-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>社員ID</th>
                      <th>氏名</th>
                      <th>障害区分</th>
                      <th>障害</th>
                      <th>等級</th>
                      <th>採用日</th>
                      <th>状態</th>
                      <th>4月</th>
                      <th>5月</th>
                      <th>6月</th>
                      <th>7月</th>
                      <th>8月</th>
                      <th>9月</th>
                      <th>10月</th>
                      <th>11月</th>
                      <th>12月</th>
                      <th>1月</th>
                      <th>2月</th>
                      <th>3月</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.no}</td>
                        <td>
                          {editingEmployeeId === employee.id ? (
                            <input 
                              type="text" 
                              value={employee.id} 
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'id', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            employee.id
                          )}
                        </td>
                        <td>
                          {editingEmployeeId === employee.id ? (
                            <input 
                              type="text" 
                              value={employee.name} 
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'name', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            employee.name
                          )}
                        </td>
                        <td>
                          {editingEmployeeId === employee.id ? (
                            <select 
                              value={employee.type} 
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'type', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="身体障害">身体障害</option>
                              <option value="知的障害">知的障害</option>
                              <option value="精神障害">精神障害</option>
                            </select>
                          ) : (
                            employee.type
                          )}
                        </td>
                        <td>
                          {editingEmployeeId === employee.id ? (
                            <input 
                              type="text" 
                              value={employee.disability} 
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'disability', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            employee.disability
                          )}
                        </td>
                        <td>
                          {editingEmployeeId === employee.id ? (
                            <input 
                              type="text" 
                              value={employee.grade} 
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'grade', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            employee.grade
                          )}
                        </td>
                        <td>
                          {editingEmployeeId === employee.id ? (
                            <input 
                              type="date" 
                              value={employee.hireDate.split('/').join('-')} 
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'hireDate', e.target.value.split('-').join('/'))}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            employee.hireDate
                          )}
                        </td>
                        <td>
                          {editingEmployeeId === employee.id ? (
                            <select 
                              value={employee.status} 
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'status', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="在籍">在籍</option>
                              <option value="休職">休職</option>
                              <option value="退職">退職</option>
                            </select>
                          ) : (
                            <span className="status-badge active">{employee.status}</span>
                          )}
                        </td>
                        {employee.monthlyStatus.map((status, monthIndex) => (
                          <td key={`${employee.id}-month-${monthIndex}`}>
                            {editingEmployeeId === employee.id ? (
                              <select 
                                value={status} 
                                onChange={(e) => handleMonthlyStatusChange(employee.id, monthIndex, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value={1}>1</option>
                                <option value={0}>0</option>
                              </select>
                            ) : (
                              status
                            )}
                          </td>
                        ))}
                        <td>
                          {editingEmployeeId === employee.id ? (
                            <button 
                              className="btn save-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmployeeSave();
                              }}
                            >
                              保存
                            </button>
                          ) : (
                            <button 
                              className="btn action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmployeeEdit(employee.id);
                              }}
                            >
                              編集
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'monthly' && (
          <div className="data-container">
            <div className="data-table-wrapper">
              <div className="horizontal-scroll-container">
                <table className="data-table monthly-detail-table">
                  <thead>
                    <tr>
                      <th className="fixed-column"></th>
                      {monthlyDetailData.months.map(month => (
                        <th key={month}>{month}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyDetailData.data.map((row) => {
                      // 特定の行の前にスペーサー行を追加
                      const needsSpacerBefore = row.id === 5 || row.id === 10;
                      const isHeaderRow = row.id === 5;
                      
                      return (
                        <React.Fragment key={`row-${row.id}`}>
                          {needsSpacerBefore && (
                            <tr className="spacer-row">
                              <td colSpan={14}></td>
                            </tr>
                          )}
                          {isHeaderRow && (
                            <tr className="header-row">
                              <th colSpan={14}>障がい者</th>
                            </tr>
                          )}
                          <tr>
                            <td className="fixed-column item-column">{row.item}</td>
                            {row.values.map((value, colIndex) => {
                              let className = '';
                              if (row.isNegative && value < 0) className = 'negative-value';
                              else if (row.isRatio) className = 'ratio-value';
                              
                              return (
                                <td key={`value-${row.id}-${colIndex}`} className={className}>
                                  {editingDetailRow === row.id && editingDetailCol === colIndex ? (
                                    <input
                                      type="text"
                                      value={value}
                                      onChange={(e) => handleDetailCellChange(row.id, colIndex, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleDetailCellSave();
                                        }
                                      }}
                                      autoFocus
                                      style={{ width: '100%', padding: '2px' }}
                                    />
                                  ) : (
                                    <span 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // 合計列は編集不可
                                        if (colIndex < 12) {
                                          handleDetailCellEdit(row.id, colIndex);
                                        }
                                      }}
                                      className={colIndex < 12 ? 'editable-cell' : ''}
                                    >
                                      {value}{row.suffix || ''}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="action-buttons">
        <button className="btn secondary-btn">印刷</button>
        <button className="btn primary-btn">CSVエクスポート</button>
      </div>
    </div>
  );
};

export default MonthlyReport;