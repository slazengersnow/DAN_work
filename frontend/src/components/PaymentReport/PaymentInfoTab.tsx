import React, { useState } from 'react';

// コンポーネントのProps型定義
interface DisabilityEmploymentAppProps {
  fiscalYear: string;
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

const DisabilityEmploymentApp: React.FC<DisabilityEmploymentAppProps> = ({ fiscalYear }) => {
  // フォームデータの状態管理
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

  // 月別データの配列化（表示用）
  const getMonthlyData = (dataKey: keyof Pick<FormDataType, 'totalRegularEmployees' | 'workerBaseCount' | 'disabledEmployees' | 'shortTimeDisabledEmployees'>) => {
    const keys = ['april', 'may', 'june', 'july', 'august', 'september', 
                 'october', 'november', 'december', 'january', 'february', 'march'];
    return keys.map(month => formData[dataKey][month]);
  };

  // 月別の法定雇用障害者数の計算
  const calculateMonthlyLegalEmployment = () => {
    const keys = ['april', 'may', 'june', 'july', 'august', 'september', 
                 'october', 'november', 'december', 'january', 'february', 'march'];
    return keys.map(month => Math.floor(formData.workerBaseCount[month] * formData.legalEmploymentRate / 100));
  };

  // 合計値の計算
  const calculateTotal = (dataKey: keyof Pick<FormDataType, 'totalRegularEmployees' | 'workerBaseCount' | 'disabledEmployees' | 'shortTimeDisabledEmployees'>) => {
    const months = ['april', 'may', 'june', 'july', 'august', 'september', 
                    'october', 'november', 'december', 'january', 'february', 'march'];
    return months.reduce((sum, month) => sum + formData[dataKey][month], 0);
  };

  // 法定雇用障害者数の年間合計
  const getTotalLegalEmployment = () => {
    return Math.floor(calculateTotal('workerBaseCount') * formData.legalEmploymentRate / 100);
  };

  // 身体障害者、知的障害者及び精神障害者の合計数の年間合計
  const getTotalDisabledEmployees = () => {
    return calculateTotal('disabledEmployees');
  };

  // A: 不足している法定雇用障害者数 × 障害者雇用納付金額（50,000円）
  const calculateA = () => {
    const legalEmployment = getTotalLegalEmployment();
    const actualEmployment = getTotalDisabledEmployees();
    
    // 不足している場合のみ納付金が発生
    const shortage = Math.max(0, legalEmployment - actualEmployment);
    return shortage * formData.paymentPerPerson;
  };

  // B: 在宅就業障害者特例調整金の計算
  const calculateB = () => {
    // 在宅就業障害者特例調整金の基礎額の計算
    const count = Math.floor(formData.homeWorkingPaymentTotal / formData.homeWorkingDivisor);
    
    // 特例調整金の計算（上限あり）
    return Math.min(
      count * formData.homeWorkingAdjustmentRate,
      getTotalDisabledEmployees() * formData.homeWorkingAdjustmentRate
    );
  };

  // 障害者雇用納付金の納付額: A - B（ただし0未満にはならない）
  const calculatePaymentAmount = () => {
    return Math.max(0, calculateA() - calculateB());
  };

  // O: 法定雇用率を超えて雇用している障害者数
  const calculateO = () => {
    const legalEmployment = getTotalLegalEmployment();
    const actualEmployment = getTotalDisabledEmployees();
    
    // 超過している場合のみ調整金が発生
    return Math.max(0, actualEmployment - legalEmployment);
  };

  // P: 身体障害者、知的障害者及び精神障害者の合計数（年間合計）
  const calculateP = () => {
    return getTotalDisabledEmployees();
  };

  // E: 障害者雇用調整金の計算 (O × 29,000円)
  const calculateE = () => {
    return calculateO() * formData.adjustmentPaymentPerPerson;
  };

  // F: 在宅就業障害者特例調整金の計算
  const calculateF = () => {
    return calculateB();
  };

  // 障害者雇用調整金および在宅就業障害者特例調整金の合計額
  const calculateAdjustmentTotal = () => {
    return calculateE() + calculateF();
  };

  // 特例給付金の計算
  const calculateSpecialPayment = () => {
    const totalShortTime = calculateTotal('shortTimeDisabledEmployees');
    const totalDisabled = getTotalDisabledEmployees();
    
    // いずれか小さい方の数 × 7,000円
    return Math.min(totalShortTime, totalDisabled) * formData.specialPaymentPerPerson;
  };

  // 月名の変換
  const getMonthName = (index: number) => {
    const months = ['４月', '５月', '６月', '７月', '８月', '９月', '10月', '11月', '12月', '１月', '２月', '３月'];
    return months[index];
  };

  // 納付金・調整金申告か判定
  const isPaymentRequired = () => {
    return calculateA() > calculateB();
  };

  // 調整金申告か判定
  const isAdjustmentRequired = () => {
    return getTotalDisabledEmployees() > getTotalLegalEmployment();
  };

  return (
    <div className="bg-white p-6 max-w-6xl mx-auto">
      <div className="border-2 border-gray-800 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm">様式第101号</div>
          <div className="text-xl font-bold">10100</div>
        </div>
        
        <div className="text-center font-bold text-lg mb-6">
          {formData.year}年度<br />
          障害者雇用納付金申告書、障害者雇用調整金、在宅就業障害者特例調整金及び特例給付金支給申請書<br />
          (常用雇用労働者の総数が100人を超える事業主用)
        </div>
        
        <div className="text-right mb-4">
          <p>下記のとおり申告・申請します。</p>
          <p className="font-bold">独立行政法人高齢・障害・求職者雇用支援機構理事長　殿</p>
        </div>
        
        <div className="flex justify-end mb-6">
          <div className="w-48">
            <div className="border border-gray-800 p-2 mb-2">
              <p className="text-sm">令和　　年　　月　　日</p>
            </div>
          </div>
        </div>
        
        {/* 申告申請事業主情報 */}
        <div className="border border-gray-800 mb-6">
          <div className="grid grid-cols-4 border-b border-gray-800">
            <div className="col-span-1 border-r border-gray-800 bg-gray-100 p-2 font-bold">①申告申請事業主</div>
            <div className="col-span-3 p-2">
              <div className="flex mb-2">
                <div className="w-16 text-right mr-2">法人番号</div>
                <div className="border border-gray-300 px-2 py-1 w-64">{formData.corporateNumber}</div>
              </div>
              <div className="flex mb-2">
                <div className="w-16 text-right mr-2">フリガナ</div>
                <div className="border border-gray-300 px-2 py-1 w-64">{formData.companyNameKana}</div>
              </div>
              <div className="flex mb-2">
                <div className="w-16 text-right mr-2">名称</div>
                <div className="border border-gray-300 px-2 py-1 w-64">{formData.companyName}</div>
                <div className="ml-4">
                  <div className="flex">
                    <div className="w-24 text-right mr-2">代表者の役職</div>
                    <div className="border border-gray-300 px-2 py-1 w-32">{formData.representativeTitle}</div>
                  </div>
                  <div className="flex mt-2">
                    <div className="w-24 text-right mr-2">氏名</div>
                    <div className="border border-gray-300 px-2 py-1 w-32">{formData.representativeName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 border-b border-gray-800">
            <div className="col-span-1 border-r border-gray-800 bg-gray-100 p-2 font-bold">③住所</div>
            <div className="col-span-3 p-2">
              <div className="flex mb-2">
                <div className="w-16 text-right mr-2">郵便番号</div>
                <div className="border border-gray-300 px-2 py-1 w-24">{formData.postalCode}</div>
              </div>
              <div className="border border-gray-300 px-2 py-1 w-full">{formData.address}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-5">
            <div className="col-span-1 border-r border-gray-800 bg-gray-100 p-2 font-bold">④産業分類</div>
            <div className="col-span-2 border-r border-gray-800 p-2">
              <div className="border border-gray-300 px-2 py-1">{formData.industryClassification}（{formData.industryClassificationCode}）</div>
            </div>
            <div className="col-span-1 border-r border-gray-800 bg-gray-100 p-2 font-bold">②都道府県・職安コード</div>
            <div className="col-span-1 p-2">
              <div className="border border-gray-300 px-2 py-1">{formData.prefectureCode}-{formData.employmentOfficeCode}</div>
            </div>
          </div>
        </div>
        
        {/* 月別データ一覧テーブル（先に表示して計算の基礎を明確に） */}
        <div className="border border-gray-800 mb-6">
          <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">障害者雇用納付金・障害者雇用調整金の算定内訳</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 p-1 w-48">区分</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="border border-gray-800 p-1 w-16">{getMonthName(i)}</th>
                  ))}
                  <th className="border border-gray-800 p-1 w-20">合計</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-800 p-1 text-sm">常用雇用労働者の総数<br/>(N)</td>
                  {getMonthlyData('totalRegularEmployees').map((value, i) => (
                    <td key={i} className="border border-gray-800 p-1 text-center">{value}</td>
                  ))}
                  <td className="border border-gray-800 p-1 text-center font-bold">{calculateTotal('totalRegularEmployees')}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-1 text-sm">法定雇用障害者数の算定の基礎となる労働者の数<br/>(O)</td>
                  {getMonthlyData('workerBaseCount').map((value, i) => (
                    <td key={i} className="border border-gray-800 p-1 text-center">{value}</td>
                  ))}
                  <td className="border border-gray-800 p-1 text-center font-bold">{calculateTotal('workerBaseCount')}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-1 text-sm">法定雇用障害者の数（納付金申告）<br/>4月～3月：((O)×{formData.legalEmploymentRate}/100)</td>
                  {calculateMonthlyLegalEmployment().map((value, i) => (
                    <td key={i} className="border border-gray-800 p-1 text-center">{value}</td>
                  ))}
                  <td className="border border-gray-800 p-1 text-center font-bold">{getTotalLegalEmployment()}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-1 text-sm">身体障害者、知的障害者及び精神障害者の合計数<br/>(P)</td>
                  {getMonthlyData('disabledEmployees').map((value, i) => (
                    <td key={i} className="border border-gray-800 p-1 text-center">{value}</td>
                  ))}
                  <td className="border border-gray-800 p-1 text-center font-bold">{getTotalDisabledEmployees()}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-1 text-sm">週労働時間が10時間以上20時間未満の雇用障害者の数<br/>(Q)</td>
                  {getMonthlyData('shortTimeDisabledEmployees').map((value, i) => (
                    <td key={i} className="border border-gray-800 p-1 text-center">{value}</td>
                  ))}
                  <td className="border border-gray-800 p-1 text-center font-bold">{calculateTotal('shortTimeDisabledEmployees')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 計算プロセスの説明エリア（新規追加） */}
        <div className="border border-gray-800 mb-6">
          <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">納付金・調整金の計算プロセス</div>
          <div className="p-4">
            {/* A値の計算プロセス */}
            <div className="mb-4">
              <h3 className="font-bold mb-2">A値：不足している法定雇用障害者数 × 障害者雇用納付金額</h3>
              <div className="flex flex-wrap items-center ml-4">
                <div className="mr-2">法定雇用障害者数：</div>
                <div className="border border-gray-300 px-2 py-1 w-16">{getTotalLegalEmployment()}</div>
                <div className="mx-2">−</div>
                <div className="mr-2">身体障害者、知的障害者及び精神障害者の合計数：</div>
                <div className="border border-gray-300 px-2 py-1 w-16">{getTotalDisabledEmployees()}</div>
                <div className="mx-2">=</div>
                <div className="border border-gray-300 px-2 py-1 w-16">{Math.max(0, getTotalLegalEmployment() - getTotalDisabledEmployees())}</div>
                <div className="mx-2">×</div>
                <div className="mr-2">50,000円</div>
                <div className="mx-2">=</div>
                <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateA().toLocaleString()}</div>
                <div className="ml-2">円</div>
              </div>
            </div>
            
            {/* B値の計算プロセス */}
            <div className="mb-4">
              <h3 className="font-bold mb-2">B値：在宅就業障害者特例調整金</h3>
              <div className="flex flex-wrap items-center ml-4 mb-2">
                <div className="mr-2">年間の在宅就業障害者への支払い総額：</div>
                <div className="border border-gray-300 px-2 py-1 w-32">{formData.homeWorkingPaymentTotal.toLocaleString()}</div>
                <div className="ml-2">円</div>
              </div>
              <div className="flex flex-wrap items-center ml-4">
                <div className="mr-2">在宅就業障害者特例調整金：</div>
                <div className="border border-gray-300 px-2 py-1 w-16">{Math.floor(formData.homeWorkingPaymentTotal / formData.homeWorkingDivisor)}</div>
                <div className="mx-2">×</div>
                <div className="mr-2">21,000円</div>
                <div className="mx-2">=</div>
                <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateB().toLocaleString()}</div>
                <div className="ml-2">円</div>
              </div>
            </div>
            
            {/* 納付金額か調整金額かの判定 */}
            <div className="mb-4">
              <h3 className="font-bold mb-2">納付金・調整金の判定</h3>
              <div className="ml-4">
                {isPaymentRequired() ? (
                  <div className="bg-yellow-100 p-2 border border-yellow-300 rounded">
                    法定雇用障害者数（{getTotalLegalEmployment()}人）＞ 実雇用障害者数（{getTotalDisabledEmployees()}人）のため、<span className="font-bold">納付金の対象</span>です。
                  </div>
                ) : (
                  <div className="bg-green-100 p-2 border border-green-300 rounded">
                    法定雇用障害者数（{getTotalLegalEmployment()}人）＜ 実雇用障害者数（{getTotalDisabledEmployees()}人）のため、<span className="font-bold">調整金の対象</span>です。
                  </div>
                )}
              </div>
            </div>
            
            {/* 調整金の場合のE, F値の計算プロセス */}
            {!isPaymentRequired() && (
              <div>
                <div className="mb-4">
                  <h3 className="font-bold mb-2">E値：障害者雇用調整金</h3>
                  <div className="flex flex-wrap items-center ml-4">
                    <div className="mr-2">超過雇用障害者数：</div>
                    <div className="border border-gray-300 px-2 py-1 w-16">{calculateO()}</div>
                    <div className="mx-2">×</div>
                    <div className="mr-2">29,000円</div>
                    <div className="mx-2">=</div>
                    <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateE().toLocaleString()}</div>
                    <div className="ml-2">円</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-bold mb-2">F値：在宅就業障害者特例調整金</h3>
                  <div className="flex flex-wrap items-center ml-4">
                    <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateF().toLocaleString()}</div>
                    <div className="ml-2">円</div>
                    <div className="ml-4 text-sm text-gray-600">（B値と同額）</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 納付金の納付額および在宅就業障害者特例調整金の申請額 */}
        {isPaymentRequired() && (
          <div className="border border-gray-800 mb-6">
            <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">障害者雇用納付金の納付額及び在宅就業障害者特例調整金の申請額</div>
            <div className="grid grid-cols-3 border-b border-gray-800 p-2">
              <div className="flex items-center">
                <div className="mr-2">(A)</div>
                <div className="border border-gray-300 px-2 py-1 w-32">{calculateA().toLocaleString()}</div>
                <div className="ml-2">円</div>
              </div>
              <div className="flex items-center justify-center">
                <div className="mr-2">−</div>
                <div className="mr-2">(B)</div>
                <div className="border border-gray-300 px-2 py-1 w-32">{calculateB().toLocaleString()}</div>
                <div className="ml-2">円</div>
              </div>
              <div className="flex items-center justify-end">
                <div className="mr-2">納付額((A)−(B))</div>
                <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculatePaymentAmount().toLocaleString()}</div>
                <div className="ml-2">円</div>
              </div>
            </div>
          </div>
        )}
        
        {/* 障害者雇用調整金及び在宅就業障害者特例調整金の申請額 */}
        {!isPaymentRequired() && (
          <div className="border border-gray-800 mb-6">
            <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">障害者雇用調整金及び在宅就業障害者特例調整金の申請額</div>
            <div className="grid grid-cols-3 border-b border-gray-800 p-2">
              <div className="flex items-center">
                <div className="mr-2">(P)</div>
                <div className="border border-gray-300 px-2 py-1 w-16">{calculateO()}</div>
                <div className="ml-2">×</div>
                <div className="mx-2">29,000円</div>
                <div className="mx-2">=</div>
                <div className="border border-gray-300 px-2 py-1 w-32">{calculateE().toLocaleString()}</div>
                <div className="ml-2">円</div>
              </div>
              <div className="flex items-center justify-center">
                <div className="mr-2">＋</div>
                <div className="mr-2">(F)</div>
                <div className="border border-gray-300 px-2 py-1 w-32">{calculateF().toLocaleString()}</div>
                <div className="ml-2">円</div>
              </div>
              <div className="flex items-center justify-end">
                <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateAdjustmentTotal().toLocaleString()}</div>
                <div className="ml-2">円</div>
              </div>
            </div>
          </div>
        )}
        
        {/* 在宅就業障害者特例調整金申請額の算出 */}
        <div className="border border-gray-800 mb-6">
          <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">在宅就業障害者特例調整金申請額の算出</div>
          <div className="p-2 border-b border-gray-800">
            <div className="flex flex-wrap items-center mb-2">
              <div className="mr-2">(I)年間の在宅就業障害者への支払い総額</div>
              <div className="border border-gray-300 px-2 py-1 w-32">{formData.homeWorkingPaymentTotal.toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
            <div className="flex flex-wrap items-center">
              <div className="mr-2">÷</div>
              <div className="border border-gray-300 px-2 py-1 w-24">{formData.homeWorkingDivisor.toLocaleString()}</div>
              <div className="ml-2">円</div>
              <div className="mx-2">=</div>
              <div className="border border-gray-300 px-2 py-1 w-16">{Math.floor(formData.homeWorkingPaymentTotal / formData.homeWorkingDivisor)}</div>
              <div className="mx-2">×</div>
              <div className="mr-2">21,000円</div>
              <div className="mx-2">=</div>
              <div className="border border-gray-300 px-2 py-1 w-32">{calculateB().toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
          </div>
        </div>
        
        {/* 特例給付金の申請額 */}
        <div className="border border-gray-800 mb-6">
          <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">特例給付金の申請額</div>
          <div className="p-2">
            <div className="flex flex-wrap items-center">
              <div className="border border-gray-300 px-2 py-1 w-16">{calculateTotal('shortTimeDisabledEmployees')}</div>
              <div className="mx-2">人又は</div>
              <div className="border border-gray-300 px-2 py-1 w-16">{getTotalDisabledEmployees()}</div>
              <div className="mx-2">人のいずれか小さい数</div>
              <div className="mx-2">×</div>
              <div className="mr-2">7,000円</div>
              <div className="mx-2">=</div>
              <div className="border border-gray-300 px-2 py-1 w-32 font-bold">{calculateSpecialPayment().toLocaleString()}</div>
              <div className="ml-2">円</div>
            </div>
          </div>
        </div>
        
        {/* 支給先情報 */}
        <div className="border border-gray-800 mb-6">
          <div className="bg-gray-200 p-2 font-bold border-b border-gray-800">障害者雇用調整金、在宅就業障害者特例調整金及び特例給付金の支給先</div>
          <div className="p-2">
            <div className="grid grid-cols-4 gap-4">
              <div className="flex items-center">
                <div className="mr-2">金融機関及び支店名</div>
              </div>
              <div className="col-span-3">
                <div className="flex items-center">
                  <div className="border border-gray-300 px-2 py-1 w-32">{formData.bankName}</div>
                  <div className="ml-2 border border-gray-300 px-2 py-1 w-16">{formData.branchName}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-2">
              <div className="flex items-center">
                <div className="mr-2">金融機関コード－支店コード</div>
              </div>
              <div className="col-span-3">
                <div className="flex items-center">
                  <div className="border border-gray-300 px-2 py-1 w-16">{formData.bankCode}</div>
                  <div className="mx-2">−</div>
                  <div className="border border-gray-300 px-2 py-1 w-16">{formData.branchCode}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-2">
              <div className="flex items-center">
                <div className="mr-2">預金種目</div>
              </div>
              <div className="col-span-3">
                <div className="flex items-center">
                  <div className="border border-gray-300 px-2 py-1 w-16">{formData.accountType}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-2">
              <div className="flex items-center">
                <div className="mr-2">口座番号</div>
              </div>
              <div className="col-span-3">
                <div className="flex items-center">
                  <div className="border border-gray-300 px-2 py-1 w-32">{formData.accountNumber}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-2">
              <div className="flex items-center">
                <div className="mr-2">口座名義人</div>
              </div>
              <div className="col-span-3">
                <div className="flex items-center">
                  <div className="border border-gray-300 px-2 py-1 w-64">{formData.accountHolder}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 操作ボタン類 */}
        <div className="flex justify-end gap-4 mt-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">保存する</button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">PDFで出力</button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">申告する</button>
        </div>
        
        <div className="text-center text-sm mt-6">
          <p>※「記入上の注意」をよく読んで記入してください。</p>
        </div>
      </div>
    </div>
  );
};

export default DisabilityEmploymentApp;