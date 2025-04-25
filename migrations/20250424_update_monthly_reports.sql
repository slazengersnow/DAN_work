-- migrations/20250424_update_monthly_reports.sql

-- 1. 一時テーブルに既存データをコピー
CREATE TEMPORARY TABLE tmp_monthly_reports AS SELECT * FROM monthly_reports;

-- 2. 既存テーブルを削除
DROP TABLE monthly_reports;

-- 3. 新しいスキーマでテーブルを再作成
CREATE TABLE monthly_reports (
    id SERIAL PRIMARY KEY,
    fiscal_year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    employees_count INTEGER DEFAULT 0,
    fulltime_count INTEGER DEFAULT 0,
    parttime_count INTEGER DEFAULT 0,
    level1_2_count INTEGER DEFAULT 0,
    other_disability_count INTEGER DEFAULT 0,
    level1_2_parttime_count INTEGER DEFAULT 0,
    other_parttime_count INTEGER DEFAULT 0,
    total_disability_count NUMERIC(10, 1) DEFAULT 0,
    employment_rate NUMERIC(10, 2) DEFAULT 0,
    legal_employment_rate NUMERIC(10, 2) DEFAULT 2.5,
    required_count INTEGER DEFAULT 0,
    over_under_count NUMERIC(10, 1) DEFAULT 0,
    status VARCHAR(50) DEFAULT '未確定',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_fiscal_year_month UNIQUE(fiscal_year, month)
);

-- 4. 元のデータを復元（notesフィールドを除外）
INSERT INTO monthly_reports (
    id, fiscal_year, month, employees_count, fulltime_count, parttime_count, 
    level1_2_count, other_disability_count, level1_2_parttime_count, 
    other_parttime_count, total_disability_count, employment_rate, 
    legal_employment_rate, required_count, over_under_count, status, 
    created_at, updated_at
)
SELECT 
    id, fiscal_year, month, employees_count, fulltime_count, parttime_count, 
    level1_2_count, other_disability_count, level1_2_parttime_count, 
    other_parttime_count, total_disability_count, employment_rate, 
    legal_employment_rate, required_count, over_under_count, status, 
    created_at, updated_at
FROM tmp_monthly_reports;

-- 5. シーケンスを更新
SELECT setval('monthly_reports_id_seq', (SELECT MAX(id) FROM monthly_reports));

-- 6. インデックスを作成
CREATE INDEX idx_monthly_reports_fiscal_year ON monthly_reports(fiscal_year);
CREATE INDEX idx_monthly_reports_month ON monthly_reports(month);
