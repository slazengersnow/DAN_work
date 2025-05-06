// This is a fixed implementation of the MonthlyReportDetail component
// It corrects issues with calculation and display logic
// Place this file in your preferred location and update imports as needed

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MonthlyDetailData, MonthlyTotal } from './types';

interface MonthlyReportDetailProps {
  monthlyDetailData?: MonthlyDetailData;
  onDetailCellChange?: (rowId: number, colIndex: number, value: string) => void;
  summaryData?: MonthlyTotal;
  isEmbedded?: boolean;
  onRefreshData?: () => void;
  onYearChange?: (year: number) => void;
}

const MonthlyReportDetail: React.FC<MonthlyReportDetailProps> = ({
  monthlyDetailData,
  onDetailCellChange,
  summaryData,
  isEmbedded = false,
  onRefreshData,
  onYearChange
}) => {
  // Keep track of input refs for focus management
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  
  // Current editing state
  const [activeCell, setActiveCell] = useState<{row: number | null, col: number | null}>({row: null, col: null});
  const [editingDetailRow, setEditingDetailRow] = useState<number | null>(null);
  const [editingDetailCol, setEditingDetailCol] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [localData, setLocalData] = useState<MonthlyDetailData | null>(null);
  const [editedValues, setEditedValues] = useState<{[key: string]: any}>({});
  
  // Status and messages
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Initialize local data from props
  useEffect(() => {
    if (monthlyDetailData) {
      setLocalData(monthlyDetailData);
    }
  }, [monthlyDetailData]);
  
  // Keep track of input elements for focus
  const setInputRef = useCallback((element: HTMLInputElement | null, key: string) => {
    if (element) {
      inputRefs.current[key] = element;
    }
  }, []);
  
  // Helper function to determine if a field is automatically calculated
  const isCalculatedField = useCallback((rowId: number): boolean => {
    // ID 4 (Total employees), 9 (Total disabilities), 10 (Actual rate), 12 (Legal count), 13 (Over/under)
    const calculatedFieldIds = [4, 9, 10, 12, 13];
    return calculatedFieldIds.includes(rowId);
  }, []);
  
  // Helper function to determine if a field is the legal rate
  const isLegalRateField = useCallback((rowId: number): boolean => {
    return rowId === 11; // Legal employment rate
  }, []);
  
  // Function to recalculate all data based on inputs
  const recalculateData = useCallback((data: MonthlyDetailData): MonthlyDetailData => {
    const newData = {...data};
    
    // Find indices for key rows
    const fullTimeEmployeesRowIndex = newData.data.findIndex(row => row.id === 2);
    const partTimeEmployeesRowIndex = newData.data.findIndex(row => row.id === 3);
    const totalEmployeesRowIndex = newData.data.findIndex(row => row.id === 4);
    
    const level1And2RowIndex = newData.data.findIndex(row => row.id === 5);
    const otherRowIndex = newData.data.findIndex(row => row.id === 6);
    const level1And2PartTimeRowIndex = newData.data.findIndex(row => row.id === 7);
    const otherPartTimeRowIndex = newData.data.findIndex(row => row.id === 8);
    const totalDisabledRowIndex = newData.data.findIndex(row => row.id === 9);
    
    const legalRateRowIndex = newData.data.findIndex(row => row.id === 11);
    
    // Calculate totals for each basic row
    for (let rowIndex = 0; rowIndex < newData.data.length; rowIndex++) {
      const row = newData.data[rowIndex];
      // Basic rows that need sum calculation
      const isBasicRow = [1, 2, 3, 5, 6, 7, 8].includes(row.id);
      
      if (isBasicRow) {
        // Sum values for the first 12 months to get total
        row.values[12] = row.values.slice(0, 12).reduce((sum, value) => sum + value, 0);
      }
    }
    
    // Calculate total employees (fulltime + 0.5 * parttime)
    if (fullTimeEmployeesRowIndex !== -1 && partTimeEmployeesRowIndex !== -1 && totalEmployeesRowIndex !== -1) {
      const fullTimeValues = newData.data[fullTimeEmployeesRowIndex].values;
      const partTimeValues = newData.data[partTimeEmployeesRowIndex].values;
      
      for (let i = 0; i < 13; i++) {
        newData.data[totalEmployeesRowIndex].values[i] = 
          fullTimeValues[i] + (partTimeValues[i] * 0.5);
      }
    }
    
    // Calculate total disabilities
    if (level1And2RowIndex !== -1 && otherRowIndex !== -1 && 
        level1And2PartTimeRowIndex !== -1 && otherPartTimeRowIndex !== -1 && 
        totalDisabledRowIndex !== -1) {
        
      const level1And2Values = newData.data[level1And2RowIndex].values;
      const otherValues = newData.data[otherRowIndex].values;
      const level1And2PartTimeValues = newData.data[level1And2PartTimeRowIndex].values;
      const otherPartTimeValues = newData.data[otherPartTimeRowIndex].values;
      
      for (let i = 0; i < 13; i++) {
        // Level 1&2 count double, parttime count as half
        newData.data[totalDisabledRowIndex].values[i] = 
          level1And2Values[i] * 2 + otherValues[i] + 
          level1And2PartTimeValues[i] * 2 * 0.5 + otherPartTimeValues[i] * 0.5;
      }
    }
    
    // Calculate employment rates
    if (totalEmployeesRowIndex !== -1 && totalDisabledRowIndex !== -1 && legalRateRowIndex !== -1) {
      const totalEmployeeValues = newData.data[totalEmployeesRowIndex].values;
      const totalDisabledValues = newData.data[totalDisabledRowIndex].values;
      const legalRateValues = newData.data[legalRateRowIndex].values;
      
      // Calculate actual employment rate
      const actualRateRowIndex = newData.data.findIndex(row => row.id === 10);
      if (actualRateRowIndex !== -1) {
        for (let i = 0; i < 13; i++) {
          if (totalEmployeeValues[i] > 0) {
            // Calculate actual rate with 2 decimal places
            const rawRate = (totalDisabledValues[i] / totalEmployeeValues[i]) * 100;
            newData.data[actualRateRowIndex].values[i] = Math.round(rawRate * 100) / 100;
          } else {
            newData.data[actualRateRowIndex].values[i] = 0;
          }
        }
      }
      
      // Calculate legal employment count
      const legalCountRowIndex = newData.data.findIndex(row => row.id === 12);
      if (legalCountRowIndex !== -1) {
        for (let i = 0; i < 13; i++) {
          // Ceiling function is used to ensure minimum required count
          newData.data[legalCountRowIndex].values[i] = 
            Math.ceil((legalRateValues[i] * totalEmployeeValues[i]) / 100);
        }
      }
      
      // Calculate over/under count
      const overUnderRowIndex = newData.data.findIndex(row => row.id === 13);
      if (overUnderRowIndex !== -1 && legalCountRowIndex !== -1) {
        const legalCountValues = newData.data[legalCountRowIndex].values;
        
        for (let i = 0; i < 13; i++) {
          // This can be negative if under the requirement
          newData.data[overUnderRowIndex].values[i] = 
            totalDisabledValues[i] - legalCountValues[i];
        }
      }
    }
    
    return newData;
  }, []);
  
  // Handle cell value changes
  const handleCellChange = useCallback((rowId: number, colIndex: number, value: string) => {
    if (!localData) return;
    
    // Special handling for legal rate field
    const isLegalRate = isLegalRateField(rowId);
    
    // Handle empty input
    if (value === '') {
      value = isLegalRate ? '0.0' : '0';
    }
    
    // Validate input format
    const isValidInput = isLegalRate
      ? /^([0-9]*\.?[0-9]*)?$/.test(value) // Allow decimal for legal rate
      : /^[0-9]*$/.test(value);            // Only integers for other fields
      
    if (!isValidInput) return;
    
    // Convert string to number
    let numValue: number;
    
    if (isLegalRate) {
      // Special handling for decimal input in legal rate field
      if (value === '.') {
        numValue = 0;
      } else if (value.endsWith('.')) {
        numValue = parseFloat(value + '0');
      } else {
        numValue = parseFloat(value);
      }
    } else {
      // Standard number parsing for other fields
      numValue = parseInt(value, 10);
      if (isNaN(numValue)) numValue = 0;
    }
    
    // Keep track of edited values
    if (isLegalRate) {
      setEditedValues(prev => ({
        ...prev,
        [`legal_rate_${colIndex}`]: numValue,
        [`legal_rate_display_${colIndex}`]: value
      }));
    } else {
      setEditedValues(prev => ({
        ...prev,
        [`row_${rowId}_col_${colIndex}`]: numValue
      }));
    }
    
    // Update local data
    setLocalData(prevData => {
      if (!prevData) return null;
      
      const newData = {...prevData};
      const rowIndex = newData.data.findIndex(row => row.id === rowId);
      
      if (rowIndex !== -1 && colIndex < 12) {
        const updatedValues = [...newData.data[rowIndex].values];
        updatedValues[colIndex] = numValue;
        
        // Recalculate sum
        updatedValues[12] = updatedValues.slice(0, 12).reduce((a, b) => a + b, 0);
        
        newData.data[rowIndex].values = updatedValues;
        
        // If legal rate changed, apply to all months
        if (isLegalRate) {
          newData.data[rowIndex].values = newData.data[rowIndex].values.map((_, idx) => 
            idx < 12 ? numValue : newData.data[rowIndex].values[idx]
          );
        }
        
        // Recalculate all dependent values
        return recalculateData(newData);
      }
      
      return prevData;
    });
    
    // Notify parent component if needed
    if (onDetailCellChange) {
      onDetailCellChange(rowId, colIndex, value);
    }
  }, [localData, isLegalRateField, recalculateData, onDetailCellChange]);
  
  // Handle cell click to start editing
  const handleCellClick = useCallback((rowId: number, colIndex: number) => {
    if (!isEditing) return;
    if (isCalculatedField(rowId)) return;
    if (colIndex >= 12) return; // Don't edit total column
    
    setActiveCell({row: rowId, col: colIndex});
    setEditingDetailRow(rowId);
    setEditingDetailCol(colIndex);
    
    // Focus the input after a short delay
    setTimeout(() => {
      const inputKey = `input-${rowId}-${colIndex}`;
      inputRefs.current[inputKey]?.focus();
    }, 10);
  }, [isEditing, isCalculatedField]);
  
  // End cell editing
  const handleCellSave = useCallback(() => {
    setEditingDetailRow(null);
    setEditingDetailCol(null);
  }, []);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowId: number, colIndex: number) => {
    if (!localData) return;
    
    // Enter key: save and move down
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave();
      
      // Find next editable row
      const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
      for (let i = currentRowIndex + 1; i < localData.data.length; i++) {
        if (!isCalculatedField(localData.data[i].id)) {
          handleCellClick(localData.data[i].id, colIndex);
          break;
        }
      }
    }
    // Tab: navigate horizontally
    else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellSave();
      
      if (e.shiftKey) {
        // Shift+Tab: move left or to previous row
        if (colIndex > 0) {
          handleCellClick(rowId, colIndex - 1);
        } else {
          // Find previous editable row
          const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
          for (let i = currentRowIndex - 1; i >= 0; i--) {
            if (!isCalculatedField(localData.data[i].id)) {
              handleCellClick(localData.data[i].id, 11); // Last month column
              break;
            }
          }
        }
      } else {
        // Tab: move right or to next row
        if (colIndex < 11) {
          handleCellClick(rowId, colIndex + 1);
        } else {
          // Find next editable row
          const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
          for (let i = currentRowIndex + 1; i < localData.data.length; i++) {
            if (!isCalculatedField(localData.data[i].id)) {
              handleCellClick(localData.data[i].id, 0); // First month column
              break;
            }
          }
        }
      }
    }
    // Arrow keys: navigate in that direction
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
             e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleCellSave();
      
      const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
      
      if (e.key === 'ArrowUp' && currentRowIndex > 0) {
        // Find previous editable row
        for (let i = currentRowIndex - 1; i >= 0; i--) {
          if (!isCalculatedField(localData.data[i].id)) {
            handleCellClick(localData.data[i].id, colIndex);
            break;
          }
        }
      }
      else if (e.key === 'ArrowDown' && currentRowIndex < localData.data.length - 1) {
        // Find next editable row
        for (let i = currentRowIndex + 1; i < localData.data.length; i++) {
          if (!isCalculatedField(localData.data[i].id)) {
            handleCellClick(localData.data[i].id, colIndex);
            break;
          }
        }
      }
      else if (e.key === 'ArrowLeft' && colIndex > 0) {
        handleCellClick(rowId, colIndex - 1);
      }
      else if (e.key === 'ArrowRight' && colIndex < 11) {
        handleCellClick(rowId, colIndex + 1);
      }
    }
  }, [localData, handleCellSave, isCalculatedField, handleCellClick]);
  
  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setIsEditing(prev => !prev);
    if (isEditing) {
      // Exit edit mode, clear state
      setEditingDetailRow(null);
      setEditingDetailCol(null);
      setActiveCell({row: null, col: null});
      setEditedValues({});
    }
  }, [isEditing]);
  
  // Handle save button click
  const handleSave = useCallback(() => {
    if (!localData) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Save logic would go here
      // For now, just show a success message
      
      setSuccessMessage('データを保存しました');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Exit edit mode
      setIsEditing(false);
      setEditedValues({});
      
      // Notify parent if needed
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error('保存エラー:', error);
      setErrorMessage('データの保存中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [localData, onRefreshData]);
  
  // Format display values
  const formatValue = useCallback((value: number, rowId: number): string => {
    // Format percentages with fixed decimal places
    if (rowId === 10 || rowId === 11) {
      return value.toFixed(2);
    }
    return value.toString();
  }, []);
  
  // If no data, show empty state
  if (!localData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>月次詳細</h3>
        <p>データが利用できません。</p>
      </div>
    );
  }
  
  // Check if data is in confirmed status
  const isConfirmed = summaryData?.status === '確定済';
  
  return (
    <div style={{ padding: '0px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>月次詳細</h3>
        
        <div>
          {!isEditing ? (
            <button
              onClick={toggleEditMode}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={isConfirmed}
            >
              編集
            </button>
          ) : (
            <>
              <button
                onClick={toggleEditMode}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                キャンセル
              </button>
              
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3a66d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                disabled={isLoading}
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {successMessage && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px' 
        }}>
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px' 
        }}>
          {errorMessage}
        </div>
      )}
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '12px', 
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <thead>
            <tr style={{ height: '28px', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ 
                textAlign: 'left', 
                padding: '6px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: '#f8f9fa', 
                zIndex: 1,
                width: '180px'
              }}></th>
              {localData.months.map((month, index) => (
                <th key={`month-${index}`} style={{ 
                  padding: '4px', 
                  textAlign: 'center', 
                  fontWeight: 'normal' 
                }}>
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={14} style={{ 
                textAlign: 'left', 
                padding: '4px 6px', 
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #dee2e6',
                borderBottom: '1px solid #dee2e6',
                fontSize: '12px'
              }}>
                従業員数
              </td>
            </tr>
            
            {localData.data.map((row) => {
              // Determine section headers and spacers
              const needsSpacerBefore = row.id === 5 || row.id === 10;
              const isHeaderRow = row.id === 5;
              const isRatioRow = row.id === 10;
              
              return (
                <React.Fragment key={`row-${row.id}`}>
                  {needsSpacerBefore && (
                    <tr className="spacer-row">
                      <td colSpan={14} style={{ padding: '3px', backgroundColor: '#f8f9fa' }}></td>
                    </tr>
                  )}
                  {isHeaderRow && (
                    <tr className="header-row">
                      <th colSpan={14} style={{ 
                        textAlign: 'left', 
                        padding: '4px 6px',
                        fontWeight: 'bold',
                        backgroundColor: '#f8f9fa',
                        borderTop: '1px solid #dee2e6',
                        borderBottom: '1px solid #dee2e6',
                        fontSize: '12px'
                      }}>
                        障がい者
                      </th>
                    </tr>
                  )}
                  {isRatioRow && (
                    <tr className="header-row">
                      <th colSpan={14} style={{ 
                        textAlign: 'left', 
                        padding: '4px 6px',
                        fontWeight: 'bold',
                        backgroundColor: '#f8f9fa',
                        borderTop: '1px solid #dee2e6',
                        borderBottom: '1px solid #dee2e6',
                        fontSize: '12px'
                      }}>
                        雇用率
                      </th>
                    </tr>
                  )}
                  <tr 
                    style={{ backgroundColor: 'white', height: '22px' }}
                    data-row-id={row.id}
                  >
                    <td style={{ 
                      textAlign: 'left', 
                      padding: '0 6px', 
                      position: 'sticky', 
                      left: 0, 
                      backgroundColor: 'white', 
                      zIndex: 1,
                      borderRight: '1px solid #f0f0f0',
                      whiteSpace: 'nowrap',
                      fontSize: '12px'
                    }}>
                      {row.item}
                      {row.suffix && <span style={{ fontSize: '10px', color: '#666' }}> ({row.suffix})</span>}
                    </td>
                    {row.values.map((value, colIndex) => {
                      const isCalcField = isCalculatedField(row.id);
                      const isNegativeValue = row.isNegative && value < 0;
                      const isEditable = isEditing && !isCalcField && colIndex < 12 && !isConfirmed;
                      const isLegalRate = isLegalRateField(row.id);
                      const isActive = activeCell.row === row.id && activeCell.col === colIndex;
                      const isEditingThisCell = editingDetailRow === row.id && editingDetailCol === colIndex;
                      
                      // Format display value
                      const displayValue = formatValue(value, row.id);
                      
                      return (
                        <td 
                          key={`value-${row.id}-${colIndex}`} 
                          style={{ 
                            padding: '0', 
                            textAlign: 'center',
                            backgroundColor: isActive ? '#e9f2ff' : 'white',
                            cursor: isEditable ? 'pointer' : 'default',
                            color: isNegativeValue ? '#dc3545' : 'inherit'
                          }}
                          onClick={() => isEditable ? handleCellClick(row.id, colIndex) : null}
                        >
                          {isEditingThisCell ? (
                            <input
                              ref={(el) => setInputRef(el, `input-${row.id}-${colIndex}`)}
                              type="text"
                              value={value}
                              onChange={(e) => handleCellChange(row.id, colIndex, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
                              onBlur={handleCellSave}
                              style={{
                                width: '100%',
                                height: '22px',
                                padding: '2px 4px',
                                border: '1px solid #ddd',
                                borderRadius: '3px',
                                textAlign: 'center',
                                fontSize: '12px',
                                backgroundColor: isLegalRate ? '#e5f7ff' : 'white'
                              }}
                            />
                          ) : (
                            <div style={{ 
                              padding: '2px 4px',
                              height: '22px',
                              lineHeight: '22px',
                              textDecoration: isEditable ? 'underline dotted #ccc' : 'none'
                            }}>
                              {displayValue}{row.suffix || ''}
                            </div>
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
  );
};

export default MonthlyReportDetail;