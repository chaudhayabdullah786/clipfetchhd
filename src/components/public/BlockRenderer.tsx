import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ChevronDown, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink 
} from "lucide-react";
import { ContentBlock } from "../../types/cms";
import { AdSlotView } from "./AdSlotView";

interface BlockRendererProps {
  blocks: ContentBlock[];
  currentRoute: string;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks, currentRoute }) => {
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<string, boolean>>({ "0": true });

  const toggleFaq = (key: string) => {
    setOpenFaqIndices(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-12 max-w-3xl mx-auto">
      {blocks.filter(b => b.enabled).map((block, idx) => {
        switch (block.type) {
          case "h2_section":
          case "heading_h2":
            return (
              <section key={block.id || idx} className="space-y-4 pt-4">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                  {block.heading}
                </h2>
                <div 
                  className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: typeof block.content === "string" ? block.content : "" }}
                />
              </section>
            );

          case "h3_subsection":
          case "heading_h3":
            return (
              <section key={block.id || idx} className="space-y-2 pt-2">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {block.heading}
                </h3>
                <div 
                  className="text-zinc-600 dark:text-zinc-400 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: typeof block.content === "string" ? block.content : "" }}
                />
              </section>
            );

          case "paragraph":
            return (
              <div key={block.id || idx} className="space-y-2 text-zinc-600 dark:text-zinc-400 leading-relaxed text-base">
                {block.heading && (
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {block.heading}
                  </h3>
                )}
                <p>{typeof block.content === "string" ? block.content : ""}</p>
              </div>
            );

          case "rich_text":
            return (
              <div key={block.id || idx} className="space-y-3">
                {block.heading && (
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {block.heading}
                  </h2>
                )}
                <div 
                  className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: typeof block.content === "string" ? block.content : "" }}
                />
              </div>
            );

          case "how_it_works_steps":
          case "how-it-works":
          case "ordered_steps":
            const steps = Array.isArray(block.content) ? block.content : [];
            return (
              <div key={block.id || idx} className="space-y-6">
                {block.heading && (
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white text-center">
                    {block.heading}
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {steps.map((step: any, sIdx: number) => (
                    <div 
                      key={sIdx} 
                      className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 relative group hover:border-purple-500/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-black flex items-center justify-center text-base">
                        {step.step || sIdx + 1}
                      </div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );

          case "feature_grid":
          case "benefits_grid":
            const features = Array.isArray(block.content) ? block.content : [];
            return (
              <div key={block.id || idx} className="space-y-6">
                {block.heading && (
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white text-center">
                    {block.heading}
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {features.map((item: any, fIdx: number) => (
                    <div 
                      key={fIdx} 
                      className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <CheckCircle2 size={18} />
                        <h3 className="font-bold text-sm md:text-base text-zinc-900 dark:text-white">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );

          case "faq_accordion":
            const faqs = Array.isArray(block.content) ? block.content : [];
            return (
              <div key={block.id || idx} className="space-y-6">
                {block.heading && (
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white text-center">
                    {block.heading}
                  </h2>
                )}
                <div className="space-y-3">
                  {faqs.map((faq: any, faqIdx: number) => {
                    const faqKey = `${idx}-${faqIdx}`;
                    const isOpen = openFaqIndices[faqKey] ?? (faqIdx === 0);
                    return (
                      <div 
                        key={faqIdx} 
                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(faqKey)}
                          className="w-full p-5 text-left font-bold text-sm md:text-base text-zinc-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <span>{faq.question}</span>
                          <ChevronDown 
                            size={18} 
                            className={`shrink-0 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-purple-600" : ""}`} 
                          />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );

          case "important_note":
            return (
              <div 
                key={block.id || idx} 
                className="p-5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-start gap-3.5 text-purple-900 dark:text-purple-200"
              >
                <Info size={20} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {block.heading && (
                    <h3 className="font-bold text-sm text-purple-950 dark:text-purple-100">
                      {block.heading}
                    </h3>
                  )}
                  <p className="text-sm leading-relaxed text-purple-800 dark:text-purple-300">
                    {typeof block.content === "string" ? block.content : ""}
                  </p>
                </div>
              </div>
            );

          case "warning_callout":
          case "warning_box":
            return (
              <div 
                key={block.id || idx} 
                className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3.5 text-amber-900 dark:text-amber-200"
              >
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {block.heading && (
                    <h3 className="font-bold text-sm text-amber-950 dark:text-amber-100">
                      {block.heading}
                    </h3>
                  )}
                  <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                    {typeof block.content === "string" ? block.content : ""}
                  </p>
                </div>
              </div>
            );

          case "trust_legal_notice":
            return (
              <div 
                key={block.id || idx} 
                className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3.5 text-zinc-700 dark:text-zinc-300"
              >
                <ShieldCheck size={20} className="text-zinc-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {block.heading && (
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                      {block.heading}
                    </h3>
                  )}
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {typeof block.content === "string" ? block.content : ""}
                  </p>
                </div>
              </div>
            );

          case "related_articles":
          case "internal_links":
            const articles = Array.isArray(block.content) ? block.content : [];
            return (
              <div key={block.id || idx} className="space-y-4">
                {block.heading && (
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {block.heading}
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {articles.map((item: any, aIdx: number) => (
                    <Link
                      key={aIdx}
                      to={item.url || "#"}
                      className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/60 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
                    >
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                        <span>Read guide</span>
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );

          case "cta":
          case "cta_banner":
            const ctaContent = typeof block.content === "object" ? block.content : { text: block.content };
            return (
              <div 
                key={block.id || idx} 
                className="p-8 rounded-3xl bg-gradient-to-tr from-purple-900 via-indigo-900 to-zinc-900 text-white text-center space-y-4 shadow-xl"
              >
                <h3 className="text-2xl font-black">
                  {block.heading || "Ready to Download Instagram Reels?"}
                </h3>
                <p className="text-zinc-300 text-sm max-w-md mx-auto">
                  {ctaContent.text || "Paste any public Reel link to save MP4 video in HD instantly."}
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-900 font-bold text-sm shadow-lg hover:bg-zinc-100 transition-colors active:scale-95"
                >
                  <Sparkles size={16} className="text-purple-600" />
                  <span>{ctaContent.buttonText || "Open Reel Downloader"}</span>
                </Link>
              </div>
            );

          case "ad_slot":
            return (
              <AdSlotView 
                key={block.id || idx} 
                position={block.content?.position || "after_block"} 
                currentRoute={currentRoute} 
              />
            );

          case "divider":
            return <hr key={block.id || idx} className="border-zinc-200 dark:border-zinc-800" />;

          case "spacer":
            return <div key={block.id || idx} className="h-8" />;

          default:
            return null;
        }
      })}
    </div>
  );
};
