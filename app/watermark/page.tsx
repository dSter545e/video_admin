"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { FiImage, FiTrash2, FiUpload } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  getWatermarkSettingsApi,
  removeWatermarkLogoApi,
  updateWatermarkSettingsApi,
  uploadWatermarkLogoApi,
} from "../../lib/api";
import { WatermarkSettings } from "../../lib/types";

const defaultSettings: WatermarkSettings = {
  enabled: false,
  mode: "text",
  text: "xHub4u",
  logoUrl: "",
  logoKey: "",
  opacity: 0.85,
  margin: 12,
};

export default function WatermarkPage() {
  const [settings, setSettings] = useState<WatermarkSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const data = await getWatermarkSettingsApi();
      setSettings(data);
    } catch {
      setError("Failed to load watermark settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateWatermarkSettingsApi({
        enabled: settings.enabled,
        mode: settings.mode,
        text: settings.text,
        opacity: settings.opacity,
        margin: settings.margin,
      });
      setSettings(updated);
    } catch {
      setError("Could not save watermark settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a PNG or JPG logo");
      return;
    }

    setUploadingLogo(true);
    setError("");
    try {
      const updated = await uploadWatermarkLogoApi(file);
      setSettings(updated);
    } catch {
      setError("Could not upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    setError("");
    try {
      const updated = await removeWatermarkLogoApi();
      setSettings(updated);
    } catch {
      setError("Could not remove logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Video Watermark">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-md bg-[var(--admin-surface-muted)] p-2 text-[var(--admin-brand)]">
                <FiImage className="text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--admin-foreground)]">Bottom-left watermark</h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  Every newly processed video gets your site name or logo burned into the bottom-left corner.
                  Settings are saved in the database and apply to new uploads only.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-[var(--admin-muted)]">Loading settings…</p>
            ) : (
              <form onSubmit={handleSave} className="space-y-5">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(event) => setSettings((prev) => ({ ...prev, enabled: event.target.checked }))}
                    className="h-4 w-4 rounded border-[var(--admin-border)]"
                  />
                  <span className="text-sm font-medium text-[var(--admin-foreground)]">Enable watermark on new uploads</span>
                </label>

                <div>
                  <p className="mb-2 text-sm font-medium text-[var(--admin-foreground)]">Watermark type</p>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--admin-border)] px-4 py-2 text-sm">
                      <input
                        type="radio"
                        name="watermark-mode"
                        checked={settings.mode === "text"}
                        onChange={() => setSettings((prev) => ({ ...prev, mode: "text" }))}
                      />
                      Text (site name)
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--admin-border)] px-4 py-2 text-sm">
                      <input
                        type="radio"
                        name="watermark-mode"
                        checked={settings.mode === "logo"}
                        onChange={() => setSettings((prev) => ({ ...prev, mode: "logo" }))}
                      />
                      Logo image
                    </label>
                  </div>
                </div>

                {settings.mode === "text" ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--admin-foreground)]">Watermark text</label>
                    <input
                      type="text"
                      value={settings.text}
                      maxLength={80}
                      onChange={(event) => setSettings((prev) => ({ ...prev, text: event.target.value }))}
                      className="admin-input w-full"
                      placeholder="xHub4u"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[var(--admin-foreground)]">Logo file</p>
                    <p className="text-xs text-[var(--admin-muted)]">Use a PNG with transparency for best results.</p>
                    {settings.logoUrl ? (
                      <div className="flex flex-wrap items-center gap-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
                        <div className="relative h-16 w-40 rounded bg-black/80">
                          <Image
                            src={settings.logoUrl}
                            alt="Watermark logo preview"
                            fill
                            className="object-contain p-2"
                            unoptimized
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRemoveLogo()}
                          disabled={uploadingLogo}
                          className="admin-btn flex items-center gap-2 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          <FiTrash2 /> Remove logo
                        </button>
                      </div>
                    ) : null}
                    <label className="admin-btn inline-flex cursor-pointer items-center gap-2 bg-[var(--admin-accent)] text-white hover:brightness-95">
                      <FiUpload />
                      {uploadingLogo ? "Uploading…" : settings.logoUrl ? "Replace logo" : "Upload logo"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={uploadingLogo} />
                    </label>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--admin-foreground)]">
                      Opacity ({Math.round(settings.opacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={settings.opacity}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, opacity: Number(event.target.value) }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--admin-foreground)]">Margin (px at 720p)</label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={settings.margin}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, margin: Number(event.target.value) || 0 }))
                      }
                      className="admin-input w-full"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="admin-btn bg-[var(--admin-brand)] text-white hover:brightness-95 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save settings"}
                </button>
              </form>
            )}
          </div>
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
