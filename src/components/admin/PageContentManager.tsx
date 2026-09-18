import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Globe, 
  Share2, 
  Code, 
  DollarSign, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Sun, 
  Moon, 
  ArrowLeft,
  Loader2,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { CmsPage, CmsPageVersion, ContentBlock } from "../../types/cms";
import { BlockRenderer } from "../public/BlockRenderer";
import { ReelDownloader } from "../public/ReelDownloader";

interface PageContentManagerProps {
  authToken?: string | null;
}

export const PageContentManager: React.FC<PageContentManagerProps> = ({ authToken }) => {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTool, setFilterTool] = useState<string>("all");

  // Editor State
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [selectedPage, setSelectedPage] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "seo" | "social" | "schema" | "ads" | "preview" | "history">("content");
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");

  // New Page Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageData, setNewPageData] = useState({
    internal_name: "",
    route: "",
    page_type: "info",
    show_tool: false
  });
  const [createError, setCreateError] = useState("");

  const getHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    return headers;
  };

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms/pages", {
        headers: getHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleEditPage = async (pageId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cms/pages/${pageId}`, {
        headers: getHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPage(data);
        setEditingPageId(pageId);
        setActiveTab("content");
      }
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    try {
      const res = await fetch("/api/admin/cms/pages", {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(newPageData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        setNewPageData({ internal_name: "", route: "", page_type: "info", show_tool: false });
        await fetchPages();
        handleEditPage(data.pageId);
      } else {
        setCreateError(data.error || "Failed to create page");
      }
    } catch {
      setCreateError("Connection error creating page");
    }
  };

  const handleCreateDraft = async () => {
    if (!editingPageId) return;
    try {
      const res = await fetch(`/api/admin/cms/pages/${editingPageId}/draft`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({ change_note: "Draft created by admin" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await handleEditPage(editingPageId);
        setSaveStatus("New draft version created");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } catch {
      // Error
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedPage || !selectedPage.active_version) return;
    const version = selectedPage.active_version;
    setSaveStatus("Saving...");
    try {
      const res = await fetch(`/api/admin/cms/versions/${version.id}`, {
        method: "PUT",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({
          ...version,
          show_tool: selectedPage.show_tool,
          internal_name: selectedPage.internal_name
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus("Saved successfully!");
        setTimeout(() => setSaveStatus(""), 2500);
      } else {
        setSaveStatus(data.error || "Failed to save draft");
      }
    } catch {
      setSaveStatus("Error saving changes");
    }
  };

  const handlePublish = async () => {
    if (!selectedPage || !selectedPage.active_version) return;
    const version = selectedPage.active_version;
    setSaveStatus("Publishing...");
    try {
      // Save any pending changes first
      await fetch(`/api/admin/cms/versions/${version.id}`, {
        method: "PUT",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({
          ...version,
          show_tool: selectedPage.show_tool,
          internal_name: selectedPage.internal_name
        })
      });

      const res = await fetch(`/api/admin/cms/versions/${version.id}/publish`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus("Published live!");
        await handleEditPage(selectedPage.id);
        await fetchPages();
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus(data.error || "Failed to publish");
      }
    } catch {
      setSaveStatus("Error publishing version");
    }
  };

  const handleRollback = async (targetVersionId: number) => {
    if (!editingPageId) return;
    if (!confirm("Are you sure you want to restore this historical version? A new published version will be created.")) return;
    try {
      const res = await fetch(`/api/admin/cms/pages/${editingPageId}/rollback`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({ targetVersionId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await handleEditPage(editingPageId);
        await fetchPages();
        setSaveStatus("Restored version successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } catch {
      // Error
    }
  };

  // Block management inside active version
  const addBlock = (type: any) => {
    if (!selectedPage || !selectedPage.active_version) return;
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      heading: type === "faq_accordion" ? "Frequently Asked Questions" : "New Section Heading",
      content: type === "faq_accordion" ? [{ question: "Sample Question?", answer: "Sample Answer." }] : "Sample section text.",
      sort_order: (selectedPage.active_version.blocks?.length || 0) + 1,
      enabled: true,
      admin_label: `New ${type}`
    };

    setSelectedPage({
      ...selectedPage,
      active_version: {
        ...selectedPage.active_version,
        blocks: [...(selectedPage.active_version.blocks || []), newBlock]
      }
    });
  };

  const updateBlock = (index: number, updated: Partial<ContentBlock>) => {
    if (!selectedPage || !selectedPage.active_version) return;
    const blocks = [...(selectedPage.active_version.blocks || [])];
    blocks[index] = { ...blocks[index], ...updated };
    setSelectedPage({
      ...selectedPage,
      active_version: {
        ...selectedPage.active_version,
        blocks
      }
    });
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (!selectedPage || !selectedPage.active_version) return;
    const blocks = [...(selectedPage.active_version.blocks || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const temp = blocks[index];
    blocks[index] = blocks[targetIdx];
    blocks[targetIdx] = temp;
    // reassign sort_order
    blocks.forEach((b, i) => (b.sort_order = i + 1));
    setSelectedPage({
      ...selectedPage,
      active_version: {
        ...selectedPage.active_version,
        blocks
      }
    });
  };

  const deleteBlock = (index: number) => {
    if (!selectedPage || !selectedPage.active_version) return;
    const blocks = (selectedPage.active_version.blocks || []).filter((_: any, i: number) => i !== index);
    blocks.forEach((b: any, i: number) => (b.sort_order = i + 1));
    setSelectedPage({
      ...selectedPage,
      active_version: {
        ...selectedPage.active_version,
        blocks
      }
    });
  };

  const duplicateBlock = (index: number) => {
    if (!selectedPage || !selectedPage.active_version) return;
    const target = selectedPage.active_version.blocks[index];
    const clone: ContentBlock = {
      ...target,
      id: `block-${Date.now()}`,
      sort_order: target.sort_order + 1,
      admin_label: `${target.admin_label || target.type} (Copy)`
    };
    const blocks = [...selectedPage.active_version.blocks];
    blocks.splice(index + 1, 0, clone);
    blocks.forEach((b, i) => (b.sort_order = i + 1));
    setSelectedPage({
      ...selectedPage,
      active_version: {
        ...selectedPage.active_version,
        blocks
      }
    });
  };

  // Filtered pages list
  const filteredPages = pages.filter((p) => {
    if (search && !p.internal_name.toLowerCase().includes(search.toLowerCase()) && !p.route.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterTool === "tool_enabled" && !p.show_tool) return false;
    if (filterTool === "tool_disabled" && p.show_tool) return false;
    return true;
  });

  // PAGE LIST VIEW
  if (!editingPageId || !selectedPage) {
    return (
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Page Content Manager</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage landing pages, content blocks, downloader integration, and page-level SEO.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New Page</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={filterTool}
              onChange={(e) => setFilterTool(e.target.value)}
              className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value="all">All Pages</option>
              <option value="tool_enabled">Tool Enabled</option>
              <option value="tool_disabled">Tool Disabled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="py-3 px-4">Page Name</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Tool</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Indexable</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      <Loader2 className="animate-spin inline-block mr-2" size={16} />
                      Loading pages...
                    </td>
                  </tr>
                ) : filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      No matching pages found.
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((page) => (
                    <tr key={page.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                        {page.internal_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-600 dark:text-purple-400">
                        {page.route}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                        {page.page_type}
                      </td>
                      <td className="py-3.5 px-4">
                        {page.show_tool ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                            Tool Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[10px]">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          page.status === "published"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                        }`}>
                          {page.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {page.indexable ? (
                          <span className="text-zinc-700 dark:text-zinc-300">Index</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Noindex</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={page.route}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-purple-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="View public page"
                          >
                            <Eye size={14} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleEditPage(page.id)}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                            title="Edit page"
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

        {/* Create Page Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 max-w-md w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Create New CMS Page</h3>
              <form onSubmit={handleCreatePage} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Internal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Video Guide"
                    value={newPageData.internal_name}
                    onChange={(e) => setNewPageData({ ...newPageData, internal_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Route (must start with /)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /video-guide"
                    value={newPageData.route}
                    onChange={(e) => setNewPageData({ ...newPageData, route: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono outline-none text-zinc-900 dark:text-white"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    System routes (/admin, /api, /preview, /download) are strictly protected.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Page Type</label>
                  <select
                    value={newPageData.page_type}
                    onChange={(e) => setNewPageData({ ...newPageData, page_type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none text-zinc-900 dark:text-white"
                  >
                    <option value="info">Info / Standard Page</option>
                    <option value="guide">Guide / Tutorial</option>
                    <option value="downloader_landing">Downloader Landing Page</option>
                    <option value="legal">Legal / Compliance</option>
                    <option value="contact">Contact</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="modal_show_tool"
                    checked={newPageData.show_tool}
                    onChange={(e) => setNewPageData({ ...newPageData, show_tool: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <label htmlFor="modal_show_tool" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                    Show Downloader Tool at the top of this page
                  </label>
                </div>

                {createError && (
                  <div className="text-xs text-red-500 font-semibold pt-1">
                    {createError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Create Page
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PAGE EDITOR VIEW (7 TABS)
  const v = selectedPage.active_version || {};

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingPageId(null);
              setSelectedPage(null);
              fetchPages();
            }}
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Back to Pages List"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {selectedPage.internal_name}
              </h2>
              <span className="font-mono text-xs text-purple-600 dark:text-purple-400">
                {selectedPage.route}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                v{v.version_number || 1} ({v.status || "draft"})
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Editing version: {v.change_note || "Draft"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {saveStatus && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse mr-2">
              {saveStatus}
            </span>
          )}

          {v.status === "published" ? (
            <button
              type="button"
              onClick={handleCreateDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>New Draft</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Save size={14} />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={handlePublish}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-red-500 hover:from-purple-700 hover:to-red-600 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Publish Live</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 7 Tab Navigation */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto pb-1 text-xs">
        {[
          { id: "content", label: "1. Content", icon: FileText },
          { id: "seo", label: "2. SEO Metadata", icon: Globe },
          { id: "social", label: "3. Social Sharing", icon: Share2 },
          { id: "schema", label: "4. Schema JSON-LD", icon: Code },
          { id: "ads", label: "5. Ad Slots", icon: DollarSign },
          { id: "preview", label: "6. Responsive Preview", icon: Eye },
          { id: "history", label: "7. Version History", icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-zinc-900 border-t-2 border-purple-600 text-purple-600 dark:text-purple-400 border-x border-zinc-200 dark:border-zinc-800"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CONTENT & BLOCK BUILDER */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Primary Page Info Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Primary Page Attributes</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Primary H1 Heading (Exactly ONE per page)
                </label>
                <input
                  type="text"
                  value={v.h1 || ""}
                  onChange={(e) => setSelectedPage({
                    ...selectedPage,
                    active_version: { ...v, h1: e.target.value }
                  })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
                  placeholder="e.g. Instagram Reel Downloader"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Downloader Tool Integration
                </label>
                <div className="mt-1 flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    Render Downloader Component
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPage({
                      ...selectedPage,
                      show_tool: !selectedPage.show_tool
                    })}
                    className={`cursor-pointer ${selectedPage.show_tool ? "text-purple-600" : "text-zinc-400"}`}
                  >
                    {selectedPage.show_tool ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Introduction / Hero Subtext
              </label>
              <textarea
                rows={2}
                value={v.introduction || ""}
                onChange={(e) => setSelectedPage({
                  ...selectedPage,
                  active_version: { ...v, introduction: e.target.value }
                })}
                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
                placeholder="Brief intro paragraph appearing directly beneath H1."
              />
            </div>
          </div>

          {/* Structured Blocks List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Structured Content Blocks</h3>
              
              {/* Add block dropdown */}
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addBlock(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="">+ Add Content Block</option>
                  <option value="how_it_works_steps">How-It-Works Steps (3-step cards)</option>
                  <option value="feature_grid">Feature Grid</option>
                  <option value="benefits_grid">Benefits Grid</option>
                  <option value="faq_accordion">FAQ Accordion</option>
                  <option value="h2_section">H2 Section Heading</option>
                  <option value="h3_subsection">H3 Subsection</option>
                  <option value="paragraph">Standard Paragraph</option>
                  <option value="rich_text">Rich Text HTML</option>
                  <option value="important_note">Important Note (Purple Callout)</option>
                  <option value="warning_callout">Warning / Responsible Use (Amber)</option>
                  <option value="trust_legal_notice">Trust & Privacy Notice</option>
                  <option value="related_articles">Related Articles Links</option>
                  <option value="cta">Call to Action Banner</option>
                  <option value="ad_slot">Controlled Ad Slot</option>
                  <option value="divider">Horizontal Divider</option>
                </select>
              </div>
            </div>

            {(!v.blocks || v.blocks.length === 0) ? (
              <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-400 text-xs">
                No content blocks added yet. Click "+ Add Content Block" above to begin composing.
              </div>
            ) : (
              <div className="space-y-3">
                {v.blocks.map((block: ContentBlock, bIdx: number) => (
                  <div
                    key={block.id || bIdx}
                    className={`p-4 rounded-2xl bg-white dark:bg-zinc-900 border transition-all ${
                      block.enabled ? "border-zinc-200 dark:border-zinc-800" : "border-zinc-200 dark:border-zinc-800 opacity-60 bg-zinc-50 dark:bg-zinc-950"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-[10px]">
                          {bIdx + 1}
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-white uppercase text-[10px] tracking-wider">
                          {block.type.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateBlock(bIdx, { enabled: !block.enabled })}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                            block.enabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {block.enabled ? "Enabled" : "Disabled"}
                        </button>

                        <button
                          type="button"
                          onClick={() => moveBlock(bIdx, "up")}
                          disabled={bIdx === 0}
                          className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlock(bIdx, "down")}
                          disabled={bIdx === v.blocks.length - 1}
                          className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ChevronDown size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => duplicateBlock(bIdx)}
                          className="p-1 text-zinc-400 hover:text-purple-600 cursor-pointer"
                          title="Duplicate block"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBlock(bIdx)}
                          className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                          title="Delete block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Block Content Editor Form */}
                    <div className="pt-3 space-y-2">
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-500">Block Heading</label>
                        <input
                          type="text"
                          value={block.heading || ""}
                          onChange={(e) => updateBlock(bIdx, { heading: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white outline-none"
                        />
                      </div>

                      {typeof block.content === "string" ? (
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-500">Text Content</label>
                          <textarea
                            rows={3}
                            value={block.content || ""}
                            onChange={(e) => updateBlock(bIdx, { content: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-500">Structured Payload (JSON)</label>
                          <textarea
                            rows={4}
                            value={JSON.stringify(block.content, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                updateBlock(bIdx, { content: parsed });
                              } catch {
                                // Allow typing
                              }
                            }}
                            className="w-full mt-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-[11px] text-zinc-900 dark:text-white outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SEO METADATA */}
      {activeTab === "seo" && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Page SEO Metadata</h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <label>SEO Title (Ideal: 30–60 characters)</label>
                <span className={`text-[11px] ${(v.seo_title || "").length > 60 ? "text-amber-500" : "text-zinc-400"}`}>
                  {(v.seo_title || "").length} characters
                </span>
              </div>
              <input
                type="text"
                value={v.seo_title || ""}
                onChange={(e) => setSelectedPage({
                  ...selectedPage,
                  active_version: { ...v, seo_title: e.target.value }
                })}
                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <label>Meta Description (Ideal: 120–160 characters)</label>
                <span className={`text-[11px] ${(v.meta_description || "").length > 160 ? "text-amber-500" : "text-zinc-400"}`}>
                  {(v.meta_description || "").length} characters
                </span>
              </div>
              <textarea
                rows={3}
                value={v.meta_description || ""}
                onChange={(e) => setSelectedPage({
                  ...selectedPage,
                  active_version: { ...v, meta_description: e.target.value }
                })}
                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Canonical URL</label>
                <input
                  type="text"
                  value={v.canonical_url || ""}
                  placeholder={selectedPage.route}
                  onChange={(e) => setSelectedPage({
                    ...selectedPage,
                    active_version: { ...v, canonical_url: e.target.value }
                  })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Primary Target Keyword</label>
                <input
                  type="text"
                  value={v.primary_keyword || ""}
                  placeholder="e.g. instagram reel downloader"
                  onChange={(e) => setSelectedPage({
                    ...selectedPage,
                    active_version: { ...v, primary_keyword: e.target.value }
                  })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={v.robots_index !== false}
                  onChange={(e) => setSelectedPage({
                    ...selectedPage,
                    active_version: { ...v, robots_index: e.target.checked }
                  })}
                  className="rounded text-purple-600"
                />
                <span>Allow Indexing (robots: index)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={v.robots_follow !== false}
                  onChange={(e) => setSelectedPage({
                    ...selectedPage,
                    active_version: { ...v, robots_follow: e.target.checked }
                  })}
                  className="rounded text-purple-600"
                />
                <span>Follow Links (robots: follow)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SOCIAL SHARING */}
      {activeTab === "social" && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Open Graph & Twitter Cards</h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Social Open Graph Image URL</label>
              <input
                type="text"
                value={v.og_image || ""}
                placeholder="https://..."
                onChange={(e) => setSelectedPage({
                  ...selectedPage,
                  active_version: { ...v, og_image: e.target.value }
                })}
                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Image Alt Description</label>
              <input
                type="text"
                value={v.og_image_alt || ""}
                placeholder="Visual description for social card preview"
                onChange={(e) => setSelectedPage({
                  ...selectedPage,
                  active_version: { ...v, og_image_alt: e.target.value }
                })}
                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">OG Type</label>
                <select
                  value={v.og_type || "website"}
                  onChange={(e) => setSelectedPage({
                    ...selectedPage,
                    active_version: { ...v, og_type: e.target.value }
                  })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
                >
                  <option value="website">website</option>
                  <option value="article">article</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Twitter Card Format</label>
                <select
                  value={v.twitter_card || "summary_large_image"}
                  onChange={(e) => setSelectedPage({
                    ...selectedPage,
                    active_version: { ...v, twitter_card: e.target.value }
                  })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
                >
                  <option value="summary_large_image">summary_large_image</option>
                  <option value="summary">summary</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHEMA */}
      {activeTab === "schema" && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Structured Data (JSON-LD)</h3>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Schema Preset</label>
            <select
              value={v.schema_preset || "WebPage"}
              onChange={(e) => setSelectedPage({
                ...selectedPage,
                active_version: { ...v, schema_preset: e.target.value }
              })}
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
            >
              <option value="WebPage">WebPage (Default)</option>
              <option value="WebSite">WebSite (Homepage)</option>
              <option value="FAQPage">FAQPage</option>
              <option value="ContactPage">ContactPage</option>
              <option value="AboutPage">AboutPage</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Custom Injected Schema (Optional JSON)</label>
            <textarea
              rows={6}
              value={v.schema_json || ""}
              onChange={(e) => setSelectedPage({
                ...selectedPage,
                active_version: { ...v, schema_json: e.target.value }
              })}
              placeholder='{"@context": "https://schema.org", ...}'
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-zinc-900 dark:text-white outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB 5: ADS */}
      {activeTab === "ads" && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Ad Slot Configuration for this Page</h3>
          <p className="text-xs text-zinc-500">
            Ad slots are governed globally in the Ad Manager. On this page ({selectedPage.route}), eligible slots include:
          </p>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold">Below Downloader Sponsor Slot</span>
              <span className="text-zinc-400 font-mono">position: below_tool</span>
            </div>
            <p className="text-zinc-500 text-[11px]">
              Active only if "Show Downloader Tool" is enabled on this page.
            </p>
          </div>
        </div>
      )}

      {/* TAB 6: PREVIEW */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded-lg cursor-pointer ${previewDevice === "desktop" ? "bg-purple-100 dark:bg-purple-950 text-purple-600" : "text-zinc-400"}`}
                title="Desktop view"
              >
                <Monitor size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("tablet")}
                className={`p-1.5 rounded-lg cursor-pointer ${previewDevice === "tablet" ? "bg-purple-100 dark:bg-purple-950 text-purple-600" : "text-zinc-400"}`}
                title="Tablet view"
              >
                <Tablet size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded-lg cursor-pointer ${previewDevice === "mobile" ? "bg-purple-100 dark:bg-purple-950 text-purple-600" : "text-zinc-400"}`}
                title="Mobile view"
              >
                <Smartphone size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPreviewTheme(previewTheme === "light" ? "dark" : "light")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              {previewTheme === "light" ? <Moon size={14} /> : <Sun size={14} className="text-amber-400" />}
              <span>{previewTheme === "light" ? "Dark Preview" : "Light Preview"}</span>
            </button>
          </div>

          <div className="flex justify-center p-4 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className={`transition-all duration-300 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl overflow-y-auto max-h-[700px] border border-zinc-200 dark:border-zinc-800 ${
              previewDevice === "mobile" ? "w-[375px]" : previewDevice === "tablet" ? "w-[768px]" : "w-full"
            } ${previewTheme === "dark" ? "dark" : ""}`}>
              <div className="p-6 md:p-10 space-y-8">
                <div className="text-center space-y-3">
                  <h1 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-white">
                    {v.h1 || selectedPage.internal_name}
                  </h1>
                  {v.introduction && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
                      {v.introduction}
                    </p>
                  )}
                </div>

                {selectedPage.show_tool && (
                  <div className="p-4 rounded-2xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-center text-xs text-purple-700 dark:text-purple-300 font-mono">
                    [Live Downloader Tool Component Rendered Here]
                  </div>
                )}

                <BlockRenderer blocks={v.blocks || []} currentRoute={selectedPage.route} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: HISTORY & ROLLBACK */}
      {activeTab === "history" && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Version History & Rollback</h3>
          <p className="text-xs text-zinc-500">
            Immutable version audit trail. Restoring a version creates a new published version without mutating history.
          </p>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {(selectedPage.versions || []).map((ver: CmsPageVersion) => (
              <div key={ver.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-zinc-900 dark:text-white">
                      Version {ver.version_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      ver.status === "published"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {ver.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {ver.change_note || "Version update"} • {new Date(ver.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  {ver.id !== selectedPage.published_version_id && (
                    <button
                      type="button"
                      onClick={() => handleRollback(ver.id)}
                      className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-950 hover:text-purple-600 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Restore this Version
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
