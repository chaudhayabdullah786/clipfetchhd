/**
 * Instagram URL Parser and Normalizer
 */

export interface ParsedInstagramUrl {
  valid: boolean;
  shortcode: string | null;
  normalizedUrl: string | null;
  type: "reel" | "p" | "tv" | null;
  error?: string;
}

const SUPPORTED_HOSTNAMES = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
  "instagr.am",
  "www.instagr.am"
]);

// Valid Instagram shortcode regex (usually 10-14 base64url characters)
const SHORTCODE_REGEX = /^[A-Za-z0-9_-]{3,35}$/;

/**
 * Extracts and parses an Instagram Reel, Post, or TV URL.
 */
export function parseInstagramUrl(rawInput: string): ParsedInstagramUrl {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      valid: false,
      shortcode: null,
      normalizedUrl: null,
      type: null,
      error: "No URL provided."
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      shortcode: null,
      normalizedUrl: null,
      type: null,
      error: "URL is empty."
    };
  }

  // Ensure protocol exists for standard URL parsing
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      valid: false,
      shortcode: null,
      normalizedUrl: null,
      type: null,
      error: "Malformed URL format."
    };
  }

  // Validate hostname
  const hostname = parsed.hostname.toLowerCase();
  if (!SUPPORTED_HOSTNAMES.has(hostname)) {
    return {
      valid: false,
      shortcode: null,
      normalizedUrl: null,
      type: null,
      error: `Unsupported domain '${parsed.hostname}'. Only instagram.com URLs are supported.`
    };
  }

  // Parse path: /reel/SHORTCODE, /p/SHORTCODE, /tv/SHORTCODE, /reels/SHORTCODE
  const pathSegments = parsed.pathname
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

  if (pathSegments.length < 2) {
    return {
      valid: false,
      shortcode: null,
      normalizedUrl: null,
      type: null,
      error: "URL path does not contain a valid Instagram Reel or Post identifier."
    };
  }

  const rawType = pathSegments[0].toLowerCase();
  let mediaType: "reel" | "p" | "tv" | null = null;

  if (rawType === "reel" || rawType === "reels") {
    mediaType = "reel";
  } else if (rawType === "p") {
    mediaType = "p";
  } else if (rawType === "tv") {
    mediaType = "tv";
  } else {
    return {
      valid: false,
      shortcode: null,
      normalizedUrl: null,
      type: null,
      error: `Unsupported Instagram media path '/${rawType}/'. Only reels, posts, or IGTV links are supported.`
    };
  }

  const shortcode = pathSegments[1];
  if (!shortcode || !SHORTCODE_REGEX.test(shortcode)) {
    return {
      valid: false,
      shortcode: null,
      normalizedUrl: null,
      type: null,
      error: `Invalid Instagram shortcode format: '${shortcode}'.`
    };
  }

  // Clean canonical URL without tracking parameters
  const canonicalPath = mediaType === "reel" ? "reel" : mediaType === "p" ? "p" : "tv";
  const normalizedUrl = `https://www.instagram.com/${canonicalPath}/${shortcode}/`;

  return {
    valid: true,
    shortcode,
    normalizedUrl,
    type: mediaType
  };
}

export function extractInstagramShortcode(rawInput: string): string | null {
  const result = parseInstagramUrl(rawInput);
  return result.valid ? result.shortcode : null;
}

export function normalizeInstagramUrl(rawInput: string): string | null {
  const result = parseInstagramUrl(rawInput);
  return result.valid ? result.normalizedUrl : null;
}

export function isValidInstagramUrl(rawInput: string): boolean {
  return parseInstagramUrl(rawInput).valid;
}
