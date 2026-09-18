import crypto from "crypto";

export interface StoredMediaSession {
  id: string;
  previewId: string;
  downloadId: string;
  shortcode: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  filename: string;
  createdAt: number;
  expiresAt: number;
}

// TTL: 15 minutes (900,000 ms)
const TOKEN_TTL_MS = 15 * 60 * 1000;

class DownloadStore {
  private sessions = new Map<string, StoredMediaSession>();
  // Indexes for fast lookup by either downloadId or previewId
  private downloadIndex = new Map<string, string>();
  private previewIndex = new Map<string, string>();

  constructor() {
    // Periodically sweep expired tokens every 5 minutes
    setInterval(() => this.purgeExpired(), 5 * 60 * 1000).unref();
  }

  /**
   * Registers a verified extraction result and issues secure temporary preview and download tokens.
   */
  public registerSession(
    shortcode: string,
    videoUrl: string,
    thumbnailUrl: string | null = null
  ): { previewId: string; downloadId: string } {
    const sessionId = crypto.randomUUID();
    const downloadId = `dl_${crypto.randomBytes(16).toString("hex")}`;
    const previewId = `pv_${crypto.randomBytes(16).toString("hex")}`;
    const now = Date.now();
    const sanitizedShortcode = shortcode.replace(/[^a-zA-Z0-9_-]/g, "");
    const filename = `instagram_reel_${sanitizedShortcode}.mp4`;

    const item: StoredMediaSession = {
      id: sessionId,
      previewId,
      downloadId,
      shortcode: sanitizedShortcode,
      videoUrl,
      thumbnailUrl,
      filename,
      createdAt: now,
      expiresAt: now + TOKEN_TTL_MS
    };

    this.sessions.set(sessionId, item);
    this.downloadIndex.set(downloadId, sessionId);
    this.previewIndex.set(previewId, sessionId);

    // Keep legacy short identifier working if needed
    this.downloadIndex.set(sessionId, sessionId);

    return { previewId, downloadId };
  }

  /**
   * Backward compatible registerDownload method.
   */
  public registerDownload(
    shortcode: string,
    videoUrl: string,
    thumbnailUrl: string | null = null
  ): string {
    const { downloadId } = this.registerSession(shortcode, videoUrl, thumbnailUrl);
    return downloadId;
  }

  /**
   * Retrieves a verified media session by its download ID or session ID.
   */
  public getDownload(downloadId: string): StoredMediaSession | null {
    if (!downloadId || typeof downloadId !== "string") return null;

    const sessionId = this.downloadIndex.get(downloadId);
    if (!sessionId) return null;

    const item = this.sessions.get(sessionId);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.deleteSession(sessionId);
      return null;
    }

    return item;
  }

  /**
   * Retrieves a verified media session by its preview ID.
   */
  public getPreview(previewId: string): StoredMediaSession | null {
    if (!previewId || typeof previewId !== "string") return null;

    const sessionId = this.previewIndex.get(previewId) || this.downloadIndex.get(previewId);
    if (!sessionId) return null;

    const item = this.sessions.get(sessionId);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.deleteSession(sessionId);
      return null;
    }

    return item;
  }

  private deleteSession(sessionId: string): void {
    const item = this.sessions.get(sessionId);
    if (item) {
      this.downloadIndex.delete(item.downloadId);
      this.previewIndex.delete(item.previewId);
      this.downloadIndex.delete(item.id);
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Removes expired items from memory.
   */
  private purgeExpired(): void {
    const now = Date.now();
    for (const [id, item] of this.sessions.entries()) {
      if (now > item.expiresAt) {
        this.deleteSession(id);
      }
    }
  }
}

export const downloadStore = new DownloadStore();
