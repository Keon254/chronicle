import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Clock, Tag } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  category: string;
  created_at: string;
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchArticle();
  }, [id]);

  async function fetchArticle() {
    const { data } = await supabase
      .from('news')
      .select('*')
      .eq('id', id!)
      .eq('is_published', true)
      .single();
    setArticle(data);
    setLoading(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-white">Article not found</h2>
        <Link to="/" className="text-amber-400 hover:text-amber-300 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {article.image_url && (
          <div className="rounded-2xl overflow-hidden mb-8 border border-slate-800">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-64 sm:h-96 object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border bg-blue-500/10 text-blue-400 border-blue-500/20">
            <Tag className="w-3 h-3" />
            {article.category}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            {formatDate(article.created_at)}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-8 leading-tight">
          {article.title}
        </h1>

        <div className="prose prose-invert prose-lg max-w-none">
          {article.content.split('\n').map((paragraph, i) => (
            <p key={i} className="text-slate-300 text-base sm:text-lg leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}
