import React, { useState, useEffect } from 'react';
import PaymentInfoForm from './PaymentInfoForm';
import PaymentCalculation from './PaymentCalculation';
import PaymentMonthlyData from './PaymentMonthlyData';
import { paymentReportApi } from '../../api/paymentReportApi';

interface PaymentInfoTabProps {
  fiscalYear: string;
  reportData?: any;
}

// フォームデータの型定義
interface FormDataType {
  year: string;
  companyName: string;
  companyNameKana: string;
  representativeTitle: string;
  representativeName: string;
  corporateNumber: string;
  postalCode: string;
  address: string;
  industryClassification: string;
  industryClassificationCode: string;
  prefectureCode: string;
  employmentOfficeCode: string;
  
  // 月次雇用データ
  totalRegularEmployees: {
    [key: string]: number;
  };
  
  workerBaseCount: {
    [key: string]: number;
  };
  
  disabledEmployees: {
    [key: string]: number;
  };
  
  shortTimeDisabledEmployees: {
    [key: string]: number;
  };
  
  // 納付金計算関連データ
  legalEmploymentRate: number;
  paymentPerPerson: number;
  adjustmentPaymentPerPerson: number;
  homeWorkingAdjustmentRate: number;
  specialPaymentPerPerson: number;
  
  // 在宅就業障害者特例調整金関連
  homeWorkingPaymentTotal: number;
  homeWorkingDivisor: number;
  
  // 銀行口座情報
  bankName: string;
  branchName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  bankCode: string;
  branchCode: string;
}

const PaymentInfoTab: React.FC<PaymentInfoTabProps> = ({ fiscalYear, reportData }) => {
  const [formData, setFormData] = useState<FormDataType>({
    year: fiscalYear || '令和7',
    companyName: '株式会社サンプル',
    companyNameKana: 'カブシキガイシャサンプル',
    representativeTitle: '代表取締役',
    representativeName: '山田太郎',
    corporateNumber: '1234567890123',
    postalCode: '100-0001',
    address: '東京都千代田区千代田1-1-1',
    industryClassification: '製造業',
    industryClassificationCode: '26',
    prefectureCode: '13',
    employmentOfficeCode: '101',
    
    // 月次雇用データ
    totalRegularEmployees: {
      april: 120, may: 120, june: 121, july: 121, august: 121,
      september: 122, october: 122, november: 123, december: 123,
      january: 123, february: 123, march: 123
    },
    
    workerBaseCount: {
      april: 118, may: 118, june: 119, july: 119, august: 119,
      september: 120, october: 120, november: 121, december: 121,
      january: 121, february: 121, march: 121
    },
    
    disabledEmployees: {
      april: 3, may: 3, june: 3, july: 3, august: 3,
      september: 4, october: 4, november: 4, december: 4,
      january: 4, february: 4, march: 4
    },
    
    shortTimeDisabledEmployees: {
      april: 1, may: 1, june: 1, july: 1, august: 1,
      september: 1, october: 1, november: 1, december: 1,
      january: 1, february: 1, march: 1
    },
    
    // 納付金計算関連データ
    legalEmploymentRate: 2.3,
    paymentPerPerson: 50000,
    adjustmentPaymentPerPerson: 29000,
    homeWorkingAdjustmentRate: 21000,
    specialPaymentPerPerson: 7000,
    
    // 在宅就業障害者特例調整金関連
    homeWorkingPaymentTotal: 350000,
    homeWorkingDivisor: 35000,
    
    // 銀行口座情報
    bankName: 'サンプル銀行',
    branchName: '本店',
    accountType: '普通',
    accountNumber: '1234567',
    accountHolder: 'カ) サンプル',
    bankCode: '0123',
    branchCode: '456'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const [showSampleDataModal, setShowSampleDataModal] = useState(false);

  // 年度数値を取得する
  const getYearValue = () => {
    if (fiscalYear.includes('年度')) {
      return parseInt(fiscalYear.replace('年度', ''));
    }
    return new Date().getFullYear();
  };

  // APIからデータを取得
  useEffect(() => {
    console.log(`PaymentInfoTab: fiscalYear変更検知 ${fiscalYear}, reportData:`, reportData);
    // formDataのyear部分を更新
    setFormData(prevData => ({
      ...prevData,
      year: fiscalYear
    }));
    
    fetchData();
  }, [fiscalYear, reportData]);

  // データ取得関数
  const fetchData = async () => {
    // reportDataが提供されている場合はそちらを使用
    if (reportData) {
      try {
        console.log(`${fiscalYear}のデータを処理します:`, reportData);
        
        // APIレスポンスデータを元にフォームデータを更新
        updateFormDataFromApiResponse(reportData);
        
        setShowCreateOption(false);
        return;
      } catch (error) {
        console.error('親コンポーネントのデータ処理エラー:', error);
      }
    }
    
    // reportDataがない場合はAPIから取得
    try {
      setLoading(true);
      setError(null);
      setShowCreateOption(false);
      
      const year = getYearValue();
      
      try {
        // 既存レポートの取得を試みる
        const report = await paymentReportApi.getPaymentReport(year);
        
        // レポートが取得できた場合の処理
        if (report) {
          console.log(`${year}年度のデータを取得:`, report);
          
          // APIから取得したデータを処理する
          updateFormDataFromApiResponse(report);
        }
        
      } catch (error) {
        // まずはエラーの型チェック
        const fetchError = error as Error;
        
        if (fetchError.message && fetchError.message.includes('見つかりません')) {
          // 404エラーの場合は、新規作成のオプションを提供
          setError(`${year}年度のデータが見つかりません。新規作成することができます。`);
          setShowCreateOption(true);
        } else {
          throw error; // その他のエラーは再スロー
        }
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '納付金レポートデータの取得に失敗しました');
      console.error('納付金レポートデータの取得エラー:', err);
    }
  };

  // APIレスポンスからフォームデータを更新する関数
  const updateFormDataFromApiResponse = (apiData: any) => {
    // 会社情報を取得
    interface CompanyData {
      companyName?: string;
      companyNameKana?: string;
      representativeTitle?: string;
      representativeName?: string;
      corporateNumber?: string;
      postalCode?: string;
      address?: string;
      industryClassification?: string;
      industryClassificationCode?: string;
      prefectureCode?: string;
      employmentOfficeCode?: string;
      [key: string]: any;
    }
    
    let companyData: CompanyData = {};
    if (apiData.company_data) {
      try {
        // APIレスポンスのcompany_dataがある場合
        companyData = typeof apiData.company_data === 'string'
          ? JSON.parse(apiData.company_data)
          : apiData.company_data;
      } catch (error) {
        console.error('会社データのパースエラー:', error);
      }
    } else {
      // APIレスポンスにcompany_dataがない場合、フラットな構造から情報を取得
      companyData = {
        companyName: apiData.company_name || '',
        address: apiData.company_address || '',
        representativeName: apiData.representative_name || '',
        // 他のフィールドも同様に
      };
    }
    
    // 月次データを取得
    interface MonthlyData {
      totalRegularEmployees?: { [key: string]: number };
      workerBaseCount?: { [key: string]: number };
      disabledEmployees?: { [key: string]: number };
      shortTimeDisabledEmployees?: { [key: string]: number };
      [key: string]: any;
    }
    
    let monthlyData: MonthlyData = {
      totalRegularEmployees: formData.totalRegularEmployees,
      workerBaseCount: formData.workerBaseCount,
      disabledEmployees: formData.disabledEmployees,
      shortTimeDisabledEmployees: formData.shortTimeDisabledEmployees
    };
    
    if (apiData.monthly_data) {
      try {
        // APIレスポンスのmonthly_dataがある場合
        const parsedData = typeof apiData.monthly_data === 'string'
          ? JSON.parse(apiData.monthly_data)
          : apiData.monthly_data;
          
        monthlyData = {
          ...monthlyData,
          ...parsedData
        };
      } catch (error) {
        console.error('月次データのパースエラー:', error);
      }
    } else if (apiData.average_employee_count && apiData.actual_employment_count) {
      // APIレスポンスにmonthly_dataがない場合、平均値から推定データを生成
      const avgEmployees = apiData.average_employee_count;
      const avgDisabled = apiData.actual_employment_count;
      
      // すべての月で同じ値を使用
      const months = ['april', 'may', 'june', 'july', 'august', 'september', 
                      'october', 'november', 'december', 'january', 'february', 'march'];
      
      const newTotalEmployees: { [key: string]: number } = {};
      const newDisabledEmployees: { [key: string]: number } = {};
      
      months.forEach(month => {
        newTotalEmployees[month] = avgEmployees;
        newDisabledEmployees[month] = avgDisabled;
      });
      
      monthlyData = {
        ...monthlyData,
        totalRegularEmployees: newTotalEmployees,
        disabledEmployees: newDisabledEmployees
      };
    }
    
    // 銀行情報を取得
    interface BankInfo {
      bankName?: string;
      branchName?: string;
      accountType?: string;
      accountNumber?: string;
      accountHolder?: string;
      bankCode?: string;
      branchCode?: string;
      [key: string]: any;
    }
    
    let bankInfo: BankInfo = {};
    if (apiData.bank_info) {
      try {
        bankInfo = typeof apiData.bank_info === 'string'
          ? JSON.parse(apiData.bank_info)
          : apiData.bank_info;
      } catch (error) {
        console.error('銀行情報のパースエラー:', error);
      }
    }
    
    // フォームデータを更新
    setFormData(prevData => ({
      ...prevData,
      year: fiscalYear,
      // 会社情報
      companyName: (companyData as CompanyData).companyName || apiData.company_name || prevData.companyName,
      companyNameKana: (companyData as CompanyData).companyNameKana || prevData.companyNameKana,
      representativeTitle: (companyData as CompanyData).representativeTitle || prevData.representativeTitle,
      representativeName: (companyData as CompanyData).representativeName || apiData.representative_name || prevData.representativeName,
      corporateNumber: (companyData as CompanyData).corporateNumber || prevData.corporateNumber,
      postalCode: (companyData as CompanyData).postalCode || prevData.postalCode,
      address: (companyData as CompanyData).address || apiData.company_address || prevData.address,
      industryClassification: (companyData as CompanyData).industryClassification || prevData.industryClassification,
      industryClassificationCode: (companyData as CompanyData).industryClassificationCode || prevData.industryClassificationCode,
      prefectureCode: (companyData as CompanyData).prefectureCode || prevData.prefectureCode,
      employmentOfficeCode: (companyData as CompanyData).employmentOfficeCode || prevData.employmentOfficeCode,
      
      // 月次データ
      totalRegularEmployees: (monthlyData as MonthlyData).totalRegularEmployees || prevData.totalRegularEmployees,
      workerBaseCount: (monthlyData as MonthlyData).workerBaseCount || prevData.workerBaseCount,
      disabledEmployees: (monthlyData as MonthlyData).disabledEmployees || prevData.disabledEmployees,
      shortTimeDisabledEmployees: (monthlyData as MonthlyData).shortTimeDisabledEmployees || prevData.shortTimeDisabledEmployees,
      
      // 銀行情報
      bankName: (bankInfo as BankInfo).bankName || prevData.bankName,
      branchName: (bankInfo as BankInfo).branchName || prevData.branchName,
      accountType: (bankInfo as BankInfo).accountType || prevData.accountType,
      accountNumber: (bankInfo as BankInfo).accountNumber || prevData.accountNumber,
      accountHolder: (bankInfo as BankInfo).accountHolder || prevData.accountHolder,
      bankCode: (bankInfo as BankInfo).bankCode || prevData.bankCode,
      branchCode: (bankInfo as BankInfo).branchCode || prevData.branchCode,
    }));
  };

  // 新規作成ハンドラー
  const handleCreateNewReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const year = getYearValue();
      
      // 新規レポートの基本データ
      const initialData = {
        year,
        total_employees: 520,
        disabled_employees: 15,
        employment_rate: 2.8,
        legal_employment_rate: 2.3,
        shortage_count: 0,
        payment_amount: 0,
        notes: `${year}年度の納付金レポート（新規作成）`,
        company_data: JSON.stringify({
          companyName: '株式会社サンプル',
          companyNameKana: 'カブシキガイシャサンプル',
          representativeTitle: '代表取締役',
          representativeName: '山田太郎',
          corporateNumber: '1234567890123',
          postalCode: '100-0001',
          address: '東京都千代田区千代田1-1-1',
          industryClassification: '製造業',
          industryClassificationCode: '26',
          prefectureCode: '13',
          employmentOfficeCode: '101',
        }),
        monthly_data: JSON.stringify({
          totalRegularEmployees: {
            april: 510, may: 515, june: 520, july: 523, august: 525,
            september: 530, october: 528, november: 527, december: 520,
            january: 515, february: 510, march: 505
          },
          disabledEmployees: {
            april: 13, may: 13, june: 14, july: 15, august: 15,
            september: 15, october: 14, november: 14, december: 13,
            january: 13, february: 12, march: 12
          }
        })
      };
      
      // 新規レポートを保存
      const result = await paymentReportApi.savePaymentReport(year, initialData);
      
      setLoading(false);
      alert(`${year}年度の納付金レポートを新規作成しました`);
      
      // 画面をリロードする
      window.location.reload();
      
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '納付金レポートの作成に失敗しました');
      console.error('納付金レポートの作成エラー:', err);
    }
  };

  // 簡素化されたサンプルデータ作成関数
  const createSampleData = async () => {
    try {
      setLoading(true);
      
      // 簡素化された2024年度のデータ
      const data2024 = {
        year: 2024,
        fiscal_year: 2024, // yearとfiscal_yearの両方を試す
        total_employees: 520,
        disabled_employees: 15,
        employment_rate: 2.8,
        legal_employment_rate: 2.3,
        shortage_count: 0,
        payment_amount: 0,
        status: "作成中",
        notes: "2024年度の納付金レポート（サンプル）"
      };
      
      // 最小限のフィールドだけでまず試す
      await paymentReportApi.savePaymentReport(2024, data2024);
      
      setLoading(false);
      setShowSampleDataModal(false);
      alert('サンプルデータを作成しました');
      
      // 画面をリロードする
      window.location.reload();
    } catch (err) {
      setLoading(false);
      console.error('サンプルデータ作成エラー:', err);
      alert('サンプルデータの作成に失敗しました');
    }
  };

  // データを保存する関数
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSaveSuccess(false);
      
      const year = getYearValue();
      
      // APIに送信するデータを整形
      const paymentReportData = {
        year,
        total_employees: Object.values(formData.totalRegularEmployees).reduce((a, b) => a + b, 0) / 12,
        disabled_employees: Object.values(formData.disabledEmployees).reduce((a, b) => a + b, 0) / 12,
        employment_rate: (Object.values(formData.disabledEmployees).reduce((a, b) => a + b, 0) / 
          Object.values(formData.totalRegularEmployees).reduce((a, b) => a + b, 0)) * 100,
        legal_employment_rate: formData.legalEmploymentRate,
        shortage_count: Math.max(0, 
          Math.floor((Object.values(formData.workerBaseCount).reduce((a, b) => a + b, 0) * formData.legalEmploymentRate / 100)) - 
          Object.values(formData.disabledEmployees).reduce((a, b) => a + b, 0)
        ),
        payment_amount: calculatePaymentAmount(),
        notes: `${fiscalYear}の納付金レポート`,
        company_data: JSON.stringify({
          companyName: formData.companyName,
          companyNameKana: formData.companyNameKana,
          representativeTitle: formData.representativeTitle,
          representativeName: formData.representativeName,
          corporateNumber: formData.corporateNumber,
          postalCode: formData.postalCode,
          address: formData.address,
          industryClassification: formData.industryClassification,
          industryClassificationCode: formData.industryClassificationCode,
          prefectureCode: formData.prefectureCode,
          employmentOfficeCode: formData.employmentOfficeCode,
        }),
        monthly_data: JSON.stringify({
          totalRegularEmployees: formData.totalRegularEmployees,
          workerBaseCount: formData.workerBaseCount,
          disabledEmployees: formData.disabledEmployees,
          shortTimeDisabledEmployees: formData.shortTimeDisabledEmployees,
        }),
        bank_info: JSON.stringify({
          bankName: formData.bankName,
          branchName: formData.branchName,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber,
          accountHolder: formData.accountHolder,
          bankCode: formData.bankCode,
          branchCode: formData.branchCode,
        })
      };
      
      // 納付金レポートを保存
      await paymentReportApi.savePaymentReport(year, paymentReportData);
      
      setLoading(false);
      setSaveSuccess(true);
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '納付金レポートの保存に失敗しました');
      console.error('納付金レポートの保存エラー:', err);
    }
  };

  // 納付金申告処理を実行する関数（ステータス関連の不要機能を削除）
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // まずは通常の保存処理を実行
      await handleSave();
      
      // ここで申告処理の実行（PDFダウンロードやメール送信など）
      alert('納付金申告処理が完了しました。納付金申告書がダウンロードされます。');
      
      // 実際の処理はここで実装（PDF生成など）
      // 例: window.open('/api/payment-reports/download-pdf/' + getYearValue(), '_blank');
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '納付金の申告処理に失敗しました');
      console.error('納付金申告処理エラー:', err);
    }
  };

  // 納付金額を計算する関数
  const calculatePaymentAmount = () => {
    // 法定雇用障害者数の年間合計
    const totalLegalEmployment = Math.floor(
      Object.values(formData.workerBaseCount).reduce((a, b) => a + b, 0) * 
      formData.legalEmploymentRate / 100
    );
    
    // 障害者雇用数の年間合計
    const totalDisabledEmployees = Object.values(formData.disabledEmployees).reduce((a, b) => a + b, 0);
    
    // 不足している場合のみ納付金が発生
    const shortage = Math.max(0, totalLegalEmployment - totalDisabledEmployees);
    const paymentA = shortage * formData.paymentPerPerson;
    
    // 在宅就業障害者特例調整金の計算
    const count = Math.floor(formData.homeWorkingPaymentTotal / formData.homeWorkingDivisor);
    const paymentB = Math.min(
      count * formData.homeWorkingAdjustmentRate,
      totalDisabledEmployees * formData.homeWorkingAdjustmentRate
    );
    
    // 納付金額 = A - B（ただし0未満にはならない）
    return Math.max(0, paymentA - paymentB);
  };

  // サンプルデータ作成モーダルを開く
  const openSampleDataModal = () => {
    setShowSampleDataModal(true);
  };

  // サンプルデータ作成モーダルを閉じる
  const closeSampleDataModal = () => {
    setShowSampleDataModal(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">納付金情報 ({fiscalYear})</h2>
      
      {loading && <div className="text-center py-4">データを読み込み中...</div>}
      
      {error && !showCreateOption && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {showCreateOption && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <p>このデータは存在しません。新規作成しますか？</p>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={handleCreateNewReport}
          >
            新規作成
          </button>
        </div>
      )}
      
      {saveSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>納付金レポートを保存しました。</p>
        </div>
      )}
      
      <div className="bg-white p-6 rounded shadow">
        {/* 事業主情報 */}
        <PaymentInfoForm formData={formData} />
        
        {/* 月別データ */}
        <PaymentMonthlyData formData={formData} />
        
        {/* 納付金計算 */}
        <PaymentCalculation formData={formData} />
        
        {/* 操作ボタン類 */}
        <div className="flex justify-end gap-4 mt-6">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={handleCreateNewReport}
          >
            新規データ作成
          </button>
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            onClick={openSampleDataModal}
            disabled={loading}
          >
            サンプルデータ作成
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={handleSave}
            disabled={loading}
          >
            保存する
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            PDFで出力
          </button>
          <button 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
            disabled={loading}
          >
            申告する
          </button>
        </div>
      </div>
      
      {/* サンプルデータ作成確認ダイアログ */}
      {showSampleDataModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">サンプルデータの作成</h3>
            <div className="mb-4">
              <p className="mb-2">2024年度の簡素化されたサンプルデータを作成します。</p>
              <p>既存のデータがある場合、上書きされます。よろしいですか？</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                onClick={closeSampleDataModal}
              >
                キャンセル
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={createSampleData}
                disabled={loading}
              >
                {loading ? '処理中...' : '作成する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentInfoTab;