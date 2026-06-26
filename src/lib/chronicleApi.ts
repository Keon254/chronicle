import { seedArticles, categories, authors, type Article, type ArticleStatus } from "../data/chronicle";

const storageKey = "chronicle-admin-articles";
const recentSearchKey = "chronicle-recent-searches";

export type ArticleInput = Omit<Article, "id" | "author" | "category" | "publishedAt" | "updatedAt" | "views" | "versions"> & {
  id?: string;
  categorySlug: string;
  authorId: string;
  publishedAt?: string;
  scheduledAt?: string;
};

const readLocal = (): Article[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]") as Article[];
    return parsed.length ? parsed : seedArticles;
  } catch {
    return seedArticles;
  }
};

const writeLocal = (items: Article[]) => localStorage.setItem(storageKey, JSON.stringify(items));

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchArticles(): Promise<Article[]> {
  return (await request<Article[]>("/api/articles")) ?? readLocal();
}

export async function fetchArticle(slug: string): Promise<Article | undefined> {
  return (await request<Article>(`/api/articles/${slug}`)) ?? readLocal().find((article) => article.slug === slug || article.id === slug);
}

export async function saveArticle(input: ArticleInput): Promise<Article> {
  const fromApi = await request<Article>("/api/admin/articles", { method: input.id ? "PUT" : "POST", body: JSON.stringify(input) });
  if (fromApi) return fromApi;
  const now = new Date().toISOString();
  const list = readLocal();
  const category = categories.find((item) => item.slug === input.categorySlug) || categories[0];
  const author = authors.find((item) => item.id === input.authorId) || authors[0];
  const existing = list.find((item) => item.id === input.id);
  const article: Article = {
    ...input,
    id: input.id || crypto.randomUUID(),
    category,
    author,
    views: existing?.views || 0,
    publishedAt: input.publishedAt || (input.status === "published" ? now : ""),
    updatedAt: now,
    versions: existing ? [{ savedAt: now, title: existing.title, content: existing.content }, ...existing.versions].slice(0, 8) : [],
  };
  const next = existing ? list.map((item) => (item.id === article.id ? article : item)) : [article, ...list];
  writeLocal(next);
  return article;
}

export async function deleteArticle(id: string) {
  const ok = await request<{ ok: boolean }>("/api/admin/articles", { method: "DELETE", body: JSON.stringify({ id }) });
  if (ok) return;
  writeLocal(readLocal().map((article) => (article.id === id ? { ...article, status: "trash" as ArticleStatus } : article)));
}

export async function subscribeNewsletter(email: string) {
  const api = await request<{ ok: boolean }>("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) });
  return api ?? { ok: true };
}

export function trackRecentSearch(query: string) {
  const clean = query.trim();
  if (!clean) return;
  const current = getRecentSearches().filter((item) => item.toLowerCase() !== clean.toLowerCase());
  localStorage.setItem(recentSearchKey, JSON.stringify([clean, ...current].slice(0, 6)));
}

export function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(recentSearchKey) || "[]") as string[];
  } catch {
    return [];
  }
}

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const estimateReadingTime = (content: string) => Math.max(1, Math.ceil(content.replace(/[#`>*-]/g, "").split(/\s+/).length / 210));

export const stripMarkdown = (content: string) => content.replace(/[#>*`]/g, "").replace(/\n+/g, " ").trim();
