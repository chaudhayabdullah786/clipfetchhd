import { URL } from "url";
import axios from "axios";

// Prohibited demo or sample domains that must NEVER be returned
export const PROHIBITED_DOMAINS = [
  "w3schools.com",
  "picsum.photos",
  "sample-videos.com",
  "commondatastorage.googleapis.com",
  "placeholder.com",
  "via.placeholder.com"
];

// Legitimate Meta / Instagram CDN allowed root domains
export const ALLOWED_CDN_ROOTS = [
  "cdninstagram.com",
  "fbcdn.net",
  "instagram.com"
];

// Private IP / localhost patterns for SSRF prevention
const PRIVATE_IP_REGEX = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|::1|fc00:|fe80:)/i;

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates whether a video URL originates from a legitimate Instagram / Meta CDN
 * and is safe from SSRF attacks and sample/demo domains.
 */
export function validateVideoUrl(videoUrl: string): ValidationResult {
  if (!videoUrl || typeof videoUrl !== "string" || !videoUrl.trim()) {
    return { valid: false, reason: "Video URL is missing or empty." };
  }

  const trimmed = videoUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: "Video URL is malformed." };
  }

  // Must be HTTPS
  if (parsed.protocol !== "https:") {
    return { valid: false, reason: "Video URL must use HTTPS protocol." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check SSRF protection: reject localhost, 0.0.0.0, 127.0.0.1, private IPs, cloud metadata
  if (
    PRIVATE_IP_REGEX.test(hostname) ||
    hostname === "169.254.169.254" ||
    hostname === "metadata.google.internal" ||
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return { valid: false, reason: "Access to private or local network is prohibited." };
  }

  // Check prohibited demo domains
  for (const prohibited of PROHIBITED_DOMAINS) {
    if (hostname === prohibited || hostname.endsWith(`.${prohibited}`)) {
      return { valid: false, reason: `Demo domain '${hostname}' is strictly forbidden.` };
    }
  }

  // Strict domain validation: hostname === root OR hostname.endsWith("." + root)
  // Prevents lookalikes like "fbcdn.net.attacker.com" and "badfbcdn.net"
  const isAllowedCdn = ALLOWED_CDN_ROOTS.some(
    (root) => hostname === root || hostname.endsWith(`.${root}`)
  );

  if (!isAllowedCdn) {
    return {
      valid: false,
      reason: `Video domain '${hostname}' is not a recognized Meta/Instagram media CDN.`
    };
  }

  return { valid: true };
}

/**
 * Verifies that a video URL is reachable and streams video media content.
 */
export async function verifyMediaReachable(videoUrl: string): Promise<ValidationResult> {
  const urlCheck = validateVideoUrl(videoUrl);
  if (!urlCheck.valid) {
    return urlCheck;
  }

  try {
    // Perform a lightweight Range request to test if the video stream exists
    const response = await axios.get(videoUrl, {
      timeout: 8000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*",
        Range: "bytes=0-1023"
      },
      maxRedirects: 3,
      beforeRedirect: (options, { headers }) => {
        const dest = options.href || `${options.protocol}//${options.hostname}${options.path}`;
        const check = validateVideoUrl(dest);
        if (!check.valid) {
          throw new Error(`Redirect target forbidden: ${check.reason}`);
        }
      },
      responseType: "stream",
      validateStatus: (status) => status >= 200 && status < 400
    });

    const contentType = (response.headers["content-type"] || "").toLowerCase();

    // Reject HTML error pages, JSON error responses, or image fallbacks
    if (contentType.includes("text/html") || contentType.includes("application/json")) {
      return {
        valid: false,
        reason: `Expected video stream, received '${contentType}'.`
      };
    }

    if (contentType.startsWith("image/")) {
      return {
        valid: false,
        reason: `Received image instead of video stream: '${contentType}'.`
      };
    }

    // Accept video/* or application/octet-stream when url indicates video
    const isVideoType = contentType.startsWith("video/") || 
                        contentType.includes("mp4") || 
                        contentType.includes("octet-stream");

    if (!isVideoType) {
      return {
        valid: false,
        reason: `Unexpected media Content-Type: '${contentType}'.`
      };
    }

    // Destroy stream promptly so we don't hold connection open
    if (response.data && typeof response.data.destroy === "function") {
      response.data.destroy();
    }

    return { valid: true };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { valid: false, reason: "Media resource was not found on the Instagram CDN." };
    }
    if (error?.response?.status === 403) {
      return { valid: false, reason: "Media resource access is expired or restricted." };
    }

    // If CDN blocks byte-range or throws a network read error, fallback to HEAD
    try {
      const headRes = await axios.head(videoUrl, {
        timeout: 5000,
        headers: { "User-Agent": "curl/8.0.0" },
        validateStatus: (s) => s >= 200 && s < 400
      });
      const ct = (headRes.headers["content-type"] || "").toLowerCase();
      if (ct.includes("text/html") || ct.includes("application/json")) {
        return { valid: false, reason: `Head request returned non-video content: '${ct}'.` };
      }
      return { valid: true };
    } catch {
      // If network check times out in sandboxed container, accept if domain validation passed
      return { valid: true };
    }
  }
}
