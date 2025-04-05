-- データベースの作成
CREATE DATABASE disability_employment;

-- データベースに接続
\c disability_employment;

-- 従業員テーブル
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,  -- 従業員番号
    name VARCHAR(100) NOT NULL,               -- 氏名
    gender VARCHAR(10),                       -- 性別
    birth_date DATE,                          -- 生年月日
    department VARCHAR(50),                   -- 所属部門
    position VARCHAR(50),                     -- 役職
    employment_status VARCHAR(30),            -- 雇用形態
    joining_date DATE,                        -- 入社日
    leaving_date DATE,                        -- 退職日
    notes TEXT,                               -- 備考
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 障害情報テーブル
CREATE TABLE disabilities (
    disability_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    disability_type VARCHAR(50),              -- 障害種別
    disability_grade VARCHAR(20),             -- 障害等級
    certificate_number VARCHAR(50),           -- 手帳番号
    certificate_date DATE,                    -- 交付日
    expiration_date DATE,                     -- 期限日
    notes TEXT,                               -- 備考
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 月次レポートテーブル
CREATE TABLE monthly_reports (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,                    -- 年
    month INTEGER NOT NULL,                   -- 月
    total_employees INTEGER,                  -- 全従業員数
    disabled_employees INTEGER,               -- 障害者数
    employment_rate DECIMAL(5,2),             -- 雇用率
    notes TEXT,                               -- 備考
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (year, month)
);

-- 納付金レポートテーブル
CREATE TABLE payment_reports (
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
CREATE TABLE payment_monthly_data (
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
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,         -- 部門名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 雇用形態マスターテーブル
CREATE TABLE employment_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL,         -- 雇用形態名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 障害種別マスターテーブル
CREATE TABLE disability_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,         -- 障害種別名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- システム設定テーブル
CREATE TABLE settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(100),                -- 会社名
    company_address TEXT,                     -- 会社住所
    representative_name VARCHAR(100),         -- 代表者名
    legal_employment_rate DECIMAL(3,1),       -- 法定雇用率
    fiscal_year_start_month INTEGER,          -- 会計年度開始月
    contact_person VARCHAR(100),              -- 担当者名
    phone_number VARCHAR(20),                 -- 電話番号
    email VARCHAR(100),                       -- メールアドレス
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

-- マスターデータの初期値設定
INSERT INTO departments (name) VALUES
('経営企画部'),
('総務部'),
('人事部'),
('経理部'),
('営業部'),
('マーケティング部'),
('開発部'),
('生産部'),
('品質管理部'),
('カスタマーサポート部');

INSERT INTO employment_statuses (name) VALUES
('正社員'),
('契約社員'),
('パートタイム'),
('アルバイト'),
('派遣社員'),
('嘱託社員');

INSERT INTO disability_types (name) VALUES
('身体障害'),
('知的障害'),
('精神障害'),
('発達障害'),
('難病');

-- 初期設定データ
INSERT INTO settings (
    company_name, company_address, representative_name,
    legal_employment_rate, fiscal_year_start_month,
    contact_person, phone_number, email
) VALUES (
    '株式会社サンプル',
    '東京都千代田区サンプル1-1-1',
    '代表 太郎',
    2.3,
    4,
    '担当 花子',
    '03-1234-5678',
    'contact@sample.co.jp'
);

-- インデックス作成
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_employment_status ON employees(employment_status);
CREATE INDEX idx_disabilities_employee_id ON disabilities(employee_id);
CREATE INDEX idx_disabilities_disability_type ON disabilities(disability_type);
CREATE INDEX idx_monthly_reports_year_month ON monthly_reports(year, month);
CREATE INDEX idx_payment_reports_fiscal_year ON payment_reports(fiscal_year);
CREATE INDEX idx_payment_monthly_data_report_id ON payment_monthly_data(payment_report_id);