import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, User, ArrowRight, Search, Sparkles, Loader2 } from "lucide-react";
import { BlogPost } from "../../types/cms";

export const BlogIndex: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    document.title = "Blog & Guides – ClipFetchHD";
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (search) query.set("search", search);
        if (selectedCategory !== "All") query.set("category", selectedCategory);
        
        const res = await fetch(`/api/public/blog?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch {
        // Safe silence
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [search, selectedCategory]);

  const categories = ["All", "Guides", "Troubleshooting", "Privacy", "Creators"];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <BookOpen size={13} />
            <span>Guides & Articles</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
            Instagram Media Guides & Tutorials
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Helpful tutorials, technical insights, and tips for saving, editing, and managing Instagram video content.
          </p>
        </header>

        {/* Search & Categories Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-purple-600" size={32} />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              No published articles found matching your criteria.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              <span>Back to Downloader</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-purple-500/50 transition-all flex flex-col justify-between"
              >
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-md">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : "Guide"}</span>
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800/80 mt-auto flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-normal">
                    <User size={12} />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Read Article</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
