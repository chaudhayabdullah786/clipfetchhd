export type PageType = 
  | "downloader_landing"
  | "info"
  | "guide"
  | "legal"
  | "contact"
  | "blog_index"
  | "system_protected";

export type PageStatus = "draft" | "published" | "archived";

export type BlockType =
  | "rich_text"
  | "h2_section"
  | "h3_subsection"
  | "paragraph"
  | "ordered_steps"
  | "bullet_list"
  | "feature_grid"
  | "benefits_grid"
  | "how_it_works_steps"
  | "faq_accordion"
  | "important_note"
  | "warning_callout"
  | "image"
  | "image_with_text"
  | "comparison_table"
  | "cta"
  | "internal_links"
  | "related_articles"
  | "trust_legal_notice"
  | "ad_slot"
  | "divider"
  | "spacer";

export interface ContentBlock {
  id: string;
  type: BlockType;
  heading?: string;
  content: any; // Structured payload depending on block type
  sort_order: number;
  enabled: boolean;
  icon?: string;
  image?: string;
  image_alt?: string;
  background_style?: "default" | "muted" | "highlight" | "bordered";
  admin_label?: string;
}

export interface CmsPage {
  id: number;
  internal_name: string;
  route: string;
  slug: string;
  page_type: PageType;
  show_tool: boolean;
  status: PageStatus;
  indexable: boolean;
  published_version_id?: number | null;
  created_at: string;
  updated_at: string;
  published_version?: CmsPageVersion | null;
  draft_version?: CmsPageVersion | null;
}

export interface CmsPageVersion {
  id: number;
  page_id: number;
  version_number: number;
  h1: string;
  introduction: string;
  supporting_text?: string;
  seo_title: string;
  meta_description: string;
  primary_keyword?: string;
  canonical_url?: string;
  robots_index: boolean;
  robots_follow: boolean;
  max_image_preview?: string;
  max_video_preview?: string;
  breadcrumb_label?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_image_alt?: string;
  og_type?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_image_alt?: string;
  schema_preset?: string;
  schema_json?: string;
  status: "draft" | "published" | "archived";
  change_note?: string;
  created_by?: string;
  published_at?: string | null;
  created_at: string;
  blocks?: ContentBlock[];
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  featured_image_alt?: string;
  author: string;
  author_bio?: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "scheduled" | "archived";
  published_version_id?: number | null;
  published_at?: string | null;
  scheduled_at?: string | null;
  created_at: string;
  updated_at: string;
  published_version?: BlogPostVersion | null;
  draft_version?: BlogPostVersion | null;
}

export interface BlogPostVersion {
  id: number;
  post_id: number;
  version_number: number;
  title: string;
  excerpt: string;
  content_json: string; // Serialized ContentBlock[]
  seo_title: string;
  meta_description: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  schema_json?: string;
  robots_index: boolean;
  robots_follow: boolean;
  status: "draft" | "published" | "archived";
  change_note?: string;
  created_by?: string;
  created_at: string;
  blocks?: ContentBlock[];
}

export interface SlugRedirect {
  id: number;
  entity_type: "page" | "blog";
  entity_id: number;
  old_path: string;
  new_path: string;
  status_code: number;
  created_at: string;
}

export type AdPosition =
  | "below_tool"
  | "after_block"
  | "between_sections"
  | "blog_sidebar"
  | "before_related"
  | "footer_area";

export interface AdSlot {
  id: number;
  name: string;
  provider: "google_adsense" | "custom_html" | "fallback_sponsor";
  publisher_id?: string;
  slot_id?: string;
  format: "responsive" | "banner_728x90" | "rectangle_300x250" | "leaderboard";
  position: AdPosition;
  settings_json?: string;
  enabled: boolean;
  allowed_pages?: string[]; // e.g. ["/", "/blog/*"]
  start_at?: string | null;
  end_at?: string | null;
  created_at: string;
}

export interface GlobalSeoSettings {
  site_name: string;
  site_tagline: string;
  production_base_url: string;
  default_seo_title: string;
  default_meta_description: string;
  default_og_image: string;
  default_og_image_alt: string;
  default_og_type: string;
  default_twitter_card: string;
  organization_name: string;
  organization_logo: string;
  contact_url: string;
  search_console_verification: string;
  bing_verification: string;
  ga4_measurement_id: string;
  default_robots: string;
  default_locale: string;
}

export interface SeoIssue {
  severity: "ERROR" | "WARNING" | "INFO";
  page_id: number;
  page_name: string;
  route: string;
  issue: string;
  recommendation: string;
}

export interface CmsAuditEntry {
  id: number;
  actor_id?: string;
  entity_type: string;
  entity_id: number;
  action: string;
  before_json?: string;
  after_json?: string;
  created_at: string;
}
