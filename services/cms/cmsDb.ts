import Database from "better-sqlite3";
import { 
  CmsPage, 
  CmsPageVersion, 
  ContentBlock, 
  BlogPost, 
  BlogPostVersion, 
  GlobalSeoSettings, 
  AdSlot, 
  SlugRedirect,
  SeoIssue 
} from "./types.js";
import { sanitizeHtml, sanitizeBlock, safeJsonLdStringify } from "./sanitizer.js";
import { cmsCache } from "./cache.js";

export function initCmsDatabase(db: Database.Database) {
  // Idempotent table creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      internal_name TEXT NOT NULL,
      route TEXT UNIQUE NOT NULL,
      slug TEXT NOT NULL,
      page_type TEXT NOT NULL,
      show_tool INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      indexable INTEGER NOT NULL DEFAULT 1,
      published_version_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cms_page_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      h1 TEXT NOT NULL,
      introduction TEXT NOT NULL,
      supporting_text TEXT,
      seo_title TEXT NOT NULL,
      meta_description TEXT NOT NULL,
      primary_keyword TEXT,
      canonical_url TEXT,
      robots_index INTEGER NOT NULL DEFAULT 1,
      robots_follow INTEGER NOT NULL DEFAULT 1,
      max_image_preview TEXT DEFAULT 'large',
      max_video_preview TEXT DEFAULT '-1',
      breadcrumb_label TEXT,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      og_image_alt TEXT,
      og_type TEXT DEFAULT 'website',
      twitter_card TEXT DEFAULT 'summary_large_image',
      twitter_title TEXT,
      twitter_description TEXT,
      twitter_image TEXT,
      twitter_image_alt TEXT,
      schema_preset TEXT DEFAULT 'WebPage',
      schema_json TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      change_note TEXT,
      created_by TEXT DEFAULT 'admin',
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES cms_pages (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cms_content_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_uuid TEXT UNIQUE NOT NULL,
      version_id INTEGER NOT NULL,
      block_type TEXT NOT NULL,
      heading TEXT,
      content_json TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      icon TEXT,
      image TEXT,
      image_alt TEXT,
      background_style TEXT DEFAULT 'default',
      admin_label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (version_id) REFERENCES cms_page_versions (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT NOT NULL,
      featured_image TEXT,
      featured_image_alt TEXT,
      author TEXT NOT NULL DEFAULT 'Editorial Team',
      author_bio TEXT,
      category TEXT NOT NULL DEFAULT 'Guides',
      tags_json TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      published_version_id INTEGER,
      published_at DATETIME,
      scheduled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blog_post_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content_json TEXT NOT NULL,
      seo_title TEXT NOT NULL,
      meta_description TEXT NOT NULL,
      canonical_url TEXT,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      twitter_title TEXT,
      twitter_description TEXT,
      twitter_image TEXT,
      schema_json TEXT,
      robots_index INTEGER NOT NULL DEFAULT 1,
      robots_follow INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'draft',
      change_note TEXT,
      created_by TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES blog_posts (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS slug_redirects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      old_path TEXT UNIQUE NOT NULL,
      new_path TEXT NOT NULL,
      status_code INTEGER NOT NULL DEFAULT 301,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ad_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'custom_html',
      publisher_id TEXT,
      slot_id TEXT,
      format TEXT NOT NULL DEFAULT 'responsive',
      position TEXT NOT NULL DEFAULT 'below_tool',
      settings_json TEXT DEFAULT '{}',
      enabled INTEGER NOT NULL DEFAULT 1,
      allowed_pages_json TEXT DEFAULT '["*"]',
      start_at DATETIME,
      end_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seo_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      site_name TEXT NOT NULL,
      site_tagline TEXT NOT NULL,
      production_base_url TEXT NOT NULL,
      default_seo_title TEXT NOT NULL,
      default_meta_description TEXT NOT NULL,
      default_og_image TEXT NOT NULL,
      default_og_image_alt TEXT NOT NULL,
      default_og_type TEXT NOT NULL DEFAULT 'website',
      default_twitter_card TEXT NOT NULL DEFAULT 'summary_large_image',
      organization_name TEXT NOT NULL,
      organization_logo TEXT NOT NULL,
      contact_url TEXT NOT NULL,
      search_console_verification TEXT DEFAULT '',
      bing_verification TEXT DEFAULT '',
      ga4_measurement_id TEXT DEFAULT '',
      default_robots TEXT NOT NULL DEFAULT 'index, follow',
      default_locale TEXT NOT NULL DEFAULT 'en_US',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cms_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id TEXT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      before_json TEXT,
      after_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data if not present
  seedDefaultCmsData(db);
}

function seedDefaultCmsData(db: Database.Database) {
  // 1. Seed Global SEO Settings
  const existingSeo = db.prepare("SELECT id FROM seo_settings WHERE id = 1").get();
  if (!existingSeo) {
    db.prepare(`
      INSERT INTO seo_settings (
        id, site_name, site_tagline, production_base_url,
        default_seo_title, default_meta_description,
        default_og_image, default_og_image_alt, default_og_type,
        default_twitter_card, organization_name, organization_logo,
        contact_url, search_console_verification, bing_verification,
        ga4_measurement_id, default_robots, default_locale
      ) VALUES (
        1, 'ClipFetchHD', 'Download Instagram Reels in High Definition', 'https://clipfetchhd.online',
        'Instagram Reel Downloader – Download Reels Online | ClipFetchHD',
        'Download public Instagram Reels as MP4 with ClipFetchHD. Paste a Reel link, preview the available video, and save it online quickly and easily.',
        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop',
        'ClipFetchHD Downloader Logo Banner', 'website',
        'summary_large_image', 'ClipFetchHD Media Tools',
        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop',
        '/contact', '', '', '', 'index, follow', 'en_US'
      )
    `).run();
  }

  // 2. Seed Homepage
  const existingHome = db.prepare("SELECT id FROM cms_pages WHERE route = '/'").get() as any;
  if (!existingHome) {
    const homeInsert = db.prepare(`
      INSERT INTO cms_pages (internal_name, route, slug, page_type, show_tool, status, indexable)
      VALUES ('Homepage', '/', '', 'downloader_landing', 1, 'published', 1)
    `).run();
    const pageId = Number(homeInsert.lastInsertRowid);

    const versionInsert = db.prepare(`
      INSERT INTO cms_page_versions (
        page_id, version_number, h1, introduction, supporting_text,
        seo_title, meta_description, primary_keyword, canonical_url,
        robots_index, robots_follow, schema_preset, status, change_note, published_at
      ) VALUES (
        ?, 1,
        'Instagram Reel Downloader',
        'Paste any public Instagram Reel or video URL to preview available media streams and download the original MP4 online.',
        'Direct browser download without account login or application installation.',
        'Instagram Reel Downloader – Download Reels Online | ClipFetchHD',
        'Download public Instagram Reels as MP4 with ClipFetchHD. Paste a Reel link, preview the available video, and save it quickly online.',
        'instagram reel downloader',
        '/',
        1, 1, 'WebSite', 'published', 'Initial seed version', CURRENT_TIMESTAMP
      )
    `).run(pageId);
    const versionId = Number(versionInsert.lastInsertRowid);

    // Seed structured content blocks for Homepage
    const homeBlocks: Array<{
      uuid: string;
      type: string;
      heading: string;
      content: any;
      order: number;
      label: string;
      icon?: string;
    }> = [
      {
        uuid: "block-home-steps",
        type: "how_it_works_steps",
        heading: "How to Download an Instagram Reel",
        content: [
          { step: 1, title: "Copy the Public Reel Link", description: "Open Instagram on your phone or browser, find the public Reel you want to save, tap Share or the three dots (...), and choose 'Copy Link'." },
          { step: 2, title: "Paste into the Downloader", description: "Paste the copied URL into the search box above. Our validator will inspect the link structure automatically." },
          { step: 3, title: "Preview & Download HD Video", description: "Click 'Download' to fetch the secure media stream. You can preview the video directly in your browser before saving the MP4 file." }
        ],
        order: 1,
        label: "How-it-works Steps"
      },
      {
        uuid: "block-home-features",
        type: "feature_grid",
        heading: "Main Downloader Features",
        content: [
          { title: "High-Definition Video", description: "Downloads original resolution MP4 streams without re-compressing or adding watermarks." },
          { title: "Direct Browser Preview", description: "Preview the video in real-time before saving to ensure you have the exact clip you need." },
          { title: "No Instagram Login Required", description: "You never need to enter your Instagram credentials or grant third-party account access." },
          { title: "Mobile & Desktop Optimized", description: "Seamless, responsive interface that works smoothly on iOS, Android, macOS, and Windows." },
          { title: "Fast CDN Extraction", description: "Connects securely to public content delivery networks for high-speed streaming." },
          { title: "Light & Dark Mode", description: "Carefully calibrated color schemes designed for eye comfort in any lighting environment." }
        ],
        order: 2,
        label: "Feature Grid"
      },
      {
        uuid: "block-home-support",
        type: "important_note",
        heading: "Supported and Unsupported Links",
        content: "This tool supports standard public Instagram Reels and video posts. Private account posts, deleted clips, age-restricted media, and temporary Stories that require authenticated session cookies cannot be downloaded. If an extraction fails, check that the creator's profile is public.",
        order: 3,
        label: "Supported Link Guidelines"
      },
      {
        uuid: "block-home-privacy",
        type: "trust_legal_notice",
        heading: "Privacy, Storage & Processing",
        content: "We respect your privacy. Video links and media data are processed strictly in temporary sessions to stream the file to your device. We do not maintain a permanent video archive, and media caches expire automatically. Anonymous diagnostics and download counts are kept solely to monitor service health.",
        order: 4,
        label: "Privacy & Processing Policy"
      },
      {
        uuid: "block-home-responsible",
        type: "warning_callout",
        heading: "Responsible Content Usage",
        content: "ClipFetchHD is intended solely for downloading content you own or have obtained permission from the copyright owner to use (e.g. archiving your personal creative portfolio or saving royalty-free educational clips). Always respect creator intellectual property rights. This tool is independent and is not affiliated with Instagram or Meta Platforms, Inc.",
        order: 5,
        label: "Responsible Use Callout"
      },
      {
        uuid: "block-home-faq",
        type: "faq_accordion",
        heading: "Frequently Asked Questions",
        content: [
          { question: "Why is a Reel unavailable for download?", answer: "The post may be from a private Instagram account, deleted by the author, region-restricted, or protected by Instagram's access restrictions. Our system only extracts genuinely public videos." },
          { question: "Can private Reels be downloaded?", answer: "No. Respecting user privacy is essential. This tool does not bypass Instagram account privacy settings or login authentication." },
          { question: "Where is the downloaded video saved?", answer: "Once you click 'Download Video (MP4)', the file is saved directly into your device's default 'Downloads' folder or photo gallery." },
          { question: "Does this downloader work on iPhone and Android?", answer: "Yes! On iPhone (Safari/Chrome), tap Download and confirm in your Files app or save to Camera Roll. On Android, the MP4 downloads directly to your device storage." },
          { question: "Is there any limit on how many Reels I can download?", answer: "Public usage is free for fair personal use. Moderate rate limits prevent automated abuse and keep extraction speeds fast for everyone." }
        ],
        order: 6,
        label: "Homepage FAQ Accordion"
      },
      {
        uuid: "block-home-guides",
        type: "related_articles",
        heading: "Helpful Reel Guides & Resources",
        content: [
          { title: "How to Copy an Instagram Reel Link", url: "/blog/how-to-copy-instagram-reel-link", description: "Step-by-step instructions for copying clean Reel URLs on iOS, Android, and Desktop." },
          { title: "Why an Instagram Reel Download May Fail", url: "/blog/why-instagram-reel-download-fails", description: "Understand the common reasons behind extraction errors and how to resolve them." },
          { title: "Public vs Private Instagram Reels", url: "/blog/public-vs-private-instagram-reels", description: "Learn how privacy settings affect content sharing, embedding, and saving." }
        ],
        order: 7,
        label: "Related Guides Links"
      }
    ];

    const insertBlock = db.prepare(`
      INSERT INTO cms_content_blocks (
        block_uuid, version_id, block_type, heading, content_json, sort_order, enabled, admin_label
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);

    for (const b of homeBlocks) {
      insertBlock.run(b.uuid, versionId, b.type, b.heading, JSON.stringify(b.content), b.order, b.label);
    }

    // Set published version on page
    db.prepare("UPDATE cms_pages SET published_version_id = ? WHERE id = ?").run(versionId, pageId);
  }

  // 3. Seed other essential standard public pages
  const defaultPages = [
    {
      internal_name: "How It Works",
      route: "/how-it-works",
      slug: "how-it-works",
      page_type: "guide",
      show_tool: 1,
      seo_title: "How It Works – Step-by-Step Instagram Reel Downloading",
      meta_description: "Learn how ClipFetchHD extracts and streams high-definition video directly from public Instagram CDN servers.",
      h1: "How ClipFetchHD Works",
      intro: "Understand our extraction process, CDN streaming, and safe media verification technology.",
      blocks: [
        {
          uuid: "block-hiw-1",
          type: "h2_section",
          heading: "The Technical Workflow",
          content: "When you paste a link, our server parses the standard shortcode and verifies that the target is a valid Instagram Reel. We then query the public media metadata and verify the CDN stream before generating a high-speed direct download session.",
          order: 1,
          label: "Workflow Section"
        },
        {
          uuid: "block-hiw-2",
          type: "benefits_grid",
          heading: "Architecture Benefits",
          content: [
            { title: "Direct Stream Pipeline", description: "Zero video re-encoding means 100% of original visual clarity is preserved." },
            { title: "Secure Proxy Sessions", description: "Streaming proxy prevents malicious URL redirection and protects user IP privacy." },
            { title: "Automated Verification", description: "Guarantees video headers match valid MP4 specifications before delivery." }
          ],
          order: 2,
          label: "Benefits Grid"
        }
      ]
    },
    {
      internal_name: "Frequently Asked Questions",
      route: "/faq",
      slug: "faq",
      page_type: "info",
      show_tool: 0,
      seo_title: "Frequently Asked Questions – ClipFetchHD Support",
      meta_description: "Answers to common questions about downloading Instagram Reels, troubleshooting extraction errors, and media formats.",
      h1: "Frequently Asked Questions",
      intro: "Find immediate answers to common questions about using our downloader tool.",
      blocks: [
        {
          uuid: "block-faq-list",
          type: "faq_accordion",
          heading: "General & Technical Questions",
          content: [
            { question: "Do you store downloaded videos?", answer: "No. Video streams are handled ephemerally and delivered directly to your device." },
            { question: "What formats are supported?", answer: "All extracted videos are delivered as standard MP4 files with AAC audio." },
            { question: "Is this service free to use?", answer: "Yes, standard usage is completely free." },
            { question: "Why do I see 'Invalid or Restricted' error?", answer: "Instagram may have marked the video as age-restricted or private, preventing public media retrieval." }
          ],
          order: 1,
          label: "FAQ Accordion"
        }
      ]
    },
    {
      internal_name: "About Us",
      route: "/about",
      slug: "about",
      page_type: "info",
      show_tool: 0,
      seo_title: "About ClipFetchHD – Independent Media Extraction Tool",
      meta_description: "Learn about the technology and mission behind the ClipFetchHD video extraction utility.",
      h1: "About ClipFetchHD",
      intro: "We build clean, fast, and transparent media utilities designed for creators, researchers, and everyday social media users.",
      blocks: [
        {
          uuid: "block-about-mission",
          type: "paragraph",
          heading: "Our Mission",
          content: "Our goal is to provide a clutter-free, fast, and privacy-respecting way to download public Instagram videos in their original quality without intrusive popups or unwanted watermarks.",
          order: 1,
          label: "Mission Statement"
        }
      ]
    },
    {
      internal_name: "Contact Us",
      route: "/contact",
      slug: "contact",
      page_type: "contact",
      show_tool: 0,
      seo_title: "Contact Us – ClipFetchHD Support & Inquiries",
      meta_description: "Get in touch with the ClipFetchHD editorial and technical support team for assistance, feedback, or inquiries.",
      h1: "Contact Our Team",
      intro: "Have a question, feedback, or need technical assistance? We are here to help.",
      blocks: [
        {
          uuid: "block-contact-info",
          type: "rich_text",
          heading: "Get in Touch",
          content: "<p>For general inquiries or feedback, email us at: <strong>support@clipfetchhd.online</strong></p><p>For copyright concerns, visit our <a href='/dmca'>Copyright & DMCA policy</a>.</p>",
          order: 1,
          label: "Contact Information"
        }
      ]
    },
    {
      internal_name: "Privacy Policy",
      route: "/privacy-policy",
      slug: "privacy-policy",
      page_type: "legal",
      show_tool: 0,
      seo_title: "Privacy Policy – ClipFetchHD",
      meta_description: "Our privacy policy explains how data is handled when you visit our website or download public Instagram Reels.",
      h1: "Privacy Policy",
      intro: "Your privacy is important to us. Read how we collect, use, and protect your information.",
      blocks: [
        {
          uuid: "block-priv-1",
          type: "rich_text",
          heading: "Data Collection & Use",
          content: "<p>We do not require user accounts. We do not store your Instagram passwords or personal credentials. When using our downloader, requested public URLs are temporarily processed by our extraction engine to locate the public video stream.</p><p>Server access logs and anonymized IP addresses may be recorded for rate limiting, DDoS mitigation, and aggregate analytics.</p>",
          order: 1,
          label: "Data Policy"
        }
      ]
    },
    {
      internal_name: "Terms of Service",
      route: "/terms",
      slug: "terms",
      page_type: "legal",
      show_tool: 0,
      seo_title: "Terms and Conditions – ClipFetchHD",
      meta_description: "Read the terms and conditions for using the ClipFetchHD media extraction utility.",
      h1: "Terms and Conditions",
      intro: "By accessing and using ClipFetchHD, you agree to comply with these terms.",
      blocks: [
        {
          uuid: "block-terms-1",
          type: "rich_text",
          heading: "Permitted Use",
          content: "<p>ClipFetchHD is provided for lawful personal archiving, educational, and research use. You agree not to use this service to infringe upon copyrights, trademarks, or proprietary rights of third parties.</p><p>This service is provided 'as is' without warranties of any kind.</p>",
          order: 1,
          label: "Terms Description"
        }
      ]
    },
    {
      internal_name: "Copyright & DMCA Notice",
      route: "/dmca",
      slug: "dmca",
      page_type: "legal",
      show_tool: 0,
      seo_title: "Copyright & DMCA Policy – ClipFetchHD",
      meta_description: "Information on how copyright holders can submit notices of infringement under the Digital Millennium Copyright Act.",
      h1: "Copyright & DMCA Notice",
      intro: "ClipFetchHD respects the intellectual property rights of creators and copyright owners.",
      blocks: [
        {
          uuid: "block-dmca-1",
          type: "rich_text",
          heading: "Notice and Takedown Procedure",
          content: "<p>ClipFetchHD does not host copyrighted media on its servers; it operates as an ephemeral streaming tool connecting users to public content. If you believe your copyrighted work is being accessed inappropriately, send a notice containing the copyrighted work details, proof of ownership, and the specific Instagram URL to <strong>dmca@clipfetchhd.online</strong>.</p>",
          order: 1,
          label: "DMCA Policy"
        }
      ]
    }
  ];

  for (const p of defaultPages) {
    const existing = db.prepare("SELECT id FROM cms_pages WHERE route = ?").get(p.route);
    if (!existing) {
      const pInsert = db.prepare(`
        INSERT INTO cms_pages (internal_name, route, slug, page_type, show_tool, status, indexable)
        VALUES (?, ?, ?, ?, ?, 'published', 1)
      `).run(p.internal_name, p.route, p.slug, p.page_type, p.show_tool);
      const pageId = Number(pInsert.lastInsertRowid);

      const vInsert = db.prepare(`
        INSERT INTO cms_page_versions (
          page_id, version_number, h1, introduction, seo_title, meta_description,
          canonical_url, robots_index, robots_follow, schema_preset, status, published_at
        ) VALUES (
          ?, 1, ?, ?, ?, ?, ?, 1, 1, 'WebPage', 'published', CURRENT_TIMESTAMP
        )
      `).run(pageId, p.h1, p.intro, p.seo_title, p.meta_description, p.route);
      const versionId = Number(vInsert.lastInsertRowid);

      const bInsert = db.prepare(`
        INSERT INTO cms_content_blocks (
          block_uuid, version_id, block_type, heading, content_json, sort_order, enabled, admin_label
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `);

      for (const b of p.blocks) {
        bInsert.run(b.uuid, versionId, b.type, b.heading, JSON.stringify(b.content), b.order, b.label);
      }

      db.prepare("UPDATE cms_pages SET published_version_id = ? WHERE id = ?").run(versionId, pageId);
    }
  }

  // 4. Seed Draft Blog Posts (per Section 14: seed only as DRAFTS, do not auto-publish)
  const draftBlogPosts = [
    {
      title: "How to Copy an Instagram Reel Link",
      slug: "how-to-copy-instagram-reel-link",
      excerpt: "A complete visual guide to finding and copying clean Instagram Reel URLs on iPhone, Android, and web browsers.",
      author: "Editorial Team",
      category: "How-To",
      tags: ["Instagram", "Guides", "Mobile"],
      blocks: [
        {
          uuid: "post-1-b1",
          type: "h2_section",
          heading: "Copying Reel URLs on the Instagram Mobile App",
          content: "On iOS or Android, open the Reel. Tap the paper airplane (Share) icon on the right-hand action column. At the bottom of the sharing tray, tap 'Copy Link'. The link is saved to your device clipboard.",
          order: 1
        },
        {
          uuid: "post-1-b2",
          type: "h2_section",
          heading: "Copying Reel URLs on a Desktop Web Browser",
          content: "Navigate to instagram.com/reels on your desktop browser. Click the three dots (...) on the top-right of the Reel container and choose 'Copy link', or copy the address directly from your browser address bar.",
          order: 2
        }
      ]
    },
    {
      title: "Why an Instagram Reel Download May Fail",
      slug: "why-instagram-reel-download-fails",
      excerpt: "Troubleshooting common reasons why Instagram Reel extraction encounters errors and how you can fix them.",
      author: "Editorial Team",
      category: "Troubleshooting",
      tags: ["Errors", "Instagram", "Troubleshooting"],
      blocks: [
        {
          uuid: "post-2-b1",
          type: "h2_section",
          heading: "Top Causes for Extraction Failures",
          content: "1. The account is set to Private. 2. The author deleted or archived the video. 3. Instagram applied a temporary rate limit or regional restriction. 4. The URL was copied incorrectly with missing shortcodes.",
          order: 1
        }
      ]
    },
    {
      title: "Public vs Private Instagram Reels",
      slug: "public-vs-private-instagram-reels",
      excerpt: "Understand how Instagram privacy permissions govern content distribution, video embedding, and third-party tools.",
      author: "Editorial Team",
      category: "Privacy",
      tags: ["Privacy", "Instagram", "Security"],
      blocks: [
        {
          uuid: "post-3-b1",
          type: "h2_section",
          heading: "The Boundaries of Public Content",
          content: "Public Reels can be viewed and linked by anyone on or off Instagram. Private Reels are strictly restricted to approved followers and are intentionally blocked from external downloader tools.",
          order: 1
        }
      ]
    },
    {
      title: "Responsible Ways to Save and Reuse Social Media Content",
      slug: "responsible-ways-to-save-and-reuse-social-media-content",
      excerpt: "Best practices for content creators: attribution, fair use, copyright guidelines, and archival storage.",
      author: "Editorial Team",
      category: "Creators",
      tags: ["Copyright", "Best Practices", "Creators"],
      blocks: [
        {
          uuid: "post-4-b1",
          type: "h2_section",
          heading: "Respecting Creator Rights",
          content: "Always ask for explicit permission before reposting another creator's work, give clear attribution in your captions, and avoid using downloaded audio for commercial advertising without licensing.",
          order: 1
        }
      ]
    }
  ];

  for (const bp of draftBlogPosts) {
    const existing = db.prepare("SELECT id FROM blog_posts WHERE slug = ?").get(bp.slug);
    if (!existing) {
      const bInsert = db.prepare(`
        INSERT INTO blog_posts (title, slug, excerpt, author, category, tags_json, status)
        VALUES (?, ?, ?, ?, ?, ?, 'draft')
      `).run(bp.title, bp.slug, bp.excerpt, bp.author, bp.category, JSON.stringify(bp.tags));
      const postId = Number(bInsert.lastInsertRowid);

      db.prepare(`
        INSERT INTO blog_post_versions (
          post_id, version_number, title, excerpt, content_json,
          seo_title, meta_description, canonical_url, status
        ) VALUES (
          ?, 1, ?, ?, ?, ?, ?, ?, 'draft'
        )
      `).run(
        postId,
        bp.title,
        bp.excerpt,
        JSON.stringify(bp.blocks),
        `${bp.title} – ClipFetchHD Guide`,
        bp.excerpt,
        `/blog/${bp.slug}`
      );
    }
  }

  // 5. Seed Controlled Ad Slots (Section 22)
  const existingAds = db.prepare("SELECT COUNT(*) as count FROM ad_slots").get() as any;
  if (!existingAds || existingAds.count === 0) {
    const adInsert = db.prepare(`
      INSERT INTO ad_slots (name, provider, publisher_id, slot_id, format, position, enabled, allowed_pages_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    adInsert.run(
      "Main Downloader Bottom Sponsor Banner",
      "custom_html",
      "",
      "",
      "responsive",
      "below_tool",
      0, // disabled by default per user safety rules
      JSON.stringify(["/"])
    );

    adInsert.run(
      "Article Middle Content Placement",
      "custom_html",
      "",
      "",
      "rectangle_300x250",
      "between_sections",
      0,
      JSON.stringify(["/blog/*"])
    );
  }
}

// --- CMS Data Access Methods ---

export class CmsService {
  constructor(private db: Database.Database) {}

  // --- Page Operations ---

  getAllPages(): CmsPage[] {
    const pages = this.db.prepare(`
      SELECT p.*, 
        pv.h1, pv.seo_title, pv.meta_description, pv.canonical_url, pv.robots_index, pv.robots_follow
      FROM cms_pages p
      LEFT JOIN cms_page_versions pv ON p.published_version_id = pv.id
      ORDER BY p.id ASC
    `).all() as any[];

    return pages.map(p => ({
      ...p,
      show_tool: Boolean(p.show_tool),
      indexable: Boolean(p.indexable),
      published_version: p.published_version_id ? {
        id: p.published_version_id,
        page_id: p.id,
        version_number: 1,
        h1: p.h1,
        introduction: "",
        seo_title: p.seo_title,
        meta_description: p.meta_description,
        canonical_url: p.canonical_url,
        robots_index: Boolean(p.robots_index),
        robots_follow: Boolean(p.robots_follow),
        status: "published",
        created_at: p.updated_at
      } : null
    }));
  }

  getPageById(id: number): (CmsPage & { versions: CmsPageVersion[]; active_version?: CmsPageVersion }) | null {
    const page = this.db.prepare("SELECT * FROM cms_pages WHERE id = ?").get(id) as any;
    if (!page) return null;

    const versions = this.db.prepare(`
      SELECT * FROM cms_page_versions WHERE page_id = ? ORDER BY version_number DESC
    `).all(id) as any[];

    // Hydrate blocks for the active version (either latest draft or published)
    const activeVersionRaw = versions.find(v => v.id === page.published_version_id) || versions[0];
    let activeVersion: CmsPageVersion | undefined = undefined;

    if (activeVersionRaw) {
      const blocksRaw = this.db.prepare(`
        SELECT * FROM cms_content_blocks WHERE version_id = ? ORDER BY sort_order ASC
      `).all(activeVersionRaw.id) as any[];

      const blocks: ContentBlock[] = blocksRaw.map(b => ({
        id: b.block_uuid,
        type: b.block_type,
        heading: b.heading || "",
        content: JSON.parse(b.content_json || "{}"),
        sort_order: b.sort_order,
        enabled: Boolean(b.enabled),
        icon: b.icon || "",
        image: b.image || "",
        image_alt: b.image_alt || "",
        background_style: b.background_style || "default",
        admin_label: b.admin_label || ""
      }));

      activeVersion = {
        ...activeVersionRaw,
        robots_index: Boolean(activeVersionRaw.robots_index),
        robots_follow: Boolean(activeVersionRaw.robots_follow),
        blocks
      };
    }

    return {
      ...page,
      show_tool: Boolean(page.show_tool),
      indexable: Boolean(page.indexable),
      versions: versions.map(v => ({
        ...v,
        robots_index: Boolean(v.robots_index),
        robots_follow: Boolean(v.robots_follow)
      })),
      active_version: activeVersion
    };
  }

  getPageByRoute(route: string, options?: { allowDraft?: boolean } | boolean): any | null {
    const isAllowDraft = typeof options === "boolean" ? options : Boolean(options?.allowDraft);
    // Check in-memory cache first if public published route
    if (!isAllowDraft) {
      const cached = cmsCache.getRoutePage(route);
      if (cached) return cached;
    }

    const page = this.db.prepare("SELECT * FROM cms_pages WHERE route = ?").get(route) as any;
    if (!page) return null;

    let targetVersionId = page.published_version_id;
    if (isAllowDraft || !targetVersionId) {
      const latest = this.db.prepare(`
        SELECT id FROM cms_page_versions WHERE page_id = ? ORDER BY version_number DESC LIMIT 1
      `).get(page.id) as any;
      if (latest) targetVersionId = latest.id;
    }

    if (!targetVersionId) return null;

    const version = this.db.prepare("SELECT * FROM cms_page_versions WHERE id = ?").get(targetVersionId) as any;
    if (!version) return null;

    const blocksRaw = this.db.prepare(`
      SELECT * FROM cms_content_blocks WHERE version_id = ? AND enabled = 1 ORDER BY sort_order ASC
    `).all(version.id) as any[];

    const blocks: ContentBlock[] = blocksRaw.map(b => ({
      id: b.block_uuid,
      type: b.block_type,
      heading: b.heading || "",
      content: JSON.parse(b.content_json || "{}"),
      sort_order: b.sort_order,
      enabled: Boolean(b.enabled),
      icon: b.icon || "",
      image: b.image || "",
      image_alt: b.image_alt || "",
      background_style: b.background_style || "default",
      admin_label: b.admin_label || ""
    }));

    const result = {
      id: page.id,
      internal_name: page.internal_name,
      route: page.route,
      slug: page.slug,
      page_type: page.page_type,
      show_tool: Boolean(page.show_tool),
      status: page.status,
      indexable: Boolean(page.indexable),
      version: {
        ...version,
        robots_index: Boolean(version.robots_index),
        robots_follow: Boolean(version.robots_follow),
        blocks
      }
    };

    if (!isAllowDraft && page.status === "published") {
      cmsCache.setRoutePage(route, result);
    }

    return result;
  }

  createPage(data: {
    internal_name: string;
    route: string;
    slug?: string;
    page_type: string;
    show_tool?: boolean;
    h1?: string;
    seo_title?: string;
    meta_description?: string;
  }): { success: boolean; pageId?: number; error?: string } {
    const rawRoute = data.route.trim();
    if (!rawRoute.startsWith("/")) {
      return { success: false, error: "Route must start with /" };
    }

    // Protect system routes (Section 5)
    const normalized = rawRoute.toLowerCase();
    if (
      normalized.startsWith("/admin") ||
      normalized.startsWith("/api") ||
      normalized.startsWith("/preview") ||
      normalized.startsWith("/download") ||
      normalized === "/sitemap.xml" ||
      normalized === "/robots.txt"
    ) {
      return { success: false, error: "System routes cannot be registered as public CMS pages." };
    }

    // Check duplicate
    const existing = this.db.prepare("SELECT id FROM cms_pages WHERE route = ?").get(rawRoute);
    if (existing) {
      return { success: false, error: `A page with route '${rawRoute}' already exists.` };
    }

    const slug = data.slug || (rawRoute === "/" ? "" : rawRoute.replace(/^\//, ""));

    const insert = this.db.prepare(`
      INSERT INTO cms_pages (internal_name, route, slug, page_type, show_tool, status, indexable)
      VALUES (?, ?, ?, ?, ?, 'draft', 1)
    `).run(
      data.internal_name.trim(),
      rawRoute,
      slug,
      data.page_type || "info",
      data.show_tool ? 1 : 0
    );

    const pageId = Number(insert.lastInsertRowid);

    // Create version 1 (draft)
    const vInsert = this.db.prepare(`
      INSERT INTO cms_page_versions (
        page_id, version_number, h1, introduction, seo_title, meta_description,
        canonical_url, robots_index, robots_follow, status, change_note
      ) VALUES (
        ?, 1, ?, ?, ?, ?, ?, 1, 1, 'draft', 'Initial page creation'
      )
    `).run(
      pageId,
      data.h1 || data.internal_name,
      `Welcome to ${data.internal_name}`,
      data.seo_title || `${data.internal_name} – ClipFetchHD`,
      data.meta_description || `Overview of ${data.internal_name} on ClipFetchHD.`,
      rawRoute
    );

    cmsCache.invalidatePages();
    return { success: true, pageId };
  }

  createDraftVersion(pageId: number, author = "admin", changeNote = "New draft"): { success: boolean; versionId?: number; error?: string } {
    const page = this.db.prepare("SELECT * FROM cms_pages WHERE id = ?").get(pageId) as any;
    if (!page) return { success: false, error: "Page not found" };

    // Get latest version to clone from
    const latestVersion = this.db.prepare(`
      SELECT * FROM cms_page_versions WHERE page_id = ? ORDER BY version_number DESC LIMIT 1
    `).get(pageId) as any;

    const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    const insert = this.db.prepare(`
      INSERT INTO cms_page_versions (
        page_id, version_number, h1, introduction, supporting_text,
        seo_title, meta_description, primary_keyword, canonical_url,
        robots_index, robots_follow, max_image_preview, max_video_preview,
        breadcrumb_label, og_title, og_description, og_image, og_image_alt,
        og_type, twitter_card, twitter_title, twitter_description, twitter_image,
        twitter_image_alt, schema_preset, schema_json, status, change_note, created_by
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, 'draft', ?, ?
      )
    `).run(
      pageId,
      nextVersionNumber,
      latestVersion?.h1 || page.internal_name,
      latestVersion?.introduction || "",
      latestVersion?.supporting_text || "",
      latestVersion?.seo_title || page.internal_name,
      latestVersion?.meta_description || "",
      latestVersion?.primary_keyword || "",
      latestVersion?.canonical_url || page.route,
      latestVersion ? latestVersion.robots_index : 1,
      latestVersion ? latestVersion.robots_follow : 1,
      latestVersion?.max_image_preview || "large",
      latestVersion?.max_video_preview || "-1",
      latestVersion?.breadcrumb_label || page.internal_name,
      latestVersion?.og_title || "",
      latestVersion?.og_description || "",
      latestVersion?.og_image || "",
      latestVersion?.og_image_alt || "",
      latestVersion?.og_type || "website",
      latestVersion?.twitter_card || "summary_large_image",
      latestVersion?.twitter_title || "",
      latestVersion?.twitter_description || "",
      latestVersion?.twitter_image || "",
      latestVersion?.twitter_image_alt || "",
      latestVersion?.schema_preset || "WebPage",
      latestVersion?.schema_json || "",
      changeNote,
      author
    );

    const newVersionId = Number(insert.lastInsertRowid);

    // Clone blocks if present in previous version
    if (latestVersion) {
      const prevBlocks = this.db.prepare(`
        SELECT * FROM cms_content_blocks WHERE version_id = ? ORDER BY sort_order ASC
      `).all(latestVersion.id) as any[];

      const bInsert = this.db.prepare(`
        INSERT INTO cms_content_blocks (
          block_uuid, version_id, block_type, heading, content_json, sort_order, enabled,
          icon, image, image_alt, background_style, admin_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const pb of prevBlocks) {
        const newUuid = `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        bInsert.run(
          newUuid,
          newVersionId,
          pb.block_type,
          pb.heading,
          pb.content_json,
          pb.sort_order,
          pb.enabled,
          pb.icon,
          pb.image,
          pb.image_alt,
          pb.background_style,
          pb.admin_label
        );
      }
    }

    return { success: true, versionId: newVersionId };
  }

  updatePageVersion(versionId: number, data: Partial<CmsPageVersion> & { blocks?: ContentBlock[]; show_tool?: boolean; internal_name?: string }): { success: boolean; error?: string } {
    const version = this.db.prepare("SELECT * FROM cms_page_versions WHERE id = ?").get(versionId) as any;
    if (!version) return { success: false, error: "Version not found" };

    if (version.status === "published") {
      return { success: false, error: "Published versions are immutable. Create a new draft to make edits." };
    }

    // Update version fields
    this.db.prepare(`
      UPDATE cms_page_versions SET
        h1 = COALESCE(?, h1),
        introduction = COALESCE(?, introduction),
        supporting_text = COALESCE(?, supporting_text),
        seo_title = COALESCE(?, seo_title),
        meta_description = COALESCE(?, meta_description),
        primary_keyword = COALESCE(?, primary_keyword),
        canonical_url = COALESCE(?, canonical_url),
        robots_index = COALESCE(?, robots_index),
        robots_follow = COALESCE(?, robots_follow),
        max_image_preview = COALESCE(?, max_image_preview),
        max_video_preview = COALESCE(?, max_video_preview),
        breadcrumb_label = COALESCE(?, breadcrumb_label),
        og_title = COALESCE(?, og_title),
        og_description = COALESCE(?, og_description),
        og_image = COALESCE(?, og_image),
        og_image_alt = COALESCE(?, og_image_alt),
        og_type = COALESCE(?, og_type),
        twitter_card = COALESCE(?, twitter_card),
        twitter_title = COALESCE(?, twitter_title),
        twitter_description = COALESCE(?, twitter_description),
        twitter_image = COALESCE(?, twitter_image),
        twitter_image_alt = COALESCE(?, twitter_image_alt),
        schema_preset = COALESCE(?, schema_preset),
        schema_json = COALESCE(?, schema_json),
        change_note = COALESCE(?, change_note)
      WHERE id = ?
    `).run(
      data.h1 !== undefined ? sanitizeHtml(data.h1) : null,
      data.introduction !== undefined ? sanitizeHtml(data.introduction) : null,
      data.supporting_text !== undefined ? sanitizeHtml(data.supporting_text) : null,
      data.seo_title !== undefined ? sanitizeHtml(data.seo_title) : null,
      data.meta_description !== undefined ? sanitizeHtml(data.meta_description) : null,
      data.primary_keyword !== undefined ? sanitizeHtml(data.primary_keyword) : null,
      data.canonical_url !== undefined ? sanitizeHtml(data.canonical_url) : null,
      data.robots_index !== undefined ? (data.robots_index ? 1 : 0) : null,
      data.robots_follow !== undefined ? (data.robots_follow ? 1 : 0) : null,
      data.max_image_preview !== undefined ? sanitizeHtml(data.max_image_preview) : null,
      data.max_video_preview !== undefined ? sanitizeHtml(data.max_video_preview) : null,
      data.breadcrumb_label !== undefined ? sanitizeHtml(data.breadcrumb_label) : null,
      data.og_title !== undefined ? sanitizeHtml(data.og_title) : null,
      data.og_description !== undefined ? sanitizeHtml(data.og_description) : null,
      data.og_image !== undefined ? sanitizeHtml(data.og_image) : null,
      data.og_image_alt !== undefined ? sanitizeHtml(data.og_image_alt) : null,
      data.og_type !== undefined ? sanitizeHtml(data.og_type) : null,
      data.twitter_card !== undefined ? sanitizeHtml(data.twitter_card) : null,
      data.twitter_title !== undefined ? sanitizeHtml(data.twitter_title) : null,
      data.twitter_description !== undefined ? sanitizeHtml(data.twitter_description) : null,
      data.twitter_image !== undefined ? sanitizeHtml(data.twitter_image) : null,
      data.twitter_image_alt !== undefined ? sanitizeHtml(data.twitter_image_alt) : null,
      data.schema_preset !== undefined ? sanitizeHtml(data.schema_preset) : null,
      data.schema_json !== undefined ? data.schema_json : null,
      data.change_note !== undefined ? sanitizeHtml(data.change_note) : null,
      versionId
    );

    // Update parent page attributes if provided
    if (data.show_tool !== undefined || data.internal_name !== undefined) {
      this.db.prepare(`
        UPDATE cms_pages SET
          show_tool = COALESCE(?, show_tool),
          internal_name = COALESCE(?, internal_name),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        data.show_tool !== undefined ? (data.show_tool ? 1 : 0) : null,
        data.internal_name ? sanitizeHtml(data.internal_name) : null,
        version.page_id
      );
    }

    // Replace blocks if provided
    if (data.blocks && Array.isArray(data.blocks)) {
      this.db.prepare("DELETE FROM cms_content_blocks WHERE version_id = ?").run(versionId);

      const bInsert = this.db.prepare(`
        INSERT INTO cms_content_blocks (
          block_uuid, version_id, block_type, heading, content_json, sort_order, enabled,
          icon, image, image_alt, background_style, admin_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < data.blocks.length; i++) {
        const b = sanitizeBlock(data.blocks[i]);
        const uuid = b.id || `block-${Date.now()}-${i}`;
        bInsert.run(
          uuid,
          versionId,
          b.type,
          b.heading || "",
          JSON.stringify(b.content || {}),
          b.sort_order ?? i,
          b.enabled !== false ? 1 : 0,
          b.icon || "",
          b.image || "",
          b.image_alt || "",
          b.background_style || "default",
          b.admin_label || ""
        );
      }
    }

    return { success: true };
  }

  publishPageVersion(versionId: number): { success: boolean; error?: string } {
    const version = this.db.prepare("SELECT * FROM cms_page_versions WHERE id = ?").get(versionId) as any;
    if (!version) return { success: false, error: "Version not found" };

    // Update version status to published
    this.db.prepare(`
      UPDATE cms_page_versions SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(versionId);

    // Update page
    this.db.prepare(`
      UPDATE cms_pages SET
        published_version_id = ?,
        status = 'published',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(versionId, version.page_id);

    // Invalidate caches
    cmsCache.invalidatePages();

    return { success: true };
  }

  rollbackPage(pageId: number, targetVersionId: number, author = "admin"): { success: boolean; newVersionId?: number; error?: string } {
    const targetVersion = this.db.prepare("SELECT * FROM cms_page_versions WHERE id = ? AND page_id = ?").get(targetVersionId, pageId) as any;
    if (!targetVersion) return { success: false, error: "Target rollback version not found" };

    // Rollback creates a NEW version with target version's content
    const res = this.createDraftVersion(pageId, author, `Rollback to version ${targetVersion.version_number}`);
    if (!res.success || !res.versionId) return res;

    // Immediately publish the newly created rollback version
    this.publishPageVersion(res.versionId);

    return { success: true, newVersionId: res.versionId };
  }

  // --- Blog Operations ---

  getBlogPosts(options?: { status?: string; category?: string; search?: string; limit?: number; offset?: number }) {
    let sql = "SELECT * FROM blog_posts WHERE 1=1";
    const params: any[] = [];

    if (options?.status) {
      sql += " AND status = ?";
      params.push(options.status);
    }
    if (options?.category) {
      sql += " AND category = ?";
      params.push(options.category);
    }
    if (options?.search) {
      sql += " AND (title LIKE ? OR excerpt LIKE ?)";
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    sql += " ORDER BY published_at DESC, id DESC";

    if (options?.limit) {
      sql += " LIMIT ?";
      params.push(options.limit);
      if (options?.offset) {
        sql += " OFFSET ?";
        params.push(options.offset);
      }
    }

    const posts = this.db.prepare(sql).all(...params) as any[];
    return posts.map(p => ({
      ...p,
      tags: JSON.parse(p.tags_json || "[]")
    }));
  }

  getBlogPostBySlug(slug: string, options?: { allowDraft?: boolean }): any | null {
    if (!options?.allowDraft) {
      const cached = cmsCache.getBlogPost(slug);
      if (cached) return cached;
    }

    const post = this.db.prepare("SELECT * FROM blog_posts WHERE slug = ?").get(slug) as any;
    if (!post) return null;

    let targetVersionId = post.published_version_id;
    if (options?.allowDraft || !targetVersionId) {
      const latest = this.db.prepare(`
        SELECT id FROM blog_post_versions WHERE post_id = ? ORDER BY version_number DESC LIMIT 1
      `).get(post.id) as any;
      if (latest) targetVersionId = latest.id;
    }

    if (!targetVersionId) return null;

    const version = this.db.prepare("SELECT * FROM blog_post_versions WHERE id = ?").get(targetVersionId) as any;
    if (!version) return null;

    const result = {
      ...post,
      tags: JSON.parse(post.tags_json || "[]"),
      version: {
        ...version,
        blocks: JSON.parse(version.content_json || "[]")
      }
    };

    if (!options?.allowDraft && post.status === "published") {
      cmsCache.setBlogPost(slug, result);
    }

    return result;
  }

  createBlogPost(data: {
    title: string;
    slug: string;
    excerpt: string;
    author?: string;
    category?: string;
    tags?: string[];
    featured_image?: string;
    featured_image_alt?: string;
    blocks?: any[];
  }): { success: boolean; postId?: number; error?: string } {
    const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const existing = this.db.prepare("SELECT id FROM blog_posts WHERE slug = ?").get(cleanSlug);
    if (existing) {
      return { success: false, error: `Blog post with slug '${cleanSlug}' already exists.` };
    }

    const insert = this.db.prepare(`
      INSERT INTO blog_posts (
        title, slug, excerpt, author, category, tags_json, featured_image, featured_image_alt, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      sanitizeHtml(data.title),
      cleanSlug,
      sanitizeHtml(data.excerpt),
      sanitizeHtml(data.author || "Editorial Team"),
      sanitizeHtml(data.category || "Guides"),
      JSON.stringify(data.tags || []),
      sanitizeHtml(data.featured_image || ""),
      sanitizeHtml(data.featured_image_alt || "")
    );

    const postId = Number(insert.lastInsertRowid);

    // Create initial draft version
    this.db.prepare(`
      INSERT INTO blog_post_versions (
        post_id, version_number, title, excerpt, content_json, seo_title, meta_description, canonical_url, status
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      postId,
      sanitizeHtml(data.title),
      sanitizeHtml(data.excerpt),
      JSON.stringify(data.blocks || []),
      `${data.title} – ClipFetchHD Guide`,
      data.excerpt,
      `/blog/${cleanSlug}`
    );

    cmsCache.invalidateBlog();
    return { success: true, postId };
  }

  updateBlogPost(postId: number, data: Partial<BlogPost> & { blocks?: any[]; change_note?: string }): { success: boolean; error?: string } {
    const post = this.db.prepare("SELECT * FROM blog_posts WHERE id = ?").get(postId) as any;
    if (!post) return { success: false, error: "Blog post not found" };

    // If slug changed, record 301 redirect automatically (Section 14 & 23)
    if (data.slug && data.slug !== post.slug) {
      const oldPath = `/blog/${post.slug}`;
      const newPath = `/blog/${data.slug.trim().toLowerCase()}`;
      try {
        this.db.prepare(`
          INSERT INTO slug_redirects (entity_type, entity_id, old_path, new_path, status_code)
          VALUES ('blog', ?, ?, ?, 301)
        `).run(postId, oldPath, newPath);
      } catch {
        // Redirect record might already exist
      }
    }

    this.db.prepare(`
      UPDATE blog_posts SET
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        excerpt = COALESCE(?, excerpt),
        author = COALESCE(?, author),
        category = COALESCE(?, category),
        tags_json = COALESCE(?, tags_json),
        featured_image = COALESCE(?, featured_image),
        featured_image_alt = COALESCE(?, featured_image_alt),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.title ? sanitizeHtml(data.title) : null,
      data.slug ? data.slug.trim().toLowerCase() : null,
      data.excerpt ? sanitizeHtml(data.excerpt) : null,
      data.author ? sanitizeHtml(data.author) : null,
      data.category ? sanitizeHtml(data.category) : null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.featured_image ? sanitizeHtml(data.featured_image) : null,
      data.featured_image_alt ? sanitizeHtml(data.featured_image_alt) : null,
      postId
    );

    // Check latest version
    const latestVersion = this.db.prepare(`
      SELECT * FROM blog_post_versions WHERE post_id = ? ORDER BY version_number DESC LIMIT 1
    `).get(postId) as any;

    if (latestVersion && latestVersion.status === "draft") {
      this.db.prepare(`
        UPDATE blog_post_versions SET
          title = COALESCE(?, title),
          excerpt = COALESCE(?, excerpt),
          content_json = COALESCE(?, content_json),
          seo_title = COALESCE(?, seo_title),
          meta_description = COALESCE(?, meta_description)
        WHERE id = ?
      `).run(
        data.title ? sanitizeHtml(data.title) : null,
        data.excerpt ? sanitizeHtml(data.excerpt) : null,
        data.blocks ? JSON.stringify(data.blocks) : null,
        data.title ? `${data.title} – ClipFetchHD Guide` : null,
        data.excerpt ? sanitizeHtml(data.excerpt) : null,
        latestVersion.id
      );
    } else {
      // Create new draft version
      const nextVer = latestVersion ? latestVersion.version_number + 1 : 1;
      this.db.prepare(`
        INSERT INTO blog_post_versions (
          post_id, version_number, title, excerpt, content_json, seo_title, meta_description, canonical_url, status, change_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
      `).run(
        postId,
        nextVer,
        data.title ? sanitizeHtml(data.title) : post.title,
        data.excerpt ? sanitizeHtml(data.excerpt) : post.excerpt,
        data.blocks ? JSON.stringify(data.blocks) : (latestVersion?.content_json || "[]"),
        data.title ? `${data.title} – ClipFetchHD Guide` : (latestVersion?.seo_title || post.title),
        data.excerpt ? sanitizeHtml(data.excerpt) : (latestVersion?.meta_description || post.excerpt),
        `/blog/${data.slug || post.slug}`,
        data.change_note || "Updated draft"
      );
    }

    cmsCache.invalidateBlog();
    return { success: true };
  }

  publishBlogPost(postId: number): { success: boolean; error?: string } {
    const post = this.db.prepare("SELECT * FROM blog_posts WHERE id = ?").get(postId) as any;
    if (!post) return { success: false, error: "Blog post not found" };

    const latestVersion = this.db.prepare(`
      SELECT id FROM blog_post_versions WHERE post_id = ? ORDER BY version_number DESC LIMIT 1
    `).get(postId) as any;

    if (!latestVersion) return { success: false, error: "No version found to publish" };

    this.db.prepare(`
      UPDATE blog_post_versions SET status = 'published' WHERE id = ?
    `).run(latestVersion.id);

    this.db.prepare(`
      UPDATE blog_posts SET
        published_version_id = ?,
        status = 'published',
        published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(latestVersion.id, postId);

    cmsCache.invalidateBlog();
    return { success: true };
  }

  unpublishBlogPost(postId: number): { success: boolean; error?: string } {
    this.db.prepare("UPDATE blog_posts SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(postId);
    cmsCache.invalidateBlog();
    return { success: true };
  }

  // --- Slug Redirects (301) ---

  getRedirect(path: string): SlugRedirect | null {
    const redirect = this.db.prepare("SELECT * FROM slug_redirects WHERE old_path = ?").get(path) as any;
    return redirect || null;
  }

  // --- Ad Slots ---

  getAdSlots(options?: { enabledOnly?: boolean; position?: string }): AdSlot[] {
    let sql = "SELECT * FROM ad_slots WHERE 1=1";
    const params: any[] = [];
    if (options?.enabledOnly) {
      sql += " AND enabled = 1";
    }
    if (options?.position) {
      sql += " AND position = ?";
      params.push(options.position);
    }

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(r => ({
      ...r,
      enabled: Boolean(r.enabled),
      allowed_pages: JSON.parse(r.allowed_pages_json || "[]")
    }));
  }

  createAdSlot(data: Omit<AdSlot, "id" | "created_at">): { success: boolean; id?: number } {
    const insert = this.db.prepare(`
      INSERT INTO ad_slots (
        name, provider, publisher_id, slot_id, format, position, settings_json, enabled, allowed_pages_json, start_at, end_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sanitizeHtml(data.name),
      data.provider || "custom_html",
      sanitizeHtml(data.publisher_id || ""),
      sanitizeHtml(data.slot_id || ""),
      data.format || "responsive",
      data.position || "below_tool",
      data.settings_json || "{}",
      data.enabled ? 1 : 0,
      JSON.stringify(data.allowed_pages || ["*"]),
      data.start_at || null,
      data.end_at || null
    );

    cmsCache.invalidateAds();
    return { success: true, id: Number(insert.lastInsertRowid) };
  }

  updateAdSlot(id: number, data: Partial<AdSlot>): { success: boolean } {
    this.db.prepare(`
      UPDATE ad_slots SET
        name = COALESCE(?, name),
        provider = COALESCE(?, provider),
        publisher_id = COALESCE(?, publisher_id),
        slot_id = COALESCE(?, slot_id),
        format = COALESCE(?, format),
        position = COALESCE(?, position),
        settings_json = COALESCE(?, settings_json),
        enabled = COALESCE(?, enabled),
        allowed_pages_json = COALESCE(?, allowed_pages_json),
        start_at = COALESCE(?, start_at),
        end_at = COALESCE(?, end_at)
      WHERE id = ?
    `).run(
      data.name ? sanitizeHtml(data.name) : null,
      data.provider || null,
      data.publisher_id !== undefined ? sanitizeHtml(data.publisher_id) : null,
      data.slot_id !== undefined ? sanitizeHtml(data.slot_id) : null,
      data.format || null,
      data.position || null,
      data.settings_json || null,
      data.enabled !== undefined ? (data.enabled ? 1 : 0) : null,
      data.allowed_pages ? JSON.stringify(data.allowed_pages) : null,
      data.start_at || null,
      data.end_at || null,
      id
    );

    cmsCache.invalidateAds();
    return { success: true };
  }

  deleteAdSlot(id: number): { success: boolean } {
    this.db.prepare("DELETE FROM ad_slots WHERE id = ?").run(id);
    cmsCache.invalidateAds();
    return { success: true };
  }

  // --- SEO Settings ---

  getSeoSettings(): GlobalSeoSettings {
    const cached = cmsCache.getGlobalSeo();
    if (cached) return cached;

    const row = this.db.prepare("SELECT * FROM seo_settings WHERE id = 1").get() as any;
    if (!row) {
      return {
        site_name: "ClipFetchHD",
        site_tagline: "Instagram Reel Downloader – Download Reels Online",
        production_base_url: "https://clipfetchhd.online",
        default_seo_title: "Instagram Reel Downloader – Download Reels Online | ClipFetchHD",
        default_meta_description: "Download public Instagram Reels as MP4 with ClipFetchHD. Paste a Reel link, preview the available video, and save it online quickly and easily.",
        default_og_image: "",
        default_og_image_alt: "",
        default_og_type: "website",
        default_twitter_card: "summary_large_image",
        organization_name: "ClipFetchHD Media Tools",
        organization_logo: "",
        contact_url: "/contact",
        search_console_verification: "",
        bing_verification: "",
        ga4_measurement_id: "",
        default_robots: "index, follow",
        default_locale: "en_US"
      };
    }

    const settings: GlobalSeoSettings = {
      site_name: row.site_name,
      site_tagline: row.site_tagline,
      production_base_url: row.production_base_url,
      default_seo_title: row.default_seo_title,
      default_meta_description: row.default_meta_description,
      default_og_image: row.default_og_image,
      default_og_image_alt: row.default_og_image_alt,
      default_og_type: row.default_og_type,
      default_twitter_card: row.default_twitter_card,
      organization_name: row.organization_name,
      organization_logo: row.organization_logo,
      contact_url: row.contact_url,
      search_console_verification: row.search_console_verification || "",
      bing_verification: row.bing_verification || "",
      ga4_measurement_id: row.ga4_measurement_id || "",
      default_robots: row.default_robots || "index, follow",
      default_locale: row.default_locale || "en_US"
    };

    cmsCache.setGlobalSeo(settings);
    return settings;
  }

  updateSeoSettings(data: Partial<GlobalSeoSettings>): { success: boolean } {
    this.db.prepare(`
      UPDATE seo_settings SET
        site_name = COALESCE(?, site_name),
        site_tagline = COALESCE(?, site_tagline),
        production_base_url = COALESCE(?, production_base_url),
        default_seo_title = COALESCE(?, default_seo_title),
        default_meta_description = COALESCE(?, default_meta_description),
        default_og_image = COALESCE(?, default_og_image),
        default_og_image_alt = COALESCE(?, default_og_image_alt),
        default_og_type = COALESCE(?, default_og_type),
        default_twitter_card = COALESCE(?, default_twitter_card),
        organization_name = COALESCE(?, organization_name),
        organization_logo = COALESCE(?, organization_logo),
        contact_url = COALESCE(?, contact_url),
        search_console_verification = COALESCE(?, search_console_verification),
        bing_verification = COALESCE(?, bing_verification),
        ga4_measurement_id = COALESCE(?, ga4_measurement_id),
        default_robots = COALESCE(?, default_robots),
        default_locale = COALESCE(?, default_locale),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      data.site_name ? sanitizeHtml(data.site_name) : null,
      data.site_tagline ? sanitizeHtml(data.site_tagline) : null,
      data.production_base_url ? sanitizeHtml(data.production_base_url) : null,
      data.default_seo_title ? sanitizeHtml(data.default_seo_title) : null,
      data.default_meta_description ? sanitizeHtml(data.default_meta_description) : null,
      data.default_og_image ? sanitizeHtml(data.default_og_image) : null,
      data.default_og_image_alt ? sanitizeHtml(data.default_og_image_alt) : null,
      data.default_og_type || null,
      data.default_twitter_card || null,
      data.organization_name ? sanitizeHtml(data.organization_name) : null,
      data.organization_logo ? sanitizeHtml(data.organization_logo) : null,
      data.contact_url ? sanitizeHtml(data.contact_url) : null,
      data.search_console_verification !== undefined ? sanitizeHtml(data.search_console_verification) : null,
      data.bing_verification !== undefined ? sanitizeHtml(data.bing_verification) : null,
      data.ga4_measurement_id !== undefined ? sanitizeHtml(data.ga4_measurement_id) : null,
      data.default_robots || null,
      data.default_locale || null
    );

    cmsCache.invalidateSeo();
    return { success: true };
  }

  // --- Actionable SEO Audit (Section 17) ---

  auditSeo(): SeoIssue[] {
    const issues: SeoIssue[] = [];
    const pages = this.getAllPages();
    const seenTitles = new Map<string, string>();
    const seenDescriptions = new Map<string, string>();

    for (const page of pages) {
      const v = page.published_version;
      if (!v) {
        issues.push({
          severity: "WARNING",
          page_id: page.id,
          page_name: page.internal_name,
          route: page.route,
          issue: "Page has no published version.",
          recommendation: "Create a draft and publish this page so it becomes accessible to visitors."
        });
        continue;
      }

      // Title checks
      if (!v.seo_title || !v.seo_title.trim()) {
        issues.push({
          severity: "ERROR",
          page_id: page.id,
          page_name: page.internal_name,
          route: page.route,
          issue: "Missing SEO Title.",
          recommendation: "Specify an explicit, descriptive SEO title between 30 and 60 characters."
        });
      } else {
        if (v.seo_title.length < 25) {
          issues.push({
            severity: "WARNING",
            page_id: page.id,
            page_name: page.internal_name,
            route: page.route,
            issue: "Short SEO Title.",
            recommendation: `Title is only ${v.seo_title.length} characters. Consider expanding with brand or context.`
          });
        }
        if (seenTitles.has(v.seo_title) && seenTitles.get(v.seo_title) !== page.route) {
          issues.push({
            severity: "WARNING",
            page_id: page.id,
            page_name: page.internal_name,
            route: page.route,
            issue: `Duplicate SEO Title with route ${seenTitles.get(v.seo_title)}.`,
            recommendation: "Ensure every indexable page has a distinct, descriptive title."
          });
        } else {
          seenTitles.set(v.seo_title, page.route);
        }
      }

      // Description checks
      if (!v.meta_description || !v.meta_description.trim()) {
        issues.push({
          severity: "WARNING",
          page_id: page.id,
          page_name: page.internal_name,
          route: page.route,
          issue: "Missing Meta Description.",
          recommendation: "Provide a helpful summary between 120 and 160 characters for search snippet previews."
        });
      } else {
        if (seenDescriptions.has(v.meta_description) && seenDescriptions.get(v.meta_description) !== page.route) {
          issues.push({
            severity: "WARNING",
            page_id: page.id,
            page_name: page.internal_name,
            route: page.route,
            issue: `Duplicate Meta Description with route ${seenDescriptions.get(v.meta_description)}.`,
            recommendation: "Tailor the description to the unique content of this specific page."
          });
        } else {
          seenDescriptions.set(v.meta_description, page.route);
        }
      }

      // Canonical checks
      if (!v.canonical_url || !v.canonical_url.trim()) {
        issues.push({
          severity: "INFO",
          page_id: page.id,
          page_name: page.internal_name,
          route: page.route,
          issue: "Implicit canonical URL.",
          recommendation: `Canonical will default to current route '${page.route}'.`
        });
      }

      // Homepage noindex check (Section 17)
      if (page.route === "/" && (!v.robots_index || !page.indexable)) {
        issues.push({
          severity: "WARNING",
          page_id: page.id,
          page_name: page.internal_name,
          route: page.route,
          issue: "Noindex set on primary homepage.",
          recommendation: "Search engines will not index the main landing page. Set Robots to Index."
        });
      }

      // Social Image
      if (!v.og_image) {
        issues.push({
          severity: "INFO",
          page_id: page.id,
          page_name: page.internal_name,
          route: page.route,
          issue: "Using default site Open Graph image.",
          recommendation: "Upload a specific OG social image for richer share previews on social platforms."
        });
      }
    }

    return issues;
  }

  // --- Convenience & Compatibility Aliases ---

  listPages(): CmsPage[] {
    return this.getAllPages();
  }

  listBlogPosts(options?: { status?: string; category?: string; search?: string; limit?: number; offset?: number }) {
    return this.getBlogPosts(options);
  }

  getBlogPostById(id: number): any | null {
    const post = this.db.prepare("SELECT * FROM blog_posts WHERE id = ?").get(id) as any;
    if (!post) return null;
    const latestVersion = this.db.prepare(
      "SELECT * FROM blog_post_versions WHERE post_id = ? ORDER BY version_number DESC LIMIT 1"
    ).get(id) as any;
    return {
      ...post,
      tags: JSON.parse(post.tags_json || "[]"),
      version: latestVersion ? {
        ...latestVersion,
        blocks: JSON.parse(latestVersion.content_json || "[]")
      } : null
    };
  }

  listAdSlots(position?: string): AdSlot[] {
    return this.getAdSlots(position ? { position } : undefined);
  }

  createDraftFromPublished(pageId: number, author = "admin", changeNote = "New draft"): number {
    const res = this.createDraftVersion(pageId, author, changeNote);
    if (!res.success || !res.versionId) {
      throw new Error(res.error || "Failed to create draft");
    }
    return res.versionId;
  }

  updateVersionDraft(versionId: number, data: any): void {
    const res = this.updatePageVersion(versionId, data);
    if (!res.success) {
      throw new Error(res.error || "Failed to update draft");
    }
  }

  publishVersion(versionId: number): void {
    const res = this.publishPageVersion(versionId);
    if (!res.success) {
      throw new Error(res.error || "Failed to publish version");
    }
  }

  rollbackToVersion(pageId: number, targetVersionId: number, author = "admin"): number {
    const res = this.rollbackPage(pageId, targetVersionId, author);
    if (!res.success || !res.newVersionId) {
      throw new Error(res.error || "Failed to rollback version");
    }
    return res.newVersionId;
  }

  runSeoAudit(): SeoIssue[] {
    return this.auditSeo();
  }
}
