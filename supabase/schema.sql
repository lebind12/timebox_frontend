-- Timebox Scheduling Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeboxes table
CREATE TABLE IF NOT EXISTS timeboxes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    todo_id UUID REFERENCES todos(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_timeboxes_user_date ON timeboxes(user_id, date);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeboxes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for todos
CREATE POLICY "Users can view own todos"
ON todos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todos"
ON todos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos"
ON todos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos"
ON todos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for timeboxes
CREATE POLICY "Users can view own timeboxes"
ON timeboxes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timeboxes"
ON timeboxes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timeboxes"
ON timeboxes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own timeboxes"
ON timeboxes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timeboxes_updated_at ON timeboxes;
CREATE TRIGGER update_timeboxes_updated_at
    BEFORE UPDATE ON timeboxes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Daily Tasks table (매일 할 일)
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    default_start_time TIME,
    default_duration_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for daily_tasks
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON daily_tasks(user_id);

-- Enable RLS for daily_tasks
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_tasks
CREATE POLICY "Users can view own daily tasks"
ON daily_tasks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily tasks"
ON daily_tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily tasks"
ON daily_tasks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily tasks"
ON daily_tasks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for daily_tasks updated_at
DROP TRIGGER IF EXISTS update_daily_tasks_updated_at ON daily_tasks;
CREATE TRIGGER update_daily_tasks_updated_at
    BEFORE UPDATE ON daily_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime (run in Supabase Dashboard > Database > Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE todos;
-- ALTER PUBLICATION supabase_realtime ADD TABLE timeboxes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE daily_tasks;
