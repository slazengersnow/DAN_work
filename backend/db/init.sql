-- 社員基本情報テーブル
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_kana VARCHAR(100) NOT NULL,
  gender CHAR(1) NOT NULL, -- '1'=男性, '2'=女性
  birth_date DATE NOT NULL,
  hire_date DATE NOT NULL,
  previous_hire_date DATE,
  previous_resignation_date DATE,
  resignation_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT '在籍中', -- '在籍中', '退職'
  count DECIMAL(3,1) NOT NULL DEFAULT 1.0, -- 雇用カウント (0.5, 1.0, 2.0)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 障害情報テーブル
CREATE TABLE IF NOT EXISTS disabilities (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  disability_type VARCHAR(20) NOT NULL, -- '身体障害', '知的障害', '精神障害'
  certificate_number VARCHAR(50),
  expiry_date DATE,
  physical_verified BOOLEAN DEFAULT FALSE,
  physical_verification CHAR(1),
  physical_degree_current VARCHAR(10),
  physical_degree_previous VARCHAR(10),
  intellectual_verified BOOLEAN DEFAULT FALSE,
  intellectual_verification CHAR(1),
  intellectual_degree_current VARCHAR(10),
  intellectual_degree_previous VARCHAR(10),
  mental_verified BOOLEAN DEFAULT FALSE,
  mental_verification CHAR(1),
  mental_degree_current VARCHAR(10),
  mental_degree_previous VARCHAR(10),
  disability_start_date DATE,
  degree_change_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
-- 転入転出情報テーブル
CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  transfer_in_date DATE,
  previous_office VARCHAR(100),
  transfer_out_date DATE,
  next_office VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
-- 月次労働時間テーブル
CREATE TABLE IF NOT EXISTS monthly_work_hours (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  scheduled_hours DECIMAL(6,2) NOT NULL DEFAULT 160.00,
  actual_hours DECIMAL(6,2) NOT NULL DEFAULT 160.00,
  exception_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE (employee_id, year, month)
);
-- 月次合計情報テーブル (会社全体の月次データ)
CREATE TABLE IF NOT EXISTS monthly_totals (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_employees INTEGER NOT NULL,
  full_time_employees INTEGER NOT NULL,
  part_time_employees INTEGER NOT NULL,
  disabled_employees DECIMAL(5,2) NOT NULL,
  actual_rate DECIMAL(4,2) NOT NULL,
  legal_rate DECIMAL(3,1) NOT NULL,
  legal_count DECIMAL(5,2) NOT NULL,
  shortage DECIMAL(5,2) NOT NULL,
  status VARCHAR(20) DEFAULT '未確定', -- '未確定', '確定済'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (year, month)
);
-- ユーザーテーブル (認証用)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin', 'user'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 会社設定テーブル
CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(100) NOT NULL,
  company_code VARCHAR(50) NOT NULL,
  company_address TEXT,
  legal_rate DECIMAL(3,1) NOT NULL DEFAULT 2.3,
  fiscal_year_start DATE NOT NULL,
  fiscal_year_end DATE NOT NULL,
  monthly_report_reminder BOOLEAN DEFAULT FALSE,
  legal_rate_alert BOOLEAN DEFAULT TRUE,
  employment_end_notice BOOLEAN DEFAULT FALSE,
  theme VARCHAR(20) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 初期ユーザーを追加
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2b$10$3NxM0N1CX5TJuXj3uqU9XOHZrjGeZsV2RCDGmz.KGBNl38oXYrUHK', 'admin') -- パスワード: admin123
ON CONFLICT (username) DO NOTHING;
