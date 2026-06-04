"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "../../../components/AdminShell";
import ProtectedRoute from "../../../components/ProtectedRoute";
import TagInput from "../../../components/TagInput";
import { createProcessedVideoApi, getCategoriesApi, suggestVideoTagsApi } from "../../../lib/api";
import { Category, VideoFormPayload } from "../../../lib/types";

const toSlug = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const initialVideo: VideoFormPayload = {
  title: "",
  slug: "",
  description: "",
  thumbnail: "",
  videoUrl: "",
  categoryId: "",
  status: "public",
  tags: [],
};

export default function AddVideoPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<VideoFormPayload>(initialVideo);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCategoriesApi();
        setCategories(data);
        if (data[0]?._id) {
          setForm((prev) => ({ ...prev, categoryId: data[0]._id }));
        }
      } catch (_error) {
        setError("Failed to load categories");
      }
    };
    load();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setUploadProgress(0);
    try {
      if (!videoFile) {
        throw new Error("Please select a video file");
      }

      await createProcessedVideoApi({
        title: form.title,
        slug: form.slug,
        description: form.description,
        thumbnail: "",
        categoryId: form.categoryId,
        status: form.status || "public",
        tags: form.tags || [],
        videoFile,
        thumbnailImageFile: thumbnailFile,
        onUploadProgress: setUploadProgress,
      });
      setUploadProgress(100);
      router.push("/videos");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Add Video">
        <form onSubmit={onSubmit} className="admin-card grid gap-4 p-6 sm:grid-cols-2">
          <input
            className="admin-input"
            placeholder="Video Title"
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug: slugEdited ? prev.slug : toSlug(title),
              }));
            }}
          />
          <input
            className="admin-input"
            placeholder="Slug (auto-generated)"
            value={form.slug || ""}
            onChange={(event) => {
              setSlugEdited(true);
              setForm({ ...form, slug: toSlug(event.target.value) });
            }}
          />
          <select
            className="admin-input"
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            className="admin-input"
            value={form.status || "public"}
            onChange={(event) => setForm({ ...form, status: event.target.value as "public" | "private" | "draft" })}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="draft">Draft</option>
          </select>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Thumbnail Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              className="admin-input w-full"
              onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)}
            />
            <p className="admin-muted mt-1 text-xs">
              Leave empty to auto-generate a thumbnail from the uploaded video after processing.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Video File</label>
            <input
              type="file"
              accept="video/*"
              className="admin-input w-full"
              onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
            />
            <p className="admin-muted mt-1 text-xs">
              Supports large files (up to 1GB). Upload may take several minutes on slow connections — keep this tab open until
              progress reaches 100%.
            </p>
          </div>
          <textarea
            className="admin-input sm:col-span-2"
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <TagInput
            value={form.tags || []}
            onChange={(tags) => setForm({ ...form, tags })}
            placeholder="Add tags (Enter or comma)"
            fetchSuggestions={suggestVideoTagsApi}
          />
          <button
            type="submit"
            disabled={loading}
            className="admin-btn bg-[var(--admin-brand)] text-white disabled:opacity-50 sm:col-span-2"
          >
            {loading ? "Processing..." : "Save Video"}
          </button>
          {loading ? (
            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="admin-muted">Upload Progress</span>
                <span className="font-semibold">{uploadProgress}%</span>
              </div>
              <div className="admin-progress-track">
                <div className="admin-progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="admin-muted mt-1 text-xs">After upload, video variants continue processing in background.</p>
            </div>
          ) : null}
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
