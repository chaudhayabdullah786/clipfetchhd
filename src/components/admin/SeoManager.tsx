import React, { useState, useEffect } from "react";
import { 
  Globe, 
  Save, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ExternalLink, 
  RefreshCw, 
  FileText, 
  Search,
  Code
} from "lucide-react";
import { GlobalSeoSettings, SeoIssue } from "../../types/cms";

interface SeoManagerProps {
  authToken?: string | null;
  onNavigateToPage?: (pageId: number) => void;
}

export const SeoManager: React.FC<SeoManagerProps> = ({ authToken, onNavigateToPage }) => {
  const [settings, setSettings] = useState<GlobalSeoSettings | null>(null);
  const [issues, setIssues] = useState<SeoIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const getHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    return headers;
  };

  const fetchSeo = async () => {
    setLoading(true);
    try {
      const [resSettings, resAudit] = await Promise.all([
        fetch("/api/admin/seo/settings", { headers: getHeaders(), credentials: "include" }),
        fetch("/api/admin/seo/audit", { headers: getHeaders(), credentials: "include" })
      ]);
      if (resSettings.ok) {
        const data = await resSettings.json();
        setSettings(data);
      }
      if (resAudit.ok) {
        const data = await resAudit.json();
        setIssues(data);
      }
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeo();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaveStatus("Saving...");
    try {
      const res = await fetch("/api/admin/seo/settings", {
        method: "PUT",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus("Saved successfully!");
        setTimeout(() => setSaveStatus(""), 2500);
      } else {
        setSaveStatus("Failed to save settings");
      }
    } catch {
      setSaveStatus("Connection error saving");
    }
  };

  const runAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/admin/seo/audit", {
        headers: getHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } finally {
      setAuditLoading(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-12 text-center text-zinc-400">
        Loading SEO engine settings...
      </div>
    );
  }

  const errors = issues.filter(i => i.severity === "ERROR");
  const warnings = issues.filter(i => i.severity === "WARNING");
  const infos = issues.filter(i => i.severity === "INFO");

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Global SEO Engine</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Control sitewide metadata, sitemaps, robots.txt, schema presets, and run automated health audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>sitemap.xml</span>
            <ExternalLink size={12} />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>robots.txt</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* SEO Health Audit Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">SEO Health & Content Audit</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold">
              Live Evaluation
            </span>
          </div>

          <button
            type="button"
            onClick={runAudit}
            disabled={auditLoading}
            className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            <RefreshCw size={12} className={auditLoading ? "animate-spin" : ""} />
            <span>Re-run Audit</span>
          </button>
        </div>

        {/* Audit Stats Banner */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 flex items-center justify-between">
            <div className="text-xs font-semibold">Errors (High Priority)</div>
            <div className="text-lg font-black">{errors.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-between">
            <div className="text-xs font-semibold">Warnings (Optimizations)</div>
            <div className="text-lg font-black">{warnings.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-between">
            <div className="text-xs font-semibold">Notices / Info</div>
            <div className="text-lg font-black">{infos.length}</div>
          </div>
        </div>

        {/* Actionable Issues List */}
        {issues.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 size={16} />
            <span>All pages pass complete SEO standards! No missing titles or descriptions detected.</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 flex items-start justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  {issue.severity === "ERROR" ? (
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  ) : issue.severity === "WARNING" ? (
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-white">
                      {issue.page_name} <span className="font-mono text-purple-600 font-normal">({issue.route})</span>: {issue.issue}
                    </div>
                    <div className="text-zinc-500 dark:text-zinc-400 mt-0.5 text-[11px]">
                      {issue.recommendation}
                    </div>
                  </div>
                </div>

                {onNavigateToPage && (
                  <button
                    type="button"
                    onClick={() => onNavigateToPage(issue.page_id)}
                    className="shrink-0 text-purple-600 dark:text-purple-400 font-semibold hover:underline text-[11px] cursor-pointer"
                  >
                    Edit Page
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Global Sitewide Defaults</h3>
          <div className="flex items-center gap-2">
            {saveStatus && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mr-2">
                {saveStatus}
              </span>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Site Name</label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Site Tagline</label>
            <input
              type="text"
              value={settings.site_tagline}
              onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Production Base URL (for Canonical & Sitemaps)</label>
            <input
              type="text"
              value={settings.production_base_url}
              onChange={(e) => setSettings({ ...settings, production_base_url: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Default SEO Title Template</label>
            <input
              type="text"
              value={settings.default_seo_title}
              onChange={(e) => setSettings({ ...settings, default_seo_title: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Default Meta Description</label>
            <textarea
              rows={2}
              value={settings.default_meta_description}
              onChange={(e) => setSettings({ ...settings, default_meta_description: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Google Search Console Verification Tag</label>
            <input
              type="text"
              placeholder="e.g. googled9a72..."
              value={settings.search_console_verification || ""}
              onChange={(e) => setSettings({ ...settings, search_console_verification: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Bing Webmaster Verification Tag</label>
            <input
              type="text"
              placeholder="e.g. 78BF6..."
              value={settings.bing_verification || ""}
              onChange={(e) => setSettings({ ...settings, bing_verification: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Google Analytics 4 Measurement ID</label>
            <input
              type="text"
              placeholder="e.g. G-XXXXXXXXXX"
              value={settings.ga4_measurement_id || ""}
              onChange={(e) => setSettings({ ...settings, ga4_measurement_id: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Default Robots Directive</label>
            <input
              type="text"
              value={settings.default_robots}
              onChange={(e) => setSettings({ ...settings, default_robots: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none"
            />
          </div>
        </div>
      </form>
    </div>
  );
};
