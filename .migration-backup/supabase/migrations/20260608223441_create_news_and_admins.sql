-- News posts table
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  is_published BOOLEAN NOT NULL DEFAULT true,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admins table to mark which users are admins
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS for news: anyone can read published news, only admins can write
CREATE POLICY "read_published_news" ON news FOR SELECT
  USING (is_published = true);

CREATE POLICY "admin_insert_news" ON news FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "admin_update_news" ON news FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "admin_delete_news" ON news FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- RLS for admins: anyone can read (needed for client-side checks), only admins can insert
CREATE POLICY "read_admins" ON admins FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "admin_insert_admin" ON admins FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Also allow unauthenticated users to read published news (for public homepage)
-- We need a separate policy for anon access
CREATE POLICY "anon_read_published_news" ON news FOR SELECT
  TO anon USING (is_published = true);

-- Index for faster queries
CREATE INDEX idx_news_created_at ON news (created_at DESC);
CREATE INDEX idx_news_category ON news (category);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();