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

// MonthlyReportDetailPropsに変更なし
interface MonthlyReportDetailProps {
  monthlyDetailData?: MonthlyDetailData | null;
  onDetailCellChange?: (rowId: number, colIndex: number, value: string) => void;
  summaryData?: MonthlyTotal | null;
  isEmbedded?: boolean;
  onRefreshData?: () => void;
}

// 設定データの型定義を追加
interface Settings {
  legal_employment_rates: {
    fiscal_year: number;
    month: number;
    rate: number;
  }[];
}

// データの初期値を変更なし
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
    { id: 11, item: '法定雇用率 (%)', values: Array(13).fill(2.3), isRatio: true },
    { id: 12, item: '法定雇用者数 (名)', values: Array(13).fill(0), isCalculated: true },
    { id: 13, item: '超過・未達 (名)', values: Array(13).fill(0), isNegative: true, isCalculated: true }
  ]
};

// APIのベースURL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// メモリストレージ（フォールバック用）
const memoryStorage = new Map();

// ストレージアクセスのラッパー関数
const safeStorage = {
  setItem: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // ストレージアクセスエラー時はメモリストレージを使用
      console.warn('ローカルストレージアクセスエラー - メモリストレージを使用:', e);
      memoryStorage.set(key, value);
    }
  },
  
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      // エラー時はメモリストレージから取得
      console.warn('ローカルストレージアクセスエラー - メモリストレージを使用:', e);
      return memoryStorage.get(key) || null;
    }
  }
};

// 年度データキー生成関数
const getYearDataKey = (year: number, month: number) => `fiscal_${year}_month_${month}`;

const MonthlyReportDetail: React.FC<MonthlyReportDetailProps> = (props) => {
    const { monthlyDetailData, onDetailCellChange, summaryData, isEmbedded, onRefreshData } = props;
          
    // デバッグログ
    console.log('MonthlyReportDetail props:', {
      isEmbedded,
      hasSummaryData: !!summaryData,
      hasMonthlyDetailData: !!monthlyDetailData,
      detailDataItemCount: monthlyDetailData?.data?.length
    });
    
    // 年月コンテキストから現在の年月を取得
    const { fiscalYear, month } = useYearMonth();

    // 対象年度選択用
    const [selectedYear, setSelectedYear] = useState<number>(fiscalYear);
    
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    
    // 状態管理
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 年度表示用
    const [displayFiscalYear, setDisplayFiscalYear] = useState<string>(`${selectedYear}年度`);
    
    // セル編集用の状態
    const [activeCell, setActiveCell] = useState<{row: number | null, col: number | null}>({row: null, col: null});
    const [editingDetailRow, setEditingDetailRow] = useState<number | null>(null);
    const [editingDetailCol, setEditingDetailCol] = useState<number | null>(null);
  
    // ローカルデータ
    const [localData, setLocalData] = useState<MonthlyDetailData>(
      isEmbedded && monthlyDetailData ? monthlyDetailData : defaultDetailData
    );

    // 設定データ用の状態を追加
    const [settings, setSettings] = useState<Settings | null>(null);
    
    // 設定情報取得用のフラグを追加
    const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
    
    // 入力参照用
    const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
    const setInputRef = useCallback((element: HTMLInputElement | null, key: string) => {
      if (element) {
        inputRefs.current[key] = element;
      }
    }, []);

    // props変更時のuseEffect修正
    useEffect(() => {
      console.log('props変更を検出:', { monthlyDetailData, isEmbedded, isCreating });
      
      if (isEmbedded) {
        if (monthlyDetailData) {
          // 親からデータが渡された場合
          setLocalData(monthlyDetailData);
          setIsCreating(false);
        } else {
          // データがない場合は常にデフォルト表示
          setLocalData(defaultDetailData);
          if (!isCreating) {
            setIsCreating(true);
          }
        }
      }
    }, [monthlyDetailData, isEmbedded, isCreating]);

    // 自動計算を行う関数
    const recalculateData = (data: MonthlyDetailData): MonthlyDetailData => {
      console.log('自動計算を実行');
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
            level1And2Values[i] * 2 + otherValues[i] + 
            level1And2PartTimeValues[i] + otherPartTimeValues[i] * 0.5;
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

      // 法定雇用率を常に2.5に保持
      const legalRateRow = newData.data.find(row => row.id === 11);
      if (legalRateRow) {
        for (let i = 0; i < 13; i++) {
          legalRateRow.values[i] = 2.5;
        }
      }
      
      return newData;
    };

    // 設定情報を取得する関数を改善
    const fetchSettings = useCallback(async () => {
      // すでに読み込み済みの場合はスキップ
      if (settingsLoaded) {
        console.log('設定情報はすでに読み込み済みです');
        return null;
      }
      
      try {
        console.log('設定情報を取得します');
        
        // 本番環境では以下を使用
        try {
          const response = await getSettings();
          console.log('取得した設定情報:', response);
          
          if (response && response.legal_employment_rates) {
            setSettings(response);
            setSettingsLoaded(true); // 読み込み完了フラグをセット
            return response;
          }
        } catch (error) {
          // API エラーの場合、一度だけログに出力して、その後は試行しない
          console.error('設定APIエラー - 今後は自動設定を使用します:', error);
          setSettingsLoaded(true); // エラーでも読み込み完了とする
        }
        
        // ここに到達した場合は設定が取得できていないので、デフォルト値を使用
        console.log('設定情報が取得できないため、デフォルト値(2.5%)を使用します');
        return null;
      } catch (error) {
        console.error('設定情報の処理中にエラーが発生しました:', error);
        setSettingsLoaded(true); // エラーでも読み込み完了とする
        return null;
      }
    }, [settingsLoaded]);

    // 法定雇用率を設定から取得する関数 - 常に2.5%を返す
    const getLegalEmploymentRate = useCallback((_year: number, _monthIndex: number): number => {
      // APIから設定を取得できた場合は、その値を使用する
      if (settings && settings.legal_employment_rates && settings.legal_employment_rates.length > 0) {
        // ここに実際の設定から値を取得するロジックを実装
        // 現在は設定APIが機能していないため、常に2.5%を返す
        return 2.5;
      }
      
      // 設定が取得できない場合はデフォルト値を返す
      return 2.5;
    }, [settings]);

    // 法定雇用率を設定してデータを更新する関数
    const updateLegalEmploymentRates = useCallback(() => {
      console.log('法定雇用率を更新します');
      
      setLocalData(prevData => {
        const newData = {...prevData};
        const legalRateRowIndex = newData.data.findIndex(row => row.id === 11);
        
        if (legalRateRowIndex !== -1) {
          const updatedValues = [...newData.data[legalRateRowIndex].values];
          
          // 各月の法定雇用率を設定から取得して設定 (常に2.5%に)
          for (let i = 0; i < 12; i++) {
            updatedValues[i] = 2.5;
          }
          
          // 合計（平均）値を計算
          updatedValues[12] = 2.5;
          
          newData.data[legalRateRowIndex].values = updatedValues;
          
          // 自動計算を実行
          return recalculateData(newData);
        }
        
        return prevData;
      });
    }, []);

    // コンポーネントマウント時に一度だけ設定を読み込む
    useEffect(() => {
      console.log('コンポーネントがマウントされました');
      if (!settingsLoaded) {
        const loadSettings = async () => {
          await fetchSettings();
          // 設定の読み込みが成功してもエラーでも強制的に2.5%を設定
          updateLegalEmploymentRates();
        };
        
        loadSettings();
      }
    }, [fetchSettings, settingsLoaded, updateLegalEmploymentRates]);

    // 設定変更を監視するイベントリスナー（将来的な実装用）
    useEffect(() => {
      // 設定変更イベントを監視する
      const handleSettingsChange = () => {
        console.log('設定変更を検知しました');
        setSettingsLoaded(false); // 再読み込みのためにフラグをリセット
        fetchSettings().then(() => {
          updateLegalEmploymentRates(); // 設定変更後に法定雇用率を更新
        });
      };
      
      // イベントリスナーの登録（将来的に実装される設定変更イベント用）
      window.addEventListener('settings-changed', handleSettingsChange);
      
      // クリーンアップ
      return () => {
        window.removeEventListener('settings-changed', handleSettingsChange);
      };
    }, [fetchSettings, updateLegalEmploymentRates]);

    // 直接コンポーネントマウント時に法定雇用率を設定
    useEffect(() => {
      // コンポーネントのマウント後に実行
      const timer = setTimeout(() => {
        console.log('直接法定雇用率を2.5%に設定します');
        updateLegalEmploymentRates();
      }, 100);
      
      return () => clearTimeout(timer);
    }, [updateLegalEmploymentRates]);

    // 年度変更時のデータ保存・復元
    useEffect(() => {
      console.log(`年度が変更されました: ${selectedYear}`);
      setDisplayFiscalYear(`${selectedYear}年度`);
      
      // 現在のデータを安全にキャッシュ（現在の年度・月と前回のをそれぞれ保存）
      if (localData) {
        safeStorage.setItem(getYearDataKey(selectedYear, month), localData);
      }
      
      // 新しい年度のデータを読み込み試行
      const savedData = safeStorage.getItem(getYearDataKey(selectedYear, month));
      
      if (savedData) {
        // 保存されていたデータがあれば復元
        setLocalData(savedData);
        console.log(`${selectedYear}年度のデータを読み込みました`);
      } else {
        console.log(`デフォルトデータを使用: ${selectedYear}年度`);
      }
      
      // 法定雇用率も更新
      updateLegalEmploymentRates();
    }, [selectedYear, month, updateLegalEmploymentRates]);

    // Postmanテスト用のデータを生成（コンソールに出力）
    const showPutRequestData = useCallback(() => {
      const currentMonthIndex = month - 1; // 0ベースにするために-1
      
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
        legal_employment_rate: 2.5 // 常に2.5を送信
      };
      
      console.log('=== Postman PUT リクエストデータ ===');
      console.log('URL: ', `${API_BASE_URL}/monthly-reports/${selectedYear}/${month}/summary`);
      console.log('Method: PUT');
      console.log('Body (JSON):');
      console.log(JSON.stringify(putData, null, 2));
      console.log('==============================');
      
      return putData;
    }, [localData, month, selectedYear]);

    // IDが与えられている場合、そこから年度を取得
    useEffect(() => {
      if (id && id.includes('-')) {
        const [year] = id.split('-');
        if (!isNaN(Number(year))) {
          setDisplayFiscalYear(`${year}年度`);
          setSelectedYear(Number(year));
        }
      }
    }, [id]);

    // 現在表示されているデータの確認は必要時のみ実行
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        // 開発環境でのみログを出力
        console.log("表示されているデータ:", localData.data.map(row => ({ id: row.id, item: row.item })));
      }
    }, [localData.data]);

    // ページロード時にPostman用データをコンソールに表示 (開発環境のみ)
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        // 開発環境でのみ実行
        const timer = setTimeout(() => {
          if (localData) {
            showPutRequestData();
          }
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }, [localData, showPutRequestData]);

    // 自動計算対象のフィールドかをチェック
    const isCalculatedField = (rowId: number): boolean => {
      const row = localData.data.find(r => r.id === rowId);
      return row?.isCalculated || false;
    };

    // 法定雇用率フィールドかをチェック - 編集不可に変更
    const isLegalRateField = (rowId: number): boolean => {
      return rowId === 11;
    };

    // 編集モード切り替え
    const toggleEditMode = () => {
      console.log('編集モード切り替え: 現在の状態 =', isEditing, ' → 新しい状態 =', !isEditing); 
      
      if (isEditing) {
        // 編集モードを終了する場合、ローカルデータを元に戻す
        if (isEmbedded && monthlyDetailData) {
          console.log('編集モード終了: データを元に戻します');
          setLocalData(prevData => {
            // 元のデータに戻すが、法定雇用率は2.5のまま
            const newData = {...monthlyDetailData};
            const legalRateRowIndex = newData.data.findIndex(row => row.id === 11);
            
            if (legalRateRowIndex !== -1) {
              const updatedValues = [...newData.data[legalRateRowIndex].values];
              
              // すべての月を2.5%に設定
              for (let i = 0; i < 12; i++) {
                updatedValues[i] = 2.5;
              }
              
              // 合計も更新
              updatedValues[12] = 2.5;
              
              newData.data[legalRateRowIndex].values = updatedValues;
            }
            
            return recalculateData(newData);
          });
        }
        setErrorMessage(null);
      }
      
      setIsEditing(prevState => !prevState);
    };

    // 新規作成モード切り替え
    const toggleCreateMode = () => {
      console.log('新規作成モード開始');
      setIsCreating(true);
      setIsEditing(true);
      
      // 新規作成時にデフォルトデータをセットし、法定雇用率は2.5に更新
      setLocalData(prevData => {
        const newData = {...defaultDetailData};
        const legalRateRowIndex = newData.data.findIndex(row => row.id === 11);
        
        if (legalRateRowIndex !== -1) {
          const updatedValues = [...newData.data[legalRateRowIndex].values];
          
          // すべての月を2.5%に設定
          for (let i = 0; i < 12; i++) {
            updatedValues[i] = 2.5;
          }
          
          // 合計も更新
          updatedValues[12] = 2.5;
          
          newData.data[legalRateRowIndex].values = updatedValues;
        }
        
        return recalculateData(newData);
      });
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

    // directSave関数の修正版
    const directSave = async (data: any) => {
      console.log('直接保存を実行します:', data);
      
      try {
        // 既存データの有無を確認
        let exists = false;
        try {
          const checkResponse = await axios.get(`${API_BASE_URL}/monthly-reports/${selectedYear}/${month}`);
          exists = !!checkResponse.data && !!checkResponse.data.success;
        } catch (error) {
          console.log('既存データのチェック中にエラー:', error);
          exists = false;
        }
        
        let response;
        
        if (exists) {
          // 既存データがある場合はPUT
          console.log('PUT リクエスト実行:', `${API_BASE_URL}/monthly-reports/${selectedYear}/${month}`);
          response = await axios.put(
            `${API_BASE_URL}/monthly-reports/${selectedYear}/${month}`, 
            data
          );
        } else {
          // 既存データがない場合はPOST
          console.log('POST リクエスト実行:', `${API_BASE_URL}/monthly-reports`);
          response = await axios.post(
            `${API_BASE_URL}/monthly-reports`, 
            data
          );
        }
        
        console.log('API応答:', response.data);
        return response.data;
      } catch (error) {
        console.error('API エラー:', error);
        throw error;
      }
    };
    
    // 保存ボタンのハンドラー - 修正版
    const handleSave = async () => {
      console.log('保存ボタンクリック');
      
      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        // 現在の月のインデックス（0ベース）
        const currentMonthIndex = month - 1;
        
        // 重要：localDataから現在の値を取得
        const saveData = {
          fiscal_year: selectedYear,
          month: month,
          employees_count: localData.data[0].values[currentMonthIndex],
          fulltime_count: localData.data[1].values[currentMonthIndex],
          parttime_count: localData.data[2].values[currentMonthIndex],
          level1_2_count: localData.data[4].values[currentMonthIndex],
          other_disability_count: localData.data[5].values[currentMonthIndex],
          level1_2_parttime_count: localData.data[6].values[currentMonthIndex],
          other_parttime_count: localData.data[7].values[currentMonthIndex],
          legal_employment_rate: 2.5
        };
        
        console.log('保存データ:', saveData);
        
        // 直接保存処理
        const result = await directSave(saveData);
        
        console.log('保存成功:', result);
        
        // 親コンポーネントに強制的に通知
        if (isEmbedded && onRefreshData) {
          onRefreshData();
        }
        
        setIsEditing(false);
        setIsCreating(false);
        setSuccessMessage(`データを${isCreating ? '作成' : '保存'}しました`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
      } catch (error) {
        console.error('月次詳細データ保存エラー:', error);
        setErrorMessage(handleApiError(error));
      } finally {
        setIsLoading(false);
      }
    };
    
    // セルクリック時のハンドラー
    const handleCellClick = (rowId: number, colIndex: number) => {
      if (colIndex >= 12) return; // 合計列はクリック不可
      if (!isEditing) return; // 編集モード時のみ処理
      if (isLegalRateField(rowId)) {
        console.log('法定雇用率フィールドはクリック不可');
        return; // 法定雇用率フィールドは編集不可
      }
      
      setActiveCell({row: rowId, col: colIndex});
      
      if (!isCalculatedField(rowId)) {
        handleDetailCellEdit(rowId, colIndex);
      }
    };

    // セル編集開始ハンドラー
    const handleDetailCellEdit = (rowId: number, colIndex: number) => {
      if (isCalculatedField(rowId)) {
        console.log('自動計算フィールドは編集不可');
        return; // 自動計算フィールドは編集不可
      }
      if (isLegalRateField(rowId)) {
        console.log('法定雇用率フィールドは編集不可');
        return; // 法定雇用率フィールドは編集不可
      }
      if (!isEditing) return; // 編集モード時のみ処理
      
      console.log(`セル編集開始: rowId=${rowId}, colIndex=${colIndex}`);
      setEditingDetailRow(rowId);
      setEditingDetailCol(colIndex);
      
      // 遅延してフォーカスを設定
      setTimeout(() => {
        const inputKey = `input-${rowId}-${colIndex}`;
        console.log(`フォーカス設定: ${inputKey}`);
        if (inputRefs.current[inputKey]) {
          inputRefs.current[inputKey]?.focus();
        }
      }, 10);
    };

    // キーボードナビゲーション
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowId: number, colIndex: number) => {
      if (isCalculatedField(rowId)) return; // 自動計算フィールドは編集不可
      if (isLegalRateField(rowId)) return; // 法定雇用率フィールドは編集不可
      
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
          if (!isCalculatedField(localData.data[i].id) && !isLegalRateField(localData.data[i].id)) {
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
                if (!isCalculatedField(localData.data[i].id) && !isLegalRateField(localData.data[i].id)) {
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
                if (!isCalculatedField(localData.data[i].id) && !isLegalRateField(localData.data[i].id)) {
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
            if (!isCalculatedField(localData.data[i].id) && !isLegalRateField(localData.data[i].id)) {
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
            if (!isCalculatedField(localData.data[i].id) && !isLegalRateField(localData.data[i].id)) {
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

    // セル編集の完了
    const handleDetailCellSave = () => {
      console.log('セル編集完了');
      setEditingDetailRow(null);
      setEditingDetailCol(null);
    };

    // セル値変更のハンドラー
    const handleLocalCellChange = (rowId: number, colIndex: number, value: string) => {
      console.log(`セル値変更: rowId=${rowId}, colIndex=${colIndex}, value=${value}`); // デバッグ用
      
      // 法定雇用率フィールドは編集不可
      if (isLegalRateField(rowId)) {
        console.log('法定雇用率フィールドは編集不可');
        return;
      }
      
      // 値の検証
      const numValue = value === '' ? 0 : Number(value);
      if (isNaN(numValue)) {
        console.log('数値以外の入力はスキップ');
        return;
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
        onDetailCellChange(rowId, colIndex, value);
      }
    };

    // スタイル定義
    const cellStyle = {
      width: '100%',
      height: '22px',
      border: 'none',
      textAlign: 'center' as const,
      background: 'transparent',
      fontSize: '12px',
      padding: '0'
    };

    const readonlyCellStyle = {
      ...cellStyle,
      backgroundColor: '#f8f9fa'
    };

    // 法定雇用率用のスタイル
    const legalRateCellStyle = {
      ...cellStyle,
      backgroundColor: '#f0f0f0',
      color: '#666'
    };

    // ステータスの取得（埋め込みモードではpropsから、独立モードでは固定値）
    const currentStatus = isEmbedded && summaryData?.status ? summaryData.status : '未確定';
    const isConfirmed = currentStatus === '確定済';

    // デバッグ表示用（開発環境のみ）
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
        月: {month}
      </div>
    ) : null;

    // データがない場合の表示
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
        
        {/* 独立ページモードの場合のみ表示 */}
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

        {/* 成功メッセージ表示エリア */}
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

        {/* エラーメッセージ表示エリア */}
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
          
        {/* ローディングインジケーター */}
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

        {/* アクションバー */}
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 左側：タイトルと年度選択 */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <h3 style={{ margin: '0' }}>月次詳細</h3>
            
            {/* 年度選択用ドロップダウン */}
            <div>
              <select
                id="fiscal-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}
                disabled={isLoading || isEditing}
              >
                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}年度</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 右側：操作ボタン */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* 編集ボタン - 編集モードでない場合に表示 */}
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
            
            {/* 編集中止ボタン - 編集モード時に表示 */}
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
            
            {/* 保存ボタン - 編集モード時に表示 */}
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
        
        {/* 月次詳細テーブル */}
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
                {/* 従業員数セクション */}
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
                
                {/* 各データ行 */}
                {localData.data.map((row) => {
                  // 特定の行の前にスペーサー行を追加
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
                      <tr style={{ 
                        backgroundColor: 'white',
                        height: '22px'
                      }}>
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
                          {/* 法定雇用率の行には「設定値から自動入力」の注釈を追加 */}
                          {isLegalRateField(row.id) && (
                            <span style={{ 
                              fontSize: '10px', 
                              color: '#6c757d', 
                              marginLeft: '5px',
                              fontStyle: 'italic'
                            }}>
                              (設定メニューから自動入力)
                            </span>
                          )}
                        </td>
                        {row.values.map((value, colIndex) => {
                          // セルの特性を判断
                          const isLegalRate = row.id === 11;
                          const isNegativeValue = row.isNegative && value < 0;
                          
                          return (
                            <td 
                              key={`value-${row.id}-${colIndex}`} 
                              style={{ 
                                padding: '0', 
                                textAlign: 'center',
                                backgroundColor: activeCell.row === row.id && activeCell.col === colIndex ? '#e9f2ff' : 'white'
                              }}
                              onClick={() => handleCellClick(row.id, colIndex)}
                            >
                              {/* 編集中のセル以外は全て読み取り専用として表示 */}
                              {(editingDetailRow === row.id && editingDetailCol === colIndex && isEditing && !isLegalRate) ? (
                                <input
                                  ref={(el: HTMLInputElement | null) => {
                                    setInputRef(el, `input-${row.id}-${colIndex}`);
                                  }}
                                  type="text"
                                  style={cellStyle}
                                  value={value}
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
                                    ...(isCalculatedField(row.id) 
                                      ? readonlyCellStyle 
                                      : isLegalRateField(row.id) 
                                        ? legalRateCellStyle
                                        : cellStyle),
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
          // データがない場合の表示
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

        {/* 独立ページモードの場合のフッターボタン */}
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