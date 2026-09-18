import crypto from "crypto";
import { parseInstagramUrl } from "./urlParser.js";
import { verifyMediaReachable } from "./verifier.js";
import { downloadStore } from "./downloadStore.js";
import { ProviderFactory } from "./providers/providerFactory.js";
import { ERROR_MESSAGES } from "./errors.js";
import {
  ExtractionResponse,
  ExtractionErrorCode,
  InstagramExtractionResult,
  RawReelData,
  DiagnosticsInfo
} from "./types.js";

export class InstagramExtractionService {
  /**
   * Main entry point for extracting an Instagram Reel or Video.
   */
  public async extract(rawUrl: string, incomingRequestId?: string): Promise<ExtractionResponse> {
    const startTime = Date.now();
    const requestId = incomingRequestId || `req_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    // 1. Validate & Normalize Instagram URL
    const parseResult = parseInstagramUrl(rawUrl);
    if (!parseResult.valid || !parseResult.shortcode || !parseResult.normalizedUrl) {
      const duration = Date.now() - startTime;
      const failureCode: ExtractionErrorCode = "INVALID_INSTAGRAM_URL";
      const message = parseResult.error || ERROR_MESSAGES[failureCode];

      this.logDiagnostics({
        requestId,
        originalUrl: rawUrl,
        normalizedUrl: parseResult.normalizedUrl || "n/a",
        shortcode: parseResult.shortcode || "n/a",
        selectedProvider: "none",
        providerConfigured: false,
        providerStatus: 400,
        providerResponseType: "invalid_url",
        videoUrlFound: false,
        verificationPassed: false,
        failureCode,
        processingTime: duration
      });

      return {
        success: false,
        error: {
          code: failureCode,
          message
        },
        diagnostics: {
          requestId,
          shortcode: parseResult.shortcode || undefined,
          provider: "none",
          providerConfigured: false,
          providerStatus: 400,
          videoFound: false,
          verification: "skipped",
          failureCode,
          processingTimeMs: duration
        }
      };
    }

    const { shortcode, normalizedUrl } = parseResult;
    const providers = ProviderFactory.getProviders();

    let extractedData: RawReelData | null = null;
    let selectedProvider = "none";
    let providerHttpStatus: number | null = null;
    let lastErrorCode: ExtractionErrorCode = "EXTRACTION_FAILED";

    // 2. Query configured providers in prioritized order
    for (const provider of providers) {
      selectedProvider = provider.name;
      const isConfigured = provider.isConfigured();

      if (!isConfigured && provider.name === "external") {
        lastErrorCode = "PROVIDER_NOT_CONFIGURED";
        continue;
      }

      try {
        const result = await provider.extract(normalizedUrl, shortcode);
        providerHttpStatus = result.httpStatus;

        if (result.errorCode) {
          lastErrorCode = result.errorCode;
        }

        if (result.data && result.data.videoUrl) {
          extractedData = result.data;
          break;
        }
      } catch (err: any) {
        lastErrorCode = "EXTRACTION_FAILED";
      }
    }

    // 3. If no video data was obtained, return honest error
    if (!extractedData || !extractedData.videoUrl) {
      const duration = Date.now() - startTime;
      const failureCode: ExtractionErrorCode = lastErrorCode || "REEL_EXTRACTION_FAILED";

      this.logDiagnostics({
        requestId,
        originalUrl: rawUrl,
        normalizedUrl,
        shortcode,
        selectedProvider,
        providerConfigured: true,
        providerStatus: providerHttpStatus,
        providerResponseType: "no_media",
        videoUrlFound: false,
        verificationPassed: false,
        failureCode,
        processingTime: duration
      });

      return {
        success: false,
        error: {
          code: failureCode,
          message: ERROR_MESSAGES[failureCode] || ERROR_MESSAGES.EXTRACTION_FAILED
        },
        diagnostics: {
          requestId,
          shortcode,
          provider: selectedProvider,
          providerConfigured: true,
          providerStatus: providerHttpStatus,
          videoFound: false,
          verification: "skipped",
          failureCode,
          processingTimeMs: duration
        }
      };
    }

    // 4. Verify Media Reachability & Authentic Meta/Instagram Origin
    const verification = await verifyMediaReachable(extractedData.videoUrl);
    if (!verification.valid) {
      const duration = Date.now() - startTime;
      const failureCode: ExtractionErrorCode = "MEDIA_VERIFICATION_FAILED";

      this.logDiagnostics({
        requestId,
        originalUrl: rawUrl,
        normalizedUrl,
        shortcode,
        selectedProvider,
        providerConfigured: true,
        providerStatus: providerHttpStatus,
        providerResponseType: "unverified_stream",
        videoUrlFound: true,
        verificationPassed: false,
        failureCode,
        processingTime: duration
      });

      return {
        success: false,
        error: {
          code: failureCode,
          message: ERROR_MESSAGES[failureCode],
          details: verification.reason
        },
        diagnostics: {
          requestId,
          shortcode,
          provider: selectedProvider,
          providerConfigured: true,
          providerStatus: providerHttpStatus,
          videoFound: true,
          verification: "failed",
          failureCode,
          processingTimeMs: duration
        }
      };
    }

    // 5. Register verified session in temporary download store
    const { previewId, downloadId } = downloadStore.registerSession(
      shortcode,
      extractedData.videoUrl,
      extractedData.thumbnailUrl
    );

    const duration = Date.now() - startTime;

    this.logDiagnostics({
      requestId,
      originalUrl: rawUrl,
      normalizedUrl,
      shortcode,
      selectedProvider,
      providerConfigured: true,
      providerStatus: providerHttpStatus || 200,
      providerResponseType: "video/mp4",
      videoUrlFound: true,
      verificationPassed: true,
      failureCode: null,
      processingTime: duration
    });

    const resultData: InstagramExtractionResult = {
      shortcode,
      requestedUrl: rawUrl,
      normalizedUrl,
      videoUrl: `/api/reels/preview/${previewId}`,
      thumbnailUrl: extractedData.thumbnailUrl,
      username: extractedData.username,
      caption: extractedData.caption,
      width: extractedData.width,
      height: extractedData.height,
      duration: extractedData.duration,
      provider: selectedProvider,
      verified: true,
      previewId,
      downloadId,
      downloadUrl: `/api/download/${downloadId}`,
      previewUrl: `/api/reels/preview/${previewId}`
    };

    return {
      success: true,
      source: "instagram",
      data: resultData,
      diagnostics: {
        requestId,
        shortcode,
        provider: selectedProvider,
        providerConfigured: true,
        providerStatus: providerHttpStatus || 200,
        videoFound: true,
        verification: "passed",
        failureCode: null,
        processingTimeMs: duration
      }
    };
  }

  /**
   * Diagnostic logger conforming to Requirement 6.
   * NEVER logs API keys, secrets, cookies, or credentials.
   */
  private logDiagnostics(params: {
    requestId: string;
    originalUrl: string;
    normalizedUrl: string;
    shortcode: string;
    selectedProvider: string;
    providerConfigured: boolean;
    providerStatus: number | null;
    providerResponseType: string;
    videoUrlFound: boolean;
    verificationPassed: boolean;
    failureCode: ExtractionErrorCode | null;
    processingTime: number;
  }): void {
    console.log(
      `[Instagram Extraction]\n` +
      `Request ID: ${params.requestId}\n` +
      `Original URL: ${params.originalUrl}\n` +
      `Normalized URL: ${params.normalizedUrl}\n` +
      `Shortcode: ${params.shortcode}\n` +
      `Selected provider: ${params.selectedProvider}\n` +
      `Provider configured: ${params.providerConfigured ? "yes" : "no"}\n` +
      `Provider HTTP status: ${params.providerStatus ?? "n/a"}\n` +
      `Provider response type: ${params.providerResponseType}\n` +
      `Video URL found: ${params.videoUrlFound ? "yes" : "no"}\n` +
      `Verification passed: ${params.verificationPassed ? "yes" : "no"}\n` +
      `Failure code: ${params.failureCode || "NONE"}\n` +
      `Processing time: ${params.processingTime}ms`
    );
  }
}

export const extractionService = new InstagramExtractionService();
