import React, { useEffect, useState } from "react";
import { AdSlot } from "../../types/cms";

interface AdSlotViewProps {
  position: string;
  currentRoute: string;
  previewMode?: boolean;
}

export const AdSlotView: React.FC<AdSlotViewProps> = ({ position, currentRoute, previewMode }) => {
  const [adSlot, setAdSlot] = useState<AdSlot | null>(null);

  useEffect(() => {
    if (previewMode) {
      setAdSlot({
        id: 999,
        name: `Preview Ad Slot (${position})`,
        provider: "custom_html",
        format: "responsive",
        position,
        enabled: true,
        allowed_pages: ["*"],
        created_at: new Date().toISOString()
      });
      return;
    }

    const fetchAd = async () => {
      try {
        const res = await fetch(`/api/public/ads?position=${encodeURIComponent(position)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            // Find slot matching currentRoute
            const matching = data.find((slot: AdSlot) => {
              if (!slot.enabled) return false;
              if (!slot.allowed_pages || slot.allowed_pages.includes("*")) return true;
              return slot.allowed_pages.some(pattern => {
                if (pattern.endsWith("/*")) {
                  const prefix = pattern.replace("/*", "");
                  return currentRoute.startsWith(prefix);
                }
                return pattern === currentRoute;
              });
            });
            setAdSlot(matching || null);
          }
        }
      } catch {
        // Safe silence on ad network error
      }
    };

    fetchAd();
  }, [position, currentRoute, previewMode]);

  if (!adSlot) return null;

  return (
    <div className="w-full my-6 flex flex-col items-center justify-center text-center">
      <div className="text-[10px] tracking-widest uppercase font-semibold text-zinc-400 dark:text-zinc-500 mb-1.5">
        Advertisement
      </div>
      <div className="w-full max-w-2xl min-h-[90px] p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-center transition-colors">
        {previewMode ? (
          <div className="text-xs text-zinc-400 font-mono">
            [Ad Preview: {adSlot.name} • {adSlot.position} • {adSlot.format}]
          </div>
        ) : adSlot.publisher_id && adSlot.slot_id ? (
          <div className="text-xs text-zinc-500">
            {/* Safe responsive placeholder container without layout shifts */}
            <span>Sponsor Content Area ({adSlot.name})</span>
          </div>
        ) : (
          <div className="text-xs text-zinc-400">
            <span>Fast & Free Instagram Reel HD Downloader • Share with Friends</span>
          </div>
        )}
      </div>
    </div>
  );
};
