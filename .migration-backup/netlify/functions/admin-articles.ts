import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { articleTags, articles, authors, categories, tags } from "../../db/schema.js";

const json = (body: unknown, status = 200) => Response.json(body, { status });
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function ensureTag(name: string) {
  const slug = slugify(name);
  const [existing] = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(tags).values({ name, slug }).returning();
  return created;
}

export default async (request: Request) => {
  try {
    const body = await request.json().catch(() => ({}));
    if (request.method === "DELETE") {
      await db.update(articles).set({ status: "trash", updatedAt: new Date() }).where(eq(articles.id, body.id));
      return json({ ok: true });
    }

    if (request.method !== "POST" && request.method !== "PUT") return new Response("Method not allowed", { status: 405 });

    const [category] = await db.select().from(categories).where(eq(categories.slug, body.categorySlug)).limit(1);
    const [author] = await db.select().from(authors).where(eq(authors.id, body.authorId)).limit(1);
    if (!category || !author) return json({ error: "Invalid category or author" }, 400);

    const values = {
      title: body.title,
      subtitle: body.subtitle,
      slug: body.slug || slugify(body.title),
      excerpt: body.excerpt,
      content: body.content,
      coverImage: body.coverImage,
      coverAlt: body.coverAlt,
      coverCaption: body.coverCaption,
      categoryId: category.id,
      authorId: author.id,
      status: body.status,
      featured: Boolean(body.featured),
      breaking: Boolean(body.breaking),
      pinned: Boolean(body.pinned),
      readingMinutes: Number(body.readingMinutes || 4),
      publishedAt: body.status === "published" ? new Date() : null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      updatedAt: new Date(),
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      ogImage: body.ogImage,
      canonicalUrl: body.canonicalUrl,
      galleries: body.galleries || [],
      embeds: body.embeds || [],
    };

    const [article] = body.id && body.id !== "new"
      ? await db.update(articles).set(values).where(eq(articles.id, body.id)).returning()
      : await db.insert(articles).values({ ...values, createdAt: new Date() }).returning();

    await db.delete(articleTags).where(eq(articleTags.articleId, article.id));
    for (const tagName of body.tags || []) {
      const tag = await ensureTag(tagName);
      await db.insert(articleTags).values({ articleId: article.id, tagId: tag.id });
    }

    return json({ ...body, id: article.id, category, author, views: article.views, publishedAt: article.publishedAt?.toISOString() || "", updatedAt: article.updatedAt.toISOString(), versions: article.versions || [] });
  } catch {
    return json({ error: "Unable to save article" }, 500);
  }
};

export const config: Config = {
  path: "/api/admin/articles",
};
