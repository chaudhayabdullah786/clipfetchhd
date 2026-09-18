import axios from "axios";
import { InstagramExtractionProvider } from "./provider.js";
import { ProviderResult, RawReelData } from "../types.js";

export class DirectInstagramProvider implements InstagramExtractionProvider {
  public name = "direct";

  public isConfigured(): boolean {
    return true;
  }

  public async extract(normalizedUrl: string, shortcode: string): Promise<ProviderResult> {
    // Strategy 1: Instagram Embed Endpoint with Crawler UA (provides public SSR metadata)
    const embedResult = await this.fetchFromEmbed(shortcode);
    if (embedResult.data && embedResult.data.videoUrl) {
      return embedResult;
    }

    // If embed indicated explicit private or restricted status
    if (embedResult.errorCode === "REEL_PRIVATE_OR_RESTRICTED" || embedResult.errorCode === "REEL_NOT_FOUND") {
      return embedResult;
    }

    // Strategy 2: Direct page fetch with social metadata crawler UA
    const directResult = await this.fetchFromDirectPage(normalizedUrl, shortcode);
    if (directResult.data && directResult.data.videoUrl) {
      return directResult;
    }

    return {
      data: null,
      httpStatus: directResult.httpStatus || embedResult.httpStatus || null,
      errorCode: directResult.errorCode || embedResult.errorCode || "REEL_EXTRACTION_FAILED"
    };
  }

  /**
   * Strategy 1: Instagram Embed Page (/reel/SHORTCODE/embed/captioned/)
   */
  private async fetchFromEmbed(shortcode: string): Promise<ProviderResult> {
    try {
      const embedUrl = `https://www.instagram.com/reel/${shortcode}/embed/captioned/`;
      const response = await axios.get(embedUrl, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache"
        },
        timeout: 10000,
        maxRedirects: 4,
        validateStatus: (s) => s >= 200 && s < 500
      });

      const status = response.status;
      const html = typeof response.data === "string" ? response.data : "";

      if (status === 404 || html.includes("Page Not Found") || html.includes("isn't available")) {
        return { data: null, httpStatus: status, errorCode: "REEL_NOT_FOUND" };
      }

      if (html.includes("login") && !html.includes("video_url") && !html.includes("GraphVideo")) {
        // Embed could not load without login - likely private or restricted
        return { data: null, httpStatus: status, errorCode: "REEL_PRIVATE_OR_RESTRICTED" };
      }

      const parsed = this.parseEmbedHtml(html, shortcode);
      if (parsed) {
        return { data: parsed, httpStatus: status };
      }

      return { data: null, httpStatus: status, errorCode: "MEDIA_URL_MISSING" };
    } catch (err: any) {
      const status = err.response?.status || null;
      if (status === 404) return { data: null, httpStatus: 404, errorCode: "REEL_NOT_FOUND" };
      if (status === 403) return { data: null, httpStatus: 403, errorCode: "REEL_PRIVATE_OR_RESTRICTED" };
      if (err.code === "ECONNABORTED") return { data: null, httpStatus: 408, errorCode: "PROVIDER_TIMEOUT" };

      return { data: null, httpStatus: status, errorCode: "EXTRACTION_FAILED" };
    }
  }

  /**
   * Strategy 2: Direct URL Request
   */
  private async fetchFromDirectPage(url: string, shortcode: string): Promise<ProviderResult> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        },
        timeout: 10000,
        maxRedirects: 4,
        validateStatus: (s) => s >= 200 && s < 500
      });

      const status = response.status;
      const html = typeof response.data === "string" ? response.data : "";

      if (status === 404 || html.includes("Page Not Found")) {
        return { data: null, httpStatus: status, errorCode: "REEL_NOT_FOUND" };
      }

      const parsed = this.parseEmbedHtml(html, shortcode);
      if (parsed) {
        return { data: parsed, httpStatus: status };
      }

      return { data: null, httpStatus: status, errorCode: "REEL_EXTRACTION_FAILED" };
    } catch (err: any) {
      const status = err.response?.status || null;
      return { data: null, httpStatus: status, errorCode: "REEL_EXTRACTION_FAILED" };
    }
  }

  /**
   * Parses Embed HTML source, extracting the JSON shortcode_media data block.
   */
  private parseEmbedHtml(html: string, shortcode: string): RawReelData | null {
    // 1. Try JSON block extraction of shortcode_media
    const jsonResult = this.extractJsonShortcodeMedia(html);
    if (jsonResult && jsonResult.videoUrl) {
      return jsonResult;
    }

    // 2. Direct token search for video_url inside escaped script strings
    const videoMatch = html.match(/video_url\\*":\s*\\*"([^"]+?\.mp4[^"\\]*)/);
    if (videoMatch) {
      const rawUrl = videoMatch[1].replace(/\\\\/g, "").replace(/\\/g, "").trim();
      if (rawUrl.startsWith("http")) {
        const thumbMatch = html.match(/display_url\\*":\s*\\*"([^"]+)/);
        const thumbnailUrl = thumbMatch
          ? thumbMatch[1].replace(/\\\\/g, "").replace(/\\/g, "").trim()
          : null;

        const userMatch =
          html.match(/username\\*":\s*\\*"([^"\\]+)/) ||
          html.match(/class=["']CaptionUsername["'][^>]*>([^<]+)/i);
        const username = userMatch ? userMatch[1].trim() : null;

        const captionMatch =
          html.match(/CaptionComments["'][^>]*>([\s\S]*?)<\/div>/i) ||
          html.match(/"text\\*":\s*\\*"([^"\\]+)/);
        const caption = captionMatch ? captionMatch[1].replace(/<[^>]+>/g, "").trim() : null;

        return {
          videoUrl: rawUrl,
          thumbnailUrl,
          caption,
          username,
          duration: null,
          width: 1080,
          height: 1920,
          quality: "HD"
        };
      }
    }

    // 3. OpenGraph meta tag fallback
    const ogVideo = html.match(/<meta\s+(?:property|content)=["']og:video["']\s+(?:content|property)=["']([^"']+)["']/i);
    if (ogVideo && ogVideo[1]) {
      const ogImage = html.match(/<meta\s+(?:property|content)=["']og:image["']\s+(?:content|property)=["']([^"']+)["']/i);
      const ogTitle = html.match(/<meta\s+(?:property|content)=["']og:title["']\s+(?:content|property)=["']([^"']+)["']/i);

      let username: string | null = null;
      let caption: string | null = null;
      if (ogTitle && ogTitle[1]) {
        const match = ogTitle[1].match(/^([^:]+)\s+on\s+Instagram:\s*["']?(.*?)["']?$/i);
        if (match) {
          username = match[1].trim();
          caption = match[2]?.trim() || null;
        }
      }

      return {
        videoUrl: ogVideo[1].replace(/&amp;/g, "&").trim(),
        thumbnailUrl: ogImage ? ogImage[1].replace(/&amp;/g, "&").trim() : null,
        caption,
        username,
        duration: null,
        width: null,
        height: null,
        quality: "HD"
      };
    }

    return null;
  }

  /**
   * Scans for the balanced JSON block following "shortcode_media"
   */
  private extractJsonShortcodeMedia(html: string): RawReelData | null {
    const token = "shortcode_media";
    const idx = html.indexOf(token);
    if (idx === -1) return null;

    // Find opening bracket of shortcode_media object
    let start = -1;
    let depth = 0;
    let end = -1;

    for (let i = idx + token.length; i < html.length; i++) {
      if (html[i] === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (html[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    if (start === -1 || end === -1) return null;

    try {
      const rawChunk = html.slice(start, end);
      // Unescape json-in-json quotes and slashes
      const normalized = rawChunk
        .replace(/\\\\"/g, '\\"')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");

      const parsed = JSON.parse(normalized);
      if (!parsed || !parsed.video_url) return null;

      const videoUrl = parsed.video_url.replace(/\\\//g, "/").replace(/\\/g, "").trim();
      const thumbnailUrl = parsed.display_url
        ? parsed.display_url.replace(/\\\//g, "/").replace(/\\/g, "").trim()
        : null;

      let caption: string | null = null;
      if (parsed.edge_media_to_caption?.edges?.[0]?.node?.text) {
        caption = parsed.edge_media_to_caption.edges[0].node.text.trim();
      }

      const username = parsed.owner?.username ? parsed.owner.username.trim() : null;
      const width = parsed.dimensions?.width || null;
      const height = parsed.dimensions?.height || null;
      const duration = typeof parsed.video_duration === "number" ? Math.round(parsed.video_duration) : null;

      return {
        videoUrl,
        thumbnailUrl,
        caption,
        username,
        duration,
        width,
        height,
        quality: width && height ? `${width}x${height}` : "HD"
      };
    } catch {
      return null;
    }
  }
}
