import { CmsPage, GlobalSeoSettings, ContentBlock } from "./types.js";
import { SeoEngine } from "./seoEngine.js";
import { escapeHtml, safeJsonLdStringify } from "./sanitizer.js";

/**
 * Generates an accessible, semantic HTML representation of structured content blocks
 * for search engine crawlers and instant server-rendered initial view.
 */
export function renderBlocksToHtml(blocks: ContentBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) return "";

  return blocks
    .filter(b => b.enabled)
    .map(block => {
      let inner = "";

      switch (block.type) {
        case "h2_section":
          inner = `<section class="cms-block cms-h2-section my-8">
            <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">${escapeHtml(block.heading)}</h2>
            <div class="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 leading-relaxed">${typeof block.content === "string" ? block.content : ""}</div>
          </section>`;
          break;

        case "h3_subsection":
          inner = `<section class="cms-block cms-h3-section my-6">
            <h3 class="text-xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">${escapeHtml(block.heading)}</h3>
            <div class="text-zinc-600 dark:text-zinc-300 leading-relaxed">${typeof block.content === "string" ? block.content : ""}</div>
          </section>`;
          break;

        case "paragraph":
          inner = `<div class="cms-block cms-paragraph my-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
            ${block.heading ? `<h3 class="text-lg font-bold mb-2">${escapeHtml(block.heading)}</h3>` : ""}
            <p>${typeof block.content === "string" ? escapeHtml(block.content) : ""}</p>
          </div>`;
          break;

        case "rich_text":
          inner = `<div class="cms-block cms-rich-text my-6 prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300">
            ${block.heading ? `<h2>${escapeHtml(block.heading)}</h2>` : ""}
            ${typeof block.content === "string" ? block.content : ""}
          </div>`;
          break;

        case "how_it_works_steps":
        case "ordered_steps":
          const steps = Array.isArray(block.content) ? block.content : [];
          inner = `<div class="cms-block cms-steps my-8 space-y-4">
            ${block.heading ? `<h2 class="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">${escapeHtml(block.heading)}</h2>` : ""}
            <ol class="grid grid-cols-1 md:grid-cols-3 gap-4 list-none p-0">
              ${steps.map((s: any, idx: number) => `
                <li class="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div class="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-sm">
                    ${s.step || idx + 1}
                  </div>
                  <h3 class="font-bold text-base text-zinc-900 dark:text-white">${escapeHtml(s.title || "")}</h3>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">${escapeHtml(s.description || "")}</p>
                </li>
              `).join("")}
            </ol>
          </div>`;
          break;

        case "feature_grid":
        case "benefits_grid":
          const items = Array.isArray(block.content) ? block.content : [];
          inner = `<div class="cms-block cms-features my-8 space-y-4">
            ${block.heading ? `<h2 class="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">${escapeHtml(block.heading)}</h2>` : ""}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${items.map((item: any) => `
                <div class="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <h3 class="font-bold text-base text-zinc-900 dark:text-white">${escapeHtml(item.title || "")}</h3>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">${escapeHtml(item.description || "")}</p>
                </div>
              `).join("")}
            </div>
          </div>`;
          break;

        case "faq_accordion":
          const faqs = Array.isArray(block.content) ? block.content : [];
          inner = `<div class="cms-block cms-faqs my-8 space-y-4">
            ${block.heading ? `<h2 class="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">${escapeHtml(block.heading)}</h2>` : ""}
            <div class="space-y-3">
              ${faqs.map((f: any) => `
                <details class="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <summary class="font-bold text-sm cursor-pointer text-zinc-900 dark:text-white">${escapeHtml(f.question || "")}</summary>
                  <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">${escapeHtml(f.answer || "")}</p>
                </details>
              `).join("")}
            </div>
          </div>`;
          break;

        case "important_note":
          inner = `<div class="cms-block cms-note my-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200">
            ${block.heading ? `<h3 class="font-bold text-sm mb-1">${escapeHtml(block.heading)}</h3>` : ""}
            <div class="text-sm leading-relaxed">${typeof block.content === "string" ? escapeHtml(block.content) : ""}</div>
          </div>`;
          break;

        case "warning_callout":
        case "trust_legal_notice":
          inner = `<div class="cms-block cms-warning my-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
            ${block.heading ? `<h3 class="font-bold text-sm mb-1">${escapeHtml(block.heading)}</h3>` : ""}
            <div class="text-sm leading-relaxed">${typeof block.content === "string" ? escapeHtml(block.content) : ""}</div>
          </div>`;
          break;

        case "related_articles":
        case "internal_links":
          const links = Array.isArray(block.content) ? block.content : [];
          inner = `<div class="cms-block cms-related my-8 space-y-4">
            ${block.heading ? `<h2 class="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">${escapeHtml(block.heading)}</h2>` : ""}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${links.map((link: any) => `
                <a href="${escapeHtml(link.url || "#")}" class="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 block hover:border-purple-500 transition-colors">
                  <h3 class="font-bold text-sm text-zinc-900 dark:text-white mb-1">${escapeHtml(link.title || "")}</h3>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400">${escapeHtml(link.description || "")}</p>
                </a>
              `).join("")}
            </div>
          </div>`;
          break;

        case "divider":
          inner = `<hr class="my-8 border-zinc-200 dark:border-zinc-800" />`;
          break;

        default:
          break;
      }

      return inner;
    })
    .join("\n");
}

/**
 * Injects SEO tags, structured data, server content, and serialized bootstrap state
 * into the HTML page template.
 */
export function injectServerSeoAndContent(
  htmlTemplate: string,
  pageData: any,
  seoSettings: GlobalSeoSettings,
  currentUrl: string
): string {
  const headMeta = SeoEngine.generateHeadMetadata(pageData, seoSettings, currentUrl);

  // 1. Replace <title>
  let html = htmlTemplate.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(headMeta.title)}</title>`);

  // 2. Build injection tags for <head>
  const headInject = [
    ...headMeta.metaTags,
    ...headMeta.linkTags,
    ...headMeta.jsonLdSchemas.map(schema => `<script type="application/ld+json">${schema}</script>`)
  ].join("\n    ");

  // Inject before </head>
  html = html.replace(/<\/head>/i, `    ${headInject}\n  </head>`);

  // 3. Serialized Bootstrap Data for seamless client hydration and bootstrapScript before body
  const bootstrapPayload = safeJsonLdStringify({
    page: pageData,
    seoSettings
  });
  const bootstrapScript = `<script id="__INITIAL_DATA__" type="application/json">${bootstrapPayload}</script>`;

  // Inject bootstrapScript before </body> without overwriting root app markup
  html = html.replace(/<\/body>/i, `    ${bootstrapScript}\n  </body>`);

  return html;
}
