-- 月次詳細データベース修正スクリプト
-- 作成日: 2025-05-07
-- 目的: 従業員テーブルに不足している notes カラムを追加

-- トランザクション開始
BEGIN;

-- ===========================================
-- 従業員テーブルのカラム存在チェック
-- ===========================================
DO $$
BEGIN
    -- notes カラムが存在するかチェック
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'notes'
    ) THEN
        -- カラムが存在しない場合、追加
        ALTER TABLE employees ADD COLUMN notes TEXT DEFAULT NULL;
        RAISE NOTICE 'employees テーブルに notes カラムを追加しました';
    ELSE
        RAISE NOTICE 'employees テーブルには既に notes カラムが存在します';
    END IF;
END $$;

-- ===========================================
-- 月次レポートテーブルのカラム存在チェック
-- ===========================================
DO $$
BEGIN
    -- notes カラムが存在するかチェック
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'monthly_reports' AND column_name = 'notes'
    ) THEN
        -- カラムが存在しない場合、追加
        ALTER TABLE monthly_reports ADD COLUMN notes TEXT DEFAULT NULL;
        RAISE NOTICE 'monthly_reports テーブルに notes カラムを追加しました';
    ELSE
        RAISE NOTICE 'monthly_reports テーブルには既に notes カラムが存在します';
    END IF;
END $$;

-- ===========================================
-- 既存データのチェックと安全確保
-- ===========================================
DO $$
BEGIN
    -- テーブルが存在するか確認
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'employees'
    ) THEN
        -- 従業員データが存在するか確認
        IF EXISTS (SELECT 1 FROM employees LIMIT 1) THEN
            RAISE NOTICE '従業員データは保持されています。既存データに影響はありません。';
        ELSE
            RAISE NOTICE '従業員テーブルにデータがありません。';
        END IF;
    ELSE
        RAISE NOTICE '従業員テーブルが存在しません。';
    END IF;
    
    -- 月次レポートテーブルのチェック
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'monthly_reports'
    ) THEN
        -- 月次レポートデータが存在するか確認
        IF EXISTS (SELECT 1 FROM monthly_reports LIMIT 1) THEN
            RAISE NOTICE '月次レポートデータは保持されています。既存データに影響はありません。';
        ELSE
            RAISE NOTICE '月次レポートテーブルにデータがありません。';
        END IF;
    ELSE
        RAISE NOTICE '月次レポートテーブルが存在しません。';
    END IF;
END $$;

-- コミット
COMMIT;

-- ===========================================
-- 変更の確認
-- ===========================================
-- このセクションはトランザクション外で実行
-- 従業員テーブルのカラム情報を表示
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'employees' AND column_name = 'notes';

-- 月次レポートテーブルのカラム情報を表示
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'monthly_reports' AND column_name = 'notes';