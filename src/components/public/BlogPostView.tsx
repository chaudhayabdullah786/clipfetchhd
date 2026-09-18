import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Calendar, 
  User, 
  ArrowLeft, 
  Share2, 
  Check, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  Tag,
  Clock
} from "lucide-react";
import { BlogPost } from "../../types/cms";
import { BlockRenderer } from "./BlockRenderer";
import { AdSlotView } from "./AdSlotView";

export const BlogPostView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/blog/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
          if (data.version?.seo_title) {
            document.title = data.version.seo_title;
          }
        } else if (res.status === 404) {
          setError("Article not found");
        } else {
          setError("Failed to load article");
        }
      } catch {
        setError("Network error loading article");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Article Not Found</h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md text-sm">
          The requested article may have been moved or unpublished.
        </p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Guides</span>
        </Link>
      </div>
    );
  }

  const v = post.version;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <article className="max-w-3xl mx-auto px-4 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-400">
          <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-xs">{post.title}</span>
        </nav>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              {post.category}
            </span>
          </div>

          {/* Exactly ONE H1 per page */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              {post.excerpt}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-purple-600" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : "Guide"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
              <span>{copied ? "Link Copied!" : "Share"}</span>
            </button>
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="rounded-2xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <img 
              src={post.featured_image} 
              alt={post.featured_image_alt || post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Structured Article Content */}
        {v?.blocks && v.blocks.length > 0 && (
          <div className="pt-2">
            <BlockRenderer blocks={v.blocks} currentRoute={`/blog/${post.slug}`} />
          </div>
        )}

        {/* Mid-Article or Bottom Ad Slot */}
        <AdSlotView position="between_sections" currentRoute={`/blog/${post.slug}`} />

        {/* Persistent Internal Downloader CTA (Section 15) */}
        <div className="p-8 rounded-3xl bg-gradient-to-tr from-purple-900 via-indigo-900 to-zinc-900 text-white text-center space-y-4 shadow-xl my-12">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-yellow-400">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-black">
            Try the Free ClipFetchHD Downloader
          </h2>
          <p className="text-zinc-300 text-sm max-w-md mx-auto leading-relaxed">
            Download your favorite Instagram Reels in crystal-clear MP4 high definition without accounts or watermarks.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-900 font-bold text-sm shadow-lg hover:bg-zinc-100 transition-all active:scale-95 cursor-pointer"
          >
            <span>Open Downloader</span>
            <ArrowLeft size={16} className="rotate-180" />
          </Link>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-2 pt-4 flex-wrap">
            <Tag size={14} className="text-zinc-400" />
            {post.tags.map((t) => (
              <span 
                key={t}
                className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};
