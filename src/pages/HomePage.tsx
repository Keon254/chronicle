import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, Tag, ArrowRight, Search } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  category: string;
  created_at: string;
  author_id: string;
}

const CATEGORIES = ['All', 'Politics', 'Technology', 'Business', 'Sports', 'Entertainment', 'Science', 'Health', 'General'];

export default function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, searchQuery]);

  async function fetchNews() {
    setLoading(true);
    let query = supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'All') {
      query = query.eq('category', selectedCategory);
    }

    const { data } = await query;
    let results = data ?? [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    setNews(results);
    setLoading(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getCategoryColor(cat: string) {
    const colors: Record<string, string> = {
      Politics: 'bg-red-500/10 text-red-400 border-red-500/20',
      Technology: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      Business: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      Sports: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      Entertainment: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      Science: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      Health: 'bg-green-500/10 text-green-400 border-green-500/20',
      General: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    return colors[cat] || colors.General;
  }

  const featured = news[0];
  const rest = news.slice(1);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
            The Chronicle
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl">
            Your trusted source for the latest news and stories from around the world.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-800" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-6 bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No articles found</h3>
            <p className="text-slate-500">Check back later for new stories.</p>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featured && (
              <Link
                to={`/article/${featured.id}`}
                className="block mb-10 group"
              >
                <div className="relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-amber-500/30 transition-all duration-300">
                  <div className="grid md:grid-cols-2">
                    {featured.image_url && (
                      <div className="h-64 md:h-96 overflow-hidden">
                        <img
                          src={featured.image_url}
                          alt={featured.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className={`p-8 md:p-10 flex flex-col justify-center ${!featured.image_url ? 'md:col-span-2' : ''}`}>
                      <span className={`inline-flex self-start items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border mb-4 ${getCategoryColor(featured.category)}`}>
                        <Tag className="w-3 h-3" />
                        {featured.category}
                      </span>
                      <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 group-hover:text-amber-400 transition-colors leading-tight">
                        {featured.title}
                      </h2>
                      <p className="text-slate-400 text-base md:text-lg line-clamp-3 mb-6">
                        {featured.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          {formatDate(featured.created_at)}
                        </span>
                        <span className="flex items-center gap-1 text-amber-400 text-sm font-medium group-hover:gap-2 transition-all">
                          Read more <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((item) => (
                <Link
                  key={item.id}
                  to={`/article/${item.id}`}
                  className="group bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5"
                >
                  {item.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border mb-3 ${getCategoryColor(item.category)}`}>
                      <Tag className="w-3 h-3" />
                      {item.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                      {item.content}
                    </p>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Newspaper(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
    </svg>
  );
}
