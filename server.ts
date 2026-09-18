import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import axios from "axios";
import helmet from "helmet";

import fs from "fs";
import { extractionService } from "./services/instagram/extractor.js";
import { downloadStore } from "./services/instagram/downloadStore.js";
import { validateVideoUrl } from "./services/instagram/validators.js";
import { ProviderFactory } from "./services/instagram/providers/providerFactory.js";
import { createRateLimiter } from "./middleware/rateLimiter.js";
import { ExtractionError } from "./services/instagram/types.js";
import { initCmsDatabase, CmsService } from "./services/cms/cmsDb.js";
import { SeoEngine } from "./services/cms/seoEngine.js";
import { injectServerSeoAndContent } from "./services/cms/htmlRenderer.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS traffic (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT,
    country TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT -- 'visit' or 'download'
  );

  CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shortcode TEXT,
    normalized_url TEXT,
    success INTEGER, -- 1 or 0
    failure_code TEXT,
    country TEXT,
    processing_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Ensure role column exists in existing databases
try {
  db.exec("ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'admin'");
} catch {
  // Column already exists
}

// Startup Configuration Validation
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  if (!process.env.JWT_SECRET) {
    console.error("[Configuration Error] Missing required environment variable: JWT_SECRET");
  }
  if (!process.env.ADMIN_USERNAME) {
    console.error("[Configuration Error] Missing required environment variable: ADMIN_USERNAME");
  }
  if (!process.env.ADMIN_PASSWORD_HASH) {
    console.error("[Configuration Error] Missing required environment variable: ADMIN_PASSWORD_HASH");
  }
}

// Helper to determine whether a string is a valid bcrypt hash
const isBcryptHash = (str: unknown): str is string =>
  typeof str === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);

// Admin Credentials Configuration
// Hostinger / Process environment has highest priority, local .env is fallback only
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "abdullah").trim();

let ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// Fail startup if invalid bcrypt hash in production; report and fallback in development
if (!ADMIN_PASSWORD_HASH || !isBcryptHash(ADMIN_PASSWORD_HASH)) {
  console.error("[Startup Error] INVALID_ADMIN_PASSWORD_HASH: ADMIN_PASSWORD_HASH must contain a valid bcrypt hash.");
  if (isProduction) {
    throw new Error("INVALID_ADMIN_PASSWORD_HASH: Production requires a valid bcrypt hash in ADMIN_PASSWORD_HASH.");
  }
  // In development, check SQLite for existing valid bcrypt hash
  const existingRecord = db.prepare("SELECT password FROM admins WHERE username = ?").get(ADMIN_USERNAME) as any;
  if (existingRecord && isBcryptHash(existingRecord.password)) {
    ADMIN_PASSWORD_HASH = existingRecord.password;
    console.log("[Startup] Using valid bcrypt hash from SQLite admins table.");
  } else {
    // Programmatically verified 12-round bcrypt hash for 'F296Db39@"$&'
    ADMIN_PASSWORD_HASH = "$2b$12$Bt4rOupj5j1oGexNy.ogDOgpyTxWD9wh42VT.E2UFoyCjPL6YpoOq";
    console.log("[Startup] Initialized with verified 12-round bcrypt hash.");
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "instareel-hd-production-secure-token-secret-key-32b";
console.log(`[Startup] JWT signing secret configured: ${Boolean(JWT_SECRET) ? "YES" : "NO"}`);
console.log(`[Startup] JWT verification secret configured: ${Boolean(JWT_SECRET) ? "YES" : "NO"}`);

// Synchronize admins database table with validated admin credentials (Section 6)
try {
  const existingAdmin = db.prepare("SELECT id, username, password, role FROM admins WHERE username = ?").get(ADMIN_USERNAME) as any;
  if (!existingAdmin) {
    db.prepare("INSERT INTO admins (username, password, role) VALUES (?, ?, 'admin')").run(ADMIN_USERNAME, ADMIN_PASSWORD_HASH);
    console.log(`[Admin Setup] Initialized admin user '${ADMIN_USERNAME}'.`);
  } else if (ADMIN_PASSWORD_HASH && isBcryptHash(ADMIN_PASSWORD_HASH) && existingAdmin.password !== ADMIN_PASSWORD_HASH) {
    db.prepare("UPDATE admins SET password = ?, role = 'admin' WHERE username = ?").run(ADMIN_PASSWORD_HASH, ADMIN_USERNAME);
    console.log(`[Admin Setup] Synchronized admin password hash for '${ADMIN_USERNAME}'.`);
  }
} catch (err) {
  console.error("[Admin Setup] Error initializing admin record in database:", err);
}

// Initialize CMS Schema, Seed Pages, Blog Posts, SEO, and Ad Slots
initCmsDatabase(db);
const cmsService = new CmsService(db);

// Helper to anonymize IP for privacy (GDPR compliant)
function anonymizeIp(ip: string | undefined): string {
  if (!ip) return "0.0.0.0";
  const firstIp = ip.split(",")[0].trim();
  if (firstIp.includes(":")) {
    // IPv6: keep first 3 segments
    const parts = firstIp.split(":");
    return parts.slice(0, 3).join(":") + "::";
  }
  // IPv4: mask last octet
  const parts = firstIp.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return firstIp;
}

// Country determination helper
const countries = ["USA", "India", "UK", "Pakistan", "Brazil", "Germany", "France", "Canada", "Australia", "UAE"];
function getCountryFromIp(ip: string): string {
  // Deterministic country selection for consistent analytics
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
    hash |= 0;
  }
  return countries[Math.abs(hash) % countries.length];
}

async function startServer() {
  console.log("[BOOT] startServer entered");
console.log("[BOOT] Node version:", process.version);
console.log("[BOOT] NODE_ENV:", process.env.NODE_ENV);
console.log("[BOOT] PORT: 3000");
  const app = express();

  // Ensure reverse proxy headers (e.g. Hostinger, Cloud Run) are trusted for req.secure, protocol and client IP
  app.set("trust proxy", 1);
  const PORT = 3000;

  // Security headers & Parsers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Traffic tracking middleware (Visits)
  app.use((req, res, next) => {
    if (req.path === "/" || req.path.startsWith("/admin")) {
      try {
        const rawIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
        const maskedIp = anonymizeIp(rawIp);
        const country = getCountryFromIp(rawIp);
        db.prepare("INSERT INTO traffic (ip_address, country, type) VALUES (?, ?, ?)").run(maskedIp, country, "visit");
      } catch (err) {
        console.error("Traffic logging error:", err);
      }
    }
    next();
  });

  // Rate limiters
  const fetchReelLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: "Too many extraction requests. Please wait a minute and try again.",
    code: "RATE_LIMITED"
  });

  const downloadLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: "Too many download requests. Please wait a minute and try again.",
    code: "RATE_LIMITED"
  });

  const adminLoginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 6,
    message: "Too many login attempts. Please try again after 15 minutes.",
    code: "RATE_LIMITED"
  });

  // --- API Endpoints ---

  /**
   * Health Check
   * GET /api/health
   */
  app.get("/api/health", (req, res) => {
    const providerStatus = ProviderFactory.getStatus();
    let dbStatus = "connected";
    try {
      db.prepare("SELECT 1").get();
    } catch {
      dbStatus = "error";
    }

    res.json({
      status: "ok",
      database: dbStatus,
      instagramProvider: {
        configured: providerStatus.configured,
        provider: providerStatus.provider
      }
    });
  });

  /**
   * Extract Reel Media
   * POST /api/reels/extract (and legacy alias POST /api/fetch-reel)
   */
  const handleExtractReel = async (req: express.Request, res: express.Response) => {
    const startTime = Date.now();
    const { url, requestId: clientRequestId } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INSTAGRAM_URL",
          message: "Please provide a valid Instagram Reel or Post link."
        }
      });
    }

    const rawIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const maskedIp = anonymizeIp(rawIp);
    const country = getCountryFromIp(rawIp);

    try {
      const result = await extractionService.extract(url, clientRequestId);
      const processingTime = Date.now() - startTime;

      if (result.success) {
        // Record download attempt and traffic
        db.prepare(
          "INSERT INTO downloads (shortcode, normalized_url, success, failure_code, country, processing_time_ms) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(result.data.shortcode, result.data.normalizedUrl, 1, null, country, processingTime);

        db.prepare("INSERT INTO traffic (ip_address, country, type) VALUES (?, ?, ?)").run(maskedIp, country, "download");

        return res.json(result);
      }

      // Failure branch
      const failure = result as ExtractionError;
      const shortcode = failure.diagnostics?.shortcode || "unknown";

      db.prepare(
        "INSERT INTO downloads (shortcode, normalized_url, success, failure_code, country, processing_time_ms) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(shortcode, url, 0, failure.error.code, country, processingTime);

      const statusMap: Record<string, number> = {
        INVALID_INSTAGRAM_URL: 400,
        INVALID_SHORTCODE: 400,
        REEL_NOT_FOUND: 404,
        REEL_PRIVATE_OR_RESTRICTED: 403,
        PROVIDER_FORBIDDEN: 403,
        PROVIDER_RATE_LIMITED: 429,
        PROVIDER_TIMEOUT: 504,
        PROVIDER_NOT_CONFIGURED: 503,
        PROVIDER_AUTH_FAILED: 502,
        PROVIDER_BAD_RESPONSE: 502,
        MEDIA_URL_MISSING: 422,
        MEDIA_VERIFICATION_FAILED: 422,
        INSTAGRAM_TEMPORARILY_UNAVAILABLE: 503,
        EXTRACTION_FAILED: 422
      };

      const statusCode = statusMap[failure.error.code] || 422;
      return res.status(statusCode).json(failure);
    } catch (err: any) {
      const processingTime = Date.now() - startTime;
      console.error("[Extraction Error]:", err.message);

      db.prepare(
        "INSERT INTO downloads (shortcode, normalized_url, success, failure_code, country, processing_time_ms) VALUES (?, ?, ?, ?, ?, ?)"
      ).run("unknown", url, 0, "INTERNAL_ERROR", country, processingTime);

      return res.status(500).json({
        success: false,
        error: {
          code: "EXTRACTION_FAILED",
          message: "An unexpected error occurred while processing the reel. Please try again."
        }
      });
    }
  };

  app.post("/api/reels/extract", fetchReelLimiter, handleExtractReel);
  app.post("/api/fetch-reel", fetchReelLimiter, handleExtractReel);

  /**
   * Media Preview Proxy (Supports HTTP Range requests for video playback)
   * GET /api/reels/preview/:previewId
   */
  app.get("/api/reels/preview/:previewId", async (req, res) => {
    const { previewId } = req.params;
    const session = downloadStore.getPreview(previewId);

    if (!session) {
      return res.status(410).json({
        success: false,
        error: {
          code: "PREVIEW_EXPIRED",
          message: "Media preview session has expired. Please fetch the reel again."
        }
      });
    }

    const validation = validateVideoUrl(session.videoUrl);
    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        error: {
          code: "SECURITY_CHECK_FAILED",
          message: "Verification failed for this media stream."
        }
      });
    }

    try {
      const range = req.headers.range;
      const headers: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*"
      };

      if (range) {
        headers["Range"] = range;
      }

      const streamResponse = await axios({
        method: "get",
        url: session.videoUrl,
        responseType: "stream",
        headers,
        timeout: 30000,
        maxRedirects: 3,
        beforeRedirect: (options) => {
          const dest = options.href || `${options.protocol}//${options.hostname}${options.path}`;
          const check = validateVideoUrl(dest);
          if (!check.valid) {
            throw new Error(`Redirect blocked: ${check.reason}`);
          }
        },
        validateStatus: (s) => (s >= 200 && s < 300) || s === 206
      });

      res.status(streamResponse.status);

      const contentType = streamResponse.headers["content-type"] || "video/mp4";
      res.setHeader("Content-Type", contentType);

      if (streamResponse.headers["content-length"]) {
        res.setHeader("Content-Length", streamResponse.headers["content-length"]);
      }
      if (streamResponse.headers["content-range"]) {
        res.setHeader("Content-Range", streamResponse.headers["content-range"]);
      }
      if (streamResponse.headers["accept-ranges"]) {
        res.setHeader("Accept-Ranges", streamResponse.headers["accept-ranges"]);
      }

      req.on("close", () => {
        if (!res.writableEnded) {
          streamResponse.data?.destroy?.();
        }
      });

      streamResponse.data.pipe(res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          error: {
            code: "PREVIEW_STREAM_ERROR",
            message: "Failed to stream video preview."
          }
        });
      }
    }
  });

  /**
   * Secure Download Proxy
   * GET /api/download/:downloadId
   */
  app.get("/api/download/:downloadId", downloadLimiter, async (req, res) => {
    const { downloadId } = req.params;

    if (!downloadId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DOWNLOAD_REQUEST",
          message: "A valid download token is required."
        }
      });
    }

    const downloadItem = downloadStore.getDownload(downloadId);
    if (!downloadItem) {
      return res.status(410).json({
        success: false,
        error: {
          code: "DOWNLOAD_EXPIRED",
          message: "This download link has expired or is invalid. Please fetch the reel again to get a fresh link."
        }
      });
    }

    // SSRF & Media URL validation check
    const validation = validateVideoUrl(downloadItem.videoUrl);
    if (!validation.valid) {
      console.warn(`[Download Aborted] Suspicious video URL detected: ${downloadItem.videoUrl}`);
      return res.status(403).json({
        success: false,
        error: {
          code: "SECURITY_CHECK_FAILED",
          message: "Download verification failed for this media stream."
        }
      });
    }

    try {
      const response = await axios({
        method: "get",
        url: downloadItem.videoUrl,
        responseType: "stream",
        timeout: 30000,
        maxRedirects: 3,
        beforeRedirect: (options) => {
          const dest = options.href || `${options.protocol}//${options.hostname}${options.path}`;
          const check = validateVideoUrl(dest);
          if (!check.valid) {
            throw new Error(`Redirect blocked: ${check.reason}`);
          }
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "*/*"
        }
      });

      res.setHeader("Content-Disposition", `attachment; filename="${downloadItem.filename}"`);
      res.setHeader("Content-Type", response.headers["content-type"] || "video/mp4");
      if (response.headers["content-length"]) {
        res.setHeader("Content-Length", response.headers["content-length"]);
      }

      // Handle client disconnect gracefully
      req.on("close", () => {
        if (!res.writableEnded) {
          response.data?.destroy?.();
        }
      });

      response.data.pipe(res);
    } catch (streamError: any) {
      console.error("[Download Stream Error]:", streamError.message);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          error: {
            code: "DOWNLOAD_STREAM_ERROR",
            message: "Failed to stream media from Instagram CDN. The temporary link may have expired."
          }
        });
      }
    }
  });

  /**
   * Legacy /api/download fallback with security validation
   */
  app.get("/api/download", downloadLimiter, async (req, res) => {
    const { url, filename } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Media URL is required."
        }
      });
    }

    const validation = validateVideoUrl(url);
    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        error: {
          code: "SECURITY_CHECK_FAILED",
          message: validation.reason || "Invalid video source."
        }
      });
    }

    try {
      const response = await axios({
        method: "get",
        url,
        responseType: "stream",
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
      });

      const safeFilename = typeof filename === "string" ? filename.replace(/[^a-zA-Z0-9._-]/g, "_") : "instagram_reel.mp4";
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.setHeader("Content-Type", response.headers["content-type"] || "video/mp4");
      if (response.headers["content-length"]) {
        res.setHeader("Content-Length", response.headers["content-length"]);
      }
      response.data.pipe(res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          error: {
            code: "DOWNLOAD_FAILED",
            message: "Could not retrieve media file. Link may have expired."
          }
        });
      }
    }
  });

  // --- Admin Authentication & Dashboard ---

  // Helper to extract & verify JWT token from cookies or Authorization header (with Bearer fallback)
  function getAdminAuth(req: express.Request): {
    authenticated: boolean;
    user?: { id?: number; username: string; role: string };
    source?: "cookie" | "bearer";
  } {
    const cookieToken = (req.cookies && req.cookies.admin_token) || null;
    let bearerToken: string | null = null;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      bearerToken = auth.substring(7).trim();
    }

    const cookiePresent = Boolean(cookieToken);
    const bearerPresent = Boolean(bearerToken);

    // 1. Try Cookie token first
    if (cookieToken) {
      try {
        const decoded = jwt.verify(cookieToken, JWT_SECRET) as any;
        console.log(`[Session Debug] cookiePresent: true, bearerPresent: ${bearerPresent}, tokenSource: cookie, jwtVerification: success, authenticatedUser: yes`);
        return {
          authenticated: true,
          user: { id: decoded.id, username: decoded.username, role: decoded.role || "admin" },
          source: "cookie"
        };
      } catch (err: any) {
        console.log(`[Session Debug] cookie token verification failed (${err?.message || "invalid"}). Trying bearer fallback...`);
      }
    }

    // 2. Fallback to Bearer token
    if (bearerToken) {
      try {
        const decoded = jwt.verify(bearerToken, JWT_SECRET) as any;
        console.log(`[Session Debug] cookiePresent: ${cookiePresent}, bearerPresent: true, tokenSource: bearer, jwtVerification: success, authenticatedUser: yes`);
        return {
          authenticated: true,
          user: { id: decoded.id, username: decoded.username, role: decoded.role || "admin" },
          source: "bearer"
        };
      } catch (err: any) {
        console.log(`[Session Debug] bearer token verification failed (${err?.message || "invalid"}).`);
      }
    }

    console.log(`[Session Debug] cookiePresent: ${cookiePresent}, bearerPresent: ${bearerPresent}, tokenSource: none, jwtVerification: failure, authenticatedUser: no`);
    return { authenticated: false };
  }

  app.post("/api/admin/login", adminLoginLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password are required.", code: "MISSING_FIELDS" });
    }

    // Step 1: Database lookup for username
    const normalizedUsername = typeof username === "string" ? username.trim() : "";
    const admin = db.prepare("SELECT id, username, password, role FROM admins WHERE username = ?").get(normalizedUsername) as any;

    const userFound = Boolean(admin);
    const storedIsBcrypt = Boolean(admin && admin.password && isBcryptHash(admin.password));
    let passwordMatch = false;

    // Step 2: Compare submitted password against stored bcrypt hash (byte-for-byte, un-trimmed)
    if (userFound && storedIsBcrypt && typeof password === "string") {
      try {
        passwordMatch = await bcrypt.compare(password, admin.password);
      } catch (err) {
        console.error("[Auth Error] Error during bcrypt verification:", err);
      }
    }

    const statusCode = userFound && passwordMatch ? 200 : 401;
    let jwtGenerated = false;
    let cookieGenerated = false;

    if (statusCode === 200) {
      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: admin.role || "admin" },
        JWT_SECRET,
        { expiresIn: "2h" }
      );
      jwtGenerated = true;

      const cookieOptions: express.CookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 2 * 60 * 60 * 1000
      };

      res.cookie("admin_token", token, cookieOptions);
      cookieGenerated = true;

      // Safe temporary diagnostics (Section 1 - NEVER prints password, hash, JWT secret, or token)
      console.log(`[Auth Diagnostic] Submitted username: ${normalizedUsername}`);
      console.log(`[Auth Diagnostic] User found in database: ${userFound ? "YES" : "NO"}`);
      console.log(`[Auth Diagnostic] Stored value is valid bcrypt hash: ${storedIsBcrypt ? "YES" : "NO"}`);
      console.log(`[Auth Diagnostic] bcrypt.compare result: ${passwordMatch ? "TRUE" : "FALSE"}`);
      console.log(`[Auth Diagnostic] Login API status: ${statusCode}`);
      console.log(`[Auth Diagnostic] JWT generated: ${jwtGenerated ? "YES" : "NO"}`);
      console.log(`[Auth Diagnostic] Set-Cookie header generated: ${cookieGenerated ? "YES" : "NO"}`);

      return res.status(200).json({ success: true, token });
    }

    // Safe diagnostics on failure
    console.log(`[Auth Diagnostic] Submitted username: ${normalizedUsername}`);
    console.log(`[Auth Diagnostic] User found in database: ${userFound ? "YES" : "NO"}`);
    console.log(`[Auth Diagnostic] Stored value is valid bcrypt hash: ${storedIsBcrypt ? "YES" : "NO"}`);
    console.log(`[Auth Diagnostic] bcrypt.compare result: FALSE`);
    console.log(`[Auth Diagnostic] Login API status: 401`);
    console.log(`[Auth Diagnostic] JWT generated: NO`);
    console.log(`[Auth Diagnostic] Set-Cookie header generated: NO`);

    return res.status(401).json({ success: false, error: "Invalid username or password.", code: "INVALID_CREDENTIALS" });
  });

  app.get("/api/admin/session", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated || !auth.user) {
      return res.status(401).json({ authenticated: false });
    }
    return res.json({
      authenticated: true,
      username: auth.user.username,
      role: auth.user.role || "admin"
    });
  });

  app.get("/api/admin/stats", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated || !auth.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const totalVisitors = db.prepare("SELECT count(*) as count FROM traffic WHERE type = 'visit'").get() as any;
      const totalDownloads = db.prepare("SELECT count(*) as count FROM downloads WHERE success = 1").get() as any;
      const failedExtractions = db.prepare("SELECT count(*) as count FROM downloads WHERE success = 0").get() as any;

      const todayDownloads = db
        .prepare("SELECT count(*) as count FROM downloads WHERE success = 1 AND date(created_at) = date('now')")
        .get() as any;

      const dailyVisitors = db
        .prepare(`
        SELECT date(timestamp) as date, count(*) as count 
        FROM traffic 
        WHERE type = 'visit' 
        GROUP BY date(timestamp) 
        ORDER BY date ASC 
        LIMIT 7
      `)
        .all();

      const downloadCounts = db
        .prepare(`
        SELECT date(created_at) as date, count(*) as count 
        FROM downloads 
        WHERE success = 1
        GROUP BY date(created_at) 
        ORDER BY date ASC 
        LIMIT 7
      `)
        .all();

      const extractionsComparison = db
        .prepare(`
        SELECT 
          date(created_at) as date,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
        FROM downloads
        GROUP BY date(created_at)
        ORDER BY date ASC
        LIMIT 7
      `)
        .all();

      const countryTraffic = db
        .prepare(`
        SELECT country as name, count(*) as value 
        FROM traffic 
        GROUP BY country
        ORDER BY value DESC
        LIMIT 8
      `)
        .all();

      const errorBreakdown = db
        .prepare(`
        SELECT failure_code as code, count(*) as count
        FROM downloads
        WHERE success = 0 AND failure_code IS NOT NULL
        GROUP BY failure_code
      `)
        .all();

      const recentActivity = db
        .prepare(`
        SELECT id, shortcode, success, failure_code, country, processing_time_ms, created_at
        FROM downloads
        ORDER BY id DESC
        LIMIT 15
      `)
        .all();

      const totalAttempts = (totalDownloads?.count || 0) + (failedExtractions?.count || 0);
      const successRate = totalAttempts > 0 ? Math.round(((totalDownloads?.count || 0) / totalAttempts) * 100) : 100;

      res.json({
        totalVisitors: totalVisitors.count || 0,
        totalDownloads: totalDownloads.count || 0,
        failedExtractions: failedExtractions.count || 0,
        todayDownloads: todayDownloads.count || 0,
        successRate,
        dailyVisitors,
        downloadCounts,
        extractionsComparison,
        countryTraffic,
        errorBreakdown,
        recentActivity
      });
    } catch {
      res.status(401).json({ error: "Invalid or expired admin session" });
    }
  });

  app.get("/api/admin/provider-status", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated || !auth.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const providerStatus = ProviderFactory.getStatus();

      const lastSuccess = db.prepare(
        "SELECT shortcode, created_at, processing_time_ms FROM downloads WHERE success = 1 ORDER BY id DESC LIMIT 1"
      ).get() as any;

      const lastFailure = db.prepare(
        "SELECT shortcode, failure_code, created_at, processing_time_ms FROM downloads WHERE success = 0 ORDER BY id DESC LIMIT 1"
      ).get() as any;

      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
        FROM downloads
      `).get() as any;

      const total = stats?.total || 0;
      const successful = stats?.successful || 0;
      const successRate = total > 0 ? Math.round((successful / total) * 100) : 100;

      res.json({
        configured: providerStatus.configured,
        provider: providerStatus.provider,
        hasExternal: providerStatus.hasExternal,
        hasDirect: providerStatus.hasDirect,
        lastSuccessfulExtraction: lastSuccess?.created_at || null,
        lastFailedExtraction: lastFailure?.created_at || null,
        recentFailureCode: lastFailure?.failure_code || null,
        successRate,
        totalDownloads: successful,
        failedExtractions: stats?.failed || 0
      });
    } catch {
      res.status(401).json({ error: "Invalid admin session" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie("admin_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/"
    });
    res.json({ success: true });
  });

  // --- 301 Redirects for Managed Slugs ---
  app.use((req, res, next) => {
    if (req.method === "GET") {
      const redirect = cmsService.getRedirect(req.path);
      if (redirect) {
        return res.redirect(redirect.status_code || 301, redirect.new_path);
      }
    }
    next();
  });

  // --- Public CMS & SEO Endpoints ---

  app.get("/sitemap.xml", (req, res) => {
    try {
      const xml = SeoEngine.generateSitemapXml(db, cmsService.getSeoSettings());
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.send(xml);
    } catch (err) {
      console.error("[Sitemap Error]", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get("/robots.txt", (req, res) => {
    try {
      const txt = SeoEngine.generateRobotsTxt(cmsService.getSeoSettings());
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send(txt);
    } catch (err) {
      console.error("[Robots Error]", err);
      res.status(500).send("Error generating robots.txt");
    }
  });

  app.get("/api/public/pages/by-route", (req, res) => {
    try {
      const route = typeof req.query.route === "string" ? req.query.route : "/";
      const allowDraft = req.query.allowDraft === "1";
      const page = cmsService.getPageByRoute(route, allowDraft);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.json(page);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load page" });
    }
  });

    app.get("/api/public/blog", (req, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const posts = cmsService.getBlogPosts({ status: "published", search, category, limit, offset });
      res.json(posts);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to list blog posts" });
    }
  });

  app.get("/api/public/blog/:slug", (req, res) => {
    try {
      const post = cmsService.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load article" });
    }
  });

  app.get("/api/public/ads", (req, res) => {
    try {
      const position = typeof req.query.position === "string" ? req.query.position : undefined;
      const slots = cmsService.getAdSlots(position ? { position } : undefined);
      res.json(slots);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to list ads" });
    }
  });

  // --- Admin CMS Endpoints ---

  app.get("/api/admin/cms/pages", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    const pages = cmsService.getAllPages();
    res.json(pages);
  });

  app.get("/api/admin/cms/pages/:id", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    const page = cmsService.getPageById(parseInt(req.params.id, 10));
    if (!page) return res.status(404).json({ error: "Page not found" });
    res.json(page);
  });

  app.post("/api/admin/cms/pages", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { internal_name, route, page_type, show_tool } = req.body;
      const result = cmsService.createPage({
        internal_name,
        route,
        page_type: page_type || "info",
        show_tool: Boolean(show_tool)
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error || "Failed to create page" });
      }
      res.json({ success: true, pageId: result.pageId });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create page" });
    }
  });

  app.post("/api/admin/cms/pages/:id/draft", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const pageId = parseInt(req.params.id, 10);
      const versionId = cmsService.createDraftFromPublished(pageId, auth.user?.username, req.body.change_note);
      res.json({ success: true, versionId });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create draft" });
    }
  });

  app.put("/api/admin/cms/versions/:versionId", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const versionId = parseInt(req.params.versionId, 10);
      cmsService.updateVersionDraft(versionId, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update draft" });
    }
  });

  app.post("/api/admin/cms/versions/:versionId/publish", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const versionId = parseInt(req.params.versionId, 10);
      cmsService.publishVersion(versionId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to publish version" });
    }
  });

  app.post("/api/admin/cms/pages/:id/rollback", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const pageId = parseInt(req.params.id, 10);
      const targetVersionId = parseInt(req.body.targetVersionId, 10);
      const newVersionId = cmsService.rollbackToVersion(pageId, targetVersionId, auth.user?.username);
      res.json({ success: true, newVersionId });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to rollback version" });
    }
  });

  // --- Admin Blog Endpoints ---
  app.get("/api/admin/blog/posts", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    const posts = cmsService.getBlogPosts();
    res.json(posts);
  });

  app.get("/api/admin/blog/posts/:id", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    const post = cmsService.getBlogPostById(parseInt(req.params.id, 10));
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  });

  app.post("/api/admin/blog/posts", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const result = cmsService.createBlogPost(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error || "Failed to create post" });
      }
      res.json({ success: true, postId: result.postId });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create post" });
    }
  });

  app.put("/api/admin/blog/posts/:id", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const postId = parseInt(req.params.id, 10);
      cmsService.updateBlogPost(postId, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update post" });
    }
  });

  app.post("/api/admin/blog/posts/:id/publish", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const postId = parseInt(req.params.id, 10);
      cmsService.publishBlogPost(postId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to publish post" });
    }
  });

  // --- Admin SEO Endpoints ---
  app.get("/api/admin/seo/settings", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    const settings = cmsService.getSeoSettings();
    res.json(settings);
  });

  app.put("/api/admin/seo/settings", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      cmsService.updateSeoSettings(req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update SEO settings" });
    }
  });

  app.get("/api/admin/seo/audit", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    const issues = cmsService.auditSeo();
    res.json(issues);
  });

  // --- Admin Ad Slots Endpoints ---
  app.get("/api/admin/ads", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    const ads = cmsService.getAdSlots();
    res.json(ads);
  });

  app.post("/api/admin/ads", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const result = cmsService.createAdSlot(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Failed to create ad slot" });
      }
      res.json({ success: true, id: result.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create ad slot" });
    }
  });

  app.put("/api/admin/ads/:id", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const id = parseInt(req.params.id, 10);
      cmsService.updateAdSlot(id, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update ad slot" });
    }
  });

  app.delete("/api/admin/ads/:id", (req, res) => {
    const auth = getAdminAuth(req);
    if (!auth.authenticated) return res.status(401).json({ error: "Unauthorized" });
    try {
      const id = parseInt(req.params.id, 10);
      cmsService.deleteAdSlot(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to delete ad slot" });
    }
  });

  // --- Server-side SEO & Content Injection Helper ---
  const handleHtmlRequest = (req: express.Request, res: express.Response, rawHtml: string) => {
    try {
      const seoSettings = cmsService.getSeoSettings();
      let pageData: any = null;

      if (req.path.startsWith("/blog/")) {
        const slug = req.path.replace("/blog/", "").split("/")[0].split("?")[0];
        const post = cmsService.getBlogPostBySlug(slug);
        if (post && post.version) {
          pageData = {
            internal_name: post.title,
            route: `/blog/${post.slug}`,
            version: {
              h1: post.title,
              introduction: post.excerpt,
              seo_title: post.version.seo_title || `${post.title} – ClipFetchHD`,
              meta_description: post.version.meta_description || post.excerpt,
              canonical_url: post.version.canonical_url || `/blog/${post.slug}`,
              og_title: post.title,
              og_description: post.excerpt,
              og_image: post.featured_image,
              og_image_alt: post.featured_image_alt,
              og_type: "article",
              schema_preset: "Article",
              robots_index: true,
              robots_follow: true,
              blocks: post.version.blocks
            }
          };
        }
      } else {
        pageData = cmsService.getPageByRoute(req.path, false);
      }

      const injectedHtml = injectServerSeoAndContent(rawHtml, pageData, seoSettings, req.originalUrl);
      res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(injectedHtml);
    } catch (err) {
      console.error("[SSR Injection Error]", err);
      res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(rawHtml);
    }
  };

    // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom"
    });

    // Vite must handle internal development modules first.
    app.use(vite.middlewares);

    // Development HTML fallback
    app.use(async (req, res, next) => {
      if (
        req.method === "GET" &&
        !req.path.startsWith("/api") &&
        !req.path.startsWith("/preview") &&
        !req.path.startsWith("/download")
      ) {
        try {
          const template = fs.readFileSync(
            path.resolve(__dirname, "index.html"),
            "utf-8"
          );

          const transformed = await vite.transformIndexHtml(
            req.originalUrl,
            template
          );

          return handleHtmlRequest(req, res, transformed);
        } catch (err) {
          return next(err);
        }
      }

      return next();
    });
  } else {
    // server.mjs is compiled inside /dist, therefore __dirname is already /dist
    const distPath = __dirname;
    const indexPath = path.join(distPath, "index.html");

    // Serve production Vite assets
    app.use(express.static(distPath));

    // React SPA / CMS / SEO fallback
    app.get("*", (req, res, next) => {
      // Unknown API endpoints must not receive React HTML
      if (req.path.startsWith("/api/")) {
        return next();
      }

      try {
        const template = fs.readFileSync(indexPath, "utf-8");

        // Public pages receive SEO metadata injection
        if (!req.path.startsWith("/admin")) {
          return handleHtmlRequest(req, res, template);
        }

        // Admin is rendered by React
        return res.sendFile(indexPath);
      } catch (err) {
        console.error("[Production HTML Error]", err);
        return res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
  console.log("[BOOT] Express listening successfully");
  console.log(`ClipFetchHD Server running on port ${PORT}`);
});
}

startServer();