export type ExtractionErrorCode =
  | "INVALID_INSTAGRAM_URL"
  | "INVALID_SHORTCODE"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_AUTH_FAILED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_FORBIDDEN"
  | "PROVIDER_BAD_RESPONSE"
  | "REEL_NOT_FOUND"
  | "REEL_PRIVATE_OR_RESTRICTED"
  | "MEDIA_URL_MISSING"
  | "MEDIA_VERIFICATION_FAILED"
  | "INSTAGRAM_TEMPORARILY_UNAVAILABLE"
  | "REEL_EXTRACTION_FAILED"
  | "EXTRACTION_FAILED";

export interface DiagnosticsInfo {
  requestId: string;
  shortcode?: string;
  provider: string;
  providerConfigured: boolean;
  providerStatus: number | null;
  videoFound: boolean;
  verification: "passed" | "failed" | "skipped";
  failureCode: ExtractionErrorCode | null;
  processingTimeMs: number;
}

export interface InstagramExtractionResult {
  shortcode: string;
  requestedUrl: string;
  normalizedUrl: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  username: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  provider: string;
  verified: boolean;
  previewId: string;
  downloadId: string;
  downloadUrl: string;
  previewUrl: string;
}

export interface ReelResult {
  success: true;
  source: "instagram";
  data: InstagramExtractionResult;
  diagnostics?: DiagnosticsInfo;
}

export interface ExtractionError {
  success: false;
  error: {
    code: ExtractionErrorCode;
    message: string;
    details?: string;
  };
  diagnostics?: DiagnosticsInfo;
}

export type ExtractionResponse = ReelResult | ExtractionError;

export interface RawReelData {
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  username: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  quality?: string | null;
}

export interface ProviderResult {
  data: RawReelData | null;
  httpStatus: number | null;
  errorCode?: ExtractionErrorCode;
}

export interface InstagramExtractionProvider {
  name: string;
  isConfigured(): boolean;
  extract(normalizedUrl: string, shortcode: string): Promise<ProviderResult>;
}
