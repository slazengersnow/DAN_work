-- backend/db/init.sql

-- データベースの作成 (既に存在する場合はこのコマンドをスキップします)
-- CREATE DATABASE disability_employment;

-- データベースに接続
-- \c disability_employment;

-- 従業員テーブル
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,  -- 従業員番号
    name VARCHAR(100) NOT NULL,               -- 氏名
    name_kana VARCHAR(100),                   -- 氏名（カナ）
    gender VARCHAR(10),                       -- 性別
    birth_date DATE,                          -- 生年月日
    department VARCHAR(50),                   -- 所属部門
    position VARCHAR(50),                     -- 役職
    employment_type VARCHAR(30),              -- 雇用形態
    hire_date DATE,                           -- 入社日
    resignation_date DATE,                    -- 退職日
    status VARCHAR(20) DEFAULT '在籍中',      -- 在籍状況
    count DECIMAL(3, 1) DEFAULT 1,            -- カウント数
    notes TEXT,                               -- 備考
    fiscal_year INTEGER,                      -- 年度
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 障害情報テーブル
CREATE TABLE IF NOT EXISTS disabilities (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    disability_type VARCHAR(50),              -- 障害種別
    physical_verified BOOLEAN DEFAULT FALSE,   -- 身体障害確認済み
    physical_degree_current VARCHAR(20),       -- 身体障害等級（現在）
    physical_degree_original VARCHAR(20),      -- 身体障害等級（原級）
    physical_certificate_number VARCHAR(50),   -- 身体障害者手帳番号
    physical_certificate_date DATE,            -- 身体障害者手帳交付日
    intellectual_verified BOOLEAN DEFAULT FALSE, -- 知的障害確認済み
    intellectual_degree_current VARCHAR(20),    -- 知的障害等級（現在）
    intellectual_certificate_number VARCHAR(50), -- 療育手帳番号
    intellectual_certificate_date DATE,         -- 療育手帳交付日
    mental_verified BOOLEAN DEFAULT FALSE,      -- 精神障害確認済み
    mental_degree_current VARCHAR(20),          -- 精神障害等級（現在）
    mental_certificate_number VARCHAR(50),      -- 精神障害者保健福祉手帳番号
    mental_certificate_date DATE,               -- 精神障害者保健福祉手帳交付日
    mental_certificate_expiration DATE,         -- 精神障害者保健福祉手帳有効期限
    notes TEXT,                               -- 備考
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 月次レポートテーブル
CREATE TABLE IF NOT EXISTS monthly_reports (
    id SERIAL PRIMARY KEY,
    fiscal_year INTEGER NOT NULL,             -- 年度
    month INTEGER NOT NULL,                   -- 月
    employees_count INTEGER DEFAULT 0,        -- 全従業員数
    fulltime_count INTEGER DEFAULT 0,         -- 正社員数
    parttime_count INTEGER DEFAULT 0,         -- パートタイム従業員数
    level1_2_count INTEGER DEFAULT 0,         -- 重度障害者数（正社員）
    other_disability_count INTEGER DEFAULT 0, -- その他障害者数（正社員）
    level1_2_parttime_count INTEGER DEFAULT 0, -- 重度障害者数（パートタイム）
    other_parttime_count INTEGER DEFAULT 0,   -- その他障害者数（パートタイム）
    total_disability_count DECIMAL(10, 1) DEFAULT 0, -- 障害者数合計（カウント後）
    employment_rate DECIMAL(10, 2) DEFAULT 0, -- 実雇用率
    legal_employment_rate DECIMAL(10, 2) DEFAULT 2.3, -- 法定雇用率
    required_count INTEGER DEFAULT 0,         -- 法定雇用数
    over_under_count DECIMAL(10, 1) DEFAULT 0, -- 過不足数
    status VARCHAR(10) DEFAULT '未確定',      -- 状態
    notes TEXT,                               -- 備考
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fiscal_year, month)
);

-- 従業員月次状態テーブル
CREATE TABLE IF NOT EXISTS employee_monthly_status (
    id SERIAL PRIMARY KEY,
    fiscal_year INTEGER NOT NULL,             -- 年度
    month INTEGER NOT NULL,                   -- 月
    employee_id VARCHAR(50) NOT NULL,         -- 従業員ID
    no INTEGER,                               -- 表示順序番号
    name VARCHAR(100),                        -- 氏名
    disability_type VARCHAR(50),              -- 障害種別
    disability VARCHAR(100),                  -- 障害詳細
    grade VARCHAR(50),                        -- 等級
    hire_date VARCHAR(20),                    -- 入社日
    status VARCHAR(20) DEFAULT '在籍',        -- 在籍状況
    monthly_status JSON DEFAULT '{"status":[1,1,1,1,1,1,1,1,1,1,1,1]}', -- 月次状態
    memo TEXT,                                -- 備考
    count DECIMAL(3, 1) DEFAULT 0,            -- カウント数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fiscal_year, month) REFERENCES monthly_reports(fiscal_year, month) ON DELETE CASCADE
);

-- 月次勤務時間テーブル
CREATE TABLE IF NOT EXISTS monthly_work_hours (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    scheduled_hours INTEGER DEFAULT 0,        -- 所定労働時間
    actual_hours INTEGER DEFAULT 0,           -- 実労働時間
    exception_reason TEXT,                    -- 特記事項
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, year, month)
);

-- 納付金レポートテーブル
CREATE TABLE IF NOT EXISTS payment_reports (
    id SERIAL PRIMARY KEY,
    fiscal_year INTEGER NOT NULL UNIQUE,      -- 会計年度
    company_name VARCHAR(100),                -- 会社名
    company_address TEXT,                     -- 会社住所
    representative_name VARCHAR(100),         -- 代表者名
    contact_person VARCHAR(100),              -- 担当者名
    phone_number VARCHAR(20),                 -- 電話番号
    email VARCHAR(100),                       -- メールアドレス
    adjustment_amount INTEGER,                -- 調整金額
    average_employee_count INTEGER,           -- 平均従業員数
    legal_employment_count INTEGER,           -- 法定雇用障害者数
    actual_employment_count INTEGER,          -- 実雇用障害者数
    shortage_count INTEGER,                   -- 不足数
    payment_amount INTEGER,                   -- 納付金額
    status VARCHAR(20),                       -- 状態（下書き/提出済み）
    submitted_date TIMESTAMP,                 -- 提出日
    notes TEXT,                               -- 備考
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 納付金月別データテーブル
CREATE TABLE IF NOT EXISTS payment_monthly_data (
    id SERIAL PRIMARY KEY,
    payment_report_id INTEGER REFERENCES payment_reports(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,                   -- 月
    total_employees INTEGER,                  -- 全従業員数
    disabled_employees INTEGER,               -- 障害者数
    employment_rate DECIMAL(5,2),             -- 雇用率
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (payment_report_id, month)
);

-- 部門マスターテーブル
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,         -- 部門名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 雇用形態マスターテーブル
CREATE TABLE IF NOT EXISTS employment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL,         -- 雇用形態名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 障害種別マスターテーブル
CREATE TABLE IF NOT EXISTS disability_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,         -- 障害種別名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会社設定テーブル
CREATE TABLE IF NOT EXISTS company_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(100),                -- 会社名
    company_address TEXT,                     -- 会社住所
    representative_name VARCHAR(100),         -- 代表者名
    legal_rate DECIMAL(3,1) DEFAULT 2.3,      -- 法定雇用率
    fiscal_start_month INTEGER DEFAULT 4,     -- 会計年度開始月
    contact_person VARCHAR(100),              -- 担当者名
    phone_number VARCHAR(20),                 -- 電話番号
    email VARCHAR(100),                       -- メールアドレス
    logo_path VARCHAR(200),                   -- ロゴパス
    business_goals TEXT,                      -- 事業目標
    disability_goals TEXT,                    -- 障害者雇用目標
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- マスターデータの初期値設定
INSERT INTO departments (name)
SELECT d FROM (VALUES ('経営企画部'), ('総務部'), ('人事部'), ('経理部'), ('営業部'), 
                      ('マーケティング部'), ('開発部'), ('生産部'), ('品質管理部'), ('カスタマーサポート部')) AS t(d)
WHERE NOT EXISTS (SELECT 1 FROM departments LIMIT 1);

INSERT INTO employment_types (name)
SELECT e FROM (VALUES ('正社員'), ('契約社員'), ('パートタイム'), ('アルバイト'), 
                      ('派遣社員'), ('嘱託社員')) AS t(e)
WHERE NOT EXISTS (SELECT 1 FROM employment_types LIMIT 1);

INSERT INTO disability_types (name)
SELECT d FROM (VALUES ('身体障害'), ('知的障害'), ('精神障害'), ('発達障害'), ('難病')) AS t(d)
WHERE NOT EXISTS (SELECT 1 FROM disability_types LIMIT 1);

-- 初期設定データ
INSERT INTO company_settings (
    company_name, company_address, representative_name,
    legal_rate, fiscal_start_month,
    contact_person, phone_number, email
)
SELECT 
    '株式会社サンプル', 
    '東京都千代田区サンプル1-1-1', 
    '代表 太郎', 
    2.3, 
    4, 
    '担当 花子', 
    '03-1234-5678', 
    'contact@sample.co.jp'
WHERE NOT EXISTS (SELECT 1 FROM company_settings LIMIT 1);

-- fiscal_yearカラムの確認と追加
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employees' AND column_name = 'fiscal_year') THEN
        ALTER TABLE employees ADD COLUMN fiscal_year INTEGER;
        UPDATE employees SET fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    END IF;
END $$;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employment_type);
CREATE INDEX IF NOT EXISTS idx_disabilities_employee_id ON disabilities(employee_id);
CREATE INDEX IF NOT EXISTS idx_disabilities_disability_type ON disabilities(disability_type);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_fiscal_year_month ON monthly_reports(fiscal_year, month);
CREATE INDEX IF NOT EXISTS idx_payment_reports_fiscal_year ON payment_reports(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_payment_monthly_data_report_id ON payment_monthly_data(payment_report_id);
CREATE INDEX IF NOT EXISTS idx_employee_monthly_status_fiscal_year_month ON employee_monthly_status(fiscal_year, month);
CREATE INDEX IF NOT EXISTS idx_employees_fiscal_year ON employees(fiscal_year);