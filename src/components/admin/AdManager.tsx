import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  ToggleLeft, 
  ToggleRight, 
  ShieldCheck, 
  Save, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { AdSlot } from "../../types/cms";

interface AdManagerProps {
  authToken?: string | null;
}

export const AdManager: React.FC<AdManagerProps> = ({ authToken }) => {
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<AdSlot>>({
    name: "",
    provider: "fallback_sponsor",
    format: "responsive",
    position: "below_tool",
    enabled: true,
    allowed_pages: ["*"]
  });

  const getHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    return headers;
  };

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads", {
        headers: getHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setAdSlots(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleToggleEnable = async (slot: AdSlot) => {
    try {
      const res = await fetch(`/api/admin/ads/${slot.id}`, {
        method: "PUT",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({ ...slot, enabled: !slot.enabled })
      });
      if (res.ok) {
        setAdSlots(prev => prev.map(s => s.id === slot.id ? { ...s, enabled: !s.enabled } : s));
      }
    } catch {
      // Error
    }
  };

  const handleSaveSlot = async (slotData: AdSlot) => {
    setSaveStatus("Saving...");
    try {
      const res = await fetch(`/api/admin/ads/${slotData.id}`, {
        method: "PUT",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(slotData)
      });
      if (res.ok) {
        setSaveStatus("Saved!");
        setEditingSlot(null);
        await fetchAds();
        setTimeout(() => setSaveStatus(""), 2500);
      } else {
        setSaveStatus("Failed to save");
      }
    } catch {
      setSaveStatus("Error saving");
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(newSlot)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewSlot({
          name: "",
          provider: "fallback_sponsor",
          format: "responsive",
          position: "below_tool",
          enabled: true,
          allowed_pages: ["*"]
        });
        await fetchAds();
      }
    } catch {
      // Error
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm("Are you sure you want to delete this ad slot?")) return;
    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        await fetchAds();
      }
    } catch {
      // Error
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Ad Slots & Monetization</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Safely place ad units with layout shift guards, route filters, and provider controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Ad Slot</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-400">
        <ShieldCheck size={18} className="text-purple-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-zinc-900 dark:text-white">Built-in Layout Shift & Ad Policy Protection</p>
          <p className="mt-0.5 leading-relaxed">
            All rendered ad containers enforce min-height reservations to prevent Cumulative Layout Shift (CLS), include prominent "Advertisement" disclosures, and respect page-level route whitelists.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-semibold">
                <th className="py-3 px-4">Slot Name</th>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={16} />
                    Loading ad slots...
                  </td>
                </tr>
              ) : adSlots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    No ad slots configured.
                  </td>
                </tr>
              ) : (
                adSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                      {slot.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-purple-600 dark:text-purple-400">
                      {slot.position}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[10px] tracking-wider text-zinc-500">
                      {slot.provider.replace(/_/g, " ")}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      {slot.format}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleEnable(slot)}
                        className="cursor-pointer"
                        title={slot.enabled ? "Click to disable" : "Click to enable"}
                      >
                        {slot.enabled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[10px] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            Disabled
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingSlot(slot)}
                          className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-lg w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Edit Ad Slot: {editingSlot.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Slot Name</label>
                <input
                  type="text"
                  value={editingSlot.name}
                  onChange={(e) => setEditingSlot({ ...editingSlot, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Provider</label>
                  <select
                    value={editingSlot.provider}
                    onChange={(e) => setEditingSlot({ ...editingSlot, provider: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                  >
                    <option value="fallback_sponsor">Fallback / Sponsor</option>
                    <option value="google_adsense">Google AdSense</option>
                    <option value="custom_html">Custom HTML</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Format</label>
                  <select
                    value={editingSlot.format}
                    onChange={(e) => setEditingSlot({ ...editingSlot, format: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                  >
                    <option value="responsive">Responsive</option>
                    <option value="banner_728x90">Leaderboard (728x90)</option>
                    <option value="rectangle_300x250">Rectangle (300x250)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Position Hook</label>
                <input
                  type="text"
                  value={editingSlot.position}
                  onChange={(e) => setEditingSlot({ ...editingSlot, position: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">AdSense Publisher ID (ca-pub-...)</label>
                <input
                  type="text"
                  value={editingSlot.publisher_id || ""}
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  onChange={(e) => setEditingSlot({ ...editingSlot, publisher_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">AdSense Slot ID</label>
                <input
                  type="text"
                  value={editingSlot.slot_id || ""}
                  placeholder="XXXXXXXXXX"
                  onChange={(e) => setEditingSlot({ ...editingSlot, slot_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSlot(editingSlot)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Add New Ad Slot</h3>
            <form onSubmit={handleCreateSlot} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Header Sponsor"
                  value={newSlot.name}
                  onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Position Tag</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. below_tool, top_banner, between_sections"
                  value={newSlot.position}
                  onChange={(e) => setNewSlot({ ...newSlot, position: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                >
                  Create Ad Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
