import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Sparkles, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { CmsPage } from "../../types/cms";
import { ReelDownloader } from "./ReelDownloader";
import { BlockRenderer } from "./BlockRenderer";
import { AdSlotView } from "./AdSlotView";

interface PublicPageViewProps {
  forcedRoute?: string;
  previewData?: any;
}

export const PublicPageView: React.FC<PublicPageViewProps> = ({ forcedRoute, previewData }) => {
  const location = useLocation();
  const currentRoute = forcedRoute || location.pathname;

  const [page, setPage] = useState<any>(previewData || null);
  const [loading, setLoading] = useState(!previewData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (previewData) {
      setPage(previewData);
      setLoading(false);
      return;
    }

    // 1. Check if server injected initial data for this route
    try {
      const initialScript = document.getElementById("__INITIAL_DATA__");
      if (initialScript && initialScript.textContent) {
        const bootstrap = JSON.parse(initialScript.textContent);
        if (bootstrap.page && bootstrap.page.route === currentRoute) {
          setPage(bootstrap.page);
          setLoading(false);
          // Remove or clear script so subsequent client navigations fetch fresh data
          initialScript.removeAttribute("id");
          return;
        }
      }
    } catch {
      // Fallback to fetch
    }

    // 2. Fetch page from API
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/pages/by-route?route=${encodeURIComponent(currentRoute)}`);
        if (res.ok) {
          const data = await res.json();
          setPage(data);
          // Update client document title
          if (data.version?.seo_title) {
            document.title = data.version.seo_title;
          }
        } else if (res.status === 404) {
          setError("Page not found");
        } else {
          setError("Failed to load page");
        }
      } catch {
        setError("Network error loading page");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [currentRoute, previewData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Page Not Found</h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md text-sm">
          The requested page does not exist or has not been published yet.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Downloader</span>
        </Link>
      </div>
    );
  }

  const v = page.version || {};

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 space-y-12">
        {/* Page Hero & Downloader Tool (Section 6 & 11) */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Sparkles size={13} />
            <span>ClipFetchHD</span>
          </div>

          {/* Exactly ONE H1 tag per page */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            {v.h1 || page.internal_name}
          </h1>

          {v.introduction && (
            <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {v.introduction}
            </p>
          )}

          {v.supporting_text && (
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-500 max-w-xl mx-auto">
              {v.supporting_text}
            </p>
          )}
        </header>

        {/* Downloader Tool (rendered if show_tool is enabled on this page) */}
        {page.show_tool && (
          <div className="space-y-6">
            <ReelDownloader />
            <AdSlotView position="below_tool" currentRoute={currentRoute} />
          </div>
        )}

        {/* Structured Content Blocks */}
        {v.blocks && v.blocks.length > 0 && (
          <div className="cms-structured-blocks pt-4">
            <BlockRenderer blocks={v.blocks} currentRoute={currentRoute} />
          </div>
        )}
      </div>
    </div>
  );
};
