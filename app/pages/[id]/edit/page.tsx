"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "../../../../components/AdminShell";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import SeoFieldsSection, { emptySeoFields, seoFromRecord } from "../../../../components/SeoFieldsSection";
import { getPageByIdAdminApi, updatePageApi } from "../../../../lib/api";
import { CmsPage, SeoFieldsInput } from "../../../../lib/types";

export default function EditPagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pageMeta, setPageMeta] = useState<CmsPage | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [path, setPath] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("draft");
  const [seo, setSeo] = useState<SeoFieldsInput>(emptySeoFields);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const page = await getPageByIdAdminApi(id);
        setPageMeta(page);
        setTitle(page.title);
        setSlug(page.slug);
        setPath(page.path || "");
        setContent(page.content || "");
        setStatus(page.status);
        setSeo(seoFromRecord(page.seo));
      } catch {
        setError("Failed to load page");
      }
    };
    void load();
  }, [id]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await updatePageApi(id, { title, slug, path, content, status, seo });
      router.push("/pages");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not update page");
    } finally {
      setLoading(false);
    }
  };

  const isSystemPage = Boolean(pageMeta?.isSystem);
  const isMetaOnly = pageMeta?.pageKind === "meta-only";

  return (
    <ProtectedRoute>
      <AdminShell title={isSystemPage ? "Edit System Page" : "Edit Page"}>
        {isSystemPage ? (
          <p className="mb-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-sm text-[var(--admin-muted)]">
            This is a built-in site page. Manage its browser title, description, and Open Graph fields in the SEO
            section below. Site Settings defaults apply only to videos and categories without their own SEO.
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="admin-card grid gap-4 p-6 sm:grid-cols-2">
          <input className="admin-input" placeholder="Page Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <input className="admin-input" placeholder="Slug" value={slug} disabled={isSystemPage} readOnly={isSystemPage} />
          <input
            className="admin-input sm:col-span-2"
            placeholder="Public path"
            value={path}
            disabled={isSystemPage}
            readOnly={isSystemPage}
          />
          <select
            className="admin-input sm:col-span-2"
            value={status}
            onChange={(event) => setStatus(event.target.value as "published" | "draft")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          {!isMetaOnly ? (
            <textarea
              className="admin-input min-h-56 sm:col-span-2"
              placeholder="Page content (HTML allowed). Leave empty to keep the default built-in page design."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          ) : (
            <p className="sm:col-span-2 rounded-lg border border-dashed border-[var(--admin-border)] p-4 text-sm text-[var(--admin-muted)]">
              This page uses the live site layout (home feed, listings, forms, etc.). Manage its SEO and Open Graph
              settings below.
            </p>
          )}
          <SeoFieldsSection
            value={seo}
            onChange={setSeo}
            fallbackTitle={isMetaOnly ? "Set a meta title for this page" : title}
            fallbackDescription={isMetaOnly ? "Set a meta description for this page" : content.slice(0, 160)}
          />
          <button
            type="submit"
            disabled={loading}
            className="admin-btn bg-[var(--admin-brand)] text-white disabled:opacity-50 sm:col-span-2"
          >
            {loading ? "Updating..." : "Update Page"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
