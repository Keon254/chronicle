import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Upload,
  X,
} from "lucide-react";
import { authors, categories, popularSearches, type Article } from "./data/chronicle";
import {
  deleteArticle,
  estimateReadingTime,
  fetchArticle,
  fetchArticles,
  getRecentSearches,
  saveArticle,
  slugify,
  stripMarkdown,
  subscribeNewsletter,
  trackRecentSearch,
  type ArticleInput,
} from "./lib/chronicleApi";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@chronicle.news";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "chronicle-admin";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(8),
  subtitle: z.string().min(12),
  slug: z.string().min(4),
  excerpt: z.string().min(20),
  content: z.string().min(80),
  coverImage: z.string().url(),
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
  ogImage: z.string().url(),
  canonicalUrl: z.string(),
  scheduledAt: z.string().optional(),
});

type ArticleForm = z.infer<typeof articleSchema>;

function App() {
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

function Shell({ theme, setTheme }: { theme: string; setTheme: (theme: string) => void }) {
  const location = useLocation();
  const isAdmin = localStorage.getItem("chronicle-admin") === "true";
  return (
    <div className="min-h-screen bg-[#f7f4ee] text-stone-950 transition-colors dark:bg-[#11100e] dark:text-stone-50">
      <Helmet>
        <title>CHRONICLE | Independent Digital Newsroom</title>
        <meta name="description" content="Chronicle is a premium digital publication built for fast, credible, beautiful journalism." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="CHRONICLE" />
        <meta property="og:description" content="Speed, credibility, readability, and beautiful storytelling." />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "CHRONICLE", url: "/" })}</script>
      </Helmet>
      <Header theme={theme} setTheme={setTheme} isAdmin={isAdmin} />
      <AnimatePresence mode="wait">
        <motion.main key={location.pathname + location.search} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/login" replace />} />
            <Route path="/500" element={<ErrorPage code="500" />} />
            <Route path="*" element={<ErrorPage code="404" />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <Link to="/search" className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#b68d40] text-stone-950 shadow-2xl shadow-black/25 transition hover:-translate-y-1" aria-label="Open search">
        <Search className="h-5 w-5" />
      </Link>
    </div>
  );
}

function Header({ theme, setTheme, isAdmin }: { theme: string; setTheme: (theme: string) => void; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const links = categories.slice(0, 8);
  return (
    <header className="sticky top-0 z-50 border-b border-stone-950/10 bg-[#f7f4ee]/86 backdrop-blur-xl dark:border-white/10 dark:bg-[#11100e]/86">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-stone-950 text-[#f0c46a] dark:bg-[#f0c46a] dark:text-stone-950"><Newspaper className="h-5 w-5" /></span>
          <span className="font-serif text-2xl font-black tracking-[0.12em]">CHRONICLE</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((cat) => (
            <Link key={cat.slug} to={`/category/${cat.slug}`} className={`rounded-full px-3 py-2 text-sm font-semibold transition ${location.pathname.includes(cat.slug) ? "bg-stone-950 text-white dark:bg-white dark:text-stone-950" : "hover:bg-stone-950/7 dark:hover:bg-white/10"}`}>{cat.name}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/search" className="icon-button"><Search className="h-4 w-4" /></Link>
          <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "auto" : "dark")} aria-label="Toggle theme">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </button>
          <Link to={isAdmin ? "/admin" : "/login"} className="rounded-full border border-stone-950/15 px-4 py-2 text-sm font-bold transition hover:bg-stone-950 hover:text-white dark:border-white/15 dark:hover:bg-white dark:hover:text-stone-950">
            {isAdmin ? "Dashboard" : "Admin"}
          </Link>
        </div>
        <button className="icon-button md:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t border-stone-950/10 px-4 py-4 dark:border-white/10 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {[...categories, { slug: "search", name: "Search" }].map((cat) => (
              <Link key={cat.slug} to={cat.slug === "search" ? "/search" : `/category/${cat.slug}`} onClick={() => setOpen(false)} className="rounded-xl bg-stone-950/6 px-3 py-3 text-sm font-bold dark:bg-white/8">{cat.name}</Link>
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
  return (
    <div>
      <BreakingTicker articles={published.filter((a) => a.breaking)} />
      <section className="relative overflow-hidden border-b border-stone-950/10 dark:border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(182,141,64,.25),transparent_30%),linear-gradient(135deg,rgba(47,111,115,.16),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-16">
          {featured && <HeroArticle article={featured} />}
          <div className="grid content-between gap-5">
            <SectionHeader kicker="Editor's Picks" title="Sharp reads for the next hour" />
            {latest.slice(0, 3).map((article) => <CompactArticle key={article.id} article={article} />)}
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
          <Panel title="Trending News" icon={<BarChart3 className="h-4 w-4" />}>{published.sort((a, b) => b.views - a.views).slice(0, 5).map((a, i) => <Ranked key={a.id} index={i + 1} article={a} />)}</Panel>
          <Panel title="Popular Tags" icon={<Tags className="h-4 w-4" />}><div className="flex flex-wrap gap-2">{Array.from(new Set(published.flatMap((a) => a.tags))).slice(0, 16).map((tag) => <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="rounded-full bg-stone-950/7 px-3 py-1.5 text-xs font-bold dark:bg-white/10">{tag}</Link>)}</div></Panel>
        </aside>
      </section>
      <section className="border-y border-stone-950/10 bg-stone-950 text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <SectionHeader kicker="Magazine Blocks" title="Coverage by desk" inverse />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map((cat) => <CategoryBlock key={cat.slug} category={cat} article={published.find((a) => a.category.slug === cat.slug)} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroArticle({ article }: { article: Article }) {
  return (
    <Link to={`/article/${article.slug}`} className="group grid overflow-hidden rounded-[2rem] border border-stone-950/10 bg-white/60 shadow-2xl shadow-stone-950/10 backdrop-blur-xl transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/7 lg:grid-rows-[420px_auto]">
      <img src={article.coverImage} alt={article.coverAlt} className="h-80 w-full object-cover transition duration-700 group-hover:scale-[1.03] lg:h-full" />
      <div className="p-6 lg:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#8a672c] dark:text-[#f0c46a]"><span>{article.category.name}</span><span>Updated {formatDate(article.updatedAt)}</span></div>
        <h1 className="font-serif text-4xl font-black leading-[0.95] md:text-6xl">{article.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700 dark:text-stone-300">{article.subtitle}</p>
      </div>
    </Link>
  );
}

function InfiniteGrid({ articles }: { articles: Article[] }) {
  const [count, setCount] = useState(6);
  const visible = articles.slice(0, count);
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((article) => <ArticleCard key={article.id} article={article} />)}</div>
      {count < articles.length && <button className="mt-8 w-full rounded-2xl border border-stone-950/15 py-4 font-black transition hover:bg-stone-950 hover:text-white dark:border-white/15 dark:hover:bg-white dark:hover:text-stone-950" onClick={() => setCount(count + 6)}>Load more reporting</button>}
    </>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link to={`/article/${article.slug}`} className="group overflow-hidden rounded-3xl border border-stone-950/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/6">
      <img src={article.coverImage} alt={article.coverAlt} loading="lazy" className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
      <div className="p-5">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#8a672c] dark:text-[#f0c46a]">{article.category.name}</span>
        <h3 className="mt-3 font-serif text-2xl font-black leading-tight">{article.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-650 dark:text-stone-300">{article.excerpt}</p>
        <div className="mt-5 flex items-center justify-between text-xs font-bold text-stone-500"><span>{article.readingMinutes} min read</span><span>{formatDate(article.publishedAt)}</span></div>
      </div>
    </Link>
  );
}

function ArticlePage() {
  const { slug = "" } = useParams();
  const { data: article } = useQuery({ queryKey: ["article", slug], queryFn: () => fetchArticle(slug) });
  const { data: all = [] } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => setProgress(Math.min(100, (window.scrollY / (document.documentElement.scrollHeight - innerHeight)) * 100));
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  if (!article) return <ErrorPage code="404" />;
  const related = all.filter((a) => a.category.slug === article.category.slug && a.id !== article.id).slice(0, 3);
  const index = all.findIndex((a) => a.id === article.id);
  return (
    <article>
      <Helmet>
        <title>{article.metaTitle || article.title} | CHRONICLE</title>
        <meta name="description" content={article.metaDescription || article.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta property="og:image" content={article.ogImage || article.coverImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={article.canonicalUrl || `/article/${article.slug}`} />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "NewsArticle", headline: article.title, image: [article.coverImage], datePublished: article.publishedAt, dateModified: article.updatedAt, author: { "@type": "Person", name: article.author.name } })}</script>
      </Helmet>
      <div className="fixed left-0 top-0 z-[60] h-1 bg-[#b68d40]" style={{ width: `${progress}%` }} />
      <section className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <Breadcrumb items={[["Home", "/"], [article.category.name, `/category/${article.category.slug}`], [article.title, ""]]} />
        <div className="mt-8 grid gap-8 lg:grid-cols-[80px_1fr_260px]">
          <ShareRail article={article} />
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[#8a672c] dark:text-[#f0c46a]">{article.category.name}</p>
            <h1 className="font-serif text-5xl font-black leading-[0.95] md:text-7xl">{article.title}</h1>
            <p className="mt-6 text-xl leading-9 text-stone-700 dark:text-stone-300">{article.subtitle}</p>
            <AuthorLine article={article} />
          </div>
          <TableOfContents content={article.content} />
        </div>
      </section>
      <figure className="mx-auto max-w-7xl px-4 lg:px-8">
        <img src={article.coverImage} alt={article.coverAlt} className="max-h-[620px] w-full rounded-[2rem] object-cover shadow-2xl shadow-black/15" />
        <figcaption className="mt-3 text-sm text-stone-500">{article.coverCaption}</figcaption>
      </figure>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_280px] lg:px-8">
        <div className="prose-chronicle" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }} />
        <aside className="space-y-5">
          <Panel title="Story Details" icon={<FileText className="h-4 w-4" />}><Detail label="Published" value={formatDate(article.publishedAt)} /><Detail label="Updated" value={formatDate(article.updatedAt)} /><Detail label="Reading time" value={`${article.readingMinutes} minutes`} /></Panel>
          <Newsletter />
        </aside>
      </section>
      {article.galleries.length > 0 && <Gallery images={article.galleries} />}
      {article.embeds.length > 0 && <Embeds embeds={article.embeds} />}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">{article.tags.map((tag) => <Link key={tag} to={`/search?q=${tag}`} className="rounded-full bg-stone-950/7 px-3 py-2 text-sm font-bold dark:bg-white/10">#{tag}</Link>)}</div>
        <div className="grid gap-4 md:grid-cols-2">{all[index - 1] && <PrevNext label="Previous" article={all[index - 1]} />}{all[index + 1] && <PrevNext label="Next" article={all[index + 1]} />}</div>
        <SectionHeader kicker="Related Articles" title="Keep reading" />
        <div className="grid gap-5 md:grid-cols-3">{related.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
      </section>
    </article>
  );
}

function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("relevance");
  const { data = [] } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  const results = useMemo(() => {
    const q = query.toLowerCase();
    let items = data.filter((a) => a.status === "published" && (category === "all" || a.category.slug === category));
    if (q) items = items.filter((a) => [a.title, a.subtitle, a.excerpt, a.content, a.tags.join(" ")].join(" ").toLowerCase().includes(q));
    return items.sort((a, b) => (sort === "newest" ? +new Date(b.publishedAt) - +new Date(a.publishedAt) : sort === "popular" ? b.views - a.views : Number(b.title.toLowerCase().includes(q)) - Number(a.title.toLowerCase().includes(q))));
  }, [data, query, category, sort]);
  const submit = () => { trackRecentSearch(query); setParams(query ? { q: query } : {}); };
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <SectionHeader kicker="Search" title="Find the thread fast" />
      <div className="rounded-[2rem] border border-stone-950/10 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-white/6">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
          <label className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} className="input pl-12" placeholder="Search reporting, tags, authors" autoFocus /></label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All categories</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}><option value="relevance">Relevance</option><option value="newest">Newest</option><option value="popular">Popular</option></select>
          <button className="button-primary" onClick={submit}><Filter className="h-4 w-4" /> Search</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{[...getRecentSearches(), ...popularSearches].slice(0, 12).map((item) => <button key={item} className="rounded-full bg-stone-950/7 px-3 py-1.5 text-xs font-bold dark:bg-white/10" onClick={() => setQuery(item)}>{item}</button>)}</div>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{results.map((a) => <SearchResult key={a.id} article={a} query={query} />)}</div>
      {results.length === 0 && <EmptyState title="No matching articles" text="Try a broader term, remove filters, or browse the latest newsroom file." />}
    </section>
  );
}

function CategoryPage() {
  const { slug = "" } = useParams();
  const category = categories.find((cat) => cat.slug === slug);
  const { data = [] } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  if (!category) return <ErrorPage code="404" />;
  const articles = data.filter((a) => a.status === "published" && a.category.slug === slug);
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <Helmet><title>{category.name} | CHRONICLE</title><meta name="description" content={category.description} /></Helmet>
      <div className="mb-10 rounded-[2rem] border border-stone-950/10 p-8 dark:border-white/10" style={{ background: `linear-gradient(135deg, ${category.color}33, transparent)` }}>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#8a672c] dark:text-[#f0c46a]">Desk</p>
        <h1 className="mt-3 font-serif text-6xl font-black">{category.name}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700 dark:text-stone-300">{category.description}</p>
      </div>
      <InfiniteGrid articles={articles} />
    </section>
  );
}

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("email") === ADMIN_EMAIL && form.get("password") === ADMIN_PASSWORD) {
      localStorage.setItem("chronicle-admin", "true");
      navigate("/admin");
    } else setError("The administrator credentials were not accepted.");
  };
  return (
    <section className="mx-auto grid min-h-[70vh] max-w-5xl place-items-center px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] border border-stone-950/10 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-white/6">
        <Shield className="mb-5 h-10 w-10 text-[#b68d40]" />
        <h1 className="font-serif text-4xl font-black">Administrator Login</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">Reader accounts are intentionally unavailable. Only newsroom administrators can access publishing tools.</p>
        {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-600 dark:text-red-300">{error}</p>}
        <input name="email" type="email" className="input mt-6" placeholder="Admin email" required />
        <input name="password" type="password" className="input mt-3" placeholder="Password" required />
        <button className="button-primary mt-5 w-full"><LayoutDashboard className="h-4 w-4" /> Enter dashboard</button>
      </form>
    </section>
  );
}

function Admin() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["articles"], queryFn: fetchArticles });
  const [editing, setEditing] = useState<Article | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const mutation = useMutation({ mutationFn: saveArticle, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }) });
  const remove = useMutation({ mutationFn: deleteArticle, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }) });
  const logout = () => { localStorage.removeItem("chronicle-admin"); location.href = "/"; };
  const stats = [{ label: "Published", value: data.filter((a) => a.status === "published").length }, { label: "Drafts", value: data.filter((a) => a.status === "draft").length }, { label: "Scheduled", value: data.filter((a) => a.status === "scheduled").length }, { label: "Views", value: data.reduce((sum, a) => sum + a.views, 0).toLocaleString() }];
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[0.18em] text-[#8a672c] dark:text-[#f0c46a]">CMS</p><h1 className="font-serif text-5xl font-black">Newsroom Dashboard</h1></div><div className="flex gap-2"><button className="button-secondary" onClick={logout}>Sign out</button><button className="button-primary" onClick={() => setEditing(blankArticle())}><Plus className="h-4 w-4" /> Create article</button></div></div>
      <div className="grid gap-4 md:grid-cols-4">{stats.map((stat) => <div key={stat.label} className="rounded-3xl border border-stone-950/10 bg-white p-5 dark:border-white/10 dark:bg-white/6"><p className="text-sm font-bold text-stone-500">{stat.label}</p><p className="mt-2 text-3xl font-black">{stat.value}</p></div>)}</div>
      <div className="mt-6 flex flex-wrap gap-2"><button className="button-secondary" onClick={() => selected.forEach((id) => remove.mutate(id))}><Trash2 className="h-4 w-4" /> Bulk trash</button><button className="button-secondary" onClick={() => data.filter((a) => selected.includes(a.id)).forEach((a) => mutation.mutate(toInput({ ...a, status: "published" })))}><Check className="h-4 w-4" /> Bulk publish</button><button className="button-secondary" onClick={() => data.filter((a) => selected.includes(a.id)).forEach((a) => mutation.mutate(toInput({ ...a, category: categories[1] })))}><Tags className="h-4 w-4" /> Bulk technology</button></div>
      <div className="mt-6 overflow-hidden rounded-[2rem] border border-stone-950/10 bg-white dark:border-white/10 dark:bg-white/6">
        {data.map((article) => <div key={article.id} className="grid gap-4 border-b border-stone-950/10 p-4 last:border-0 dark:border-white/10 md:grid-cols-[32px_1fr_auto] md:items-center"><input type="checkbox" checked={selected.includes(article.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, article.id] : selected.filter((id) => id !== article.id))} /><div><div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide"><span>{article.status}</span><span>{article.category.name}</span>{article.featured && <span>Featured</span>}{article.breaking && <span>Breaking</span>}</div><h3 className="mt-1 font-serif text-2xl font-black">{article.title}</h3><p className="text-sm text-stone-500">Updated {formatDate(article.updatedAt)} · {article.versions.length} saved versions</p></div><div className="flex gap-2"><Link className="icon-button" to={`/article/${article.slug}`}><Eye className="h-4 w-4" /></Link><button className="icon-button" onClick={() => setEditing(article)}><Edit3 className="h-4 w-4" /></button><button className="icon-button" onClick={() => remove.mutate(article.id)}><Trash2 className="h-4 w-4" /></button></div></div>)}
      </div>
      {editing && <EditorModal article={editing} close={() => setEditing(null)} save={(input) => mutation.mutate(input, { onSuccess: () => setEditing(null) })} />}
    </section>
  );
}

function EditorModal({ article, close, save }: { article: Article; close: () => void; save: (input: ArticleInput) => void }) {
  const form = useForm<ArticleForm>({ resolver: zodResolver(articleSchema), defaultValues: { ...toInput(article), tags: article.tags.join(", ") } });
  const title = form.watch("title");
  useEffect(() => { if (!form.getValues("slug") && title) form.setValue("slug", slugify(title)); }, [form, title]);
  const content = form.watch("content");
  useEffect(() => { const id = setTimeout(() => localStorage.setItem(`chronicle-autosave-${article.id}`, JSON.stringify(form.getValues())), 700); return () => clearTimeout(id); }, [article.id, content, form, title]);
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-stone-950/70 p-4 backdrop-blur-md">
      <form onSubmit={form.handleSubmit((values) => save({ ...values, tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean), readingMinutes: estimateReadingTime(values.content), galleries: article.galleries, embeds: article.embeds }))} className="mx-auto max-w-5xl rounded-[2rem] bg-[#f7f4ee] p-5 shadow-2xl dark:bg-[#161513]">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-4xl font-black">{article.id === "new" ? "Create Article" : "Edit Article"}</h2><button type="button" className="icon-button" onClick={close}><X /></button></div>
        <div className="grid gap-4 md:grid-cols-2"><Field label="Headline" error={form.formState.errors.title?.message}><input className="input" {...form.register("title")} /></Field><Field label="Slug" error={form.formState.errors.slug?.message}><input className="input" {...form.register("slug")} /></Field></div>
        <Field label="Subtitle" error={form.formState.errors.subtitle?.message}><input className="input" {...form.register("subtitle")} /></Field>
        <Field label="Rich text / Markdown" error={form.formState.errors.content?.message}><textarea className="input min-h-72 font-mono text-sm" {...form.register("content")} /></Field>
        <div className="grid gap-4 md:grid-cols-3"><Field label="Category"><select className="input" {...form.register("categorySlug")}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></Field><Field label="Author"><select className="input" {...form.register("authorId")}>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><Field label="Status"><select className="input" {...form.register("status")}><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="trash">Trash</option></select></Field></div>
        <div className="grid gap-4 md:grid-cols-2"><Field label="Cover image URL" error={form.formState.errors.coverImage?.message}><input className="input" {...form.register("coverImage")} /></Field><Field label="OpenGraph image" error={form.formState.errors.ogImage?.message}><input className="input" {...form.register("ogImage")} /></Field></div>
        <div className="grid gap-4 md:grid-cols-2"><Field label="Alt text" error={form.formState.errors.coverAlt?.message}><input className="input" {...form.register("coverAlt")} /></Field><Field label="Caption"><input className="input" {...form.register("coverCaption")} /></Field></div>
        <Field label="Excerpt"><textarea className="input" {...form.register("excerpt")} /></Field>
        <div className="grid gap-4 md:grid-cols-3"><Field label="Meta title"><input className="input" {...form.register("metaTitle")} /></Field><Field label="Meta description"><input className="input" {...form.register("metaDescription")} /></Field><Field label="Canonical URL"><input className="input" {...form.register("canonicalUrl")} /></Field></div>
        <Field label="Tags"><input className="input" {...form.register("tags")} placeholder="Policy, Analysis, Markets" /></Field>
        <div className="my-4 grid gap-3 md:grid-cols-3"><Toggle label="Featured" register={form.register("featured")} /><Toggle label="Breaking News" register={form.register("breaking")} /><Toggle label="Pinned" register={form.register("pinned")} /></div>
        <div className="mb-5 rounded-2xl border border-stone-950/10 p-4 dark:border-white/10"><p className="mb-2 text-sm font-black"><ImageIcon className="mr-2 inline h-4 w-4" />Media library</p><p className="text-sm text-stone-500">Add optimized image URLs with meaningful alt text. Uploaded binary storage can be connected through Netlify Blobs without changing the article schema.</p><button type="button" className="button-secondary mt-3"><Upload className="h-4 w-4" /> Validate media</button></div>
        <div className="flex flex-wrap justify-end gap-2"><button type="button" className="button-secondary" onClick={() => alert(stripMarkdown(form.getValues("content")).slice(0, 500))}><Eye className="h-4 w-4" /> Preview</button><button className="button-primary"><Clipboard className="h-4 w-4" /> Save article</button></div>
      </form>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone-950/10 bg-stone-950 text-stone-300 dark:border-white/10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_1fr_auto] lg:px-8">
        <div><h2 className="font-serif text-3xl font-black text-white">CHRONICLE</h2><p className="mt-3 max-w-md text-sm leading-6">Independent reporting designed for speed, credibility, readability, and beautiful storytelling.</p></div>
        <div className="grid grid-cols-2 gap-2">{categories.slice(0, 8).map((c) => <Link key={c.slug} to={`/category/${c.slug}`} className="text-sm font-bold hover:text-[#f0c46a]">{c.name}</Link>)}</div>
        <div className="flex gap-2"><Link to="/rss.xml" className="icon-button-dark"><Rss className="h-4 w-4" /></Link><Link to="/sitemap.xml" className="icon-button-dark"><LinkIcon className="h-4 w-4" /></Link></div>
      </div>
    </footer>
  );
}

const formatDate = (date: string) => date ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date)) : "Not published";
const renderMarkdown = (md: string) => DOMPurify.sanitize(md.split("\n").map((line) => line.startsWith("## ") ? `<h2 id="${slugify(line.slice(3))}">${line.slice(3)}</h2>` : line.startsWith("> ") ? `<blockquote>${line.slice(2)}</blockquote>` : line.startsWith("```") ? "" : line.trim() ? `<p>${line}</p>` : "").join(""));
const toInput = (article: Article): ArticleInput => ({ ...article, categorySlug: article.category.slug, authorId: article.author.id });
const blankArticle = (): Article => ({ ...seedBlank, id: "new", slug: "", title: "", subtitle: "", excerpt: "", content: "", metaTitle: "", metaDescription: "" });
const seedBlank: Article = { ...authors && { id: "new", title: "Untitled article", subtitle: "Draft subtitle for a complete story package.", slug: "untitled", excerpt: "A concise summary for readers and search engines.", content: "## What changed\nWrite the verified opening here.\n\n## Why it matters\nExplain the impact with context.", coverImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=82", coverAlt: "Newsroom desk with papers", coverCaption: "Chronicle newsroom file image.", category: categories[0], author: authors[0], status: "draft", featured: false, breaking: false, pinned: false, tags: ["Draft"], readingMinutes: 2, views: 0, publishedAt: "", updatedAt: new Date().toISOString(), metaTitle: "Untitled Chronicle article", metaDescription: "A Chronicle draft article.", ogImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=82", canonicalUrl: "/article/untitled", galleries: [], embeds: [], versions: [] } } as Article;
function SectionHeader({ kicker, title, inverse = false }: { kicker: string; title: string; inverse?: boolean }) { return <div className="mb-5"><p className={`text-xs font-black uppercase tracking-[0.18em] ${inverse ? "text-[#f0c46a]" : "text-[#8a672c] dark:text-[#f0c46a]"}`}>{kicker}</p><h2 className="mt-2 font-serif text-4xl font-black">{title}</h2></div>; }
function BreakingTicker({ articles }: { articles: Article[] }) { return <div className="overflow-hidden bg-[#b68d40] py-2 text-stone-950"><div className="animate-ticker whitespace-nowrap text-sm font-black uppercase tracking-wide">{articles.concat(articles).map((a, i) => <Link key={`${a.id}-${i}`} to={`/article/${a.slug}`} className="mx-8 inline-flex items-center gap-2"><Sparkles className="h-4 w-4" />Breaking: {a.title}</Link>)}</div></div>; }
function CompactArticle({ article }: { article: Article }) { return <Link to={`/article/${article.slug}`} className="group grid grid-cols-[100px_1fr] gap-4 rounded-2xl border border-stone-950/10 bg-white/70 p-3 transition hover:bg-white dark:border-white/10 dark:bg-white/6"><img src={article.coverImage} alt={article.coverAlt} className="h-24 rounded-xl object-cover" /><div><p className="text-xs font-black uppercase text-[#8a672c] dark:text-[#f0c46a]">{article.category.name}</p><h3 className="mt-1 font-serif text-xl font-black leading-tight group-hover:underline">{article.title}</h3></div></Link>; }
function Newsletter() { const [email, setEmail] = useState(""); const [done, setDone] = useState(false); return <div className="rounded-3xl border border-stone-950/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/6"><Mail className="h-5 w-5 text-[#b68d40]" /><h3 className="mt-3 font-serif text-2xl font-black">The Morning Ledger</h3><p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">A concise briefing with the stories worth carrying into the day.</p><form className="mt-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); await subscribeNewsletter(email); setDone(true); }}><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /><button className="button-primary">{done ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</button></form></div>; }
function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <div className="rounded-3xl border border-stone-950/10 bg-white p-5 dark:border-white/10 dark:bg-white/6"><h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-black">{icon}{title}</h3>{children}</div>; }
function Ranked({ article, index }: { article: Article; index: number }) { return <Link to={`/article/${article.slug}`} className="grid grid-cols-[32px_1fr] gap-3 border-t border-stone-950/10 py-3 first:border-0 dark:border-white/10"><span className="font-serif text-2xl font-black text-[#b68d40]">{index}</span><span className="font-bold leading-snug">{article.title}</span></Link>; }
function CategoryBlock({ category, article }: { category: typeof categories[number]; article?: Article }) { return <Link to={`/category/${category.slug}`} className="min-h-52 rounded-3xl p-5 transition hover:-translate-y-1" style={{ background: `linear-gradient(135deg, ${category.color}, #1f1b16)` }}><h3 className="font-serif text-3xl font-black">{category.name}</h3><p className="mt-3 text-sm leading-6 text-white/78">{article?.title || category.description}</p></Link>; }
function SkeletonGrid() { return <div className="grid gap-5 md:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 animate-pulse rounded-3xl bg-stone-950/10 dark:bg-white/10" />)}</div>; }
function Breadcrumb({ items }: { items: Array<[string, string]> }) { return <nav className="flex flex-wrap gap-2 text-sm font-bold text-stone-500">{items.map(([label, href], i) => href ? <Link key={label} to={href}>{label}{i < items.length - 1 && " /"}</Link> : <span key={label}>{label}</span>)}</nav>; }
function ShareRail({ article }: { article: Article }) { const copy = () => navigator.clipboard?.writeText(location.href); return <aside className="sticky top-24 hidden h-fit space-y-2 lg:block"><button className="icon-button" onClick={copy}><Copy className="h-4 w-4" /></button><button className="icon-button" onClick={() => navigator.share?.({ title: article.title, url: location.href })}><Share2 className="h-4 w-4" /></button><button className="icon-button"><Bookmark className="h-4 w-4" /></button></aside>; }
function AuthorLine({ article }: { article: Article }) { return <div className="mt-6 flex flex-wrap items-center gap-4"><img src={article.author.avatarUrl} alt={article.author.name} className="h-12 w-12 rounded-full object-cover" /><div><p className="font-black">{article.author.name}</p><p className="text-sm text-stone-500">{article.author.role} · {article.readingMinutes} min read · {formatDate(article.publishedAt)}</p></div></div>; }
function TableOfContents({ content }: { content: string }) { const heads = content.split("\n").filter((l) => l.startsWith("## ")); return <aside className="sticky top-24 hidden h-fit rounded-3xl border border-stone-950/10 p-5 dark:border-white/10 lg:block"><p className="mb-3 text-sm font-black">Table of contents</p>{heads.map((h) => <a key={h} href={`#${slugify(h.slice(3))}`} className="block py-2 text-sm font-bold text-stone-600 hover:text-[#b68d40] dark:text-stone-300">{h.slice(3)}</a>)}</aside>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="border-t border-stone-950/10 py-3 text-sm dark:border-white/10"><span className="font-black">{label}</span><span className="float-right text-stone-500">{value}</span></div>; }
function Gallery({ images }: { images: Array<{ url: string; alt: string; caption: string }> }) { return <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8"><div className="grid gap-4 md:grid-cols-2">{images.map((img) => <figure key={img.url}><img src={img.url} alt={img.alt} className="h-80 w-full rounded-3xl object-cover" /><figcaption className="mt-2 text-sm text-stone-500">{img.caption}</figcaption></figure>)}</div></section>; }
function Embeds({ embeds }: { embeds: Array<{ type: string; url: string; title: string }> }) { return <section className="mx-auto max-w-4xl px-4 py-8">{embeds.map((embed) => embed.type === "youtube" ? <iframe key={embed.url} className="aspect-video w-full rounded-3xl" src={embed.url} title={embed.title} loading="lazy" allowFullScreen /> : <div key={embed.url} className="rounded-3xl border border-stone-950/10 p-6 dark:border-white/10">Embedded post: {embed.title}</div>)}</section>; }
function PrevNext({ label, article }: { label: string; article: Article }) { return <Link to={`/article/${article.slug}`} className="rounded-3xl border border-stone-950/10 p-5 dark:border-white/10"><p className="text-sm font-black text-[#8a672c] dark:text-[#f0c46a]">{label}</p><h3 className="mt-2 font-serif text-2xl font-black">{article.title}</h3></Link>; }
function SearchResult({ article, query }: { article: Article; query: string }) { const title = query ? article.title.replace(new RegExp(`(${query})`, "ig"), "<mark>$1</mark>") : article.title; return <Link to={`/article/${article.slug}`} className="rounded-3xl border border-stone-950/10 bg-white p-5 dark:border-white/10 dark:bg-white/6"><p className="text-xs font-black uppercase text-[#8a672c] dark:text-[#f0c46a]">{article.category.name}</p><h3 className="mt-2 font-serif text-2xl font-black" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }} /><p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">{article.excerpt}</p></Link>; }
function EmptyState({ title, text }: { title: string; text: string }) { return <div className="rounded-[2rem] border border-stone-950/10 p-10 text-center dark:border-white/10"><Search className="mx-auto h-8 w-8 text-[#b68d40]" /><h2 className="mt-4 font-serif text-3xl font-black">{title}</h2><p className="mt-2 text-stone-500">{text}</p></div>; }
function ErrorPage({ code }: { code: "404" | "500" }) { return <section className="grid min-h-[65vh] place-items-center px-4 text-center"><div><h1 className="font-serif text-8xl font-black">{code}</h1><p className="mt-4 text-lg text-stone-600 dark:text-stone-300">{code === "404" ? "This page moved out of the edition." : "The newsroom hit an unexpected error."}</p><Link to="/" className="button-primary mt-6 inline-flex"><ArrowLeft className="h-4 w-4" /> Back to front page</Link></div></section>; }
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="my-3 block"><span className="mb-1 block text-sm font-black">{label}</span>{children}{error && <span className="text-xs font-bold text-red-600">{error}</span>}</label>; }
function Toggle({ label, register }: { label: string; register: ReturnType<UseFormRegister<ArticleForm>> }) { return <label className="flex items-center gap-3 rounded-2xl border border-stone-950/10 p-4 font-black dark:border-white/10"><input type="checkbox" {...register} />{label}</label>; }

export default App;
