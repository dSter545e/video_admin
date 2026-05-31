"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "../../../components/AdminShell";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { createCategoryApi } from "../../../lib/api";

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

export default function AddCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createCategoryApi({ name, slug, imageUrl: "", featured, imageFile });
      router.push("/categories");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Add Category">
        <form onSubmit={onSubmit} className="admin-card grid gap-4 p-6 sm:grid-cols-2">
          <input
            className="admin-input"
            placeholder="Category Name"
            value={name}
            onChange={(event) => {
              const value = event.target.value;
              setName(value);
              if (!slugEdited) setSlug(toSlug(value));
            }}
          />
          <input
            className="admin-input"
            placeholder="Slug (auto-generated)"
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(toSlug(event.target.value));
            }}
          />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Category Image</label>
            <input
              type="file"
              accept="image/*"
              className="admin-input w-full"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            />
          </div>
          <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="h-4 w-4"
            />
            Feature this category on homepage (max 6)
          </label>
          <button
            type="submit"
            disabled={loading}
            className="admin-btn bg-[var(--admin-brand)] text-white disabled:opacity-50 sm:col-span-2"
          >
            {loading ? "Saving..." : "Save Category"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
