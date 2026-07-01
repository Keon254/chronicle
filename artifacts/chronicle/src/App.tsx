import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, type UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Check,
  Clipboard,
  Copy,
  Edit3,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  LayoutDashboard,
  Link as LinkIcon,
  Mail,
  Menu,
  Moon,
  Newspaper,
  Plus,
  Rss,
  Search,
  Share2,
  Shield,
  Sparkles,
  Sun,
  Tags,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { authors, categories, popularSearches, type Article } from "./data/chronicle";
import {
  deleteArticle,
  estimateReadingTime,
  fetchArticle,
  fetchArticles,
  getBookmarks,
  getRecentSearches,
  saveArticle,
  slugify,
  stripMarkdown,
  subscribeNewsletter,
  toggleBookmark,
  trackRecentSearch,
  type ArticleInput,
} from "./lib/chronicleApi";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@chronicle.news";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "chronicle-admin";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(8, "Headline must be at least 8 characters"),
  subtitle: z.string().min(12, "Subtitle must be at least 12 characters"),
  slug: z.string().min(4, "Slug too short"),
  excerpt: z.string().min(20, "Excerpt must be at least 20 characters"),
  content: z.string().min(80, "Content too short"),
  coverImage: z.string().url("Must be a valid URL"),
  coverAlt: z.string().min(8),
  coverCaption: z.string().min(8),
  categorySlug: z.string(),
  authorId: z.string(),
  status: z.enum(["draft", "published", "scheduled", "trash"]),
  featured: z.boolean(),
  breaking: z.boolean(),
  pinned: z.boolean(),
  tags: z.string(),
  metaTitle: z.string().min(8),
  metaDescription: z.string().min(20),
  ogImage: z.string().url("Must be a valid URL"),
  canonicalUrl: z.string(),
  scheduledAt: z.string().optional(),
});

type ArticleForm = z.infer<typeof articleSchema>;

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </HelmetProvider>
  );
}

function AppInner() {
  const [theme, setTheme] = useState(() => localStorage.getItem("chronicle-theme") || "auto");
  useEffect(() => {
    const dark = theme === "dark" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("chronicle-theme", theme);
  }, [theme]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Shell theme={theme} setTheme={setTheme} />
    </BrowserRouter>
  );
}

function Shell({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  const location = useLocation();
  const isAdmin = localStorage.getItem("chronicle-admin") === "true";
  return (
    <div className="min-h-screen transition-colors" style={{ background: theme === "dark" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "#11100e" : "#f7f4ee" }}>
      <Header theme={theme} setTheme={setTheme} isAdmin={isAdmin} />
      <AnimatePresence mode="wait">
        <motion.main key={location.pathname + location.search} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<ErrorPage code="404" />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <Link
        to="/search"
        className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full shadow-2xl transition hover:-translate-y-1"
        style={{ background: "#b68d40", color: "#0e0c09" }}
        aria-label="Open search"
      >
        <Search className="h-5 w-5" />
      </Link>
    </div>
  );
}

function Header({ theme, setTheme, isAdmin }: { theme: string; setTheme: (t: string) => void; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const links = categories.slice(0, 8);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 dark:border-white/10" style={{ background: "rgba(247,244,238,0.88)", backdropFilter: "blur(20px)" }}>
      <style>{`.dark header { background: rgba(17,16,14,0.88) !important; }`}</style>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "#0e0c09" }}>
            <Newspaper className="h-5 w-5" style={{ color: "#f0c46a" }} />
          </span>
          <span className="font-serif text-2xl font-black tracking-[0.12em] dark:text-stone-50">CHRONICLE</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((cat) => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className="rounded-full px-3 py-2 text-sm font-semibold transition dark:text-stone-200"
              style={location.pathname.includes(cat.slug) ? { background: "#0e0c09", color: "#fff" } : {}}
            >
              {cat.name}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/search" className="icon-button" aria-label="Search"><Search className="h-4 w-4" /></Link>
          <Link to="/bookmarks" className="icon-button" aria-label="Bookmarks"><Bookmark className="h-4 w-4" /></Link>
          <button
            className="icon-button"
            onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "auto" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </button>
          <Link
            to={isAdmin ? "/admin" : "/login"}
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-bold transition hover:bg-black hover:text-white dark:border-white/15 dark:text-stone-200 dark:hover:bg-white dark:hover:text-stone-950"
          >
            {isAdmin ? "Dashboard" : "Admin"}
          </Link>
        </div>
        <button className="icon-button md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-black/10 px-4 py-4 dark:border-white/10 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {[...categories, { slug: "search", name: "Search" }, { slug: "bookmarks", name: "Bookmarks" }].map((cat) => (
              <Link
                key={cat.slug}
                to={["search", "bookmarks"].includes(cat.slug) ? `/${cat.slug}` : `/category/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="rounded-xl bg-black/6 px-3 py-3 text-sm font-bold dark:bg-white/8 dark:text-stone-200"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function Home() {
  const { data = [], isLoading } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  const published = data.filter((a) => a.status === "published").sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  const featured = published.find((a) => a.featured) || published[0];
  const latest = published.filter((a) => a.id !== featured?.id);
  const breaking = published.filter((a) => a.breaking);

  return (
    <div>
      <Helmet>
        <title>CHRONICLE | Independent Digital Newsroom</title>
        <meta name="description" content="Chronicle is a premium digital publication built for fast, credible, beautiful journalism." />
      </Helmet>
      {breaking.length > 0 && <BreakingTicker articles={breaking} />}
      <section className="relative overflow-hidden border-b border-black/10 dark:border-white/10">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 20%, rgba(182,141,64,.2) 0%, transparent 35%), linear-gradient(135deg, rgba(47,111,115,.12) 0%, transparent 50%)" }} />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-16">
          {isLoading ? <div className="skeleton h-[540px] rounded-[2rem]" /> : featured && <HeroArticle article={featured} />}
          <div className="grid content-between gap-5">
            <SectionHeader kicker="Editor's Picks" title="Sharp reads for the next hour" />
            {isLoading
              ? [1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
              : latest.slice(0, 3).map((a) => <CompactArticle key={a.id} article={a} />)}
            <Newsletter />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1fr_340px] lg:px-8">
        <div>
          <SectionHeader kicker="Latest News" title="The live file" />
          {isLoading ? <SkeletonGrid /> : <InfiniteGrid articles={latest} />}
        </div>
        <aside className="space-y-6">
          <Panel title="Trending" icon={<TrendingUp className="h-4 w-4" />}>
            {published.sort((a, b) => b.views - a.views).slice(0, 5).map((a, i) => <Ranked key={a.id} index={i + 1} article={a} />)}
          </Panel>
          <Panel title="Popular Tags" icon={<Tags className="h-4 w-4" />}>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(published.flatMap((a) => a.tags))).slice(0, 16).map((tag) => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="rounded-full bg-black/7 px-3 py-1.5 text-xs font-bold dark:bg-white/10 dark:text-stone-300">
                  {tag}
                </Link>
              ))}
            </div>
          </Panel>
        </aside>
      </section>

      <section className="border-y border-black/10 dark:border-white/10" style={{ background: "#0e0c09", color: "white" }}>
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <SectionHeader kicker="Magazine Blocks" title="Coverage by desk" inverse />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map((cat) => (
              <CategoryBlock key={cat.slug} category={cat} article={published.find((a) => a.category.slug === cat.slug)} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroArticle({ article }: { article: Article }) {
  return (
    <Link
      to={`/article/${article.slug}`}
      className="group grid overflow-hidden rounded-[2rem] border border-black/10 shadow-2xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-1 dark:border-white/10 lg:grid-rows-[420px_auto]"
      style={{ background: "rgba(255,255,255,0.6)" }}
    >
      <img src={article.coverImage} alt={article.coverAlt} className="h-80 w-full object-cover transition duration-700 group-hover:scale-[1.03] lg:h-full" loading="eager" />
      <div className="p-6 lg:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em]" style={{ color: "#8a672c" }}>
          <span>{article.category.name}</span>
          <span>·</span>
          <span>Updated {formatDate(article.updatedAt)}</span>
          {article.breaking && <span className="rounded-full px-2 py-0.5" style={{ background: "#b68d40", color: "#0e0c09" }}>Breaking</span>}
        </div>
        <h1 className="font-serif text-4xl font-black leading-[0.95] dark:text-stone-50 md:text-5xl">{article.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700 dark:text-stone-300">{article.subtitle}</p>
      </div>
    </Link>
  );
}

function InfiniteGrid({ articles }: { articles: Article[] }) {
  const [count, setCount] = useState(9);
  const visible = articles.slice(0, count);
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((a) => <ArticleCard key={a.id} article={a} />)}
      </div>
      {count < articles.length && (
        <button
          className="mt-8 w-full rounded-2xl border border-black/15 py-4 font-black transition hover:bg-black hover:text-white dark:border-white/15 dark:text-stone-200 dark:hover:bg-white dark:hover:text-stone-950"
          onClick={() => setCount(count + 9)}
        >
          Load more reporting
        </button>
      )}
    </>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to={`/article/${article.slug}`}
      className="group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/6"
    >
      <div className="overflow-hidden">
        <img src={article.coverImage} alt={article.coverAlt} loading="lazy" className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <span className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "#8a672c" }}>{article.category.name}</span>
        <h3 className="mt-2 font-serif text-2xl font-black leading-tight dark:text-stone-100">{article.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600 dark:text-stone-300">{article.excerpt}</p>
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-stone-500">
          <span>{article.readingMinutes} min read</span>
          <span>{formatDate(article.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function CategoryPage() {
  const { slug = "" } = useParams();
  const { data = [], isLoading } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  const category = categories.find((c) => c.slug === slug);
  const articles = data.filter((a) => a.status === "published" && a.category.slug === slug).sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  const [count, setCount] = useState(9);

  if (!category) return <ErrorPage code="404" />;

  return (
    <div>
      <Helmet>
        <title>{category.name} | CHRONICLE</title>
        <meta name="description" content={category.description} />
      </Helmet>
      <div className="border-b border-black/10 dark:border-white/10" style={{ background: `linear-gradient(135deg, ${category.color}22, transparent)` }}>
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <Breadcrumb items={[["Home", "/"], [category.name, ""]]} />
          <h1 className="mt-4 font-serif text-5xl font-black dark:text-stone-50">{category.name}</h1>
          <p className="mt-3 max-w-xl text-lg text-stone-600 dark:text-stone-300">{category.description}</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {isLoading ? (
          <SkeletonGrid />
        ) : articles.length === 0 ? (
          <EmptyState title="Nothing filed yet" text="This desk is being set up. Check back soon." />
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {articles.slice(0, count).map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
            {count < articles.length && (
              <button className="mt-8 w-full rounded-2xl border border-black/15 py-4 font-black transition hover:bg-black hover:text-white dark:border-white/15 dark:text-stone-200 dark:hover:bg-white dark:hover:text-stone-950" onClick={() => setCount(count + 9)}>
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ArticlePage() {
  const { slug = "" } = useParams();
  const { data: article, isLoading } = useQuery({ queryKey: ["article", slug], queryFn: () => fetchArticle(slug) });
  const { data: all = [] } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  const [progress, setProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (article) setBookmarked(getBookmarks().includes(article.id));
  }, [article]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  if (isLoading) return <ArticleSkeleton />;
  if (!article) return <ErrorPage code="404" />;

  const published = all.filter((a) => a.status === "published");
  const related = published.filter((a) => a.category.slug === article.category.slug && a.id !== article.id).slice(0, 3);
  const idx = published.findIndex((a) => a.id === article.id);
  const prev = published[idx + 1];
  const next = published[idx - 1];

  const handleBookmark = () => {
    const now = toggleBookmark(article.id);
    setBookmarked(now);
    showToast(now ? "Bookmarked!" : "Bookmark removed");
  };
  const handleCopy = () => {
    navigator.clipboard?.writeText(location.href);
    showToast("Link copied!");
  };
  const handleShare = () => {
    if (navigator.share) navigator.share({ title: article.title, url: location.href });
    else handleCopy();
  };

  return (
    <article>
      <Helmet>
        <title>{article.metaTitle || article.title} | CHRONICLE</title>
        <meta name="description" content={article.metaDescription || article.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta property="og:image" content={article.ogImage || article.coverImage} />
        <meta name="twitter:card" content="summary_large_image" />
        {article.canonicalUrl && <link rel="canonical" href={article.canonicalUrl} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "NewsArticle",
          headline: article.title, image: [article.coverImage],
          datePublished: article.publishedAt, dateModified: article.updatedAt,
          author: { "@type": "Person", name: article.author.name },
        })}</script>
      </Helmet>

      <div id="reading-progress" style={{ width: `${progress}%` }} />

      <section className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <Breadcrumb items={[["Home", "/"], [article.category.name, `/category/${article.category.slug}`], [article.title, ""]]} />
        <div className="mt-8 grid gap-8 lg:grid-cols-[80px_1fr_260px]">
          <aside className="sticky top-24 hidden h-fit space-y-2 lg:block">
            <button className="icon-button" onClick={handleCopy} title="Copy link"><Copy className="h-4 w-4" /></button>
            <button className="icon-button" onClick={handleShare} title="Share"><Share2 className="h-4 w-4" /></button>
            <button className="icon-button" onClick={handleBookmark} title="Bookmark">
              {bookmarked ? <BookmarkCheck className="h-4 w-4" style={{ color: "#b68d40" }} /> : <Bookmark className="h-4 w-4" />}
            </button>
          </aside>
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.18em]" style={{ color: "#8a672c" }}>{article.category.name}</p>
            <h1 className="font-serif text-5xl font-black leading-[0.95] dark:text-stone-50 md:text-6xl">{article.title}</h1>
            <p className="mt-6 text-xl leading-9 text-stone-700 dark:text-stone-300">{article.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <img src={article.author.avatarUrl} alt={article.author.name} className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="font-black dark:text-stone-100">{article.author.name}</p>
                <p className="text-sm text-stone-500">{article.author.role} · {article.readingMinutes} min read · {formatDate(article.publishedAt)}</p>
              </div>
            </div>
          </div>
          <aside className="sticky top-24 hidden h-fit rounded-3xl border border-black/10 p-5 dark:border-white/10 lg:block">
            <p className="mb-3 text-sm font-black dark:text-stone-100">Table of contents</p>
            {article.content.split("\n").filter((l) => l.startsWith("## ")).map((h) => (
              <a key={h} href={`#${slugify(h.slice(3))}`} className="block py-1.5 text-sm font-bold text-stone-600 hover:text-[#b68d40] dark:text-stone-300">
                {h.slice(3)}
              </a>
            ))}
          </aside>
        </div>
      </section>

      <figure className="mx-auto max-w-7xl px-4 lg:px-8">
        <img src={article.coverImage} alt={article.coverAlt} className="max-h-[600px] w-full rounded-[2rem] object-cover shadow-2xl shadow-black/15" />
        {article.coverCaption && <figcaption className="mt-3 text-center text-sm text-stone-500">{article.coverCaption}</figcaption>}
      </figure>

      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
        <div className="prose-article dark:text-stone-200" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }} />
        {article.tags?.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="rounded-full bg-black/7 px-3 py-1.5 text-xs font-bold dark:bg-white/10 dark:text-stone-300">
                #{tag}
              </Link>
            ))}
          </div>
        )}
        <div className="mt-8 flex gap-3">
          <button className="button-secondary" onClick={handleCopy}><Copy className="h-4 w-4" /> Copy link</button>
          <button className="button-secondary" onClick={handleShare}><Share2 className="h-4 w-4" /> Share</button>
          <button className="button-secondary" onClick={handleBookmark}>
            {bookmarked ? <BookmarkCheck className="h-4 w-4" style={{ color: "#b68d40" }} /> : <Bookmark className="h-4 w-4" />}
            {bookmarked ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {article.galleries?.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <h2 className="mb-6 font-serif text-3xl font-black dark:text-stone-50">Photo Gallery</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {article.galleries.map((img) => (
              <figure key={img.url}>
                <img src={img.url} alt={img.alt} className="h-72 w-full rounded-3xl object-cover" loading="lazy" />
                {img.caption && <figcaption className="mt-2 text-sm text-stone-500">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      {article.embeds?.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-8">
          {article.embeds.map((embed) =>
            embed.type === "youtube" ? (
              <div key={embed.url} className="overflow-hidden rounded-3xl">
                <iframe className="aspect-video w-full" src={embed.url} title={embed.title} loading="lazy" allowFullScreen />
              </div>
            ) : null
          )}
        </section>
      )}

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <SectionHeader kicker="Keep reading" title="Related coverage" />
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
        </section>
      )}

      {(prev || next) && (
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-2 lg:px-8">
          {prev && <PrevNext label="← Previous" article={prev} />}
          {next && <PrevNext label="Next →" article={next} />}
        </div>
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </article>
  );
}

function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [input, setInput] = useState(query);
  const [sort, setSort] = useState("newest");
  const [cat, setCat] = useState("all");
  const { data = [] } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  const recent = getRecentSearches();
  const navigate = useNavigate();

  useEffect(() => { setInput(query); }, [query]);

  const results = useMemo(() => {
    let list = data.filter((a) => a.status === "published");
    if (cat !== "all") list = list.filter((a) => a.category.slug === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (sort === "newest") list.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
    else if (sort === "oldest") list.sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt));
    else if (sort === "popular") list.sort((a, b) => b.views - a.views);
    else if (sort === "alpha") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [data, query, sort, cat]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      trackRecentSearch(input.trim());
      setParams({ q: input.trim() });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <Helmet><title>Search | CHRONICLE</title></Helmet>
      <h1 className="font-serif text-5xl font-black dark:text-stone-50">Search</h1>
      <form className="mt-6 flex gap-3" onSubmit={submit}>
        <input className="input flex-1 text-lg" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search articles, topics, tags…" autoFocus />
        <button type="submit" className="button-primary"><Search className="h-4 w-4" /></button>
      </form>

      {!query && recent.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-black text-stone-500">Recent searches</p>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button key={r} className="rounded-full bg-black/7 px-3 py-1.5 text-sm font-bold dark:bg-white/10 dark:text-stone-300"
                onClick={() => { trackRecentSearch(r); setParams({ q: r }); }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {!query && (
        <div className="mt-8">
          <p className="mb-3 font-black dark:text-stone-100">Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((s) => (
              <button key={s} className="rounded-full border border-black/15 px-3 py-1.5 text-sm font-bold dark:border-white/15 dark:text-stone-300"
                onClick={() => { trackRecentSearch(s); setParams({ q: s }); }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {query && (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-stone-500">{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</span>
            <select className="input w-auto text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most viewed</option>
              <option value="alpha">A–Z</option>
            </select>
            <select className="input w-auto text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          {results.length === 0 ? (
            <EmptyState title="No results found" text="Try a different keyword or browse categories." />
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {results.map((a) => <SearchResult key={a.id} article={a} query={query} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookmarksPage() {
  const { data = [] } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  const [bookmarkIds, setBookmarkIds] = useState<string[]>(getBookmarks);
  const articles = data.filter((a) => bookmarkIds.includes(a.id));

  const remove = (id: string) => {
    toggleBookmark(id);
    setBookmarkIds(getBookmarks());
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <Helmet><title>Bookmarks | CHRONICLE</title></Helmet>
      <h1 className="font-serif text-5xl font-black dark:text-stone-50">Bookmarks</h1>
      <p className="mt-2 text-stone-500">{articles.length} saved article{articles.length !== 1 ? "s" : ""}</p>
      {articles.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="No bookmarks yet" text="Tap the bookmark icon on any article to save it for later." />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <div key={a.id} className="relative">
              <ArticleCard article={a} />
              <button
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow"
                onClick={() => remove(a.id)}
                title="Remove bookmark"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
      <Helmet><title>About | CHRONICLE</title></Helmet>
      <h1 className="font-serif text-6xl font-black dark:text-stone-50">About CHRONICLE</h1>
      <p className="mt-6 text-xl leading-9 text-stone-700 dark:text-stone-300">Chronicle is an independent digital newsroom built for speed, credibility, readability, and beautiful storytelling. We cover politics, technology, business, science, sports, and more.</p>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {authors.map((a) => (
          <div key={a.id} className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/6">
            <img src={a.avatarUrl} alt={a.name} className="h-16 w-16 rounded-full object-cover" />
            <h3 className="mt-4 font-serif text-xl font-black dark:text-stone-100">{a.name}</h3>
            <p className="text-sm font-bold" style={{ color: "#b68d40" }}>{a.role}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{a.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPage() {
  const [done, setDone] = useState(false);
  const form = useForm({ defaultValues: { name: "", email: "", message: "" } });
  const submit = form.handleSubmit(() => setDone(true));

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <Helmet><title>Contact | CHRONICLE</title></Helmet>
      <h1 className="font-serif text-5xl font-black dark:text-stone-50">Contact</h1>
      <p className="mt-4 text-lg text-stone-600 dark:text-stone-300">Tips, corrections, pitches, and press inquiries welcome.</p>
      {done ? (
        <div className="mt-10 rounded-3xl border border-black/10 p-10 text-center dark:border-white/10">
          <Check className="mx-auto h-10 w-10" style={{ color: "#b68d40" }} />
          <h2 className="mt-4 font-serif text-3xl font-black dark:text-stone-50">Message sent</h2>
          <p className="mt-2 text-stone-500">We'll get back to you within 48 hours.</p>
        </div>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <Field label="Name"><input className="input" {...form.register("name")} required /></Field>
          <Field label="Email"><input className="input" type="email" {...form.register("email")} required /></Field>
          <Field label="Message"><textarea className="input min-h-36" {...form.register("message")} required /></Field>
          <button type="submit" className="button-primary">Send message</button>
        </form>
      )}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("chronicle-admin", "true");
      navigate("/admin");
      window.location.reload();
    } else {
      setError("Invalid credentials.");
    }
  };

  return (
    <div className="grid min-h-[80vh] place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Shield className="mx-auto h-10 w-10" style={{ color: "#b68d40" }} />
          <h1 className="mt-4 font-serif text-4xl font-black dark:text-stone-50">Admin login</h1>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label="Password"><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
          <button type="submit" className="button-primary w-full justify-center">Sign in</button>
        </form>
      </div>
    </div>
  );
}

function Admin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<"articles" | "categories" | "analytics">("articles");
  const deleteMut = useMutation({ mutationFn: (id: string) => deleteArticle(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }) });
  const navigate = useNavigate();

  const logout = () => { localStorage.removeItem("chronicle-admin"); navigate("/"); window.location.reload(); };

  const stats = {
    total: data.length,
    published: data.filter((a) => a.status === "published").length,
    drafts: data.filter((a) => a.status === "draft").length,
    scheduled: data.filter((a) => a.status === "scheduled").length,
    views: data.reduce((s, a) => s + (a.views || 0), 0),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Helmet><title>Admin Dashboard | CHRONICLE</title></Helmet>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6" style={{ color: "#b68d40" }} />
          <h1 className="font-serif text-4xl font-black dark:text-stone-50">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button className="button-primary" onClick={() => setEditingId("new")}><Plus className="h-4 w-4" /> New article</button>
          <button className="button-secondary" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Total", value: stats.total },
          { label: "Published", value: stats.published },
          { label: "Drafts", value: stats.drafts },
          { label: "Scheduled", value: stats.scheduled },
          { label: "Total views", value: stats.views.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/6">
            <p className="text-3xl font-black dark:text-stone-50">{s.value}</p>
            <p className="mt-1 text-sm font-bold text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-2">
        {(["articles", "analytics"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${view === v ? "bg-stone-950 text-white dark:bg-white dark:text-stone-950" : "border border-black/15 dark:border-white/15 dark:text-stone-200"}`}>{v}</button>
        ))}
      </div>

      {view === "articles" && (
        <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10">
          {isLoading ? <div className="skeleton h-64" /> : (
            <table className="w-full text-sm">
              <thead className="border-b border-black/10 bg-black/4 dark:border-white/10 dark:bg-white/4">
                <tr>
                  {["Headline", "Category", "Status", "Views", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-stone-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.id} className="border-b border-black/8 last:border-0 dark:border-white/8 hover:bg-black/3 dark:hover:bg-white/3">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-bold dark:text-stone-200">{a.title}</p>
                      <p className="text-xs text-stone-500">{a.author.name}</p>
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-300">{a.category.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${a.status === "published" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : a.status === "draft" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-300">{a.views?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-stone-500">{formatDate(a.publishedAt || a.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="icon-button h-8 w-8 min-h-0 min-w-0" onClick={() => setEditingId(a.id)} title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button className="icon-button h-8 w-8 min-h-0 min-w-0 hover:border-red-300 hover:text-red-600" onClick={() => confirm("Move to trash?") && deleteMut.mutate(a.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {view === "analytics" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/6">
            <h3 className="mb-4 font-serif text-2xl font-black dark:text-stone-50">Top articles by views</h3>
            {data.sort((a, b) => b.views - a.views).slice(0, 8).map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 border-t border-black/8 py-3 first:border-0 dark:border-white/8">
                <span className="font-serif text-2xl font-black" style={{ color: "#b68d40" }}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold dark:text-stone-200">{a.title}</p>
                  <p className="text-xs text-stone-500">{a.views?.toLocaleString()} views</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/6">
            <h3 className="mb-4 font-serif text-2xl font-black dark:text-stone-50">Content by category</h3>
            {categories.map((cat) => {
              const count = data.filter((a) => a.category.slug === cat.slug && a.status === "published").length;
              const pct = stats.published > 0 ? Math.round((count / stats.published) * 100) : 0;
              return (
                <div key={cat.slug} className="border-t border-black/8 py-3 first:border-0 dark:border-white/8">
                  <div className="flex justify-between text-sm font-bold dark:text-stone-200">
                    <span>{cat.name}</span>
                    <span style={{ color: "#b68d40" }}>{count}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-black/8 dark:bg-white/8">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: cat.color || "#b68d40" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingId !== null && <ArticleEditor id={editingId} onClose={() => { setEditingId(null); qc.invalidateQueries({ queryKey: ["articles"] }); }} />}
    </div>
  );
}

function ArticleEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const { data = [] } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  const existing = id !== "new" ? data.find((a) => a.id === id) : undefined;
  const qc = useQueryClient();

  const form = useForm<ArticleForm>({
    resolver: zodResolver(articleSchema),
    defaultValues: existing ? toInput(existing) : blankArticleForm(),
  });

  const saveMut = useMutation({
    mutationFn: (data: ArticleForm) => saveArticle({ ...data, tags: data.tags.split(",").map((t) => t.trim()).filter(Boolean) } as ArticleInput),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["articles"] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="w-full max-w-4xl rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-[#1c1917]" onSubmit={form.handleSubmit((d) => saveMut.mutate(d))}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-4xl font-black dark:text-stone-50">{id === "new" ? "Create Article" : "Edit Article"}</h2>
          <button type="button" className="icon-button" onClick={onClose}><X /></button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Headline" error={form.formState.errors.title?.message}><input className="input" {...form.register("title")} /></Field>
          <Field label="Slug" error={form.formState.errors.slug?.message}><input className="input" {...form.register("slug")} /></Field>
        </div>
        <Field label="Subtitle" error={form.formState.errors.subtitle?.message}><input className="input" {...form.register("subtitle")} /></Field>
        <Field label="Excerpt" error={form.formState.errors.excerpt?.message}><textarea className="input" rows={3} {...form.register("excerpt")} /></Field>
        <Field label="Content (Markdown)" error={form.formState.errors.content?.message}><textarea className="input min-h-64 font-mono text-sm" {...form.register("content")} /></Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Category">
            <select className="input" {...form.register("categorySlug")}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Author">
            <select className="input" {...form.register("authorId")}>
              {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" {...form.register("status")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="trash">Trash</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cover image URL" error={form.formState.errors.coverImage?.message}><input className="input" {...form.register("coverImage")} /></Field>
          <Field label="OG image URL" error={form.formState.errors.ogImage?.message}><input className="input" {...form.register("ogImage")} /></Field>
          <Field label="Alt text" error={form.formState.errors.coverAlt?.message}><input className="input" {...form.register("coverAlt")} /></Field>
          <Field label="Caption"><input className="input" {...form.register("coverCaption")} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Meta title"><input className="input" {...form.register("metaTitle")} /></Field>
          <Field label="Meta description"><input className="input" {...form.register("metaDescription")} /></Field>
          <Field label="Canonical URL"><input className="input" {...form.register("canonicalUrl")} /></Field>
        </div>
        <Field label="Tags (comma-separated)"><input className="input" {...form.register("tags")} placeholder="AI, Policy, Analysis" /></Field>
        <div className="my-4 grid gap-3 md:grid-cols-3">
          <Toggle label="Featured" register={form.register("featured")} />
          <Toggle label="Breaking News" register={form.register("breaking")} />
          <Toggle label="Pinned" register={form.register("pinned")} />
        </div>
        {saveMut.isError && <p className="text-sm font-bold text-red-600">Failed to save. Please try again.</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button-primary" disabled={saveMut.isPending}>
            <Clipboard className="h-4 w-4" /> {saveMut.isPending ? "Saving…" : "Save article"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10" style={{ background: "#0e0c09", color: "#d6d3d1" }}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_1fr_auto] lg:px-8">
        <div>
          <h2 className="font-serif text-3xl font-black text-white">CHRONICLE</h2>
          <p className="mt-3 max-w-md text-sm leading-6">Independent reporting designed for speed, credibility, readability, and beautiful storytelling.</p>
          <p className="mt-4 text-xs text-stone-600">© {new Date().getFullYear()} Chronicle. All rights reserved.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {categories.slice(0, 10).map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="text-sm font-bold hover:text-[#f0c46a] transition">{c.name}</Link>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-stone-500">More</p>
          {[["About", "/about"], ["Contact", "/contact"], ["Bookmarks", "/bookmarks"]].map(([label, href]) => (
            <div key={href}><Link to={href} className="text-sm font-bold hover:text-[#f0c46a] transition">{label}</Link></div>
          ))}
          <div className="flex gap-2 pt-2">
            <a href="/rss.xml" className="icon-button-dark" aria-label="RSS Feed"><Rss className="h-4 w-4" /></a>
            <a href="/sitemap.xml" className="icon-button-dark" aria-label="Sitemap"><LinkIcon className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Reusable helpers ────────────────────────── */

function BreakingTicker({ articles }: { articles: Article[] }) {
  const duped = [...articles, ...articles];
  return (
    <div className="overflow-hidden py-2" style={{ background: "#b68d40", color: "#0e0c09" }}>
      <div className="animate-ticker whitespace-nowrap text-sm font-black uppercase tracking-wide">
        {duped.map((a, i) => (
          <Link key={`${a.id}-${i}`} to={`/article/${a.slug}`} className="mx-8 inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />Breaking: {a.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

function CompactArticle({ article }: { article: Article }) {
  return (
    <Link to={`/article/${article.slug}`} className="group grid grid-cols-[100px_1fr] gap-4 rounded-2xl border border-black/10 p-3 transition hover:bg-white dark:border-white/10 dark:hover:bg-white/8" style={{ background: "rgba(255,255,255,0.6)" }}>
      <img src={article.coverImage} alt={article.coverAlt} className="h-24 rounded-xl object-cover" loading="lazy" />
      <div>
        <p className="text-xs font-black uppercase" style={{ color: "#8a672c" }}>{article.category.name}</p>
        <h3 className="mt-1 font-serif text-xl font-black leading-tight group-hover:underline dark:text-stone-100">{article.title}</h3>
      </div>
    </Link>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div className="rounded-3xl border border-black/10 p-5 dark:border-white/10" style={{ background: "rgba(255,255,255,0.7)" }}>
      <Mail className="h-5 w-5" style={{ color: "#b68d40" }} />
      <h3 className="mt-3 font-serif text-2xl font-black dark:text-stone-900">The Morning Ledger</h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">A concise briefing with the stories worth carrying into the day.</p>
      {done ? (
        <p className="mt-4 text-sm font-black" style={{ color: "#b68d40" }}>✓ You're subscribed!</p>
      ) : (
        <form className="mt-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); await subscribeNewsletter(email); setDone(true); }}>
          <input className="input flex-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <button type="submit" className="button-primary"><ArrowRight className="h-4 w-4" /></button>
        </form>
      )}
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/6">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-black dark:text-stone-100">{icon}{title}</h3>
      {children}
    </div>
  );
}

function Ranked({ article, index }: { article: Article; index: number }) {
  return (
    <Link to={`/article/${article.slug}`} className="grid grid-cols-[32px_1fr] gap-3 border-t border-black/10 py-3 first:border-0 dark:border-white/10">
      <span className="font-serif text-2xl font-black" style={{ color: "#b68d40" }}>{index}</span>
      <span className="font-bold leading-snug dark:text-stone-200">{article.title}</span>
    </Link>
  );
}

function CategoryBlock({ category, article }: { category: typeof categories[number]; article?: Article }) {
  return (
    <Link to={`/category/${category.slug}`} className="min-h-52 rounded-3xl p-5 transition hover:-translate-y-1" style={{ background: `linear-gradient(135deg, ${category.color}, #1a1612)`, color: "white" }}>
      <h3 className="font-serif text-3xl font-black">{category.name}</h3>
      <p className="mt-3 text-sm leading-6 text-white/75">{article?.title || category.description}</p>
    </Link>
  );
}

function SectionHeader({ kicker, title, inverse = false }: { kicker: string; title: string; inverse?: boolean }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: inverse ? "#f0c46a" : "#8a672c" }}>{kicker}</p>
      <h2 className={`mt-2 font-serif text-4xl font-black ${inverse ? "text-white" : "dark:text-stone-50"}`}>{title}</h2>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-80 rounded-3xl" />)}
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8 space-y-6">
      <div className="skeleton h-8 w-48 rounded-full" />
      <div className="skeleton h-16 rounded-2xl" />
      <div className="skeleton h-8 w-2/3 rounded-2xl" />
      <div className="skeleton h-[400px] rounded-3xl" />
      {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-6 rounded-full" />)}
    </div>
  );
}

function Breadcrumb({ items }: { items: Array<[string, string]> }) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm font-bold text-stone-500">
      {items.map(([label, href], i) =>
        href ? (
          <span key={label} className="flex items-center gap-2">
            <Link to={href} className="hover:text-stone-800 dark:hover:text-stone-200">{label}</Link>
            {i < items.length - 1 && <span>/</span>}
          </span>
        ) : (
          <span key={label} className="truncate max-w-xs">{label}</span>
        )
      )}
    </nav>
  );
}

function SearchResult({ article, query }: { article: Article; query: string }) {
  const title = query ? article.title.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), "<mark>$1</mark>") : article.title;
  return (
    <Link to={`/article/${article.slug}`} className="rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/6 block">
      <p className="text-xs font-black uppercase" style={{ color: "#8a672c" }}>{article.category.name}</p>
      <h3 className="mt-2 font-serif text-2xl font-black dark:text-stone-100" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }} />
      <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{article.excerpt}</p>
      <p className="mt-3 text-xs font-bold text-stone-500">{formatDate(article.publishedAt)} · {article.readingMinutes} min</p>
    </Link>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-10 rounded-[2rem] border border-black/10 p-12 text-center dark:border-white/10">
      <Search className="mx-auto h-8 w-8" style={{ color: "#b68d40" }} />
      <h2 className="mt-4 font-serif text-3xl font-black dark:text-stone-50">{title}</h2>
      <p className="mt-2 text-stone-500">{text}</p>
    </div>
  );
}

function ErrorPage({ code }: { code: "404" | "500" }) {
  return (
    <section className="grid min-h-[65vh] place-items-center px-4 text-center">
      <div>
        <h1 className="font-serif text-8xl font-black dark:text-stone-50">{code}</h1>
        <p className="mt-4 text-lg text-stone-600 dark:text-stone-300">
          {code === "404" ? "This page moved out of the edition." : "The newsroom hit an unexpected error."}
        </p>
        <Link to="/" className="button-primary mt-6 inline-flex"><ArrowLeft className="h-4 w-4" /> Back to front page</Link>
      </div>
    </section>
  );
}

function PrevNext({ label, article }: { label: string; article: Article }) {
  return (
    <Link to={`/article/${article.slug}`} className="rounded-3xl border border-black/10 p-5 block hover:bg-white transition dark:border-white/10 dark:hover:bg-white/6">
      <p className="text-sm font-black" style={{ color: "#8a672c" }}>{label}</p>
      <h3 className="mt-2 font-serif text-2xl font-black dark:text-stone-100">{article.title}</h3>
    </Link>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="my-2 block">
      <span className="mb-1 block text-sm font-black dark:text-stone-200">{label}</span>
      {children}
      {error && <span className="text-xs font-bold text-red-600">{error}</span>}
    </label>
  );
}

function Toggle({ label, register }: { label: string; register: ReturnType<UseFormRegister<ArticleForm>> }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 p-4 font-black dark:border-white/10 dark:text-stone-200">
      <input type="checkbox" {...register} className="h-4 w-4 accent-[#b68d40]" />{label}
    </label>
  );
}

/* ─── Utilities ───────────────────────────────── */

const formatDate = (date: string) =>
  date ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date)) : "—";

const renderMarkdown = (md: string) =>
  DOMPurify.sanitize(
    md.split("\n").map((line) => {
      if (line.startsWith("## ")) return `<h2 id="${slugify(line.slice(3))}">${line.slice(3)}</h2>`;
      if (line.startsWith("> ")) return `<blockquote>${line.slice(2)}</blockquote>`;
      if (line.startsWith("```")) return "";
      if (line.startsWith("**") && line.endsWith("**")) return `<strong>${line.slice(2, -2)}</strong>`;
      if (line.trim()) return `<p>${line}</p>`;
      return "";
    }).join("")
  );

const toInput = (article: Article): ArticleForm => ({
  id: article.id,
  title: article.title,
  subtitle: article.subtitle,
  slug: article.slug,
  excerpt: article.excerpt,
  content: article.content,
  coverImage: article.coverImage,
  coverAlt: article.coverAlt,
  coverCaption: article.coverCaption,
  categorySlug: article.category.slug,
  authorId: article.author.id,
  status: article.status,
  featured: article.featured,
  breaking: article.breaking,
  pinned: article.pinned,
  tags: Array.isArray(article.tags) ? article.tags.join(", ") : "",
  metaTitle: article.metaTitle,
  metaDescription: article.metaDescription,
  ogImage: article.ogImage,
  canonicalUrl: article.canonicalUrl,
});

const blankArticleForm = (): ArticleForm => ({
  title: "",
  subtitle: "",
  slug: "",
  excerpt: "",
  content: "## What changed\nWrite the story here.\n\n## Why it matters\nExplain the impact.",
  coverImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=82",
  coverAlt: "Newsroom desk",
  coverCaption: "Chronicle file image.",
  categorySlug: categories[0]?.slug || "technology",
  authorId: authors[0]?.id || "mara-velasquez",
  status: "draft",
  featured: false,
  breaking: false,
  pinned: false,
  tags: "",
  metaTitle: "",
  metaDescription: "",
  ogImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=82",
  canonicalUrl: "",
});

export default App;
