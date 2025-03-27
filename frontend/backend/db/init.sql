-- テーブル作成スクリプト
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_kana VARCHAR(100),
  gender VARCHAR(10),
  birth_date DATE,
  hire_date DATE NOT NULL,
  resignation_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT '在籍中',
  count NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
