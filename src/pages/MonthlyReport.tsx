import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ElementDetector, 
  DOMManipulator, 
  diagnosePageStructure 
} from '../utils/common';

// 型定義を追加
interface Employee {
  no: number;
  id: number;
  name: string;
  type: string;
  disability: string;
  grade: string;
  hireDate: string;
  status: string;
  count: number;
  monthlyStatus: number[];
  memo: string;
}

interface MonthlyDetailData {
  months: string[];
  data: {
    id: number;
    item: string;
    values: number[];
    suffix?: string;
    isRatio?: boolean;
    isCalculated?: boolean;
    isNegative?: boolean;
    isDisability?: boolean;
  }[];
}

interface HistoryRecord {
  yearMonth: string;
  totalEmployees: number;
  disabledCount: number;
  physical: number;
  intellectual: number;
  mental: number;
  employmentCount: number;
  actualRate: number;
  status: string;
}

interface SummaryData {
  year: number;
  month: number;
  totalEmployees: number;
  disabledEmployees: number;
  employmentCount: number;
  actualRate: number;
  legalRate: number;
}

// モックデータ
const mockSummary: SummaryData = {
  year: 2024,
  month: 11,
  totalEmployees: 525,
  disabledEmployees: 5,
  employmentCount: 12.75,
  actualRate: 2.43,
  legalRate: 2.3,
};

const mockEmployees: Employee[] = [
  { no: 1, id: 1001, name: '山田 太郎', type: '身体障害', disability: '視覚', grade: '1級', hireDate: '2020/04/01', status: '在籍', 
    count: 2.0, monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], memo: '特記事項なし' },
  { no: 2, id: 2222, name: '鈴木 花子', type: '身体障害', disability: '聴覚', grade: '4級', hireDate: '2020/04/01', status: '在籍', 
    count: 1.0, monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], memo: '' },
  { no: 3, id: 3333, name: '佐藤 一郎', type: '知的障害', disability: '-', grade: 'B', hireDate: '2020/04/01', status: '在籍', 
    count: 1.0, monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], memo: '' },
  { no: 4, id: 4444, name: '高橋 勇太', type: '精神障害', disability: 'ADHD', grade: '3級', hireDate: '2020/04/01', status: '在籍', 
    count: 1.0, monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], memo: '月1回面談実施' },
  { no: 5, id: 5555, name: '田中 美咲', type: '精神障害', disability: 'うつ病', grade: '2級', hireDate: '2021/04/01', status: '在籍', 
    count: 1.0, monthlyStatus: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], memo: '短時間勤務' },
];

const mockHistory: HistoryRecord[] = [
  { yearMonth: '2024/11', totalEmployees: 525, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.75, actualRate: 2.43, status: '確定済' },
  { yearMonth: '2024/10', totalEmployees: 525, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.5, actualRate: 2.38, status: '確定済' },
  { yearMonth: '2024/09', totalEmployees: 520, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.0, actualRate: 2.31, status: '確定済' },
];

// 月次詳細データ
const initialMonthlyDetailData: MonthlyDetailData = {
  months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
  data: [
    { id: 1, item: '従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 2, item: 'フルタイム従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 3, item: 'パートタイム従業員数', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 4, item: 'トータル従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 700, 7822] },
    { id: 5, item: 'Level 1 & 2', values: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 24], isDisability: true },
    { id: 6, item: 'その他', values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 33], isDisability: true },
    { id: 7, item: 'Level 1 & 2 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], isDisability: true },
    { id: 8, item: 'その他 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], isDisability: true },
    { id: 9, item: 'トータル障がい者数', values: [4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 57], isDisability: true },
    { id: 10, item: '実雇用率', values: [0.7, 0.7, 0.6, 0.8, 0.8, 0.8, 0.8, 0.7, 0.8, 0.7, 0.7, 0.7, 0.7], suffix: '%', isRatio: true, isCalculated: true },
    { id: 11, item: '法定雇用率', values: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5], suffix: '%', isRatio: true },
    { id: 12, item: '法定雇用者数', values: [15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 18, 196], isCalculated: true },
    { id: 13, item: '超過・未達', values: [-11, -11, -12, -11, -11, -11, -12, -12, -12, -12, -12, -13, -139], isNegative: true, isCalculated: true }
  ]
};

const MonthlyReport: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedMonth, setSelectedMonth] = useState<number>(11);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [employees, setEmployees] = useState<Employee[]>([...mockEmployees]);
  const [monthlyDetailData, setMonthlyDetailData] = useState<MonthlyDetailData>({...initialMonthlyDetailData});
  const [editingDetailRow, setEditingDetailRow] = useState<number | null>(null);
  const [editingDetailCol, setEditingDetailCol] = useState<number | null>(null);
  const [activeCell, setActiveCell] = useState<{row: number | null, col: number | null}>({row: null, col: null});
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editingSummary, setEditingSummary] = useState<boolean>(false);
  
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  const tabItems = [
    { id: 'summary', label: 'サマリー' },
    { id: 'employees', label: '従業員詳細' },
    { id: 'monthly', label: '月次詳細' }
  ];

  // 従業員データの更新ハンドラー
  const handleEmployeeDataChange = (id: number, field: string, value: string) => {
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        // 修正1: 型安全に変更を処理
        const updatedEmp = { ...emp, [field]: value };
        
        // 身体障害で1級または2級の場合、自動的にカウントを2にする
        if (field === 'type' || field === 'grade') {
          if (updatedEmp.type === '身体障害' && (updatedEmp.grade === '1級' || updatedEmp.grade === '2級')) {
            updatedEmp.count = 2.0;
          }
        }
        
        return updatedEmp;
      }
      return emp;
    }));
  };

  // 従業員の月次ステータス更新ハンドラー
  const handleMonthlyStatusChange = (id: number, monthIndex: number, value: string) => {
    // 修正2: 数値変換を明示的に行う
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        const newMonthlyStatus = [...emp.monthlyStatus];
        newMonthlyStatus[monthIndex] = numValue;
        return { ...emp, monthlyStatus: newMonthlyStatus };
      }
      return emp;
    }));
  };

  // 月次詳細データの編集ハンドラー
  const handleDetailCellEdit = (rowId: number, colIndex: number) => {
    if (isCalculatedField(rowId)) return; // 自動計算フィールドは編集不可
    
    setEditingDetailRow(rowId);
    setEditingDetailCol(colIndex);
    
    // 遅延してフォーカスを設定
    setTimeout(() => {
      const inputKey = `input-${rowId}-${colIndex}`;
      if (inputRefs.current[inputKey]) {
        inputRefs.current[inputKey]?.focus();
      }
    }, 10);
  };

  // 月次詳細データの更新ハンドラー
  const handleDetailCellChange = (rowId: number, colIndex: number, value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;

    setMonthlyDetailData(prev => {
      const newData = {...prev, data: [...prev.data]};
      const rowIndex = newData.data.findIndex(row => row.id === rowId);
      
      if (rowIndex !== -1 && colIndex < 12) { // 合計列は編集不可
        const updatedRow = {...newData.data[rowIndex]};
        const newValues = [...updatedRow.values];
        newValues[colIndex] = numValue;
        
        // 合計を再計算
        newValues[12] = newValues.slice(0, 12).reduce((acc, val) => acc + val, 0);
        
        updatedRow.values = newValues;
        newData.data[rowIndex] = updatedRow;
      }
      
      // 自動計算フィールドの更新
      return recalculateValues(newData);
    });
  };

  // 自動計算フィールドの確認
  const isCalculatedField = (rowId: number): boolean => {
    const row = monthlyDetailData.data.find(row => row.id === rowId);
    return !!row?.isCalculated;
  };

  // 計算の依存関係を考慮した全ての値の再計算
  const recalculateValues = (data: MonthlyDetailData): MonthlyDetailData => {
    const newData = {...data, data: [...data.data]};
    
    // インデックスで各行を取得
    const totalEmployeesIdx = newData.data.findIndex(row => row.id === 4);
    const totalDisabledIdx = newData.data.findIndex(row => row.id === 9);
    const actualRateIdx = newData.data.findIndex(row => row.id === 10);
    const legalRateIdx = newData.data.findIndex(row => row.id === 11);
    const legalCountIdx = newData.data.findIndex(row => row.id === 12);
    const shortageIdx = newData.data.findIndex(row => row.id === 13);
    
    if (totalEmployeesIdx !== -1 && totalDisabledIdx !== -1 && actualRateIdx !== -1 && 
        legalRateIdx !== -1 && legalCountIdx !== -1 && shortageIdx !== -1) {
      
      const totalEmployeesRow = newData.data[totalEmployeesIdx];
      const totalDisabledRow = newData.data[totalDisabledIdx];
      const legalRateRow = newData.data[legalRateIdx];
      
      // 各月ごとに計算を行う
      for (let i = 0; i < 13; i++) { // 合計も含めて計算
        // 1. 実雇用率の計算（トータル障がい者数 / トータル従業員数）
        if (totalEmployeesRow.values[i] > 0) {
          newData.data[actualRateIdx].values[i] = parseFloat((totalDisabledRow.values[i] / totalEmployeesRow.values[i] * 100).toFixed(2));
        } else {
          newData.data[actualRateIdx].values[i] = 0;
        }
        
        // 2. 法定雇用者数の計算（法定雇用率 * トータル従業員数 / 100）
        newData.data[legalCountIdx].values[i] = Math.round(legalRateRow.values[i] * totalEmployeesRow.values[i] / 100);
        
        // 3. 超過・未達の計算（トータル障がい者数 - 法定雇用者数）
        newData.data[shortageIdx].values[i] = totalDisabledRow.values[i] - newData.data[legalCountIdx].values[i];
      }
    }
    
    return newData;
  };

  // 月次詳細データの保存ハンドラー
  const handleDetailCellSave = () => {
    setEditingDetailRow(null);
    setEditingDetailCol(null);
  };

  // キーボードナビゲーション用のハンドラー
  const handleKeyDown = (e: React.KeyboardEvent, rowId: number, colIndex: number) => {
    if (isCalculatedField(rowId)) return; // 自動計算フィールドは移動のみ許可
    
    // Enter キーを押した場合は編集を保存して下の行へ
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDetailCellSave();
      
      // 次の編集可能なセルを探して移動
      const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
      let nextRowId = null;
      
      for (let i = currentRowIndex + 1; i < monthlyDetailData.data.length; i++) {
        if (!isCalculatedField(monthlyDetailData.data[i].id)) {
          nextRowId = monthlyDetailData.data[i].id;
          break;
        }
      }
      
      if (nextRowId !== null) {
        handleDetailCellEdit(nextRowId, colIndex);
      }
    }
    // Tab キーを押した場合は次のセルへ
    else if (e.key === 'Tab') {
      e.preventDefault();
      handleDetailCellSave();
      
      if (e.shiftKey) {
        // Shift+Tab で左へ移動
        if (colIndex > 0) {
          handleDetailCellEdit(rowId, colIndex - 1);
        } else {
          // 前の行の最後の列へ
          const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
          if (currentRowIndex > 0) {
            let prevRowId = null;
            for (let i = currentRowIndex - 1; i >= 0; i--) {
              if (!isCalculatedField(monthlyDetailData.data[i].id)) {
                prevRowId = monthlyDetailData.data[i].id;
                break;
              }
            }
            if (prevRowId !== null) {
              handleDetailCellEdit(prevRowId, 11); // 最後の月 (12番目のセル)
            }
          }
        }
      } else {
        // Tab で右へ移動
        if (colIndex < 11) {
          handleDetailCellEdit(rowId, colIndex + 1);
        } else {
          // 次の行の最初の列へ
          const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
          if (currentRowIndex < monthlyDetailData.data.length - 1) {
            let nextRowId = null;
            for (let i = currentRowIndex + 1; i < monthlyDetailData.data.length; i++) {
              if (!isCalculatedField(monthlyDetailData.data[i].id)) {
                nextRowId = monthlyDetailData.data[i].id;
                break;
              }
            }
            if (nextRowId !== null) {
              handleDetailCellEdit(nextRowId, 0); // 最初の月
            }
          }
        }
      }
    }
    // 矢印キーでの移動
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleDetailCellSave();
      
      const currentRowIndex = monthlyDetailData.data.findIndex(row => row.id === rowId);
      
      if (e.key === 'ArrowUp' && currentRowIndex > 0) {
        let prevRowId = null;
        for (let i = currentRowIndex - 1; i >= 0; i--) {
          if (!isCalculatedField(monthlyDetailData.data[i].id)) {
            prevRowId = monthlyDetailData.data[i].id;
            break;
          }
        }
        if (prevRowId !== null) {
          handleDetailCellEdit(prevRowId, colIndex);
        }
      }
      else if (e.key === 'ArrowDown' && currentRowIndex < monthlyDetailData.data.length - 1) {
        let nextRowId = null;
        for (let i = currentRowIndex + 1; i < monthlyDetailData.data.length; i++) {
          if (!isCalculatedField(monthlyDetailData.data[i].id)) {
            nextRowId = monthlyDetailData.data[i].id;
            break;
          }
        }
        if (nextRowId !== null) {
          handleDetailCellEdit(nextRowId, colIndex);
        }
      }
      else if (e.key === 'ArrowLeft' && colIndex > 0) {
        handleDetailCellEdit(rowId, colIndex - 1);
      }
      else if (e.key === 'ArrowRight' && colIndex < 11) {
        handleDetailCellEdit(rowId, colIndex + 1);
      }
    }
  };

  // セルクリック時にアクティブセルを設定
  const handleCellClick = (rowId: number, colIndex: number) => {
    if (colIndex >= 12) return; // 合計列はクリック不可
    setActiveCell({row: rowId, col: colIndex});
    
    if (!isCalculatedField(rowId)) {
      handleDetailCellEdit(rowId, colIndex);
    }
  };

  // 編集フォーム以外をクリックした時に保存
  const handleOutsideClick = () => {
    if (editingDetailRow !== null) {
      handleDetailCellSave();
    }
  };

  // 編集モードの切り替え
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // サマリー編集モードの切り替え
  const toggleSummaryEditMode = () => {
    setEditingSummary(!editingSummary);
  };

  // 従業員メモの更新ハンドラー
  const handleMemoChange = (id: number, value: string) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, memo: value } : emp
    ));
  };

  // カウント更新ハンドラー
  const handleCountChange = (id: number, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, count: numValue } : emp
    ));
  };

  // 初回読み込み時に自動計算と身体障害1級・2級のカウント設定
  useEffect(() => {
    setMonthlyDetailData(recalculateValues(monthlyDetailData));
    
    // 身体障害1級・2級のカウントを自動設定
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => {
        if (emp.type === '身体障害' && (emp.grade === '1級' || emp.grade === '2級')) {
          return { ...emp, count: 2.0 };
        }
        return emp;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 年月表示を隠す処理を追加
  useEffect(() => {
    const setupPage = async () => {
      try {
        // 修正3: ElementDetectorの使用方法を修正
        // 年月セレクタ要素を検出
        const yearMonthSelectors = ElementDetector.findFormElements(['.year-month-selector', '.filter-select']);
        
        // 要素が見つかったら隠す
        if (yearMonthSelectors && yearMonthSelectors.elements && yearMonthSelectors.elements.length > 0) {
          Array.from(yearMonthSelectors.elements).forEach((element: Element) => {
            DOMManipulator.hide(element);
          });
        }
      } catch (error) {
        console.error('Error hiding year/month selectors:', error);
      }
    };
    
    setupPage();
    
    // クリーンアップ関数
    return () => {
      try {
        // 修正4: クリーンアップ処理を修正
        const yearMonthSelectors = ElementDetector.findFormElements(['.year-month-selector', '.filter-select']);
        
        if (yearMonthSelectors && yearMonthSelectors.elements && yearMonthSelectors.elements.length > 0) {
          Array.from(yearMonthSelectors.elements).forEach((element: Element) => {
            DOMManipulator.show(element);
          });
        }
      } catch (error) {
        console.error('Error showing year/month selectors:', error);
      }
    };
  }, []);

  // 入力参照用関数
  const setInputRef = useCallback((element: HTMLInputElement | null, key: string) => {
    if (element) {
      inputRefs.current[key] = element;
    }
  }, []);

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
      
      <div className="content-wrapper">
        {activeTab === 'summary' && (
          <>
            <div className="data-container">
              <div className="data-header">
                <h3 className="data-title">障害者雇用者詳細</h3>
                <div className="header-actions">
                  {editingSummary ? (
                    <button className="btn primary-btn" onClick={toggleSummaryEditMode}>保存</button>
                  ) : (
                    <button className="btn action-btn" onClick={toggleSummaryEditMode}>編集</button>
                  )}
                </div>
              </div>
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
                      <th>カウント</th>
                      <th>備考</th>
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
                        <td>
                          {editingSummary ? (
                            <input 
                              type="number" 
                              step="0.5" 
                              min="0" 
                              max="2" 
                              value={employee.count} 
                              onChange={(e) => handleCountChange(employee.id, e.target.value)}
                              className="editable-input small-input"
                            />
                          ) : (
                            employee.count
                          )}
                        </td>
                        <td>
                          {editingSummary ? (
                            <input 
                              type="text" 
                              value={employee.memo} 
                              onChange={(e) => handleMemoChange(employee.id, e.target.value)}
                              className="editable-input"
                            />
                          ) : (
                            employee.memo
                          )}
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
            <div className="data-header">
              <h3 className="data-title">従業員詳細</h3>
              <div className="header-actions">
                {editMode ? (
                  <button className="btn primary-btn" onClick={toggleEditMode}>保存</button>
                ) : (
                  <button className="btn action-btn" onClick={toggleEditMode}>編集</button>
                )}
              </div>
            </div>
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
                      <th>備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.no}</td>
                        <td>
                          {editMode ? (
                            <input 
                              type="text" 
                              value={employee.id}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'id', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input"
                            />
                          ) : (
                            employee.id
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <input 
                              type="text" 
                              value={employee.name}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'name', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input"
                            />
                          ) : (
                            employee.name
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <select 
                              value={employee.type}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'type', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-select"
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
                          {editMode ? (
                            <input 
                              type="text" 
                              value={employee.disability}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'disability', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input"
                            />
                          ) : (
                            employee.disability
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <input 
                              type="text" 
                              value={employee.grade}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'grade', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input"
                            />
                          ) : (
                            employee.grade
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <input 
                              type="date"
                              value={employee.hireDate.split('/').join('-')}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'hireDate', e.target.value.split('-').join('/'))}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input"
                            />
                          ) : (
                            employee.hireDate
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <select 
                              value={employee.status}
                              onChange={(e) => handleEmployeeDataChange(employee.id, 'status', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-select"
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
                            {editMode ? (
                              <select 
                                value={status}
                                onChange={(e) => handleMonthlyStatusChange(employee.id, monthIndex, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="editable-select"
                              >
                                <option value="0">0</option>
                                <option value="0.5">0.5</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                              </select>
                            ) : (
                              status
                            )}
                          </td>
                        ))}
                        <td>
                          {editMode ? (
                            <input 
                              type="text" 
                              value={employee.memo}
                              onChange={(e) => handleMemoChange(employee.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="editable-input memo-input"
                            />
                          ) : (
                            employee.memo
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
                          <tr className={row.isCalculated ? 'calculated-row' : ''}>
                            <td className="fixed-column item-column">{row.item}</td>
                            {row.values.map((value, colIndex) => {
                              let className = 'cell';
                              if (row.isNegative && value < 0) className += ' negative-value';
                              else if (row.isRatio) className += ' ratio-value';
                              if (row.isCalculated) className += ' calculated-cell';
                              if (activeCell.row === row.id && activeCell.col === colIndex) className += ' active-cell';
                              
                              return (
                                <td 
                                  key={`value-${row.id}-${colIndex}`} 
                                  className={className}
                                  onClick={() => handleCellClick(row.id, colIndex)}
                                >
                                  {editingDetailRow === row.id && editingDetailCol === colIndex ? (
                                    <input
                                      ref={(el) => setInputRef(el, `input-${row.id}-${colIndex}`)}
                                      type="text"
                                      value={value}
                                      onChange={(e) => handleDetailCellChange(row.id, colIndex, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
                                      className="cell-input"
                                    />
                                  ) : (
                                    <span className={colIndex < 12 && !row.isCalculated ? 'editable-cell' : ''}>
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
            <div className="spreadsheet-help">
              <p>注: 矢印キー、Tab キー、Enter キーでセル間を移動できます。 「実雇用率」「法定雇用者数」「超過・未達」は自動計算されます。</p>
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