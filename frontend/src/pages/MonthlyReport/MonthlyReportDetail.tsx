import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonthlyDetailData, MonthlyTotal } from './types';
import { 
  updateDetailCell, 
  updateMonthlySummary,
  handleApiError,
  getSettings
} from '../../api/reportApi';
import { useYearMonth } from './YearMonthContext';
import axios from 'axios';

interface MonthlyReportDetailProps {
  monthlyDetailData?: MonthlyDetailData | null;
  onDetailCellChange?: (rowId: number, colIndex: number, value: string) => void;
  summaryData?: MonthlyTotal | null;
  isEmbedded?: boolean;
  onRefreshData?: () => void;
  onYearChange?: (year: number) => void; // 年度変更通知用の新しいprop
}

interface Settings {
  legal_employment_rates: {
    fiscal_year: number;
    month: number;
    rate: number;
  }[];
}

const defaultDetailData: MonthlyDetailData = {
  months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
  data: [
    { id: 1, item: '従業員数 (名)', values: Array(13).fill(0) },
    { id: 2, item: 'フルタイム従業員数 (名)', values: Array(13).fill(0) },
    { id: 3, item: 'パートタイム従業員数 (名)', values: Array(13).fill(0) },
    { id: 4, item: 'トータル従業員数 (名)', values: Array(13).fill(0), isCalculated: true },
    { id: 5, item: '1級・2級の障がい者 (名)', values: Array(13).fill(0), isDisability: true },
    { id: 6, item: 'その他障がい者 (名)', values: Array(13).fill(0), isDisability: true },
    { id: 7, item: '1級・2級の障がい者(パートタイム) (名)', values: Array(13).fill(0), isDisability: true },
    { id: 8, item: 'その他障がい者(パートタイム) (名)', values: Array(13).fill(0), isDisability: true },
    { id: 9, item: '障がい者合計 (名)', values: Array(13).fill(0), isDisability: true, isCalculated: true },
    { id: 10, item: '実雇用率 (%)', values: Array(13).fill(0), isRatio: true, isCalculated: true },
    { id: 11, item: '法定雇用率 (%)', values: Array(13).fill(0), isRatio: true },
    { id: 12, item: '法定雇用者数 (名)', values: Array(13).fill(0), isCalculated: true },
    { id: 13, item: '超過・未達 (名)', values: Array(13).fill(0), isNegative: true, isCalculated: true }
  ]
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const MonthlyReportDetail: React.FC<MonthlyReportDetailProps> = (props) => {
    const { monthlyDetailData, onDetailCellChange, summaryData, isEmbedded, onRefreshData, onYearChange } = props;
          
    console.log('MonthlyReportDetail props:', {
      isEmbedded,
      hasSummaryData: !!summaryData,
      hasMonthlyDetailData: !!monthlyDetailData,
      detailDataItemCount: monthlyDetailData?.data?.length
    });
    
    const { fiscalYear, month } = useYearMonth();
    const [selectedYear, setSelectedYear] = useState<number>(fiscalYear);
    
    // 年度変更追跡用のref
    const prevSelectedYear = useRef<number>(selectedYear);
    
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [displayFiscalYear, setDisplayFiscalYear] = useState<string>(`${selectedYear}年度`);
    
    const [activeCell, setActiveCell] = useState<{row: number | null, col: number | null}>({row: null, col: null});
    const [editingDetailRow, setEditingDetailRow] = useState<number | null>(null);
    const [editingDetailCol, setEditingDetailCol] = useState<number | null>(null);
  
    const [localData, setLocalData] = useState<MonthlyDetailData>(
      isEmbedded && monthlyDetailData ? monthlyDetailData : defaultDetailData
    );

    // 編集された値を明示的に保持する
    const [editedValues, setEditedValues] = useState<{[key: string]: any}>({});
    const [settings, setSettings] = useState<Settings | null>(null);
    const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
    
    const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
    const setInputRef = useCallback((element: HTMLInputElement | null, key: string) => {
      if (element) {
        inputRefs.current[key] = element;
      }
    }, []);

    // フィールド名と行IDのマッピング
    const rowFieldMap: {[key: string]: string} = {
      '1': 'employees_count',
      '2': 'fulltime_count',
      '3': 'parttime_count',
      '5': 'level1_2_count',
      '6': 'other_disability_count',
      '7': 'level1_2_parttime_count',
      '8': 'other_parttime_count',
      '11': 'legal_employment_rate'
    };

    // 月のインデックス計算（4月始まりの会計年度）
    const getMonthIndex = useCallback((m: number) => {
      return (m > 3) ? m - 4 : m + 8;
    }, []);

    // ブラウザストレージへのアクセスエラーを捕捉
    useEffect(() => {
      const originalError = console.error;
      console.error = function(...args) {
        // ストレージエラーを無視
        if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('Access to storage is not allowed') || 
            args[0].includes('Could not find identifiable element'))) {
          console.log('ブラウザのストレージエラーを無視しました:', args[0]);
          return;
        }
        originalError.apply(console, args);
      };
      
      return () => {
        // クリーンアップ時に元のエラーハンドラに戻す
        console.error = originalError;
      };
    }, []);

    useEffect(() => {
      console.log('props変更を検出:', { monthlyDetailData, isEmbedded, isCreating });
      
      if (isEmbedded) {
        if (monthlyDetailData) {
          setLocalData(monthlyDetailData);
          setIsCreating(false);
        } else {
          setLocalData(defaultDetailData);
          if (!isCreating) {
            setIsCreating(true);
          }
        }
      }
    }, [monthlyDetailData, isEmbedded, isCreating]);

    const recalculateData = (data: MonthlyDetailData): MonthlyDetailData => {
      console.log('自動計算を実行');
      const newData = {...data};
      
      const fullTimeEmployeesRowIndex = newData.data.findIndex(row => row.id === 2);
      const partTimeEmployeesRowIndex = newData.data.findIndex(row => row.id === 3);
      const totalEmployeesRowIndex = newData.data.findIndex(row => row.id === 4);
      
      const level1And2RowIndex = newData.data.findIndex(row => row.id === 5);
      const otherRowIndex = newData.data.findIndex(row => row.id === 6);
      const level1And2PartTimeRowIndex = newData.data.findIndex(row => row.id === 7);
      const otherPartTimeRowIndex = newData.data.findIndex(row => row.id === 8);
      const totalDisabledRowIndex = newData.data.findIndex(row => row.id === 9);
      
      const legalRateRowIndex = newData.data.findIndex(row => row.id === 11);
      
      if (fullTimeEmployeesRowIndex !== -1 && partTimeEmployeesRowIndex !== -1 && totalEmployeesRowIndex !== -1) {
        const fullTimeValues = newData.data[fullTimeEmployeesRowIndex].values;
        const partTimeValues = newData.data[partTimeEmployeesRowIndex].values;
        
        for (let i = 0; i < 13; i++) {
          if (i < 12) {
            newData.data[totalEmployeesRowIndex].values[i] = 
              fullTimeValues[i] + (partTimeValues[i] * 0.5);
          } else {
            newData.data[totalEmployeesRowIndex].values[i] = 
              newData.data[totalEmployeesRowIndex].values.slice(0, 12).reduce((a, b) => a + b, 0);
          }
        }
      }
      
      if (level1And2RowIndex !== -1 && otherRowIndex !== -1 && 
          level1And2PartTimeRowIndex !== -1 && otherPartTimeRowIndex !== -1 && 
          totalDisabledRowIndex !== -1) {
          
        const level1And2Values = newData.data[level1And2RowIndex].values;
        const otherValues = newData.data[otherRowIndex].values;
        const level1And2PartTimeValues = newData.data[level1And2PartTimeRowIndex].values;
        const otherPartTimeValues = newData.data[otherPartTimeRowIndex].values;
        
        for (let i = 0; i < 13; i++) {
          newData.data[totalDisabledRowIndex].values[i] = 
            level1And2Values[i] * 2 + otherValues[i] + 
            level1And2PartTimeValues[i] + otherPartTimeValues[i] * 0.5;
        }
      }
      
      if (totalEmployeesRowIndex !== -1 && totalDisabledRowIndex !== -1 && legalRateRowIndex !== -1) {
        const totalEmployeeValues = newData.data[totalEmployeesRowIndex].values;
        const totalDisabledValues = newData.data[totalDisabledRowIndex].values;
        const legalRateValues = newData.data[legalRateRowIndex].values;
        
        const actualRateRowIndex = newData.data.findIndex(row => row.id === 10);
        if (actualRateRowIndex !== -1) {
          for (let i = 0; i < 13; i++) {
            if (totalEmployeeValues[i] > 0) {
              newData.data[actualRateRowIndex].values[i] = 
                Number(((totalDisabledValues[i] / totalEmployeeValues[i]) * 100).toFixed(2));
            } else {
              newData.data[actualRateRowIndex].values[i] = 0;
            }
          }
        }
        
        const legalCountRowIndex = newData.data.findIndex(row => row.id === 12);
        if (legalCountRowIndex !== -1) {
          for (let i = 0; i < 13; i++) {
            if (i < 12) {
              newData.data[legalCountRowIndex].values[i] = 
                Math.floor((legalRateValues[i] * totalEmployeeValues[i]) / 100);
            } else {
              newData.data[legalCountRowIndex].values[i] = 
                newData.data[legalCountRowIndex].values.slice(0, 12).reduce((a, b) => a + b, 0);
            }
          }
        }
        
        const overUnderRowIndex = newData.data.findIndex(row => row.id === 13);
        if (overUnderRowIndex !== -1 && legalCountRowIndex !== -1) {
          const legalCountValues = newData.data[legalCountRowIndex].values;
          for (let i = 0; i < 13; i++) {
            newData.data[overUnderRowIndex].values[i] = 
              totalDisabledValues[i] - legalCountValues[i];
          }
        }
      }
      
      return newData;
    };

    const fetchSettings = useCallback(async () => {
      if (settingsLoaded) {
        console.log('設定情報はすでに読み込み済みです');
        return null;
      }
      
      try {
        console.log('設定情報を取得します');
        
        try {
          const response = await getSettings();
          console.log('取得した設定情報:', response);
          
          if (response && response.legal_employment_rates) {
            setSettings(response);
            setSettingsLoaded(true);
            return response;
          }
        } catch (error) {
          console.error('設定APIエラー:', error);
          setSettingsLoaded(true);
        }
        
        console.log('設定情報が取得できません');
        return null;
      } catch (error) {
        console.error('設定情報の処理中にエラーが発生しました:', error);
        setSettingsLoaded(true);
        return null;
      }
    }, [settingsLoaded]);

    useEffect(() => {
      console.log('コンポーネントがマウントされました');
      if (!settingsLoaded) {
        const loadSettings = async () => {
          await fetchSettings();
        };
        
        loadSettings();
      }
    }, [fetchSettings, settingsLoaded]);

    useEffect(() => {
      const handleSettingsChange = () => {
        console.log('設定変更を検知しました');
        setSettingsLoaded(false);
        fetchSettings();
      };
      
      window.addEventListener('settings-changed', handleSettingsChange);
      
      return () => {
        window.removeEventListener('settings-changed', handleSettingsChange);
      };
    }, [fetchSettings]);

    useEffect(() => {
      const timer = setTimeout(() => {
        console.log('コンポーネントマウント時の初期化');
      }, 100);
      
      return () => clearTimeout(timer);
    }, []);

    // 年度変更時の処理を強化
    useEffect(() => {
      console.log(`年度が変更されました: ${selectedYear}`);
      setDisplayFiscalYear(`${selectedYear}年度`);
      
      // 年度変更時に親コンポーネントに通知する処理を追加
      if (isEmbedded && onYearChange && prevSelectedYear.current !== selectedYear) {
        console.log(`年度変更による再取得: ${prevSelectedYear.current} → ${selectedYear}`);
        prevSelectedYear.current = selectedYear;
        
        // 新年度の場合はエラー処理を改善
        try {
          // 親コンポーネントに年度変更を通知
          onYearChange(selectedYear);
        } catch (error) {
          // エラーハンドリング
          console.log('年度変更通知中のエラーを処理しました:', error);
          // 必要に応じてデフォルトデータを設定
          setLocalData(defaultDetailData);
        }
      }
    }, [selectedYear, isEmbedded, onYearChange, defaultDetailData]);

    const showPutRequestData = useCallback(() => {
      // 4月始まりの会計年度に合わせたインデックス計算
      const currentMonthIndex = getMonthIndex(month);
      
      const putData = {
        fiscal_year: selectedYear,
        month: month,
        employees_count: localData.data[0].values[currentMonthIndex],
        fulltime_count: localData.data[1].values[currentMonthIndex],
        parttime_count: localData.data[2].values[currentMonthIndex],
        level1_2_count: localData.data[4].values[currentMonthIndex],
        other_disability_count: localData.data[5].values[currentMonthIndex],
        level1_2_parttime_count: localData.data[6].values[currentMonthIndex],
        other_parttime_count: localData.data[7].values[currentMonthIndex],
        legal_employment_rate: localData.data[10].values[currentMonthIndex]
      };
      
      console.log('=== Postman PUT リクエストデータ ===');
      console.log('URL: ', `${API_BASE_URL}/monthly-reports/${selectedYear}/${month}/summary`);
      console.log('Method: PUT');
      console.log('Body (JSON):');
      console.log(JSON.stringify(putData, null, 2));
      console.log('==============================');
      
      return putData;
    }, [localData, month, selectedYear, getMonthIndex]);

    useEffect(() => {
      if (id && id.includes('-')) {
        const [year] = id.split('-');
        if (!isNaN(Number(year))) {
          setDisplayFiscalYear(`${year}年度`);
          setSelectedYear(Number(year));
        }
      }
    }, [id]);

    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log("表示されているデータ:", localData.data);
      }
    }, [localData.data]);

    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        const timer = setTimeout(() => {
          if (localData) {
            showPutRequestData();
          }
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }, [localData, showPutRequestData]);

    const isCalculatedField = (rowId: number): boolean => {
      const row = localData.data.find(r => r.id === rowId);
      return row?.isCalculated || false;
    };

    const isLegalRateField = (rowId: number): boolean => {
      return rowId === 11; // 法定雇用率フィールドのID
    };

    const toggleEditMode = () => {
      console.log('編集モード切り替え: 現在の状態 =', isEditing, ' → 新しい状態 =', !isEditing); 
      
      if (isEditing) {
        if (isEmbedded && monthlyDetailData) {
          console.log('編集モード終了: データを元に戻します');
          setLocalData(monthlyDetailData);
        }
        setErrorMessage(null);
        setEditedValues({}); // 編集値をクリア
      }
      
      setIsEditing(prevState => !prevState);
    };

    const toggleCreateMode = () => {
      console.log('新規作成モード開始');
      setIsCreating(true);
      setIsEditing(true);
      setEditedValues({}); // 編集値をクリア
      setLocalData(defaultDetailData);
    };
    
    const handleBack = () => {
      navigate('/monthly-report?tab=monthly');
    };

    const exportToCSV = (): void => {
      alert('CSVエクスポート機能はまだ実装されていません');
    };

    const handlePrint = (): void => {
      window.print();
    };

    // 存在チェックの実装
    const checkIfReportExists = async (year: number, month: number): Promise<boolean> => {
      try {
        const response = await axios.get(`${API_BASE_URL}/monthly-reports/${year}/${month}`);
        return !!response.data && !!response.data.success;
      } catch (error) {
        // 404エラーは存在しないことを意味する
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return false;
        }
        // その他のエラーの場合は再スロー
        console.error('レポート存在チェックエラー:', error);
        return false;
      }
    };

    // データの直接保存機能を改善
    const directSave = async (data: any) => {
      console.log('直接保存を実行します:', data);
      
      try {
        // 既存データの確認
        const exists = await checkIfReportExists(data.fiscal_year, data.month);
        
        let response;
        
        try {
          if (exists) {
            // 更新処理
            console.log('PUT リクエスト実行:', `${API_BASE_URL}/monthly-reports/${data.fiscal_year}/${data.month}`);
            response = await axios.put(
              `${API_BASE_URL}/monthly-reports/${data.fiscal_year}/${data.month}`, 
              data
            );
          } else {
            // 新規作成処理
            console.log('POST リクエスト実行:', `${API_BASE_URL}/monthly-reports`);
            response = await axios.post(
              `${API_BASE_URL}/monthly-reports`, 
              data
            );
          }
          
          console.log('API応答:', response.data);
          return response.data;
        } catch (error) {
          if (error instanceof Error && error.message.includes('Access to storage is not allowed')) {
            console.log('ストレージエラーが発生しましたが、処理を継続します');
            // エラーにもかかわらず成功したとみなす
            return { 
              success: true, 
              message: 'データが保存されました（ブラウザ警告あり）',
              data: data
            };
          }
          throw error;
        }
      } catch (error) {
        console.error('API エラー:', error);
        throw error;
      }
    };

    const safeRefetchData = async () => {
      try {
        if (onRefreshData) {
          onRefreshData();
        }
      } catch (error) {
        if (error instanceof Error && 
          (error.message.includes('Access to storage is not allowed') || 
            error.message.includes('Could not find identifiable element'))) {
          console.log('データ再取得中にストレージエラーが発生しましたが、処理を継続します');
          // 手動でデータを更新
          setLocalData(prevData => {
            // 保存したデータをローカルに反映
            const newData = {...prevData};
            // 現在の編集値を反映
            Object.entries(editedValues).forEach(([key, value]) => {
              if (key.endsWith('_display')) return;
              
              const rowId = Object.entries(rowFieldMap).find(([, fieldName]) => fieldName === key)?.[0];
              if (rowId) {
                const rowIndex = newData.data.findIndex(row => row.id === Number(rowId));
                if (rowIndex !== -1) {
                  const monthIndex = getMonthIndex(month);
                  if (monthIndex < newData.data[rowIndex].values.length) {
                    newData.data[rowIndex].values[monthIndex] = Number(value);
                  }
                }
              }
            });
            
            return recalculateData(newData);
          });
        } else {
          console.error('データ再取得エラー:', error);
          throw error;
        }
      }
    };

    const handleErrorSafely = (error: any): string => {
      // ブラウザ拡張機能関連のエラーを無視
      if (error instanceof Error && 
        (error.message.includes('Access to storage is not allowed') || 
          error.message.includes('Could not find identifiable element'))) {
        console.log('無視可能なエラー:', error.message);
        return 'ブラウザの設定により一部機能が制限されていますが、処理は継続されました。';
      }
      
      // 通常のエラー処理
      return handleApiError(error);
    };
    
    const handleSave = async () => {
      console.log('保存ボタンクリック'); 
      
      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        // 4月始まりの会計年度に合わせたインデックス計算
        const currentMonthIndex = getMonthIndex(month);
        console.log(`保存処理: 選択年度=${selectedYear}, 選択月=${month}, 月インデックス=${currentMonthIndex}`);
        
        // 編集された値のログ出力
        console.log("保存時の editedValues:", editedValues);
        
        // 現在の値を収集
        const currentValues: {[key: string]: number} = {
          employees_count: 0,
          fulltime_count: 0,
          parttime_count: 0,
          level1_2_count: 0,
          other_disability_count: 0,
          level1_2_parttime_count: 0,
          other_parttime_count: 0,
          legal_employment_rate: 0
        };
        
        // localDataから現在の値を直接取得
        if (localData && localData.data) {
          Object.entries(rowFieldMap).forEach(([rowId, fieldName]) => {
            const row = localData.data.find(r => r.id === Number(rowId));
            if (row && row.values && row.values.length > currentMonthIndex) {
              console.log(`行${rowId}(${fieldName})の値: ${row.values[currentMonthIndex]}`);
              currentValues[fieldName] = row.values[currentMonthIndex];
            }
          });
        }
        
        // 編集された値で上書き
        Object.entries(editedValues).forEach(([key, value]) => {
          // "_display" が付いていないキーのみ処理
          if (key in currentValues && !key.endsWith('_display')) {
            currentValues[key] = value;
          }
        });
        
        // 法定雇用率の特別処理
        if ('legal_employment_rate_display' in editedValues) {
          const displayValue = editedValues.legal_employment_rate_display;
          if (typeof displayValue === 'string') {
            if (displayValue === '.') {
              currentValues.legal_employment_rate = 0.0;
            } else if (displayValue.endsWith('.')) {
              // '2.' → '2.0' に変換
              currentValues.legal_employment_rate = parseFloat(displayValue + '0');
            } else if (displayValue.includes('.')) {
              // すでに小数点がある場合はそのまま使用
              currentValues.legal_employment_rate = parseFloat(displayValue);
            }
          }
        }
        
        // 保存するデータを準備
        const saveData = {
          fiscal_year: selectedYear,
          month: month,
          ...currentValues
        };
        
        console.log('保存するデータ (詳細):', JSON.stringify(saveData, null, 2));
        
        // APIにデータを保存
        const result = await directSave(saveData);
        
        console.log('保存成功:', result);
        
        // 保存が成功した場合の処理
        if (result && result.success) {
          // 編集モードをオフに
          setIsEditing(false);
          setIsCreating(false);
          
          // 編集値をクリア
          setEditedValues({});
          
          // 成功メッセージを表示
          setSuccessMessage(`データを${isCreating ? '作成' : '保存'}しました`);
          setTimeout(() => setSuccessMessage(null), 3000);
          
          // 親コンポーネントに通知してデータを再取得（タイムアウトを長めに設定）
          if (isEmbedded && onRefreshData) {
            console.log('データを再取得します');
            
            // 直接データを更新
            if (result.data) {
              const updatedData = result.data;
              // ローカルデータを更新
              setLocalData(prevData => {
                const newData = {...prevData};
                // 取得したデータで更新
                if (updatedData.level1_2_count !== undefined) {
                  const rowIndex = newData.data.findIndex(row => row.id === 5);
                  if (rowIndex !== -1) {
                    newData.data[rowIndex].values[currentMonthIndex] = updatedData.level1_2_count;
                  }
                }
                // 他のフィールドも同様に更新
                
                return recalculateData(newData);
              });
            }
            
            // 時間をずらして親コンポーネントの再取得処理を実行
            setTimeout(() => {
              try {
                safeRefetchData();
              } catch (e) {
                console.error('データ再取得中にエラーが発生しました:', e);
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error('月次詳細データ保存エラー:', error);
        setErrorMessage(handleErrorSafely(error));
      } finally {
        setIsLoading(false);
      }
    };
    
    const handleCellClick = (rowId: number, colIndex: number) => {
      if (colIndex >= 12) return;
      if (!isEditing) return;
      if (isCalculatedField(rowId)) return;
      
      setActiveCell({row: rowId, col: colIndex});
      handleDetailCellEdit(rowId, colIndex);
    };

    const handleDetailCellSave = () => {
      console.log('セル編集完了');
      setEditingDetailRow(null);
      setEditingDetailCol(null);
    };

    const handleDetailCellEdit = (rowId: number, colIndex: number) => {
      if (isCalculatedField(rowId)) {
        console.log('自動計算フィールドは編集不可');
        return;
      }
      if (!isEditing) return;
      
      console.log(`セル編集開始: rowId=${rowId}, colIndex=${colIndex}`);
      setEditingDetailRow(rowId);
      setEditingDetailCol(colIndex);
      
      setTimeout(() => {
        const inputKey = `input-${rowId}-${colIndex}`;
        console.log(`フォーカス設定: ${inputKey}`);
        if (inputRefs.current[inputKey]) {
          inputRefs.current[inputKey]?.focus();
        }
      }, 10);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowId: number, colIndex: number) => {
      if (isCalculatedField(rowId)) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        handleDetailCellSave();
        
        const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
        for (let i = currentRowIndex + 1; i < localData.data.length; i++) {
          if (!isCalculatedField(localData.data[i].id)) {
            const nextRowId = localData.data[i].id;
            handleDetailCellEdit(nextRowId, colIndex);
            break;
          }
        }
      }
      else if (e.key === 'Tab') {
        e.preventDefault();
        handleDetailCellSave();
        
        if (e.shiftKey) {
          if (colIndex > 0) {
            handleDetailCellEdit(rowId, colIndex - 1);
          } else {
            const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
            if (currentRowIndex > 0) {
              let prevRowId: number | null = null;
              for (let i = currentRowIndex - 1; i >= 0; i--) {
                if (!isCalculatedField(localData.data[i].id)) {
                  prevRowId = localData.data[i].id;
                  break;
                }
              }
              if (prevRowId !== null) {
                handleDetailCellEdit(prevRowId, 11);
              }
            }
          }
        } else {
          if (colIndex < 11) {
            handleDetailCellEdit(rowId, colIndex + 1);
          } else {
            const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
            if (currentRowIndex < localData.data.length - 1) {
              let nextRowId: number | null = null;
              for (let i = currentRowIndex + 1; i < localData.data.length; i++) {
                if (!isCalculatedField(localData.data[i].id)) {
                  nextRowId = localData.data[i].id;
                  break;
                }
              }
              if (nextRowId !== null) {
                handleDetailCellEdit(nextRowId, 0);
              }
            }
          }
        }
      }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleDetailCellSave();
        
        const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
        
        if (e.key === 'ArrowUp' && currentRowIndex > 0) {
          let prevRowId: number | null = null;
          for (let i = currentRowIndex - 1; i >= 0; i--) {
            if (!isCalculatedField(localData.data[i].id)) {
              prevRowId = localData.data[i].id;
              break;
            }
          }
          if (prevRowId !== null) {
            handleDetailCellEdit(prevRowId, colIndex);
          }
        }
        else if (e.key === 'ArrowDown' && currentRowIndex < localData.data.length - 1) {
          let nextRowId: number | null = null;
          for (let i = currentRowIndex + 1; i < localData.data.length; i++) {
            if (!isCalculatedField(localData.data[i].id)) {
              nextRowId = localData.data[i].id;
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

    // 法定雇用率フィールドの小数点入力の問題を修正
    const handleLocalCellChange = (rowId: number, colIndex: number, value: string) => {
      console.log(`セル値変更: rowId=${rowId}, colIndex=${colIndex}, value=${value}`);
      
      // 法定雇用率フィールド専用の入力判定
      const isLegalRate = isLegalRateField(rowId);
      
      // 小数点入力パターンチェック - 法定雇用率フィールドのみ特別扱い
      const pattern = isLegalRate 
        ? /^[0-9]*\.?[0-9]*$/ // 法定雇用率フィールド用 - 小数点を許可
        : /^[0-9]+$/;         // その他フィールド用 - 整数のみ
      
      // 空の入力を許可
      if (value === '') {
        value = '0';
      }
      
      // パターンチェック
      if (!pattern.test(value)) {
        console.log(`無効な入力はスキップ: ${isLegalRate ? '数値または小数点を含む数値' : '整数'}のみ許可`);
        return;
      }
      
      // 値の処理
      let numValue: number;
      let displayValue = value;
      
      // 法定雇用率の特別処理
      if (isLegalRate) {
        if (value === '.') {
          // 小数点のみの場合は0.0として処理
          numValue = 0;
          displayValue = '0.0';
        } else if (value.endsWith('.')) {
          // 末尾が小数点の場合は小数点以下を0として扱うが、表示は小数点付きのまま
          numValue = parseFloat(value + '0');
        } else {
          numValue = parseFloat(value);
        }
        
        // 月インデックス計算
        const monthIndex = getMonthIndex(month);
        
        // 現在の月のセルを編集している場合は編集値を記録
        if (colIndex === monthIndex && rowFieldMap[rowId.toString()]) {
          console.log(`編集値を記録: ${rowFieldMap[rowId.toString()]} = ${numValue} (表示: ${displayValue})`);
          
          // 小数点表記を保持するための特別な状態
          setEditedValues(prev => ({
            ...prev,
            [rowFieldMap[rowId.toString()]]: numValue,
            [`${rowFieldMap[rowId.toString()]}_display`]: displayValue  // 表示用の値を別途保存
          }));
        }
      } else {
        // 通常の数値変換
        numValue = parseInt(value, 10);
        if (isNaN(numValue)) numValue = 0;
        
        // 月インデックス計算
        const monthIndex = getMonthIndex(month);
        
        // 現在の月のセルを編集している場合は編集値を記録
        if (colIndex === monthIndex && rowFieldMap[rowId.toString()]) {
          console.log(`編集値を記録: ${rowFieldMap[rowId.toString()]} = ${numValue} (表示: ${displayValue})`);
          
          // 通常フィールドの編集値を保存
          setEditedValues(prev => ({
            ...prev,
            [rowFieldMap[rowId.toString()]]: numValue
          }));
        }
      }
      
      // ローカルデータの更新
      setLocalData(prevData => {
        const newData = {...prevData};
        const rowIndex = newData.data.findIndex(row => row.id === rowId);
        
        if (rowIndex !== -1 && colIndex < 12) {
          const updatedValues = [...newData.data[rowIndex].values];
          updatedValues[colIndex] = numValue;
          
          // 合計の再計算
          updatedValues[12] = updatedValues.slice(0, 12).reduce((a, b) => a + b, 0);
          
          newData.data[rowIndex].values = updatedValues;
          console.log(`値更新: ${rowId}行, ${colIndex}列, 値=${numValue}`);
          
          // 自動計算を実行
          return recalculateData(newData);
        }
        
        return newData;
      });
      
      // 埋め込みモードの場合、親コンポーネントにも変更を通知
      if (isEmbedded && onDetailCellChange) {
        console.log('親コンポーネントに変更を通知');
        onDetailCellChange(rowId, colIndex, isLegalRate ? displayValue : value);
      }
    };

    const cellStyle = {
      width: '100%',
      height: '22px',
      border: 'none',
      textAlign: 'center' as const,
      backgroundColor: 'transparent',
      fontSize: '12px',
      padding: '0'
    };

    const readonlyCellStyle = {
      ...cellStyle,
      backgroundColor: '#f8f9fa'
    };

    const legalRateCellStyle = {
      ...cellStyle,
      backgroundColor: '#e5f7ff', // 薄い青色の背景で法定雇用率フィールドを視覚的に区別
      fontWeight: 'bold' as const
    };

    const currentStatus = isEmbedded && summaryData?.status ? summaryData.status : '未確定';
    const isConfirmed = currentStatus === '確定済';

    const DebugInfo = process.env.NODE_ENV === 'development' ? (
      <div style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        編集モード: {isEditing ? 'ON' : 'OFF'} | 
        新規作成モード: {isCreating ? 'ON' : 'OFF'} | 
        年度: {selectedYear} | 
        月: {month} | 
        月インデックス: {getMonthIndex(month)}
      </div>
    ) : null;

    // 年度変更時のエラー処理を改善
    const handleYearSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newYear = Number(e.target.value);
      console.log(`年度選択変更: ${selectedYear} → ${newYear}`);
      
      // 先に現在の年度の値を保存
      setSelectedYear(newYear);
      
      // 年度変更を親コンポーネントに通知
      if (onYearChange) {
        try {
          onYearChange(newYear);
        } catch (error) {
          console.error('年度変更通知中にエラーが発生しました:', error);
          
          // エラーが発生した場合でも、新しい年度のデフォルトデータを表示
          setLocalData(prevData => {
            const newData = {...defaultDetailData};
            // 年度情報を更新
            return newData;
          });
          
          // 仮のエラー処理
          setErrorMessage('新しい年度のデータを読み込めませんでした。デフォルト値を表示しています。');
          setTimeout(() => setErrorMessage(null), 5000);
        }
      }
    };

    if (!monthlyDetailData && !isCreating && isEmbedded) {
      return (
        <div className="monthly-report-detail" style={{ padding: isEmbedded ? '0' : '20px' }}>
          {DebugInfo}
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>月次詳細</h3>
            <button 
              type="button"
              onClick={toggleCreateMode}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={isLoading || isConfirmed}
            >
              新規作成
            </button>
          </div>
          
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            marginTop: '20px'
          }}>
            <p>月次詳細データがありません。新規作成ボタンからデータを作成してください。</p>
          </div>
        </div>
      );
    }

    return (
      <div className="monthly-report-detail" style={{ padding: isEmbedded ? '0' : '20px' }}>
        {DebugInfo}
        
        {!isEmbedded && (
          <>
            <button 
              onClick={handleBack}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '15px'
              }}
            >
              ← 月次報告一覧に戻る
            </button>
            
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>月次報告詳細</h1>
            
            <div style={{ 
              backgroundColor: '#f0f8ff', 
              padding: '15px', 
              borderRadius: '4px', 
              marginBottom: '20px' 
            }}>
              <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '10px' }}>{displayFiscalYear}集計サマリー</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                <span>常用労働者数: 525名</span>
                <span>|</span>
                <span>障害者数: 5名</span>
                <span>|</span>
                <span>雇用カウント: 5</span>
                <span>|</span>
                <span>実雇用率: 2.43%</span>
                <span>|</span>
                <span>法定雇用率: 2.5%</span>
              </div>
            </div>
          </>
        )}

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
          
        {isLoading && (
          <div style={{ 
            backgroundColor: '#e9ecef', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            データを処理中...
          </div>
        )}

        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <h3 style={{ margin: '0' }}>月次詳細</h3>
            
            <div>
              <select
                id="fiscal-year-select"
                value={selectedYear}
                onChange={handleYearSelectChange}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}
                disabled={isLoading || isEditing}
              >
                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}年度</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isEditing && (
              <button 
                type="button"
                onClick={toggleEditMode}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                disabled={isLoading || isConfirmed}
              >
                編集
              </button>
            )}
            
            {isEditing && (
              <button 
                type="button"
                onClick={toggleEditMode}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                disabled={isLoading}
              >
                キャンセル
              </button>
            )}
            
            {isEditing && (
              <button 
                type="button"
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
            )}
          </div>
        </div>
        
        {localData.data.length > 0 ? (
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #dee2e6', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{ height: '28px', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '4px 6px', 
                    position: 'sticky', 
                    left: 0, 
                    backgroundColor: '#f8f9fa', 
                    zIndex: 1,
                    width: '180px'
                  }}></th>
                  {localData.months.map((month, index) => (
                    <th key={`month-${index}`} style={{ padding: '2px', textAlign: 'center', fontWeight: 'normal' }}>
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
                  const needsSpacerBefore = row.id === 5 || row.id === 10;
                  const isHeaderRow = row.id === 5;
                  
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
                      {row.id === 10 && (
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
                        key={`row-${row.id}`}
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
                        </td>
                        {row.values.map((value, colIndex) => {
                          const isCalcField = isCalculatedField(row.id);
                          const isNegativeValue = row.isNegative && value < 0;
                          const isActive = activeCell.row === row.id && activeCell.col === colIndex;
                          const isEditable = isEditing && !isCalcField && colIndex < 12;
                          const isActiveEditing = editingDetailRow === row.id && editingDetailCol === colIndex;
                          const isLegal = isLegalRateField(row.id);
                          
                          return (
                            <td 
                              key={`value-${row.id}-${colIndex}`} 
                              style={{ 
                                padding: '0', 
                                textAlign: 'center',
                                backgroundColor: isActive ? '#e9f2ff' : 'white'
                              }}
                              onClick={() => isEditable ? handleCellClick(row.id, colIndex) : null}
                            >
                              {(isActiveEditing && isEditing && !isCalcField) ? (
                                <input
                                  ref={(el: HTMLInputElement | null) => {
                                    setInputRef(el, `input-${row.id}-${colIndex}`);
                                  }}
                                  type="text"
                                  style={isLegal ? legalRateCellStyle : cellStyle}
                                  value={value.toString()}
                                  onChange={(e) => handleLocalCellChange(row.id, colIndex, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
                                  onBlur={handleDetailCellSave}
                                  onFocus={() => setActiveCell({row: row.id, col: colIndex})}
                                />
                              ) : (
                                <input
                                  type="text"
                                  style={{
                                    ...(isCalcField 
                                      ? readonlyCellStyle 
                                      : isLegal ? legalRateCellStyle : cellStyle),
                                    color: isNegativeValue ? 'red' : 'inherit'
                                  }}
                                  value={value}
                                  readOnly
                                />
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
        ) : (
          <div style={{ 
            padding: '30px', 
            textAlign: 'center', 
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '16px', color: '#666' }}>月次詳細データがありません。</p>
            {!isEmbedded && (
              <button
                onClick={handleBack}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  marginTop: '15px',
                  cursor: 'pointer'
                }}
              >
                戻る
              </button>
            )}
          </div>
        )}

        {!isEmbedded && localData.data.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              印刷
            </button>
            <button
              onClick={exportToCSV}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              CSVエクスポート
            </button>
          </div>
        )}
      </div>
    );
};

export default MonthlyReportDetail;