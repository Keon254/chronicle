CREATE TABLE IF NOT EXISTS "analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"article_id" uuid,
	"event" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_tags" (
	"article_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "article_tags_pkey" PRIMARY KEY("article_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"excerpt" text DEFAULT '' NOT NULL,
	"content" text NOT NULL,
	"cover_image" text NOT NULL,
	"cover_alt" text NOT NULL,
	"cover_caption" text DEFAULT '' NOT NULL,
	"category_id" uuid,
	"author_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL CHECK ("status" IN ('draft','published','scheduled','archived','trash')),
	"featured" boolean DEFAULT false NOT NULL,
	"breaking" boolean DEFAULT false NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"reading_minutes" integer DEFAULT 4 NOT NULL CHECK ("reading_minutes" > 0),
	"views" integer DEFAULT 0 NOT NULL CHECK ("views" >= 0),
	"published_at" timestamp,
	"scheduled_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"meta_title" text DEFAULT '' NOT NULL,
	"meta_description" text DEFAULT '' NOT NULL,
	"og_image" text DEFAULT '' NOT NULL,
	"canonical_url" text DEFAULT '' NOT NULL,
	"galleries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"embeds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"versions" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"role" text DEFAULT 'Staff Writer' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"email" text NOT NULL UNIQUE,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE,
	"slug" text NOT NULL UNIQUE,
	"description" text DEFAULT '' NOT NULL,
	"color" text DEFAULT '#b8860b' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"type" text DEFAULT 'image' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL UNIQUE,
	"source" text DEFAULT 'site' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"key" text PRIMARY KEY,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE,
	"slug" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_article_event_idx" ON "analytics" ("article_id","event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_status_idx" ON "articles" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_category_idx" ON "articles" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_published_idx" ON "articles" ("published_at");--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_article_id_articles_id_fkey') THEN
		ALTER TABLE "analytics" ADD CONSTRAINT "analytics_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE;
	END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'article_tags_article_id_articles_id_fkey') THEN
		ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE;
	END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'article_tags_tag_id_tags_id_fkey') THEN
		ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_tags_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE;
	END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articles_category_id_categories_id_fkey') THEN
		ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL;
	END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articles_author_id_authors_id_fkey') THEN
		ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_authors_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE SET NULL;
	END IF;
END $$;
