import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  CheckCircle2, 
  Calendar, 
  User, 
  ArrowLeft, 
  Save, 
  Loader2,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { BlogPost, ContentBlock } from "../../types/cms";

interface BlogManagerProps {
  authToken?: string | null;
}

export const BlogManager: React.FC<BlogManagerProps> = ({ authToken }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [saveStatus, setSaveStatus] = useState("");

  // New Post state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Guides");

  const getHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    return headers;
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog/posts", {
        headers: getHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleEditPost = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/posts/${id}`, {
        headers: getHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPost(data);
        setEditingPostId(id);
      }
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/blog/posts", {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({
          title: newPostTitle,
          category: newPostCategory,
          author: "ClipFetchHD Editorial Team"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        setNewPostTitle("");
        await fetchPosts();
        handleEditPost(data.postId);
      }
    } catch {
      // Error
    }
  };

  const handleSavePost = async () => {
    if (!selectedPost) return;
    setSaveStatus("Saving...");
    try {
      const res = await fetch(`/api/admin/blog/posts/${selectedPost.id}`, {
        method: "PUT",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(selectedPost)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus("Saved successfully!");
        setTimeout(() => setSaveStatus(""), 2500);
      } else {
        setSaveStatus("Error saving post");
      }
    } catch {
      setSaveStatus("Connection error saving");
    }
  };

  const handlePublishPost = async () => {
    if (!selectedPost) return;
    setSaveStatus("Publishing...");
    try {
      // Save changes first
      await fetch(`/api/admin/blog/posts/${selectedPost.id}`, {
        method: "PUT",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(selectedPost)
      });

      const res = await fetch(`/api/admin/blog/posts/${selectedPost.id}/publish`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        setSaveStatus("Published live!");
        await handleEditPost(selectedPost.id);
        await fetchPosts();
        setTimeout(() => setSaveStatus(""), 2500);
      }
    } catch {
      setSaveStatus("Error publishing");
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  if (!editingPostId || !selectedPost) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Blog & Guides Manager</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Publish rich technical articles, user tutorials, and SEO guides.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Article</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Guides">Guides</option>
              <option value="Troubleshooting">Troubleshooting</option>
              <option value="Privacy">Privacy</option>
              <option value="Creators">Creators</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      <Loader2 className="animate-spin inline-block mr-2" size={16} />
                      Loading articles...
                    </td>
                  </tr>
                ) : filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      No articles found.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                        {post.title}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-600 dark:text-purple-400">
                        /blog/{post.slug}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {post.category}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {post.author}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          post.status === "published"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-purple-600 transition-colors"
                          >
                            <Eye size={14} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleEditPost(post.id)}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 max-w-md w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Create New Article</h3>
              <form onSubmit={handleCreatePost} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Article Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How to Save Instagram Audio"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Category</label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none text-zinc-900 dark:text-white"
                  >
                    <option value="Guides">Guides</option>
                    <option value="Troubleshooting">Troubleshooting</option>
                    <option value="Privacy">Privacy</option>
                    <option value="Creators">Creators</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                  >
                    Create Article
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // POST EDITOR
  const v = selectedPost.version || {};

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingPostId(null);
              setSelectedPost(null);
              fetchPosts();
            }}
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {selectedPost.title}
            </h2>
            <p className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
              /blog/{selectedPost.slug} ({selectedPost.status})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mr-2">
              {saveStatus}
            </span>
          )}

          <button
            type="button"
            onClick={handleSavePost}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Save size={14} />
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={handlePublishPost}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-red-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            <CheckCircle2 size={14} />
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Content & Blocks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Article Header</h3>
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Title</label>
              <input
                type="text"
                value={selectedPost.title}
                onChange={(e) => setSelectedPost({ ...selectedPost, title: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Excerpt / Summary</label>
              <textarea
                rows={2}
                value={selectedPost.excerpt || ""}
                onChange={(e) => setSelectedPost({ ...selectedPost, excerpt: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Structured blocks */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Article Blocks</h3>
            {(v.blocks || []).map((b: ContentBlock, i: number) => (
              <div key={b.id || i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase">
                  <span>{b.type.replace(/_/g, " ")}</span>
                  <span>#{i + 1}</span>
                </div>
                <input
                  type="text"
                  placeholder="Heading"
                  value={b.heading || ""}
                  onChange={(e) => {
                    const blocks = [...v.blocks];
                    blocks[i] = { ...blocks[i], heading: e.target.value };
                    setSelectedPost({ ...selectedPost, version: { ...v, blocks } });
                  }}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                />
                <textarea
                  rows={4}
                  placeholder="Content"
                  value={typeof b.content === "string" ? b.content : JSON.stringify(b.content, null, 2)}
                  onChange={(e) => {
                    const blocks = [...v.blocks];
                    blocks[i] = { ...blocks[i], content: e.target.value };
                    setSelectedPost({ ...selectedPost, version: { ...v, blocks } });
                  }}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Metadata & SEO */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Publishing Details</h3>
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Slug</label>
              <input
                type="text"
                value={selectedPost.slug}
                onChange={(e) => setSelectedPost({ ...selectedPost, slug: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Category</label>
              <select
                value={selectedPost.category}
                onChange={(e) => setSelectedPost({ ...selectedPost, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
              >
                <option value="Guides">Guides</option>
                <option value="Troubleshooting">Troubleshooting</option>
                <option value="Privacy">Privacy</option>
                <option value="Creators">Creators</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Author</label>
              <input
                type="text"
                value={selectedPost.author}
                onChange={(e) => setSelectedPost({ ...selectedPost, author: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
