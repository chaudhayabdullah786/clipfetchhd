import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { 
  Download, 
  Instagram, 
  LayoutDashboard, 
  LogOut, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Globe, 
  Moon, 
  Sun,
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Copy,
  Check,
  X,
  RefreshCw,
  FileVideo,
  Clock,
  Sparkles,
  HelpCircle,
  Info,
  BarChart3,
  FileText,
  BookOpen,
  Search,
  DollarSign
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ThemeProvider, useTheme } from "./theme";
import { PublicPageView } from "./components/public/PublicPageView";
import { BlogIndex } from "./components/public/BlogIndex";
import { BlogPostView } from "./components/public/BlogPostView";
import { PageContentManager } from "./components/admin/PageContentManager";
import { BlogManager } from "./components/admin/BlogManager";
import { SeoManager } from "./components/admin/SeoManager";
import { AdManager } from "./components/admin/AdManager";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Instagram size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-red-500">
                ClipFetchHD
              </span>
              <span className="text-[10px] -mt-1 font-medium text-zinc-400 dark:text-zinc-500">HD Downloader</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Downloader
            </Link>
            <Link to="/how-it-works" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              How It Works
            </Link>
            <Link to="/blog" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Guides & Blog
            </Link>
            <Link to="/faq" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              FAQ
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-zinc-700" />}
          </button>
          <Link
            to="/admin"
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Admin Portal"
            aria-label="Admin Portal"
          >
            <ShieldCheck size={18} />
          </Link>
        </div>
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer className="py-14 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
    <div className="max-w-7xl mx-auto px-4 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white text-xs">
              <Instagram size={14} />
            </div>
            <span>ClipFetchHD</span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
            Ultra-fast, watermark-free Instagram Reel & video downloader. Direct original bitrate preservation from CDN.
          </p>
        </div>

        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Tools & Utilities</h4>
          <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <li><Link to="/" className="hover:text-purple-600 transition-colors">Instagram Reel Downloader</Link></li>
            <li><Link to="/how-it-works" className="hover:text-purple-600 transition-colors">How It Works</Link></li>
            <li><Link to="/faq" className="hover:text-purple-600 transition-colors">Frequently Asked Questions</Link></li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Content & Guides</h4>
          <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <li><Link to="/blog" className="hover:text-purple-600 transition-colors">Instagram Guides & Blog</Link></li>
            <li><Link to="/about" className="hover:text-purple-600 transition-colors">About ClipFetchHD</Link></li>
            <li><Link to="/contact" className="hover:text-purple-600 transition-colors">Contact Support</Link></li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Compliance & Legal</h4>
          <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <li><Link to="/privacy-policy" className="hover:text-purple-600 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-purple-600 transition-colors">Terms of Service</Link></li>
            <li><Link to="/dmca" className="hover:text-purple-600 transition-colors">DMCA Takedown Notice</Link></li>
          </ul>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center space-y-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          &copy; {new Date().getFullYear()} ClipFetchHD. All rights reserved.
        </p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-2xl mx-auto">
          Disclaimer: This service is an independent utility and is not affiliated with, endorsed, or certified by Instagram or Meta Platforms, Inc.
        </p>
      </div>
    </div>
  </footer>
);

// --- User-Side: HomePage ---

type DownloaderState = "idle" | "fetching" | "success" | "error";

interface DiagnosticsInfo {
  requestId: string;
  shortcode?: string;
  provider: string;
  providerConfigured: boolean;
  providerStatus: number | null;
  videoFound: boolean;
  verification: "passed" | "failed" | "skipped";
  failureCode: string | null;
  processingTimeMs: number;
}

interface ReelData {
  shortcode: string;
  requestedUrl: string;
  normalizedUrl: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  username: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  quality?: string | null;
  verified: boolean;
  previewId?: string;
  downloadId: string;
  downloadUrl?: string;
  previewUrl?: string;
}

interface ExtractionErrorData {
  code: string;
  message: string;
  details?: string;
}

const LOADING_STEPS = [
  "Validating Instagram Reel URL...",
  "Querying Reel metadata...",
  "Verifying video stream from CDN...",
  "Preparing high-definition download..."
];

const HomePage = () => {
  const [downloaderState, setDownloaderState] = useState<DownloaderState>("idle");
  const [url, setUrl] = useState("");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [result, setResult] = useState<ReelData | null>(null);
  const [error, setError] = useState<ExtractionErrorData | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsInfo | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Progressive loading indicator text
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (downloaderState === "fetching") {
      timer = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1200);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(timer);
  }, [downloaderState]);

  // Clean up ongoing network requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Check URL format for real-time hint
  const trimmedUrl = url.trim();
  const isInstaPattern = /instagram\.com\/(reel|reels|p|tv)\/[A-Za-z0-9_-]+/i.test(trimmedUrl);
  const hasInput = trimmedUrl.length > 0;

  const handleDownload = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!trimmedUrl || downloaderState === "fetching") return;

    // Abort previous in-flight request if user triggered again
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    console.log("[Downloader] request started");

    const clientRequestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    setDownloaderState("fetching");
    setError(null);
    setResult(null);
    setDiagnostics(null);

    try {
      const response = await fetch("/api/reels/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl, requestId: clientRequestId }),
        signal: controller.signal
      });

      const json = await response.json();

      if (controller.signal.aborted) return;

      if (response.ok && json.success && json.data && json.data.videoUrl) {
        setResult(json.data);
        setDiagnostics(json.diagnostics || null);
        setError(null);
        setDownloaderState("success");
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      } else {
        const errObj = json.error || {};
        setError({
          code: errObj.code || "EXTRACTION_FAILED",
          message: errObj.message || "Failed to retrieve this Instagram Reel. Please ensure the post is public.",
          details: errObj.details
        });
        setDiagnostics(json.diagnostics || null);
        setResult(null);
        setDownloaderState("error");
      }
    } catch (err: any) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        return;
      }
      setError({
        code: "NETWORK_ERROR",
        message: "Unable to connect to the downloader server. Please check your connection and try again."
      });
      setResult(null);
      setDownloaderState("error");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch {
      // Clipboard read permission might be denied
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUrl("");
    setError(null);
    setResult(null);
    setDiagnostics(null);
    setDownloaderState("idle");
  };

  const handleCopyLink = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.normalizedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex flex-col items-center">
      <div className="max-w-3xl w-full px-4 text-center space-y-8">
        
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Sparkles size={13} />
            <span>Direct Instagram HD Extractor</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Download Instagram <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600">
              Reels in HD
            </span>
          </h1>
          <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Paste any public Instagram Reel or Video URL to download original MP4 video in high definition without watermarks.
          </p>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleDownload} className="relative group text-left">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          
          <div className="relative flex flex-col md:flex-row gap-2 p-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="flex-1 flex items-center px-3 py-1">
              <input
                type="text"
                placeholder="https://www.instagram.com/reel/DU1E_VVDIYm/..."
                className="w-full py-2.5 bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 text-sm md:text-base font-medium"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={downloaderState === "fetching"}
              />
              {hasInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  title="Clear input"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePaste}
                className="px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 bg-zinc-50 dark:bg-zinc-800 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Copy size={14} />
                <span>Paste</span>
              </button>

              <button
                type="submit"
                disabled={downloaderState === "fetching" || !hasInput}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-red-500 to-yellow-500 hover:from-purple-700 hover:via-red-600 hover:to-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base whitespace-nowrap"
              >
                {downloaderState === "fetching" ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Fetching Reel...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time URL format helper */}
          {hasInput && downloaderState !== "fetching" && (
            <div className="mt-2 px-3 text-xs flex items-center gap-1.5">
              {isInstaPattern ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 size={13} /> Valid Instagram link format
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Info size={13} /> Must be an Instagram link (e.g. instagram.com/reel/...)
                </span>
              )}
            </div>
          )}
        </form>

        {/* SINGLE EXCLUSIVE RESULT AREA */}

        {/* 1. Multi-step Loading State */}
        {downloaderState === "fetching" && (
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="animate-spin text-purple-600" size={24} />
              <p className="font-semibold text-zinc-900 dark:text-white text-base">
                {LOADING_STEPS[loadingStepIndex]}
              </p>
            </div>
            
            {/* Progress indicator bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-red-500 h-full transition-all duration-700 ease-out"
                style={{ width: `${((loadingStepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Connecting directly to public media source without sample placeholders.
            </p>
          </div>
        )}

        {/* 2. Error Presentation Card (Rendered ONLY when downloaderState === "error") */}
        {downloaderState === "error" && error && (
          <div className="p-6 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900/40 text-left space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <AlertCircle size={22} className="text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-red-900 dark:text-red-200">
                  Extraction Failed
                </h3>
                <p className="text-sm font-normal text-red-700 dark:text-red-300 leading-relaxed">
                  {error.message}
                </p>
                {error.details && (
                  <p className="text-xs font-mono text-red-600 dark:text-red-400 opacity-90 pt-0.5">
                    {error.details}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-red-200/60 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 space-y-1.5">
              <p className="font-semibold">Helpful tips:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Make sure the Instagram account and Reel are set to <strong>Public</strong>.</li>
                <li>Private accounts or age-gated reels cannot be retrieved.</li>
                <li>Ensure the URL follows the format: <span className="font-mono">https://www.instagram.com/reel/SHORTCODE/</span></li>
              </ul>
            </div>

            {/* Diagnostic Information */}
            {diagnostics && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiagnostics((prev) => !prev)}
                  className="text-xs font-mono text-red-600 dark:text-red-400 underline hover:no-underline flex items-center gap-1"
                >
                  <span>{showDiagnostics ? "Hide" : "View"} Developer Diagnostics</span>
                </button>

                {showDiagnostics && (
                  <div className="mt-2 p-3 bg-red-100/50 dark:bg-red-900/30 rounded-xl font-mono text-[11px] space-y-1 text-red-800 dark:text-red-200">
                    <div>Request ID: {diagnostics.requestId}</div>
                    <div>Provider: {diagnostics.provider}</div>
                    <div>Failure Code: {diagnostics.failureCode || error.code}</div>
                    <div>HTTP Status: {diagnostics.providerStatus ?? "n/a"}</div>
                    <div>Processing Time: {diagnostics.processingTimeMs}ms</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDownload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Paste Another Link
              </button>
            </div>
          </div>
        )}

        {/* 3. Verified Result Card (Rendered ONLY when downloaderState === "success") */}
        {downloaderState === "success" && result && result.videoUrl && (
          <div
            ref={resultRef}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 text-left"
          >
            <div className="md:flex">
              {/* Media Preview Player */}
              <div className="md:w-5/12 bg-black relative flex items-center justify-center aspect-[9/16] max-h-[480px]">
                <video
                  src={result.videoUrl}
                  poster={result.thumbnailUrl || undefined}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Media Details & Download Actions */}
              <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 size={14} />
                      Verified Instagram Stream
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      ID: {result.shortcode}
                    </span>
                  </div>

                  {result.username && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {result.username.charAt(0).toUpperCase()}
                      </div>
                      <span>@{result.username}</span>
                    </div>
                  )}

                  {result.caption ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">
                      {result.caption}
                    </p>
                  ) : (
                    <p className="text-sm italic text-zinc-400">Instagram Reel Video</p>
                  )}

                  <div className="flex flex-wrap gap-3 pt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                      <FileVideo size={13} /> {result.quality || "HD Video"}
                    </span>
                    {result.duration && (
                      <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                        <Clock size={13} /> {result.duration}s
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                      MP4 Format
                    </span>
                  </div>

                  {/* Provider & Diagnostic Badge */}
                  {diagnostics && (
                    <div className="pt-2 text-[11px] text-zinc-400 font-mono flex items-center gap-3">
                      <span>Provider: {diagnostics.provider}</span>
                      <span>Latency: {diagnostics.processingTimeMs}ms</span>
                    </div>
                  )}
                </div>

                {/* Download Actions */}
                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <a
                    href={result.downloadUrl || `/api/download/${result.downloadId}`}
                    download
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-purple-600 via-red-500 to-yellow-500 hover:from-purple-700 hover:via-red-600 hover:to-yellow-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 transition-transform active:scale-95 text-base"
                  >
                    <Download size={20} />
                    <span>Download HD Video (.mp4)</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-xl text-xs transition-colors"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copied ? "Copied!" : "Copy Link"}</span>
                    </button>

                    <a
                      href={result.normalizedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-xl text-xs transition-colors"
                    >
                      <ExternalLink size={14} />
                      <span>View on Instagram</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full text-center py-2 text-xs font-medium text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Download another Reel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8">
          {[
            {
              icon: <TrendingUp className="text-purple-500" size={20} />,
              title: "Original HD Quality",
              desc: "Downloads directly from the highest-bitrate video stream available on Instagram's media network."
            },
            {
              icon: <ShieldCheck className="text-blue-500" size={20} />,
              title: "100% Private & Safe",
              desc: "No login or account permissions required. Media is processed via secure temporary proxy tokens."
            },
            {
              icon: <Download className="text-red-500" size={20} />,
              title: "Free & Unlimited",
              desc: "Download as many public reels, video posts, and IGTV clips as you want without restrictions."
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-left space-y-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">{feature.title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="pt-12 text-left space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-purple-500" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Frequently Asked Questions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">How do I download an Instagram Reel?</h4>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Open Instagram, tap the Share icon on any Reel, choose "Copy link", then paste it into the box above and click Download.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Can I download private Instagram Reels?</h4>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                No. For privacy and legal reasons, our service only retrieves media from public Instagram accounts and posts.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Where are downloaded videos saved?</h4>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Videos are saved as standard .mp4 files in your browser or device's default "Downloads" folder.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Does this site show fake or demo videos?</h4>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Never. If a reel cannot be extracted due to privacy or restrictions, you will receive an honest status error instead of unrelated sample media.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Admin Authentication (No leaked credentials on screen) ---

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = sessionStorage.getItem("admin_token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch("/api/admin/session", {
          credentials: "include",
          headers
        });
        if (res.ok) {
          navigate("/admin/dashboard", { replace: true });
        }
      } catch {
        // Unauthenticated - stay on login page
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Send trimmed username, but password is NEVER trimmed or altered
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          sessionStorage.setItem("admin_token", data.token);
        }

        // Section 11 & 12: Verify session before redirecting UI
        const authHeaders: Record<string, string> = {};
        if (data.token) {
          authHeaders["Authorization"] = `Bearer ${data.token}`;
        }

        const sessionRes = await fetch("/api/admin/session", {
          credentials: "include",
          headers: authHeaders
        });

        if (!sessionRes.ok) {
          setError("Failed to verify authenticated session. Please try again.");
          return;
        }

        const sessionData = await sessionRes.json();
        if (!sessionData.authenticated) {
          setError("Failed to verify authenticated session. Please try again.");
          return;
        }

        navigate("/admin/dashboard", { replace: true });
      } else {
        setError(data.error || "Invalid username or password.");
      }
    } catch {
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-lg">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Portal</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sign in with authorized administrator credentials.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Admin Username
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm text-zinc-900 dark:text-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm text-zinc-900 dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/40 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs text-zinc-500 hover:text-purple-600 transition-colors">
            &larr; Back to Downloader
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- Admin Analytics Dashboard (Phase 4L & 4M) ---

const AdminDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "blog" | "seo" | "ads">("overview");
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem("admin_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const [res, pRes] = await Promise.all([
        fetch("/api/admin/stats", { credentials: "include", headers }),
        fetch("/api/admin/provider-status", { credentials: "include", headers })
      ]);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        sessionStorage.removeItem("admin_token");
        navigate("/admin", { replace: true });
        return;
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setProviderStatus(pData);
      }
    } catch {
      sessionStorage.removeItem("admin_token");
      navigate("/admin", { replace: true });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem("admin_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      await fetch("/api/admin/logout", { method: "POST", credentials: "include", headers });
    } catch {
      // Ignore network error during logout
    } finally {
      sessionStorage.removeItem("admin_token");
      navigate("/admin", { replace: true });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#14b8a6", "#f43f5e"];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Admin Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                Live
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Real-time platform traffic, extraction metrics, and audit history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shadow-sm cursor-pointer"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0",
              activeTab === "overview"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <BarChart3 size={14} />
            <span>Overview & Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pages")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0",
              activeTab === "pages"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <FileText size={14} />
            <span>Page Content</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("blog")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0",
              activeTab === "blog"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <BookOpen size={14} />
            <span>Blog & Guides</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0",
              activeTab === "seo"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <Search size={14} />
            <span>SEO Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ads")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0",
              activeTab === "ads"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <DollarSign size={14} />
            <span>Ad Slots</span>
          </button>
        </div>

        {activeTab === "pages" && (
          <PageContentManager authToken={sessionStorage.getItem("admin_token")} />
        )}

        {activeTab === "blog" && (
          <BlogManager authToken={sessionStorage.getItem("admin_token")} />
        )}

        {activeTab === "seo" && (
          <SeoManager 
            authToken={sessionStorage.getItem("admin_token")} 
            onNavigateToPage={() => setActiveTab("pages")}
          />
        )}

        {activeTab === "ads" && (
          <AdManager authToken={sessionStorage.getItem("admin_token")} />
        )}

        {activeTab === "overview" && (
          <>
        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              label: "Total Site Visitors",
              value: stats.totalVisitors,
              icon: <Users className="text-blue-500" size={20} />,
              color: "bg-blue-500/10",
              sub: "Recorded visits"
            },
            {
              label: "Successful Downloads",
              value: stats.totalDownloads,
              icon: <Download className="text-purple-500" size={20} />,
              color: "bg-purple-500/10",
              sub: "Completed stream exports"
            },
            {
              label: "Extraction Success Rate",
              value: `${stats.successRate}%`,
              icon: <TrendingUp className="text-emerald-500" size={20} />,
              color: "bg-emerald-500/10",
              sub: `${stats.failedExtractions || 0} failed attempts`
            },
            {
              label: "Today's Downloads",
              value: stats.todayDownloads,
              icon: <Clock className="text-orange-500" size={20} />,
              color: "bg-orange-500/10",
              sub: "Past 24-hour window"
            }
          ].map((stat, i) => (
            <div
              key={i}
              className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.color)}>
                  {stat.icon}
                </div>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{stat.sub}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white mt-0.5">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Provider Status & Health Info */}
        {providerStatus && (
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Extraction Engine & Provider Status</h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Active: <span className="font-semibold text-purple-600 dark:text-purple-400">{providerStatus.provider.toUpperCase()}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-1">
                <span className="text-zinc-400">Engine Readiness</span>
                <p className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  {providerStatus.configured ? "Configured & Ready" : "Unconfigured"}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-1">
                <span className="text-zinc-400">Direct Crawler Engine</span>
                <p className="font-bold text-zinc-800 dark:text-zinc-200">
                  {providerStatus.hasDirect ? "Enabled (Facebook Crawler Embed)" : "Disabled"}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-1">
                <span className="text-zinc-400">External Provider API</span>
                <p className="font-bold text-zinc-800 dark:text-zinc-200">
                  {providerStatus.hasExternal ? "API Configured" : "Not configured (Direct only)"}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-1">
                <span className="text-zinc-400">Last Failure Code</span>
                <p className="font-bold font-mono text-zinc-800 dark:text-zinc-200">
                  {providerStatus.recentFailureCode || "None (Clean)"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Charts Row 1: Daily Visitors & Daily Downloads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Visitors Line Chart */}
          <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Daily Visitors</h3>
                <p className="text-xs text-zinc-400">Visitor volume over the past 7 days</p>
              </div>
              <Users size={18} className="text-zinc-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyVisitors}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    itemStyle={{ color: "#8b5cf6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#8b5cf6" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Extractions Success vs Failed Bar Chart */}
          <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Extraction Performance</h3>
                <p className="text-xs text-zinc-400">Successful downloads vs restricted/failed attempts</p>
              </div>
              <Download size={18} className="text-zinc-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.extractionsComparison}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  />
                  <Bar dataKey="successful" name="Success" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Country Distribution & Error Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country Traffic Pie */}
          <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Geographic Traffic</h3>
                <p className="text-xs text-zinc-400">Visitor distribution by country</p>
              </div>
              <Globe size={18} className="text-zinc-400" />
            </div>

            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.countryTraffic}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.countryTraffic.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {stats.countryTraffic.slice(0, 8).map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-zinc-600 dark:text-zinc-400 truncate">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Breakdown Card */}
          <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Extraction Audit Diagnostics</h3>
                <p className="text-xs text-zinc-400">Failure code frequencies for extraction reliability</p>
              </div>
              <AlertCircle size={18} className="text-zinc-400" />
            </div>

            {stats.errorBreakdown && stats.errorBreakdown.length > 0 ? (
              <div className="space-y-3">
                {stats.errorBreakdown.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {item.code}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {item.code === "PRIVATE_OR_RESTRICTED_REEL" && "User submitted private/restricted post"}
                        {item.code === "INVALID_INSTAGRAM_URL" && "Malformed or non-Instagram URL submitted"}
                        {item.code === "REEL_EXTRACTION_FAILED" && "Instagram anti-scraping / loginwall encountered"}
                        {item.code === "RATE_LIMITED" && "Client exceeded threshold rate limits"}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold font-mono">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400 space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                <p className="text-sm font-medium">No errors recorded yet</p>
                <p className="text-xs">All download requests have executed cleanly.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Audit Table (Phase 4M) */}
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Download Activity</h3>
              <p className="text-xs text-zinc-400">Audit log of the latest Reel extraction and download requests</p>
            </div>
            <LayoutDashboard size={18} className="text-zinc-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Reel Shortcode</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity: any) => (
                    <tr key={activity.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {activity.created_at}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {activity.shortcode !== "unknown" ? (
                          <a
                            href={`https://www.instagram.com/reel/${activity.shortcode}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                          >
                            <span>{activity.shortcode}</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-zinc-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {activity.success === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                            <CheckCircle2 size={12} />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[11px] font-semibold font-mono">
                            <AlertCircle size={12} />
                            {activity.failure_code || "FAILED"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        {activity.country || "Global"}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        {activity.processing_time_ms ? `${activity.processing_time_ms}ms` : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      No downloads recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}

      </div>
    </div>
  );
};

// --- Main Application ---

function MainLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPostView />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<PublicPageView />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <MainLayout />
      </Router>
    </ThemeProvider>
  );
}
