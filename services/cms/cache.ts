/**
 * In-Memory CMS Cache for high-performance public page serving.
 * Prevents redundant SQLite round-trips while guaranteeing immediate invalidation on publishing actions.
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

class CmsCacheService {
  private pageByRouteCache = new Map<string, CacheEntry<any>>();
  private blogPostBySlugCache = new Map<string, CacheEntry<any>>();
  private globalSeoCache: CacheEntry<any> | null = null;
  private adSlotsCache: CacheEntry<any[]> | null = null;
  private sitemapCache: { xml: string; cachedAt: number } | null = null;

  // Cache TTL in milliseconds (default: 5 minutes, but immediately invalidated on write)
  private readonly TTL_MS = 5 * 60 * 1000;

  getRoutePage(route: string): any | null {
    const entry = this.pageByRouteCache.get(route);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > this.TTL_MS) {
      this.pageByRouteCache.delete(route);
      return null;
    }
    return entry.data;
  }

  setRoutePage(route: string, data: any): void {
    this.pageByRouteCache.set(route, { data, cachedAt: Date.now() });
  }

  getBlogPost(slug: string): any | null {
    const entry = this.blogPostBySlugCache.get(slug);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > this.TTL_MS) {
      this.blogPostBySlugCache.delete(slug);
      return null;
    }
    return entry.data;
  }

  setBlogPost(slug: string, data: any): void {
    this.blogPostBySlugCache.set(slug, { data, cachedAt: Date.now() });
  }

  getGlobalSeo(): any | null {
    if (!this.globalSeoCache) return null;
    if (Date.now() - this.globalSeoCache.cachedAt > this.TTL_MS) {
      this.globalSeoCache = null;
      return null;
    }
    return this.globalSeoCache.data;
  }

  setGlobalSeo(data: any): void {
    this.globalSeoCache = { data, cachedAt: Date.now() };
  }

  getAdSlots(): any[] | null {
    if (!this.adSlotsCache) return null;
    if (Date.now() - this.adSlotsCache.cachedAt > this.TTL_MS) {
      this.adSlotsCache = null;
      return null;
    }
    return this.adSlotsCache.data;
  }

  setAdSlots(data: any[]): void {
    this.adSlotsCache = { data, cachedAt: Date.now() };
  }

  getSitemap(): string | null {
    if (!this.sitemapCache) return null;
    if (Date.now() - this.sitemapCache.cachedAt > this.TTL_MS) {
      this.sitemapCache = null;
      return null;
    }
    return this.sitemapCache.xml;
  }

  setSitemap(xml: string): void {
    this.sitemapCache = { xml, cachedAt: Date.now() };
  }

  /**
   * Invalidate all or specific cached resources on publishing actions.
   */
  invalidatePages(): void {
    this.pageByRouteCache.clear();
    this.sitemapCache = null;
  }

  invalidateBlog(): void {
    this.blogPostBySlugCache.clear();
    this.sitemapCache = null;
  }

  invalidateSeo(): void {
    this.globalSeoCache = null;
    this.sitemapCache = null;
  }

  invalidateAds(): void {
    this.adSlotsCache = null;
  }

  invalidateAll(): void {
    this.pageByRouteCache.clear();
    this.blogPostBySlugCache.clear();
    this.globalSeoCache = null;
    this.adSlotsCache = null;
    this.sitemapCache = null;
  }
}

export const cmsCache = new CmsCacheService();
