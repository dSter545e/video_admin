"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import AdminShell from "../../../../components/AdminShell";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import SeoFieldsSection, { emptySeoFields, seoFromRecord } from "../../../../components/SeoFieldsSection";
import { getCategoriesApi, updateCategoryApi } from "../../../../lib/api";
import { SeoFieldsInput } from "../../../../lib/types";

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

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [seo, setSeo] = useState<SeoFieldsInput>(emptySeoFields);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const categories = await getCategoriesApi();
        const category = categories.find((item) => item._id === id);
        if (!category) {
          setError("Category not found");
          return;
        }
        setName(category.name);
        setSlug(category.slug || toSlug(category.name));
        setFeatured(Boolean(category.featured));
        setCurrentImageUrl(category.imageUrl || "");
        setSeo(seoFromRecord(category.seo));
      } catch (_error) {
        setError("Failed to load category");
      }
    };
    loadCategory();
  }, [id]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await updateCategoryApi(id, { name, slug, imageUrl: currentImageUrl || "", featured, imageFile, seo });
      router.push("/categories");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Edit Category">
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
            placeholder="Slug"
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(toSlug(event.target.value));
            }}
          />
          <div className="sm:col-span-2">
            {currentImageUrl ? (
              <Image
                src={currentImageUrl}
                alt={name || "Category"}
                width={144}
                height={96}
                unoptimized
                className="mb-2 h-24 w-36 rounded object-cover"
              />
            ) : null}
            <label className="mb-1 block text-sm font-medium">Upload New Category Image</label>
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
          <SeoFieldsSection
            value={seo}
            onChange={setSeo}
            fallbackTitle={name}
            fallbackDescription={`Watch ${name} videos`}
          />
          <button
            type="submit"
            disabled={loading}
            className="admin-btn bg-[var(--admin-brand)] text-white disabled:opacity-50 sm:col-span-2"
          >
            {loading ? "Updating..." : "Update Category"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
