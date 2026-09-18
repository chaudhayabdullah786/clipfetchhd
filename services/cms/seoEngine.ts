import Database from "better-sqlite3";
import { GlobalSeoSettings, ContentBlock } from "./types.js";
import { escapeHtml, safeJsonLdStringify, validateCanonicalUrl } from "./sanitizer.js";

export interface HeadMetadata {
  title: string;
  metaTags: string[];
  linkTags: string[];
  jsonLdSchemas: string[];
}

export class SeoEngine {
  /**
   * Builds the complete head metadata tags (Title, Meta, OG, Twitter, Canonical, Schema JSON-LD)
   * for server-side HTML injection.
   */
  static generateHeadMetadata(page: any, settings: GlobalSeoSettings, currentUrl: string): HeadMetadata {
    const v = page?.version || {};
    const baseUrl = (settings.production_base_url || "https://clipfetchhd.online").replace(/\/$/, "");

    // 1. Resolve effective Title & Description
    const title = v.seo_title || `${page?.internal_name || "Page"} – ${settings.site_name}`;
    const description = v.meta_description || settings.default_meta_description;

    // 2. Resolve Canonical
    let canonical = v.canonical_url || page?.route || currentUrl;
    if (canonical.startsWith("/")) {
      canonical = `${baseUrl}${canonical}`;
    }
    const validatedCanonical = validateCanonicalUrl(canonical).normalized || `${baseUrl}${page?.route || "/"}`;

    // 3. Resolve Robots
    const isIndex = v.robots_index !== false && page?.indexable !== false;
    const isFollow = v.robots_follow !== false;
    const robotsContent = `${isIndex ? "index" : "noindex"}, ${isFollow ? "follow" : "nofollow"}, max-image-preview:${v.max_image_preview || "large"}, max-video-preview:${v.max_video_preview || "-1"}`;

    // 4. Resolve Social Meta
    const ogTitle = v.og_title || title;
    const ogDesc = v.og_description || description;
    const ogImage = v.og_image || settings.default_og_image || "";
    const ogImageAlt = v.og_image_alt || settings.default_og_image_alt || title;
    const ogType = v.og_type || (page?.page_type === "blog_post" ? "article" : settings.default_og_type || "website");

    const twitterCard = v.twitter_card || settings.default_twitter_card || "summary_large_image";
    const twitterTitle = v.twitter_title || ogTitle;
    const twitterDesc = v.twitter_description || ogDesc;
    const twitterImage = v.twitter_image || ogImage;
    const twitterImageAlt = v.twitter_image_alt || ogImageAlt;

    const metaTags: string[] = [
      `<meta name="description" content="${escapeHtml(description)}">`,
      `<meta name="robots" content="${escapeHtml(robotsContent)}">`,
      
      // Open Graph
      `<meta property="og:site_name" content="${escapeHtml(settings.site_name)}">`,
      `<meta property="og:type" content="${escapeHtml(ogType)}">`,
      `<meta property="og:url" content="${escapeHtml(validatedCanonical)}">`,
      `<meta property="og:title" content="${escapeHtml(ogTitle)}">`,
      `<meta property="og:description" content="${escapeHtml(ogDesc)}">`,
      `<meta property="og:locale" content="${escapeHtml(settings.default_locale || "en_US")}">`
    ];

    if (ogImage) {
      metaTags.push(`<meta property="og:image" content="${escapeHtml(ogImage)}">`);
      if (ogImageAlt) {
        metaTags.push(`<meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}">`);
      }
    }

    // Twitter Cards
    metaTags.push(
      `<meta name="twitter:card" content="${escapeHtml(twitterCard)}">`,
      `<meta name="twitter:title" content="${escapeHtml(twitterTitle)}">`,
      `<meta name="twitter:description" content="${escapeHtml(twitterDesc)}">`
    );

    if (twitterImage) {
      metaTags.push(`<meta name="twitter:image" content="${escapeHtml(twitterImage)}">`);
      if (twitterImageAlt) {
        metaTags.push(`<meta name="twitter:image:alt" content="${escapeHtml(twitterImageAlt)}">`);
      }
    }

    // Search Engine Verifications (Section 16)
    if (settings.search_console_verification) {
      metaTags.push(`<meta name="google-site-verification" content="${escapeHtml(settings.search_console_verification)}">`);
    }
    if (settings.bing_verification) {
      metaTags.push(`<meta name="msvalidate.01" content="${escapeHtml(settings.bing_verification)}">`);
    }

    const linkTags: string[] = [
      `<link rel="canonical" href="${escapeHtml(validatedCanonical)}">`
    ];

    // 5. Build Structured Data (JSON-LD) Schemas
    const jsonLdSchemas: string[] = [];

    // WebSite schema (on homepage)
    if (page?.route === "/") {
      const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": settings.site_name,
        "url": baseUrl,
        "description": settings.site_tagline || description,
        "publisher": {
          "@type": "Organization",
          "name": settings.organization_name,
          "logo": {
            "@type": "ImageObject",
            "url": settings.organization_logo || ogImage
          }
        }
      };
      jsonLdSchemas.push(safeJsonLdStringify(websiteSchema));
    }

    // WebPage schema
    const webPageSchema: any = {
      "@context": "https://schema.org",
      "@type": page?.page_type === "contact" ? "ContactPage" : page?.page_type === "about" ? "AboutPage" : "WebPage",
      "name": title,
      "url": validatedCanonical,
      "description": description,
      "isPartOf": {
        "@type": "WebSite",
        "name": settings.site_name,
        "url": baseUrl
      }
    };
    if (v.published_at) {
      webPageSchema.datePublished = v.published_at;
    }
    jsonLdSchemas.push(safeJsonLdStringify(webPageSchema));

    // BreadcrumbList schema
    if (page?.route !== "/") {
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": v.breadcrumb_label || page?.internal_name || title,
            "item": validatedCanonical
          }
        ]
      };
      jsonLdSchemas.push(safeJsonLdStringify(breadcrumbSchema));
    }

    // FAQPage schema (if page has faq_accordion block)
    const blocks: ContentBlock[] = v.blocks || [];
    const faqBlock = blocks.find(b => b.type === "faq_accordion" && b.enabled);
    if (faqBlock && Array.isArray(faqBlock.content) && faqBlock.content.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqBlock.content.map((item: any) => ({
          "@type": "Question",
          "name": item.question || "",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer || ""
          }
        }))
      };
      jsonLdSchemas.push(safeJsonLdStringify(faqSchema));
    }

    // Article schema (for blog posts)
    if (page?.page_type === "blog_post") {
      const articleSchema: any = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": description,
        "url": validatedCanonical,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": validatedCanonical
        },
        "author": {
          "@type": "Person",
          "name": page.author || "Editorial Team"
        },
        "publisher": {
          "@type": "Organization",
          "name": settings.organization_name,
          "logo": {
            "@type": "ImageObject",
            "url": settings.organization_logo || ogImage
          }
        }
      };
      if (page.featured_image) {
        articleSchema.image = page.featured_image;
      }
      if (page.published_at) {
        articleSchema.datePublished = page.published_at;
      }
      if (page.updated_at) {
        articleSchema.dateModified = page.updated_at;
      }
      jsonLdSchemas.push(safeJsonLdStringify(articleSchema));
    }

    // Custom injected schema if present in version
    if (v.schema_json && v.schema_json.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(v.schema_json);
        jsonLdSchemas.push(safeJsonLdStringify(parsed));
      } catch {
        // Invalid custom schema JSON ignored safely
      }
    }

    return {
      title,
      metaTags,
      linkTags,
      jsonLdSchemas
    };
  }

  /**
   * Generates dynamic XML Sitemap containing only published, indexable pages and blog posts.
   * Excludes admin, api, preview, download, drafts, and noindex items (Section 18).
   */
  static generateSitemapXml(db: Database.Database, settings: GlobalSeoSettings): string {
    const baseUrl = (settings.production_base_url || "https://clipfetchhd.online").replace(/\/$/, "");

    // Query published pages with robots_index = 1 and indexable = 1
    const pages = db.prepare(`
      SELECT p.route, p.page_type, p.updated_at, pv.robots_index
      FROM cms_pages p
      INNER JOIN cms_page_versions pv ON p.published_version_id = pv.id
      WHERE p.status = 'published' AND p.indexable = 1 AND pv.robots_index = 1
      ORDER BY p.id ASC
    `).all() as any[];

    // Query published blog posts with robots_index = 1
    const blogPosts = db.prepare(`
      SELECT bp.slug, bp.published_at, bp.updated_at, bpv.robots_index
      FROM blog_posts bp
      INNER JOIN blog_post_versions bpv ON bp.published_version_id = bpv.id
      WHERE bp.status = 'published' AND bpv.robots_index = 1
      ORDER BY bp.published_at DESC
    `).all() as any[];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const p of pages) {
      const loc = `${baseUrl}${p.route === "/" ? "" : p.route}`;
      let priority = "0.7";
      let changefreq = "weekly";

      if (p.route === "/") {
        priority = "1.0";
        changefreq = "daily";
      } else if (p.page_type === "guide" || p.page_type === "downloader_landing") {
        priority = "0.8";
      } else if (p.page_type === "legal") {
        priority = "0.4";
        changefreq = "monthly";
      }

      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

      xml += `  <url>\n`;
      xml += `    <loc>${escapeHtml(loc)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    for (const post of blogPosts) {
      const loc = `${baseUrl}/blog/${post.slug}`;
      const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

      xml += `  <url>\n`;
      xml += `    <loc>${escapeHtml(loc)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;
    return xml;
  }

  /**
   * Generates dynamic robots.txt referencing the sitemap and disallowing private routes (Section 19).
   */
  static generateRobotsTxt(settings: GlobalSeoSettings): string {
    const baseUrl = (settings.production_base_url || "https://clipfetchhd.online").replace(/\/$/, "");

    return `# ClipFetchHD Robots Configuration
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin
Disallow: /api/
Disallow: /preview/
Disallow: /download/

Sitemap: ${baseUrl}/sitemap.xml
`;
  }
}
