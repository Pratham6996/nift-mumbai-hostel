-- NIFT Mumbai Hostel Platform — Database Migration
-- Run this in Supabase Dashboard → SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly Menus table
CREATE TABLE IF NOT EXISTS weekly_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_start_date DATE NOT NULL UNIQUE,
    monday JSONB NOT NULL DEFAULT '{}',
    tuesday JSONB NOT NULL DEFAULT '{}',
    wednesday JSONB NOT NULL DEFAULT '{}',
    thursday JSONB NOT NULL DEFAULT '{}',
    friday JSONB NOT NULL DEFAULT '{}',
    saturday JSONB NOT NULL DEFAULT '{}',
    sunday JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('quality', 'quantity', 'hygiene', 'suggestion')),
    content TEXT NOT NULL,
    image_url TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('food', 'drink', 'snacks')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_weekly_menus_week_start ON weekly_menus(week_start_date);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Service role full access to users" ON users FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies: Weekly Menus (public read)
CREATE POLICY "Anyone can read menus" ON weekly_menus FOR SELECT USING (true);
CREATE POLICY "Service role full access to menus" ON weekly_menus FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies: Feedback (public read, auth write own)
CREATE POLICY "Anyone can read feedback" ON feedback FOR SELECT USING (true);
CREATE POLICY "Users can insert own feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to feedback" ON feedback FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies: Expenses (private, own data only)
CREATE POLICY "Users can read own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to expenses" ON expenses FOR ALL USING (auth.role() = 'service_role');
