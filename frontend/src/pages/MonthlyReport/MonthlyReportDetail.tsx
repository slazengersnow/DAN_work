// src/pages/MonthlyReport/MonthlyReportDetail.tsx
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonthlyDetailData, MonthlyTotal } from './types';
import { updateDetailCell, handleApiError, updateMonthlySummary } from '../../api/reportApi';
import { YearMonthContext } from './YearMonthContext';
import { useYearMonth } from './YearMonthContext';  // カスタムフックを使用
import { 
  headerStyle, 
  buttonStyle, 
  primaryButtonStyle, 
  editModeIndicatorStyle, 
  buttonAreaStyle,
  errorMessageStyle,
  loadingIndicatorStyle,
  noDataMessageStyle,
  summaryBoxStyle,
  tableContainerStyle,
  tableStyle,
  tableHeaderStyle,
  tableCellStyle,
  tabContainerStyle,
  tabStyle,
  activeTabStyle,
  actionBarStyle,
  negativeValueStyle,
  statusBadgeStyle
} from './utils';


interface MonthlyReportDetailProps {
  // タブ内に埋め込む場合に必要なprops
  monthlyDetailData?: MonthlyDetailData;
  onDetailCellChange?: (rowId: number, colIndex: number, value: string) => void;
  summaryData?: MonthlyTotal;
  isEmbedded?: boolean;
  onRefreshData?: () => void; // データ更新後にリフレッシュを親コンポーネントに通知
  initialEditMode?: boolean; // 新規データの場合に初期状態で編集モードをオンにするためのフラグ
  // 親からの編集モード制御用
  isEditMode?: boolean;
  setIsEditMode?: (mode: boolean) => void;
}

const MonthlyReportDetail: React.FC<MonthlyReportDetailProps> = (props) => {
    console.log('MonthlyReportDetail.tsx loaded at:', new Date().toISOString());
    const { 
      monthlyDetailData, 
      onDetailCellChange, 
      summaryData, 
      isEmbedded, 
      onRefreshData, 
      initialEditMode,
      isEditMode,
      setIsEditMode
    } = props;
          
    // Debug logs
    console.log('MonthlyReportDetail props:', {
      isEmbedded,
      hasSummaryData: !!summaryData,
      hasMonthlyDetailData: !!monthlyDetailData,
      detailDataItemCount: monthlyDetailData?.data?.length,
      initialEditMode,
      isEditMode // 親から渡された編集モード
    });
    
    console.log('MonthlyReportDetail がレンダリングされました', {
      isEmbedded,
      hasSummaryData: !!summaryData,
      hasDetailData: !!monthlyDetailData,
      isEditMode: isEditMode || false, // 親から渡された編集モード
      initialEditMode: props.initialEditMode
    });
    
    // 年月コンテキストから現在の年月を取得（カスタムフックを使用）
    const { fiscalYear, month } = useYearMonth();

    // 年月コンテキストから現在の年月を取得
    const yearMonthContext = useContext(YearMonthContext);
    // contextの実際のプロパティ名を使用
    const year = yearMonthContext.fiscalYear; // YearMonthContextの実際のプロパティに合わせて修正
    
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    
    // 内部の編集モード状態（親から渡されない場合のフォールバック）
    const [internalIsEditing, setInternalIsEditing] = useState<boolean>(initialEditMode || false);
    
    // 親から渡された編集モードか内部の編集モードを使用
    const isEditing = isEditMode !== undefined ? isEditMode : internalIsEditing;
    const setIsEditing = setIsEditMode || setInternalIsEditing;
    
    console.log("MonthlyReportDetail コンポーネントがマウントされました。isEditing初期値:", isEditing);
    
    // ローディング状態
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // エラーメッセージ状態
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 初期データ（独立ページモードで使用）
    const initialData: MonthlyDetailData = {
      months: ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '合計'],
      data: [
        { id: 1, item: '従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 690, 7822] },
        { id: 2, item: 'フルタイム従業員数', values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 690, 7822] },
        { id: 3, item: 'パートタイム従業員数', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { 
          id: 4, 
          item: 'トータル従業員数', 
          values: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 690, 7822],
          isCalculated: true 
        },
        { id: 5, item: 'Level 1 & 2', values: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 24] },
        { id: 6, item: 'その他', values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 33] },
        { id: 7, item: 'Level 1 & 2 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 8, item: 'その他 (パートタイム)', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { 
          id: 9, 
          item: 'トータル障がい者数', 
          values: [4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 57],
          isCalculated: true
        },
        { 
          id: 10, 
          item: '実雇用率', 
          values: [0.67, 0.66, 0.63, 0.78, 0.77, 0.77, 0.76, 0.75, 0.75, 0.75, 0.74, 0.72, 0.73], 
          suffix: '%', 
          isRatio: true, 
          isCalculated: true 
        },
        { 
          id: 11, 
          item: '法定雇用率', 
          values: [2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3], 
          suffix: '%', 
          isRatio: true 
        },
        { 
          id: 12, 
          item: '法定雇用者数', 
          values: [13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 15, 15, 172], 
          isCalculated: true 
        },
        { 
          id: 13, 
          item: '超過・未達', 
          values: [-9, -9, -10, -9, -9, -9, -10, -10, -10, -10, -10, -10, -115], 
          isNegative: true, 
          isCalculated: true 
        }
      ]
    };
  
    // 年度表示用（独立ページモードで使用）
    const [displayFiscalYear, setDisplayFiscalYear] = useState<string>('2024年度');
    
    // セル編集用の状態
    const [activeCell, setActiveCell] = useState<{row: number | null, col: number | null}>({row: null, col: null});
    const [editingDetailRow, setEditingDetailRow] = useState<number | null>(null);
    const [editingDetailCol, setEditingDetailCol] = useState<number | null>(null);
  
    // ローカルデータ（埋め込みモードではpropsから、独立モードでは初期データから）
    const [localData, setLocalData] = useState<MonthlyDetailData>(
      isEmbedded && monthlyDetailData ? monthlyDetailData : initialData
    );
    
    // 元のデータを保持（編集キャンセル用）
    const [originalData, setOriginalData] = useState<MonthlyDetailData>(
      isEmbedded && monthlyDetailData ? monthlyDetailData : initialData
    );
    
    // 入力参照用
    const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
    const setInputRef = useCallback((element: HTMLInputElement | null, key: string) => {
      if (element) {
        inputRefs.current[key] = element;
      }
    }, []);

    // IDが与えられている場合、そこから年度を取得
    useEffect(() => {
      if (id && id.includes('-')) {
        const [year] = id.split('-');
        if (!isNaN(Number(year))) {
          setDisplayFiscalYear(`${year}年度`);
        }
      }
    }, [id]);

    // props変更に応じてローカルデータを更新
    useEffect(() => {
      if (isEmbedded && monthlyDetailData) {
        console.log('props変更によるデータ更新:', { 
          dataLength: monthlyDetailData.data.length 
        });
        setLocalData(monthlyDetailData);
        setOriginalData(monthlyDetailData); // 元のデータも更新
      }
    }, [monthlyDetailData, isEmbedded]);

    // 親から渡されるデータのデバッグ
    useEffect(() => {
      if (monthlyDetailData) {
        console.log("親から渡されたデータ:", monthlyDetailData.data.map(row => ({ id: row.id, item: row.item })));
      }
    }, [monthlyDetailData]);

    // 現在表示されているデータの確認
    useEffect(() => {
      console.log("表示されているデータ:", localData.data.map(row => ({ id: row.id, item: row.item })));
    }, [localData.data]);
    
    // initialEditMode から編集モードを設定
    useEffect(() => {
      // コンポーネントマウント時の状態確認
      console.log('コンポーネントマウント時の状態:', {
        isEditing,
        hasMonthlyData: !!monthlyDetailData,
        dataLength: localData.data.length
      });
      
      // props から initialEditMode をチェック
      if (initialEditMode && !isEditing) {
        console.log('新規データのため自動的に編集モードを有効化');
        setIsEditing(true);
      }
    }, [initialEditMode, isEditing, setIsEditing]);

    // 自動計算対象のフィールドかをチェック
    const isCalculatedField = (rowId: number): boolean => {
      const row = localData.data.find(r => r.id === rowId);
      return row?.isCalculated || false;
    };

    // 法定雇用率フィールドかをチェック
    const isLegalRateField = (rowId: number): boolean => {
      return rowId === 11;
    };

    // 編集モード切り替え（改善版、親コンポーネントの状態に対応）
    const toggleEditMode = () => {
      console.log('編集モード切り替え 開始:', { 
        現在の状態: isEditing, 
        新しい状態: !isEditing 
      });
      
      // 編集モードをオフに切り替える場合、元のデータに戻す
      if (isEditing) {
        console.log('編集モードをオフに切り替え、元のデータに戻します');
        if (isEmbedded && monthlyDetailData) {
          setLocalData(monthlyDetailData);
        } else {
          setLocalData(originalData);
        }
        setErrorMessage(null);
        setEditingDetailRow(null);
        setEditingDetailCol(null);
      } else {
        // 編集モードをオンにする場合、現在のデータをバックアップ
        console.log('編集モードをオンに切り替え、現在のデータをバックアップ');
        setOriginalData({...localData});
      }
      
      // 編集モードを切り替える（親コンポーネントの関数を使用）
      setIsEditing(!isEditing);
      
      console.log('編集モード切り替え 完了:', { 
        新しい状態: !isEditing 
      });
    };
  
    // 新規作成用の関数
    const handleCreateNew = () => {
      console.log('新規作成 開始');
      
      // 初期データを設定
      setLocalData(initialData);
      setOriginalData(initialData);
      // 親の編集モード状態を更新
      setIsEditing(true);
      
      // 親に通知（埋め込みモードの場合）
      if (isEmbedded && onRefreshData) {
        onRefreshData();
      }
      
      console.log('新規作成 完了');
    };
  
    // 戻るボタンのハンドラー
    const handleBack = () => {
      navigate('/monthly-report?tab=monthly');
    };

    // CSVエクスポート
    const exportToCSV = (): void => {
      alert('CSVエクスポート機能はまだ実装されていません');
    };

    // 印刷
    const handlePrint = (): void => {
      window.print();
    };

    // 保存ボタンのハンドラー
    const handleSave = async () => {
      console.log('保存ボタンクリック 開始');
      
      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        if (isEmbedded && onDetailCellChange) {
          // 変更されたセルをAPIに送信
          const updatePromises = localData.data.map(async (row) => {
            // 自動計算フィールドでなければ更新
            if (!isCalculatedField(row.id)) {
              // 各月の値を更新
              for (let colIndex = 0; colIndex < 12; colIndex++) {
                // APIを呼び出して更新
                await updateDetailCell(
                  year,
                  month,
                  row.id,
                  colIndex.toString(),  // 数値を文字列に変換
                  row.values[colIndex].toString()
                );
                
                // 親コンポーネントにも変更を通知（ローカル更新用）
                onDetailCellChange(row.id, colIndex, row.values[colIndex].toString());
              }
            }
          });
          
          await Promise.all(updatePromises);
        } else {
          // 独立モードの場合は、既存のAPI関数を使用
          console.log('独立モードでの保存: データを直接APIに送信します');
          
          // サマリーデータを作成（実際のアプリケーションに合わせて調整が必要）
          const summaryData = {
            fiscal_year: year,
            month: month,
            employees_count: localData.data.find(r => r.id === 1)?.values[0] || 0,
            fulltime_count: localData.data.find(r => r.id === 2)?.values[0] || 0,
            parttime_count: localData.data.find(r => r.id === 3)?.values[0] || 0,
            level1_2_count: localData.data.find(r => r.id === 5)?.values[0] || 0,
            other_disability_count: localData.data.find(r => r.id === 6)?.values[0] || 0,
            level1_2_parttime_count: localData.data.find(r => r.id === 7)?.values[0] || 0,
            other_parttime_count: localData.data.find(r => r.id === 8)?.values[0] || 0,
            total_disability_count: localData.data.find(r => r.id === 9)?.values[0] || 0,
            employment_rate: localData.data.find(r => r.id === 10)?.values[0] || 0,
            legal_employment_rate: localData.data.find(r => r.id === 11)?.values[0] || 2.3,
            required_count: localData.data.find(r => r.id === 12)?.values[0] || 0,
            over_under_count: localData.data.find(r => r.id === 13)?.values[0] || 0,
            status: '未確定'
          };
          
          // サマリーデータを保存
          const savedData = await updateMonthlySummary(year, month, summaryData);
          console.log('サマリーデータ保存成功:', savedData);
          
          // 各セルを個別に更新
          const updatePromises = localData.data.map(async (row) => {
            // 自動計算フィールドでなければ更新
            if (!isCalculatedField(row.id)) {
              // 各月の値を更新
              for (let colIndex = 0; colIndex < 12; colIndex++) {
                // APIを呼び出して更新
                await updateDetailCell(
                  year,
                  month,
                  row.id,
                  colIndex.toString(),
                  row.values[colIndex].toString()
                );
              }
            }
          });
          
          await Promise.all(updatePromises);
          console.log('詳細データ保存成功');
        }
        
        // データ更新後に親コンポーネントに通知
        if (onRefreshData) {
          onRefreshData();
        }
        
        // 保存成功後、編集モードを終了（親コンポーネントの状態を更新）
        setIsEditing(false);
        // 保存後のデータを元データとして設定
        setOriginalData({...localData});
        
        alert('データを保存しました');
      } catch (error) {
        console.error('月次詳細データ保存エラー:', error);
        setErrorMessage(handleApiError(error));
      } finally {
        setIsLoading(false);
      }
      
      console.log('保存ボタンクリック 完了');
    };
  
    // セルクリック時のハンドラー（改善版）
    const handleCellClick = (rowId: number, colIndex: number) => {
      console.log(`セルクリック 開始: rowId=${rowId}, colIndex=${colIndex}, isEditing=${isEditing}`);
      
      // 合計列は編集不可
      if (colIndex >= 12) {
        console.log('合計列はクリック不可');
        return;
      }
      
      // 編集モードでない場合は無効
      if (!isEditing) {
        console.log('編集モードでないため、セル編集無効');
        return;
      }
      
      // セルの状態を更新
      setActiveCell({row: rowId, col: colIndex});
      console.log('アクティブセル設定:', {row: rowId, col: colIndex});
      
      // 計算フィールドでなければ編集開始
      if (!isCalculatedField(rowId)) {
        console.log('編集開始:', {rowId, colIndex});
        setEditingDetailRow(rowId);
        setEditingDetailCol(colIndex);
        
        // 遅延してフォーカスを設定
        setTimeout(() => {
          const inputKey = `input-${rowId}-${colIndex}`;
          console.log('フォーカス設定:', inputKey);
          if (inputRefs.current[inputKey]) {
            inputRefs.current[inputKey]?.focus();
          }
        }, 10);
      } else {
        console.log('計算フィールドのため編集不可');
      }
      
      console.log(`セルクリック 完了`);
    };

    // キーボードナビゲーション
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowId: number, colIndex: number) => {
      if (isCalculatedField(rowId)) return; // 自動計算フィールドは編集不可
      
      // 変数の型を number | null に変更
      let nextRowId: number | null = null;
      let prevRowId: number | null = null;
      
      // 現在の行のインデックスを探す
      const currentRowIndex = localData.data.findIndex(row => row.id === rowId);
      
      if (e.key === 'Enter') {
        e.preventDefault();
        handleDetailCellSave();
        
        // 次の編集可能なセルを探して移動
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
      else if (e.key === 'Tab') {
        e.preventDefault();
        handleDetailCellSave();
        
        // Tab + Shift キーでの移動
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
      // 矢印キーでの移動
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

    // セル編集開始ハンドラー 
    const handleDetailCellEdit = (rowId: number, colIndex: number) => {
      console.log('セル編集開始 開始:', {rowId, colIndex});
      
      if (isCalculatedField(rowId)) {
        console.log('計算フィールドのため編集不可');
        return;
      }
      
      if (!isEditing) {
        console.log('編集モードでないため処理不可');
        return;
      }
      
      setEditingDetailRow(rowId);
      setEditingDetailCol(colIndex);
      setActiveCell({row: rowId, col: colIndex});
      
      // 遅延してフォーカスを設定
      setTimeout(() => {
        const inputKey = `input-${rowId}-${colIndex}`;
        console.log('フォーカス設定:', inputKey);
        if (inputRefs.current[inputKey]) {
          inputRefs.current[inputKey]?.focus();
        }
      }, 10);
      
      console.log('セル編集開始 完了');
    };

    // セル編集の完了
    const handleDetailCellSave = () => {
      console.log('セル編集完了:', {
        rowId: editingDetailRow,
        colIndex: editingDetailCol
      });
      
      setEditingDetailRow(null);
      setEditingDetailCol(null);
    };

    // セル値変更のハンドラー
    const handleLocalCellChange = (rowId: number, colIndex: number, value: string) => {
      console.log(`セル値変更 開始: rowId=${rowId}, colIndex=${colIndex}, value=${value}`);
      
      // 値の検証
      const numValue = value === '' ? 0 : Number(value);
      if (isNaN(numValue)) {
        console.log('無効な数値形式:', value);
        return;
      }
      
      // ローカルデータの更新
      setLocalData(prevData => {
        const newData = {...prevData};
        const rowIndex = newData.data.findIndex(row => row.id === rowId);
        
        if (rowIndex !== -1 && colIndex < 12) {
          const updatedValues = [...newData.data[rowIndex].values];
          updatedValues[colIndex] = numValue;
          
          // 法定雇用率の場合、全ての月に同じ値を設定
          if (isLegalRateField(rowId)) {
            console.log('法定雇用率フィールド: 全ての月に同じ値を設定');
            for (let i = 0; i < 12; i++) {
              updatedValues[i] = numValue;
            }
          }
          
          // 合計の再計算
          updatedValues[12] = updatedValues.slice(0, 12).reduce((a, b) => a + b, 0);
          
          newData.data[rowIndex].values = updatedValues;
          
          // 自動計算を実行
          return recalculateData(newData);
        }
        
        return newData;
      });
      
      // 埋め込みモードの場合、親コンポーネントにも変更を通知
      if (isEmbedded && onDetailCellChange) {
        onDetailCellChange(rowId, colIndex, value);
      }
      
      console.log(`セル値変更 完了`);
    };

    // 自動計算を行う
    const recalculateData = (data: MonthlyDetailData): MonthlyDetailData => {
      const newData = {...data};
      
      // フルタイム従業員数の行
      const fullTimeEmployeesRowIndex = newData.data.findIndex(row => row.id === 2);
      // パートタイム従業員数の行
      const partTimeEmployeesRowIndex = newData.data.findIndex(row => row.id === 3);
      // トータル従業員数の行
      const totalEmployeesRowIndex = newData.data.findIndex(row => row.id === 4);
      
      // Level 1 & 2 の行
      const level1And2RowIndex = newData.data.findIndex(row => row.id === 5);
      // その他の行
      const otherRowIndex = newData.data.findIndex(row => row.id === 6);
      // Level 1 & 2 (パートタイム)の行
      const level1And2PartTimeRowIndex = newData.data.findIndex(row => row.id === 7);
      // その他 (パートタイム)の行
      const otherPartTimeRowIndex = newData.data.findIndex(row => row.id === 8);
      // トータル障がい者数の行
      const totalDisabledRowIndex = newData.data.findIndex(row => row.id === 9);
      
      // 法定雇用率の行
      const legalRateRowIndex = newData.data.findIndex(row => row.id === 11);
      
      // トータル従業員数の計算（フルタイム + パートタイム×0.5）
      if (fullTimeEmployeesRowIndex !== -1 && partTimeEmployeesRowIndex !== -1 && totalEmployeesRowIndex !== -1) {
        const fullTimeValues = newData.data[fullTimeEmployeesRowIndex].values;
        const partTimeValues = newData.data[partTimeEmployeesRowIndex].values;
        
        for (let i = 0; i < 13; i++) {
          if (i < 12) {
            // 各月のデータを計算
            newData.data[totalEmployeesRowIndex].values[i] = 
              fullTimeValues[i] + (partTimeValues[i] * 0.5);
          } else {
            // 合計値は各月の合計として再計算
            newData.data[totalEmployeesRowIndex].values[i] = 
              newData.data[totalEmployeesRowIndex].values.slice(0, 12).reduce((a, b) => a + b, 0);
          }
        }
      }
      
      // トータル障がい者数の計算（各障がい者カテゴリの合計）
      if (level1And2RowIndex !== -1 && otherRowIndex !== -1 && 
          level1And2PartTimeRowIndex !== -1 && otherPartTimeRowIndex !== -1 && 
          totalDisabledRowIndex !== -1) {
          
        const level1And2Values = newData.data[level1And2RowIndex].values;
        const otherValues = newData.data[otherRowIndex].values;
        const level1And2PartTimeValues = newData.data[level1And2PartTimeRowIndex].values;
        const otherPartTimeValues = newData.data[otherPartTimeRowIndex].values;
        
        for (let i = 0; i < 13; i++) {
          // 各月または合計の障がい者数を計算
          newData.data[totalDisabledRowIndex].values[i] = 
            level1And2Values[i] + otherValues[i] + 
            level1And2PartTimeValues[i] + otherPartTimeValues[i];
        }
      }
      
      if (totalEmployeesRowIndex !== -1 && totalDisabledRowIndex !== -1 && legalRateRowIndex !== -1) {
        const totalEmployeeValues = newData.data[totalEmployeesRowIndex].values;
        const totalDisabledValues = newData.data[totalDisabledRowIndex].values;
        const legalRateValues = newData.data[legalRateRowIndex].values;
        
        // 実雇用率の計算 (障がい者数/従業員数 * 100)
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
        
        // 法定雇用者数の計算 (法定雇用率 * 従業員数 / 100)
        const legalCountRowIndex = newData.data.findIndex(row => row.id === 12);
        if (legalCountRowIndex !== -1) {
          for (let i = 0; i < 13; i++) {
            if (i < 12) {
              // 各月の法定雇用者数を計算（小数点以下切り捨て）
              newData.data[legalCountRowIndex].values[i] = 
                Math.floor((legalRateValues[i] * totalEmployeeValues[i]) / 100);
            } else {
              // 合計は各月の合計として再計算
              newData.data[legalCountRowIndex].values[i] = 
                newData.data[legalCountRowIndex].values.slice(0, 12).reduce((a, b) => a + b, 0);
            }
          }
        }
        
        // 超過・未達の計算 (障がい者数 - 法定雇用者数)
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

    // ステータスの取得（埋め込みモードではpropsから、独立モードでは固定値）
    const currentStatus = isEmbedded && summaryData?.status ? summaryData.status : '未確定';
    const isConfirmed = currentStatus === '確定済';

    // データがない場合をチェック
    const hasNoData = isEmbedded && (!monthlyDetailData || !monthlyDetailData.data || monthlyDetailData.data.length === 0);

    // データがない場合は新規作成用のUIを表示
    if (hasNoData) {
      return (
        <div style={noDataMessageStyle}>
          <p style={{ marginBottom: '20px' }}>月次詳細データがありません。</p>
          
          {/* 新規作成用ボタンを追加 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button 
              type="button"
              onClick={() => {
                console.log('月次詳細: 新規作成ボタンがクリックされました');
                // 初期データを設定
                setLocalData(initialData);
                setOriginalData(initialData);
                // 明示的に編集モードをオンに
                setIsEditing(true);
                console.log('編集モードをオンにしました:', true);
                
                // 親に通知（埋め込みモードの場合）
                if (isEmbedded && onRefreshData) {
                  onRefreshData();
                }
              }}
              style={primaryButtonStyle}
            >
              新規作成
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="monthly-report-detail" style={{ padding: isEmbedded ? '0' : '20px' }}>
        {/* 独立ページモードの場合のみ表示 */}
        {!isEmbedded && (
          <>
            <button 
              onClick={handleBack}
              style={buttonStyle}
            >
              ← 月次報告一覧に戻る
            </button>
            
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>月次報告詳細</h1>
          </>
        )}

        {/* 集計サマリー */}
        <div style={summaryBoxStyle}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '10px' }}>集計サマリー</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <span>常用労働者数: {localData.data.find(r => r.id === 1)?.values[0] || 0}名</span>
            <span>|</span>
            <span>障害者数: {localData.data.find(r => r.id === 9)?.values[0] || 0}名</span>
            <span>|</span>
            <span>実雇用率: {(localData.data.find(r => r.id === 10)?.values[0] || 0).toFixed(2)}%</span>
            <span>|</span>
            <span>法定雇用率: {(localData.data.find(r => r.id === 11)?.values[0] || 0).toFixed(1)}%</span>
          </div>
        </div>

        {/* エラーメッセージとローディング */}
        {errorMessage && <div style={errorMessageStyle}>{errorMessage}</div>}
        {isLoading && <div style={loadingIndicatorStyle}>データを処理中...</div>}

        {/* ヘッダーとアクションボタン */}
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>月次詳細</h3>
          <div style={buttonAreaStyle}>
            <button 
              type="button"
              id="editButton"
              onClick={toggleEditMode}
              style={buttonStyle}
              disabled={isLoading || isConfirmed}
            >
              {isEditing ? '編集中止' : '編集'}
            </button>
            
            {isEditing && (
              <button 
                type="button"
                onClick={handleSave}
                style={primaryButtonStyle}
                disabled={isLoading}
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            )}
          </div>
        </div>
        
        {/* 編集モード時のインジケーター */}
        {isEditing && (
          <div style={editModeIndicatorStyle}>
            <span style={{ fontWeight: 'bold' }}>編集モード</span>：変更後は「保存」ボタンをクリックしてください。「編集中止」で変更を破棄します。
          </div>
        )}

        {/* タブナビゲーション */}
        <div style={tabContainerStyle}>
          <div style={tabStyle}>サマリー</div>
          <div style={tabStyle}>従業員詳細</div>
          <div style={activeTabStyle}>月次詳細</div>
        </div>
        
        {/* 月次詳細テーブル */}
        {(() => {
          console.log('月次詳細テーブルのレンダリング前', {
            hasData: !!localData,
            rowCount: localData?.data?.length,
            isEditing
          });
          return null;
        })()}
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ height: '28px' }}>
                <th style={{ 
                  ...tableHeaderStyle, 
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#f8f9fa',
                  zIndex: 1,
                  width: '180px'
                }}></th>
                {localData.months.map((month, index) => (
                  <th key={`month-${index}`} style={{ ...tableHeaderStyle, textAlign: 'center', fontWeight: 'normal' }}>
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* セクションヘッダー：従業員数 */}
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
              
              {/* データ行のレンダリング - 基本的な構造は維持 */}
              {localData.data.map((row) => {
                // 特定の行の前にスペーサー行と見出し行を追加
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
                    
                    <tr style={{ backgroundColor: 'white', height: '22px' }}>
                      <td style={{ 
                        ...tableCellStyle,
                        textAlign: 'left',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'white',
                        zIndex: 1,
                        borderRight: '1px solid #f0f0f0',
                        whiteSpace: 'nowrap'
                      }}>
                        {row.item}
                      </td>
                      
                      {row.values.map((value, colIndex) => {
                        const isLegalRate = row.id === 11;
                        const isFirstColumn = colIndex === 0;
                        const isNegativeValue = row.isNegative && value < 0;
                        const isEditable = !isCalculatedField(row.id) && colIndex < 12 && isEditing;
                        const isEditingCell = editingDetailRow === row.id && editingDetailCol === colIndex;
                        const isLegalRateEditing = isLegalRate && isFirstColumn && isEditing;
                        
                        return (
                          <td 
                            key={`value-${row.id}-${colIndex}`} 
                            style={{ 
                              ...tableCellStyle,
                              padding: '0',
                              textAlign: 'center',
                              backgroundColor: activeCell.row === row.id && activeCell.col === colIndex ? '#e9f2ff' : 'white',
                              cursor: isEditable ? 'pointer' : 'default'
                            }}
                            onClick={() => handleCellClick(row.id, colIndex)}
                          >
                            {(isEditingCell || isLegalRateEditing) ? (
                              <input
                                ref={(el: HTMLInputElement | null) => {
                                  setInputRef(el, `input-${row.id}-${colIndex}`);
                                }}
                                type="text"
                                style={{
                                  width: '100%',
                                  height: '22px',
                                  border: '1px solid #007bff',
                                  textAlign: 'center',
                                  background: '#e9f2ff', 
                                  fontSize: '12px',
                                  padding: '0 2px'
                                }}
                                value={value}
                                onChange={(e) => handleLocalCellChange(row.id, colIndex, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
                                onFocus={() => setActiveCell({row: row.id, col: colIndex})}
                                onBlur={() => {
                                  console.log('セル編集完了:', {rowId: row.id, colIndex});
                                }}
                              />
                            ) : (
                              <div
                                onClick={isEditable ? () => handleCellClick(row.id, colIndex) : undefined}
                                style={{
                                  width: '100%',
                                  height: '22px',
                                  textAlign: 'center',
                                  background: isCalculatedField(row.id) ? '#f8f9fa' : (isEditing ? '#f9f9f9' : 'transparent'),
                                  fontSize: '12px',
                                  padding: '3px 0',
                                  cursor: isEditable ? 'pointer' : 'default',
                                  color: isNegativeValue ? 'red' : 'inherit',
                                  border: activeCell.row === row.id && activeCell.col === colIndex ? '1px dashed #ccc' : 'none'
                                }}
                              >
                                {row.suffix ? `${value}${row.suffix}` : value}
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

        {/* アクションバー */}
        <div style={actionBarStyle}>
          <button onClick={handlePrint} style={buttonStyle}>
            印刷
          </button>
          <button onClick={exportToCSV} style={primaryButtonStyle}>
            CSVエクスポート
          </button>
        </div>
      </div>
    );
};

export default MonthlyReportDetail;