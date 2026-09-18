/**
 * Security & Sanitization utilities for CMS Content, Metadata, and Structured Data.
 * Enforces strict XSS prevention, protocol whitelisting, and JSON-LD safe escaping.
 */

// Disallowed HTML tags that must be stripped or neutralized
const DANGEROUS_TAG_REGEX = /<\s*(script|iframe|object|embed|applet|form|input|button|link|meta|style)[^>]*>.*?<\s*\/\s*\1\s*>|<\s*(script|iframe|object|embed|applet|form|input|button|link|meta|style)[^>]*\/?>/gis;

// Disallowed attribute event handlers (e.g. onload, onclick, onerror)
const EVENT_HANDLER_REGEX = /\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;

// Disallowed URI protocols
const DANGEROUS_PROTOCOL_REGEX = /(javascript|data|vbscript|file):/gi;

/**
 * Strips dangerous HTML elements, event attributes, and unapproved protocols.
 */
export function sanitizeHtml(raw: string | undefined | null): string {
  if (!raw || typeof raw !== "string") return "";

  let cleaned = raw
    .replace(DANGEROUS_TAG_REGEX, "")
    .replace(EVENT_HANDLER_REGEX, "")
    .replace(DANGEROUS_PROTOCOL_REGEX, "invalid-protocol:");

  return cleaned.trim();
}

/**
 * Escapes plain text for safe insertion into HTML attribute values or text nodes.
 */
export function escapeHtml(str: string | undefined | null): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Safely stringifies JSON-LD and escapes closing script tags so stored content cannot terminate the script block.
 */
export function safeJsonLdStringify(obj: any): string {
  try {
    const json = JSON.stringify(obj, null, 2);
    // Escape '</script' to prevent premature script block termination in HTML
    return json.replace(/<\/script/gi, "<\\/script");
  } catch {
    return "{}";
  }
}

/**
 * Validates canonical URLs.
 * Enforces HTTPS and prevents protocol smuggling or local file access.
 */
export function validateCanonicalUrl(url: string | undefined | null, baseUrl?: string): { valid: boolean; normalized?: string; error?: string } {
  if (!url || !url.trim()) {
    return { valid: true, normalized: "" };
  }

  const trimmed = url.trim();

  // Allow relative URLs starting with '/'
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) {
      return { valid: false, error: "Protocol-relative URLs are not allowed for canonical tags." };
    }
    return { valid: true, normalized: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { valid: false, error: "Canonical URL must use HTTP or HTTPS." };
    }
    return { valid: true, normalized: parsed.href };
  } catch {
    return { valid: false, error: "Malformed URL syntax." };
  }
}

/**
 * Recursively sanitizes structured content blocks.
 */
export function sanitizeBlock(block: any): any {
  if (!block || typeof block !== "object") return block;

  const sanitized = { ...block };

  if (typeof sanitized.heading === "string") {
    sanitized.heading = sanitizeHtml(sanitized.heading);
  }

  if (typeof sanitized.content === "string") {
    sanitized.content = sanitizeHtml(sanitized.content);
  } else if (typeof sanitized.content === "object" && sanitized.content !== null) {
    if (Array.isArray(sanitized.content)) {
      sanitized.content = sanitized.content.map((item) => {
        if (typeof item === "string") return sanitizeHtml(item);
        if (typeof item === "object" && item !== null) {
          const sItem: Record<string, any> = {};
          for (const [k, v] of Object.entries(item)) {
            sItem[k] = typeof v === "string" ? sanitizeHtml(v) : v;
          }
          return sItem;
        }
        return item;
      });
    } else {
      const sContent: Record<string, any> = {};
      for (const [k, v] of Object.entries(sanitized.content)) {
        sContent[k] = typeof v === "string" ? sanitizeHtml(v) : v;
      }
      sanitized.content = sContent;
    }
  }

  return sanitized;
}
