CREATE TABLE IF NOT EXISTS authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Staff Writer',
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  email text NOT NULL UNIQUE,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#b8860b',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL,
  cover_image text NOT NULL,
  cover_alt text NOT NULL,
  cover_caption text NOT NULL DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES authors(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','scheduled','archived','trash')),
  featured boolean NOT NULL DEFAULT false,
  breaking boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false,
  reading_minutes integer NOT NULL DEFAULT 4 CHECK (reading_minutes > 0),
  views integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  published_at timestamp,
  scheduled_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now(),
  meta_title text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  og_image text NOT NULL DEFAULT '',
  canonical_url text NOT NULL DEFAULT '',
  galleries jsonb NOT NULL DEFAULT '[]'::jsonb,
  embeds jsonb NOT NULL DEFAULT '[]'::jsonb,
  versions jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  alt text NOT NULL,
  caption text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'image',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'site',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  event text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles(slug);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles(status);
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category_id);
CREATE INDEX IF NOT EXISTS articles_published_idx ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS analytics_article_event_idx ON analytics(article_id, event);
