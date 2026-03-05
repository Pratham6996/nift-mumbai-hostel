-- Drop Expenses Feature
-- Run this in Supabase Dashboard → SQL Editor

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can read own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
DROP POLICY IF EXISTS "Service role full access to expenses" ON expenses;

-- Drop indexes
DROP INDEX IF EXISTS idx_expenses_user_id;
DROP INDEX IF EXISTS idx_expenses_date;

-- Drop the table
DROP TABLE IF EXISTS expenses;
