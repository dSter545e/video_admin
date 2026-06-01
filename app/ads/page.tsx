"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiRadio, FiTrash2, FiX } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  createAdApi,
  deleteAdApi,
  getAdSlotsMetaApi,
  getAdsAdminApi,
  updateAdApi,
} from "../../lib/api";
import { AdItem, AdSlotMeta } from "../../lib/types";

const PAGE_OPTIONS = [
  { id: "all", label: "All pages" },
  { id: "home", label: "Home" },
  { id: "watch", label: "Watch / video page" },
  { id: "videos", label: "Videos listing" },
  { id: "categories", label: "Categories" },
  { id: "search", label: "Search" },
];

const emptyForm = {
  name: "",
  slot: "header_leaderboard",
  type: "html" as "html" | "image" | "video",
  htmlContent: "",
  imageUrl: "",
  videoUrl: "",
  linkUrl: "",
  altText: "Advertisement",
  pages: ["all"] as string[],
  inFeedEvery: 10,
  skipAfterSeconds: 5,
  popupDelaySeconds: 5,
  popupCooldownMinutes: 30,
  priority: 0,
  isActive: true,
  startAt: "",
  endAt: "",
};

export default function AdsPage() {
  const [slots, setSlots] = useState<AdSlotMeta[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedSlotMeta = useMemo(() => slots.find((slot) => slot.id === form.slot), [slots, form.slot]);

  const load = async () => {
    try {
      const [slotsMeta, adList] = await Promise.all([getAdSlotsMetaApi(), getAdsAdminApi()]);
      setSlots(slotsMeta.slots);
      setAds(adList);
    } catch {
      setError("Failed to load ads");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const startEdit = (ad: AdItem) => {
    setEditingId(ad._id);
    setForm({
      name: ad.name,
      slot: ad.slot,
      type: ad.type,
      htmlContent: ad.htmlContent || "",
      imageUrl: ad.imageUrl || "",
      videoUrl: ad.videoUrl || "",
      linkUrl: ad.linkUrl || "",
      altText: ad.altText || "Advertisement",
      pages: ad.pages?.length ? ad.pages : ["all"],
      inFeedEvery: ad.inFeedEvery || 10,
      skipAfterSeconds: ad.skipAfterSeconds ?? 5,
      popupDelaySeconds: ad.popupDelaySeconds ?? 5,
      popupCooldownMinutes: ad.popupCooldownMinutes ?? 30,
      priority: ad.priority || 0,
      isActive: ad.isActive,
      startAt: ad.startAt ? ad.startAt.slice(0, 16) : "",
      endAt: ad.endAt ? ad.endAt.slice(0, 16) : "",
    });
  };

  const togglePage = (pageId: string) => {
    setForm((prev) => {
      const has = prev.pages.includes(pageId);
      if (pageId === "all") return { ...prev, pages: ["all"] };
      const withoutAll = prev.pages.filter((page) => page !== "all");
      const next = has ? withoutAll.filter((page) => page !== pageId) : [...withoutAll, pageId];
      return { ...prev, pages: next.length ? next : ["all"] };
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        slot: form.slot,
        type: form.type,
        htmlContent: form.htmlContent,
        imageUrl: form.imageUrl,
        videoUrl: form.videoUrl,
        linkUrl: form.linkUrl,
        altText: form.altText,
        pages: form.pages,
        inFeedEvery: form.inFeedEvery,
        skipAfterSeconds: form.skipAfterSeconds,
        popupDelaySeconds: form.popupDelaySeconds,
        popupCooldownMinutes: form.popupCooldownMinutes,
        priority: form.priority,
        isActive: form.isActive,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      };

      if (editingId) {
        await updateAdApi(editingId, payload);
      } else {
        await createAdApi(payload as Omit<AdItem, "_id" | "createdAt" | "updatedAt">);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save ad");
    } finally {
      setSaving(false);
    }
  };

  const removeAd = async (id: string) => {
    if (!window.confirm("Delete this ad?")) return;
    try {
      await deleteAdApi(id);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete ad");
    }
  };

  const slotLabel = (slotId: string) => slots.find((slot) => slot.id === slotId)?.label || slotId;

  return (
    <ProtectedRoute>
      <AdminShell title="Ads">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <form onSubmit={handleSubmit} className="admin-card space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{editingId ? "Edit Ad" : "Create Ad"}</h3>
              {editingId ? (
                <button type="button" onClick={resetForm} className="admin-btn admin-btn-outline flex items-center gap-1 text-xs">
                  <FiX /> Cancel
                </button>
              ) : null}
            </div>

            <input
              className="admin-input w-full"
              placeholder="Ad name (internal)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <select
              className="admin-input w-full"
              value={form.slot}
              onChange={(e) => setForm({ ...form, slot: e.target.value })}
            >
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.type === "html"}
                  onChange={() => setForm({ ...form, type: "html" })}
                />
                HTML / Script
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.type === "image"}
                  onChange={() => setForm({ ...form, type: "image" })}
                />
                Image banner
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.type === "video"}
                  onChange={() => setForm({ ...form, type: "video" })}
                />
                Video (MP4 / HLS URL)
              </label>
            </div>

            {form.type === "html" ? (
              <textarea
                className="admin-input min-h-[140px] w-full font-mono text-xs"
                placeholder='Paste ad code, e.g. <script>...</script> or <a href="..."><img ...></a>'
                value={form.htmlContent}
                onChange={(e) => setForm({ ...form, htmlContent: e.target.value })}
                required={!editingId}
              />
            ) : null}

            {form.type === "image" ? (
              <>
                <input
                  className="admin-input w-full"
                  placeholder="Image URL"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  required={!editingId}
                />
                <input
                  className="admin-input w-full"
                  placeholder="Click URL (optional)"
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                />
                <input
                  className="admin-input w-full"
                  placeholder="Alt text"
                  value={form.altText}
                  onChange={(e) => setForm({ ...form, altText: e.target.value })}
                />
              </>
            ) : null}

            {form.type === "video" ? (
              <input
                className="admin-input w-full"
                placeholder="Video ad URL (MP4 or .m3u8)"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                required={!editingId}
              />
            ) : null}

            <div>
              <p className="mb-2 text-sm font-medium">Show on pages</p>
              <div className="flex flex-wrap gap-2">
                {PAGE_OPTIONS.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => togglePage(page.id)}
                    className={`rounded px-3 py-1 text-xs ${
                      form.pages.includes(page.id) ? "bg-[var(--admin-brand)] text-white" : "admin-btn-outline"
                    }`}
                  >
                    {page.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedSlotMeta?.placementType === "in_feed" ? (
              <input
                type="number"
                min={4}
                max={50}
                className="admin-input w-full"
                placeholder="Show every N video cards"
                value={form.inFeedEvery}
                onChange={(e) => setForm({ ...form, inFeedEvery: Number(e.target.value) || 10 })}
              />
            ) : null}

            {form.slot === "watch_video_preroll" || selectedSlotMeta?.placementType === "video" ? (
              <input
                type="number"
                min={0}
                max={120}
                className="admin-input w-full"
                placeholder="Skip button after N seconds (0 = immediate)"
                value={form.skipAfterSeconds}
                onChange={(e) => setForm({ ...form, skipAfterSeconds: Number(e.target.value) })}
              />
            ) : null}

            {form.slot === "popup" || selectedSlotMeta?.placementType === "popup" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  min={0}
                  max={120}
                  className="admin-input w-full"
                  placeholder="Show popup after N seconds"
                  value={form.popupDelaySeconds}
                  onChange={(e) => setForm({ ...form, popupDelaySeconds: Number(e.target.value) })}
                />
                <input
                  type="number"
                  min={0}
                  max={1440}
                  className="admin-input w-full"
                  placeholder="Cooldown minutes (0 = once per session)"
                  value={form.popupCooldownMinutes}
                  onChange={(e) => setForm({ ...form, popupCooldownMinutes: Number(e.target.value) })}
                />
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="number"
                className="admin-input w-full"
                placeholder="Priority (higher first)"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="datetime-local"
                className="admin-input w-full"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
              <input
                type="datetime-local"
                className="admin-input w-full"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              />
            </div>
            <p className="admin-muted text-xs">Optional schedule — leave empty for always on.</p>

            <button type="submit" disabled={saving} className="admin-btn bg-[var(--admin-brand)] text-white">
              {saving ? "Saving..." : editingId ? "Update Ad" : "Create Ad"}
            </button>
          </form>

          <div className="admin-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FiRadio />
              <h3 className="text-lg font-semibold">Active Ads ({ads.length})</h3>
            </div>
            <div className="space-y-3">
              {ads.map((ad) => (
                <div
                  key={ad._id}
                  className={`rounded border p-3 ${
                    editingId === ad._id ? "border-[var(--admin-brand)]" : "border-[var(--admin-border)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{ad.name}</p>
                      <p className="admin-muted text-xs">{slotLabel(ad.slot)}</p>
                      <p className="admin-muted text-xs">
                        {ad.type.toUpperCase()} · Pages: {(ad.pages || ["all"]).join(", ")} · Priority {ad.priority}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        ad.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ad.isActive ? "Active" : "Off"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => startEdit(ad)} className="admin-btn admin-btn-outline flex items-center gap-1 text-xs">
                      <FiEdit2 /> Edit
                    </button>
                    <button onClick={() => removeAd(ad._id)} className="admin-btn flex items-center gap-1 bg-red-600 text-xs text-white">
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {!ads.length ? <p className="admin-muted text-sm">No ads yet. Create one to show on the user site.</p> : null}
            </div>
          </div>
        </div>

        <div className="admin-card mt-4 p-5">
          <h3 className="mb-3 text-lg font-semibold">Ad slot reference</h3>
          <ul className="admin-muted space-y-2 text-sm">
            {slots.map((slot) => (
              <li key={slot.id}>
                <strong className="text-[var(--admin-text)]">{slot.label}</strong> — <code>{slot.id}</code>
                {slot.placementType === "in_feed" ? ` (every ${slot.defaultInFeedEvery || 10} cards)` : null}
              </li>
            ))}
          </ul>
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
