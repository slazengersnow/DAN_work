// frontend/src/components/employee-tabs/MonthlyInfo.tsx
import React, { useState, ChangeEvent } from 'react';
import { TabProps } from '../../types/Employee';

const MonthlyInfo: React.FC<TabProps> = ({ employeeData, onUpdate }) => {
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  const [laborTimeChange, setLaborTimeChange] = useState<string>('なし');
  
  // 初期値の設定（実際のデータがない場合はデフォルト値を使用）
  const defaultMonthlyData = {
    standardHours: Array(12).fill(160),
    actualHours: [160, 160, 152, 160, 160, 160, 144, 160, 160, 160, 160, 152],
    notes: ['', '', '有給休暇', '', '', '', '診療通院(2日)', '', '', '', '', '有給休暇'],
    attendanceFlag: Array(12).fill(1),
    reportFlag: Array(12).fill(1),
    countValues: Array(12).fill(employeeData.count || 2.0)
  };

  const [monthlyData, setMonthlyData] = useState(employeeData.monthlyData || defaultMonthlyData);

  // 月名の配列
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

  // 年度変更ハンドラ
  const handleFiscalYearChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setFiscalYear(e.target.value);
    // APIから該当年度のデータを取得する処理などを追加
  };

  // 労働時間変動有無の変更ハンドラ
  const handleLaborTimeChangeToggle = (e: ChangeEvent<HTMLSelectElement>): void => {
    setLaborTimeChange(e.target.value);
  };

  // 月次データの編集ハンドラ
  const handleMonthlyDataChange = (field: 'standardHours' | 'actualHours' | 'notes' | 'attendanceFlag' | 'countValues', monthIndex: number, value: string): void => {
    const newMonthlyData = { ...monthlyData };
    
    if (field === 'notes') {
      newMonthlyData[field][monthIndex] = value;
    } else {
      const numValue = value === '' ? 0 : Number(value);
      if (!isNaN(numValue)) {
        newMonthlyData[field][monthIndex] = numValue;
      }
    }
    
    setMonthlyData(newMonthlyData);
    
    // 親コンポーネントにデータ更新を通知
    onUpdate({ monthlyData: newMonthlyData });
  };

  // 年間合計を計算
  const calculateYearlyTotal = (hourArray: number[]): number => {
    return hourArray.reduce((sum, hours) => sum + hours, 0);
  };

  // CSVファイルをエクスポートする関数
  const exportToCSV = (): void => {
    alert('CSVエクスポート機能はまだ実装されていません');
    // 実際のエクスポート処理を実装
  };

  // 一括申請する関数
  const submitBatch = (): void => {
    alert('一括申請機能はまだ実装されていません');
    // 実際の申請処理を実装
  };

  // 共通のテーブルセルスタイル
  const cellStyle = {
    width: '100%',
    height: '26px',
    border: 'none',
    textAlign: 'center' as const,
    background: 'transparent',
    fontSize: '14px'
  };

  // 合計セルスタイル (フォントサイズを各月と同じに)
  const totalCellStyle = {
    padding: '0 4px',
    textAlign: 'center' as const,
    backgroundColor: '#f0f0f0',
    fontSize: '14px'  // 各月と同じフォントサイズ
  };

  return (
    <div className="monthly-info-tab">
      {/* 申告設定 */}
      <div className="declaration-settings">
        <h3 className="section-title">申告設定</h3>
        <div className="form-row">
          <div className="form-group">
            <label>申告年度</label>
            <select 
              value={fiscalYear} 
              onChange={handleFiscalYearChange}
              className="form-control"
            >
              <option value="2024年度">2024年度</option>
              <option value="2023年度">2023年度</option>
              <option value="2022年度">2022年度</option>
            </select>
          </div>
          <div className="form-group">
            <label>所定労働時間変動の有無</label>
            <select 
              value={laborTimeChange} 
              onChange={handleLaborTimeChangeToggle}
              className="form-control"
            >
              <option value="なし">なし</option>
              <option value="あり">あり</option>
            </select>
          </div>
        </div>
      </div>

      {/* 労働時間テーブル - スプレッドシートスタイル */}
      <div className="labor-hours-section">
        <h3 className="section-title">労働時間</h3>
        
        <div className="monthly-table-container">
          <table className="monthly-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ height: '30px' }}>
                <th style={{ width: '100px', textAlign: 'left', paddingLeft: '8px' }}></th>
                {months.map((month, index) => (
                  <th key={`header-${index}`} style={{ padding: '4px', textAlign: 'center' }}>{month}</th>
                ))}
                <th style={{ padding: '4px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>合計</th>
              </tr>
            </thead>
            <tbody>
              {/* 所定労働時間の行 */}
              <tr style={{ height: '26px' }}>
                <th style={{ textAlign: 'left', paddingLeft: '8px' }}>所定時間</th>
                {monthlyData.standardHours.map((hours: number, index: number) => (
                  <td key={`standard-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                    <input
                      type="text"
                      style={cellStyle}
                      value={hours}
                      onChange={(e) => handleMonthlyDataChange('standardHours', index, e.target.value)}
                    />
                  </td>
                ))}
                <td style={totalCellStyle}>
                  {calculateYearlyTotal(monthlyData.standardHours)}
                </td>
              </tr>
              
              {/* 実労働時間の行 */}
              <tr style={{ height: '26px' }}>
                <th style={{ textAlign: 'left', paddingLeft: '8px' }}>実労働時間</th>
                {monthlyData.actualHours.map((hours: number, index: number) => (
                  <td key={`actual-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                    <input
                      type="text"
                      style={cellStyle}
                      value={hours}
                      onChange={(e) => handleMonthlyDataChange('actualHours', index, e.target.value)}
                    />
                  </td>
                ))}
                <td style={totalCellStyle}>
                  {calculateYearlyTotal(monthlyData.actualHours)}
                </td>
              </tr>
              
              {/* 在籍フラグの行 */}
              <tr style={{ height: '26px' }}>
                <th style={{ textAlign: 'left', paddingLeft: '8px' }}>在籍フラグ</th>
                {monthlyData.attendanceFlag.map((flag: number, index: number) => (
                  <td key={`attendance-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                    <input
                      type="text"
                      style={cellStyle}
                      value={flag}
                      onChange={(e) => handleMonthlyDataChange('attendanceFlag', index, e.target.value)}
                    />
                  </td>
                ))}
                <td style={{ ...totalCellStyle, fontWeight: 'normal' }}></td>
              </tr>

              {/* カウント値の行 */}
              <tr style={{ height: '26px' }}>
                <th style={{ textAlign: 'left', paddingLeft: '8px' }}>カウント</th>
                {monthlyData.countValues.map((count: number, index: number) => (
                  <td key={`count-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                    <input
                      type="text"
                      style={cellStyle}
                      value={count.toFixed(1)}
                      onChange={(e) => handleMonthlyDataChange('countValues', index, e.target.value)}
                    />
                  </td>
                ))}
                <td style={{ ...totalCellStyle, fontWeight: 'normal' }}></td>
              </tr>

              {/* 備考の行 */}
              <tr style={{ height: '26px' }}>
                <th style={{ textAlign: 'left', paddingLeft: '8px' }}>備考</th>
                {monthlyData.notes.map((note: string, index: number) => (
                  <td key={`note-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                    <input
                      type="text"
                      style={cellStyle}
                      value={note}
                      onChange={(e) => handleMonthlyDataChange('notes', index, e.target.value)}
                      placeholder="-"
                    />
                  </td>
                ))}
                <td style={{ ...totalCellStyle, fontWeight: 'normal' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 年間合計 */}
      <div className="summary-section" style={{ marginTop: '20px' }}>
        <h3 className="section-title">年間合計</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontWeight: 'bold', width: '200px' }}>年間合計所定労働時間:</div>
            <div style={{ fontWeight: 'bold' }}>{calculateYearlyTotal(monthlyData.standardHours)}時間</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontWeight: 'bold', width: '200px' }}>年間合計実労働時間:</div>
            <div style={{ fontWeight: 'bold' }}>{calculateYearlyTotal(monthlyData.actualHours)}時間</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button 
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              padding: '6px 12px', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={exportToCSV}
          >
            CSV出力
          </button>
          <button 
            style={{ 
              backgroundColor: '#007bff', 
              color: 'white', 
              padding: '6px 12px', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={submitBatch}
          >
            一括申請
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyInfo;