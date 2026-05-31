"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import AdminShell from "../../../../components/AdminShell";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import TagInput from "../../../../components/TagInput";
import { getCategoriesApi, getVideoByIdApi, suggestVideoTagsApi, updateVideoApi } from "../../../../lib/api";
import { Category } from "../../../../lib/types";

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

const initialForm = {
  title: "",
  slug: "",
  description: "",
  thumbnail: "",
  categoryId: "",
  tags: [] as string[],
  status: "public" as "public" | "private" | "draft",
};

export default function EditVideoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [video, categoriesData] = await Promise.all([getVideoByIdApi(id), getCategoriesApi()]);
        setCategories(categoriesData);
        setForm({
          title: video.title || "",
          slug: video.slug || toSlug(video.title || ""),
          description: video.description || "",
          thumbnail: video.thumbnail || "",
          categoryId: video.category?._id || "",
          tags: (video.tags || []).map((tag) => tag.displayName),
          status:
            video.processingStatus === "processing"
              ? ((video.finalStatus === "active"
                  ? "public"
                  : video.finalStatus === "inactive"
                    ? "private"
                    : video.finalStatus) || "public")
              : (((video.processingStatus === "active"
                  ? "public"
                  : video.processingStatus === "inactive"
                    ? "private"
                    : video.processingStatus) as "public" | "private" | "draft") || "public"),
        });
      } catch (_error) {
        setError("Failed to load video details");
      }
    };
    load();
  }, [id, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await updateVideoApi(id, {
        ...form,
        thumbnailImageFile: thumbnailFile,
      });
      router.push("/videos");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Edit Video">
        <form onSubmit={onSubmit} className="admin-card grid gap-4 p-6 sm:grid-cols-2">
          <input
            className="admin-input"
            placeholder="Title"
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
            placeholder="Slug"
            value={form.slug}
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
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as "public" | "private" | "draft" })}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="draft">Draft</option>
          </select>
          <div className="sm:col-span-2">
            {form.thumbnail ? (
              <Image
                src={form.thumbnail}
                alt={form.title || "Thumbnail"}
                width={160}
                height={96}
                unoptimized
                className="mb-2 h-24 w-40 rounded object-cover"
              />
            ) : null}
            <label className="mb-1 block text-sm font-medium">Upload New Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              className="admin-input w-full"
              onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)}
            />
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
            {loading ? "Updating..." : "Update Video"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
