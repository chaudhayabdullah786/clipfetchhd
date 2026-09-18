import { ExtractionErrorCode } from "./types.js";

export const ERROR_MESSAGES: Record<ExtractionErrorCode, string> = {
  INVALID_INSTAGRAM_URL: "Please provide a valid Instagram Reel or Post URL (e.g. instagram.com/reel/...).",
  INVALID_SHORTCODE: "Could not identify a valid shortcode in the provided Instagram link.",
  PROVIDER_NOT_CONFIGURED: "Extraction provider is not configured. Please check environment variables.",
  PROVIDER_AUTH_FAILED: "Extraction provider authentication failed. Please verify API credentials.",
  PROVIDER_RATE_LIMITED: "The Reel service is temporarily busy. Please wait a moment and try again.",
  PROVIDER_TIMEOUT: "The extraction request timed out. Please try again.",
  PROVIDER_FORBIDDEN: "Access to this media was denied by the upstream provider.",
  PROVIDER_BAD_RESPONSE: "Received an invalid or malformed response from the extraction provider.",
  REEL_NOT_FOUND: "The requested Instagram Reel could not be found or may have been deleted.",
  REEL_PRIVATE_OR_RESTRICTED: "This Reel could not be accessed. It may be private, age-restricted, or removed.",
  MEDIA_URL_MISSING: "The Reel metadata was located, but no valid video stream URL was found.",
  MEDIA_VERIFICATION_FAILED: "The extracted video stream failed security verification. Only authentic Instagram media is served.",
  INSTAGRAM_TEMPORARILY_UNAVAILABLE: "Instagram is temporarily unavailable or blocking requests. Please try again shortly.",
  REEL_EXTRACTION_FAILED: "Could not extract video content from this Instagram link. Ensure the account and reel are public.",
  EXTRACTION_FAILED: "We couldn't retrieve this Instagram Reel. Please ensure the post is public."
};

export class InstagramExtractionError extends Error {
  public code: ExtractionErrorCode;
  public status: number;
  public details?: string;

  constructor(code: ExtractionErrorCode, details?: string, status = 422) {
    super(ERROR_MESSAGES[code] || details || "Extraction failed");
    this.name = "InstagramExtractionError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
