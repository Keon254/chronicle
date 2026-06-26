import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const authors = pgTable("authors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Staff Writer"),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url"),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("#b8860b"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt").notNull().default(""),
    content: text("content").notNull(),
    coverImage: text("cover_image").notNull(),
    coverAlt: text("cover_alt").notNull(),
    coverCaption: text("cover_caption").notNull().default(""),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    authorId: uuid("author_id").references(() => authors.id, { onDelete: "set null" }),
    status: text("status", { enum: ["draft", "published", "scheduled", "archived", "trash"] }).notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    breaking: boolean("breaking").notNull().default(false),
    pinned: boolean("pinned").notNull().default(false),
    readingMinutes: integer("reading_minutes").notNull().default(4),
    views: integer("views").notNull().default(0),
    publishedAt: timestamp("published_at"),
    scheduledAt: timestamp("scheduled_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    metaTitle: text("meta_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),
    ogImage: text("og_image").notNull().default(""),
    canonicalUrl: text("canonical_url").notNull().default(""),
    galleries: jsonb("galleries").$type<Array<{ url: string; alt: string; caption: string }>>().notNull().default([]),
    embeds: jsonb("embeds").$type<Array<{ type: "youtube" | "tweet"; url: string; title: string }>>().notNull().default([]),
    versions: jsonb("versions").$type<Array<{ savedAt: string; title: string; content: string }>>().notNull().default([]),
  },
  (table) => ({
    slugIdx: index("articles_slug_idx").on(table.slug),
    statusIdx: index("articles_status_idx").on(table.status),
    categoryIdx: index("articles_category_idx").on(table.categoryId),
    publishedIdx: index("articles_published_idx").on(table.publishedAt),
  }),
);

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const articleTags = pgTable(
  "article_tags",
  {
    articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({ pk: primaryKey({ columns: [table.articleId, table.tagId] }) }),
);

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  alt: text("alt").notNull(),
  caption: text("caption").notNull().default(""),
  type: text("type").notNull().default("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("site"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const analytics = pgTable(
  "analytics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id").references(() => articles.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    articleEventIdx: index("analytics_article_event_idx").on(table.articleId, table.event),
  }),
);
