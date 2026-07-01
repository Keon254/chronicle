import type { Config } from "@netlify/functions";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { articleTags, articles, authors, categories, tags } from "../../db/schema.js";

const fallback = () => new Response(null, { status: 204 });

export default async (request: Request) => {
  try {
    const url = new URL(request.url);
    const slug = url.pathname.split("/").pop();
    const rows = await db
      .select()
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(authors, eq(articles.authorId, authors.id))
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt));

    const tagRows = await db.select().from(articleTags).leftJoin(tags, eq(articleTags.tagId, tags.id));
    const payload = rows.map((row) => ({
      id: row.articles.id,
      title: row.articles.title,
      subtitle: row.articles.subtitle,
      slug: row.articles.slug,
      excerpt: row.articles.excerpt,
      content: row.articles.content,
      coverImage: row.articles.coverImage,
      coverAlt: row.articles.coverAlt,
      coverCaption: row.articles.coverCaption,
      category: row.categories,
      author: row.authors,
      status: row.articles.status,
      featured: row.articles.featured,
      breaking: row.articles.breaking,
      pinned: row.articles.pinned,
      tags: tagRows.filter((tag) => tag.article_tags.articleId === row.articles.id).map((tag) => tag.tags?.name).filter(Boolean),
      readingMinutes: row.articles.readingMinutes,
      views: row.articles.views,
      publishedAt: row.articles.publishedAt?.toISOString() || "",
      updatedAt: row.articles.updatedAt.toISOString(),
      metaTitle: row.articles.metaTitle,
      metaDescription: row.articles.metaDescription,
      ogImage: row.articles.ogImage,
      canonicalUrl: row.articles.canonicalUrl,
      galleries: row.articles.galleries,
      embeds: row.articles.embeds,
      versions: row.articles.versions,
    }));

    if (url.pathname.startsWith("/api/articles/") && slug) {
      const article = payload.find((item) => item.slug === slug || item.id === slug);
      return article ? Response.json(article) : new Response("Not found", { status: 404 });
    }

    return Response.json(payload);
  } catch {
    return fallback();
  }
};

export const config: Config = {
  path: ["/api/articles", "/api/articles/:slug"],
};
