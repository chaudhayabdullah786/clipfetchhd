import axios, { AxiosError } from "axios";
import { InstagramExtractionProvider } from "./provider.js";
import { ProviderResult, RawReelData } from "../types.js";

/**
 * Generic External Instagram Extraction Provider.
 * Connects to an external REST API (e.g. RapidAPI, custom microservice, or third-party extractor)
 * and normalizes the payload into the application's canonical format.
 */
export class ExternalInstagramProvider implements InstagramExtractionProvider {
  public name = "external";

  public isConfigured(): boolean {
    return Boolean(process.env.INSTAGRAM_API_BASE_URL || process.env.INSTAGRAM_API_ENDPOINT);
  }

  public async extract(normalizedUrl: string, shortcode: string): Promise<ProviderResult> {
    const baseUrl = process.env.INSTAGRAM_API_BASE_URL || process.env.INSTAGRAM_API_ENDPOINT;
    const apiKey = process.env.INSTAGRAM_API_KEY;

    if (!baseUrl) {
      return {
        data: null,
        httpStatus: null,
        errorCode: "PROVIDER_NOT_CONFIGURED"
      };
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "ClipFetchHD-Downloader/1.0"
      };

      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        // Common RapidAPI / third-party header compatibility
        headers["x-rapidapi-key"] = apiKey;
        headers["x-api-key"] = apiKey;
      }

      // Check if URL template has placeholders or should be sent via POST
      let response;
      if (baseUrl.includes("{url}") || baseUrl.includes("{shortcode}")) {
        const targetUrl = baseUrl
          .replace("{url}", encodeURIComponent(normalizedUrl))
          .replace("{shortcode}", encodeURIComponent(shortcode));
        response = await axios.get(targetUrl, { headers, timeout: 15000 });
      } else {
        response = await axios.post(
          baseUrl,
          {
            url: normalizedUrl,
            shortcode,
            media_type: "reel"
          },
          { headers, timeout: 15000 }
        );
      }

      const status = response.status;
      const body = response.data;

      if (!body || typeof body !== "object") {
        return {
          data: null,
          httpStatus: status,
          errorCode: "PROVIDER_BAD_RESPONSE"
        };
      }

      // Normalize heterogeneous third-party response schemas into RawReelData
      const normalizedData = this.normalizeExternalResponse(body);
      if (!normalizedData || !normalizedData.videoUrl) {
        return {
          data: null,
          httpStatus: status,
          errorCode: "MEDIA_URL_MISSING"
        };
      }

      return {
        data: normalizedData,
        httpStatus: status
      };
    } catch (err: unknown) {
      const axiosError = err as AxiosError;
      const status = axiosError.response?.status || null;

      if (status === 401) {
        return { data: null, httpStatus: 401, errorCode: "PROVIDER_AUTH_FAILED" };
      }
      if (status === 403) {
        return { data: null, httpStatus: 403, errorCode: "PROVIDER_FORBIDDEN" };
      }
      if (status === 429) {
        return { data: null, httpStatus: 429, errorCode: "PROVIDER_RATE_LIMITED" };
      }
      if (status === 404) {
        return { data: null, httpStatus: 404, errorCode: "REEL_NOT_FOUND" };
      }
      if (axiosError.code === "ECONNABORTED" || axiosError.code === "ETIMEDOUT") {
        return { data: null, httpStatus: 408, errorCode: "PROVIDER_TIMEOUT" };
      }

      return {
        data: null,
        httpStatus: status,
        errorCode: "PROVIDER_BAD_RESPONSE"
      };
    }
  }

  /**
   * Translates third-party JSON into our internal RawReelData schema.
   */
  private normalizeExternalResponse(body: any): RawReelData | null {
    // 1. Check nested data properties (common in APIs like { data: { video_url: ... } })
    const root = body.data || body.result || body.media || body;

    // 2. Video URL candidates
    let videoUrl: string | null = null;
    if (typeof root.videoUrl === "string") videoUrl = root.videoUrl;
    else if (typeof root.video_url === "string") videoUrl = root.video_url;
    else if (typeof root.download_url === "string") videoUrl = root.download_url;
    else if (typeof root.url === "string" && !root.url.endsWith(".jpg") && !root.url.endsWith(".png")) videoUrl = root.url;
    else if (Array.isArray(root.medias) && root.medias.length > 0) {
      const videoItem = root.medias.find((m: any) => m.type === "video" || m.extension === "mp4") || root.medias[0];
      videoUrl = videoItem.url || videoItem.downloadUrl || null;
    } else if (Array.isArray(root.links) && root.links.length > 0) {
      videoUrl = root.links[0].url || root.links[0].link || null;
    }

    if (!videoUrl) {
      return null;
    }

    // 3. Thumbnail URL candidates
    const thumbnailUrl: string | null =
      root.thumbnailUrl ||
      root.thumbnail_url ||
      root.thumb ||
      root.display_url ||
      root.poster ||
      null;

    // 4. Caption candidates
    const caption: string | null =
      root.caption ||
      root.title ||
      root.description ||
      root.text ||
      null;

    // 5. Username candidates
    const username: string | null =
      root.username ||
      root.author ||
      root.creator ||
      root.owner?.username ||
      null;

    // 6. Dimensions and duration
    const width = typeof root.width === "number" ? root.width : null;
    const height = typeof root.height === "number" ? root.height : null;
    const duration = typeof root.duration === "number" ? Math.round(root.duration) : null;
    const quality = width && height ? `${width}x${height}` : root.quality || "HD";

    return {
      videoUrl,
      thumbnailUrl,
      caption,
      username,
      duration,
      width,
      height,
      quality
    };
  }
}
