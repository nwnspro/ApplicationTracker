-- Job Applications Table
-- Run this SQL in your Supabase SQL Editor to create the required table

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED')),
  notes TEXT,
  url TEXT,
  applied_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  table_name VARCHAR(100) DEFAULT 'Table 1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Create index on applied_date for sorting
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_date ON job_applications(applied_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own job applications
CREATE POLICY "Users can view their own job applications"
  ON job_applications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own job applications
CREATE POLICY "Users can insert their own job applications"
  ON job_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own job applications
CREATE POLICY "Users can update their own job applications"
  ON job_applications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own job applications
CREATE POLICY "Users can delete their own job applications"
  ON job_applications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Todo Jobs Table (for the URL todo list feature)
CREATE TABLE IF NOT EXISTS todo_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  company_name VARCHAR(255),
  position VARCHAR(255),
  metadata JSONB,
  completed BOOLEAN DEFAULT FALSE,
  table_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_todo_jobs_user_id ON todo_jobs(user_id);

-- Enable Row Level Security (RLS) for todo_jobs
ALTER TABLE todo_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for todo_jobs
CREATE POLICY "Users can view their own todo jobs"
  ON todo_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todo jobs"
  ON todo_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todo jobs"
  ON todo_jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todo jobs"
  ON todo_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to auto-update updated_at for todo_jobs
CREATE TRIGGER update_todo_jobs_updated_at
  BEFORE UPDATE ON todo_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
