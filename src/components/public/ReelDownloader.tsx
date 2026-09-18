import React, { useState, useEffect, useRef } from "react";
import { 
  Download, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  Info,
  FileVideo,
  Clock,
  ExternalLink
} from "lucide-react";

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

export const ReelDownloader: React.FC = () => {
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

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const trimmedUrl = url.trim();
  const isInstaPattern = /instagram\.com\/(reel|reels|p|tv)\/[A-Za-z0-9_-]+/i.test(trimmedUrl);
  const hasInput = trimmedUrl.length > 0;

  const handleDownload = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!trimmedUrl || downloaderState === "fetching") return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
    <div className="w-full max-w-3xl mx-auto space-y-6 text-center">
      {/* Downloader Input Form */}
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
              className="px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 bg-zinc-50 dark:bg-zinc-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy size={14} />
              <span>Paste</span>
            </button>

            <button
              type="submit"
              disabled={downloaderState === "fetching" || !hasInput}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-red-500 to-yellow-500 hover:from-purple-700 hover:via-red-600 hover:to-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base whitespace-nowrap cursor-pointer"
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

      {/* 1. Multi-step Loading State */}
      {downloaderState === "fetching" && (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="animate-spin text-purple-600" size={24} />
            <p className="font-semibold text-zinc-900 dark:text-white text-base">
              {LOADING_STEPS[loadingStepIndex]}
            </p>
          </div>
          
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

      {/* 2. Error Presentation Card */}
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

          {diagnostics && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDiagnostics((prev) => !prev)}
                className="text-xs font-mono text-red-600 dark:text-red-400 underline hover:no-underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showDiagnostics ? "Hide" : "View"} Developer Diagnostics</span>
              </button>

              {showDiagnostics && (
                <div className="mt-3 p-3 bg-red-100/60 dark:bg-red-950/50 rounded-xl font-mono text-[11px] space-y-1 text-red-800 dark:text-red-300">
                  <div>Request ID: {diagnostics.requestId}</div>
                  <div>Provider: {diagnostics.provider} (Configured: {diagnostics.providerConfigured ? "yes" : "no"})</div>
                  <div>HTTP Status: {diagnostics.providerStatus ?? "N/A"}</div>
                  <div>Video Found: {diagnostics.videoFound ? "yes" : "no"}</div>
                  <div>Verification: {diagnostics.verification}</div>
                  <div>Failure Code: {diagnostics.failureCode || "UNKNOWN"}</div>
                  <div>Processing Time: {diagnostics.processingTimeMs}ms</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Verified Media Success Card */}
      {downloaderState === "success" && result && (
        <div
          ref={resultRef}
          className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl text-left space-y-6 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-56 shrink-0 aspect-[9/16] max-h-80 bg-zinc-950 rounded-2xl overflow-hidden relative shadow-inner border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
              <video
                src={result.previewUrl || `/preview/${result.downloadId}`}
                poster={result.thumbnailUrl || undefined}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 size={14} />
                  <span>Stream Verified & Ready</span>
                </div>
                {result.quality && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {result.quality}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white line-clamp-2">
                  {result.caption ? result.caption : `Instagram Reel (${result.shortcode})`}
                </h3>
                {result.username && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Creator: <span className="font-semibold text-zinc-800 dark:text-zinc-200">@{result.username}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                <div className="flex items-center gap-2">
                  <FileVideo size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Format: MP4 (H.264)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Duration: {result.duration ? `${Math.round(result.duration)}s` : "Normal"}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={result.downloadUrl || `/download/${result.downloadId}`}
                  download={`instagram_reel_${result.shortcode}.mp4`}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 via-red-500 to-yellow-500 hover:from-purple-700 hover:via-red-600 hover:to-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base text-center cursor-pointer"
                >
                  <Download size={18} />
                  <span>Download Video (MP4)</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  title="Copy clean Reel URL"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
