"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "../../../components/AdminShell";
import ProtectedRoute from "../../../components/ProtectedRoute";
import SeoFieldsSection, { emptySeoFields } from "../../../components/SeoFieldsSection";
import { createPageApi } from "../../../lib/api";
import { SeoFieldsInput } from "../../../lib/types";

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

export default function AddPagePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [path, setPath] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("draft");
  const [seo, setSeo] = useState<SeoFieldsInput>(emptySeoFields);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createPageApi({ title, slug, path, content, status, seo });
      router.push("/pages");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Add Page">
        <form onSubmit={onSubmit} className="admin-card grid gap-4 p-6 sm:grid-cols-2">
          <input
            className="admin-input"
            placeholder="Page Title"
            value={title}
            onChange={(event) => {
              const value = event.target.value;
              setTitle(value);
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
          <input
            className="admin-input sm:col-span-2"
            placeholder="Custom path (optional, e.g. /privacy-policy or /pages/about-us)"
            value={path}
            onChange={(event) => setPath(event.target.value)}
          />
          <select
            className="admin-input sm:col-span-2"
            value={status}
            onChange={(event) => setStatus(event.target.value as "published" | "draft")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <textarea
            className="admin-input min-h-56 sm:col-span-2"
            placeholder="Page content (HTML allowed)"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <SeoFieldsSection
            value={seo}
            onChange={setSeo}
            fallbackTitle={title}
            fallbackDescription={content.slice(0, 160)}
          />
          <button
            type="submit"
            disabled={loading}
            className="admin-btn bg-[var(--admin-brand)] text-white disabled:opacity-50 sm:col-span-2"
          >
            {loading ? "Saving..." : "Save Page"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
