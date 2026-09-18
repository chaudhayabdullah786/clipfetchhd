import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * In-memory sliding window rate limiter
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  code?: string;
}) {
  const clients = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(key);
      }
    }
  }, 60000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    const existing = clients.get(clientIp);

    if (!existing || now > existing.resetTime) {
      clients.set(clientIp, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return next();
    }

    if (existing.count >= options.max) {
      const retryAfterSeconds = Math.ceil((existing.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: {
          code: options.code || "RATE_LIMITED",
          message: options.message
        }
      });
    }

    existing.count++;
    return next();
  };
}
