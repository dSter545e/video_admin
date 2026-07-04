"use client";

import Image from "next/image";
import { SeoFieldsInput } from "../lib/types";

type SeoFieldsSectionProps = {
  value: SeoFieldsInput;
  onChange: (next: SeoFieldsInput) => void;
  fallbackTitle?: string;
  fallbackDescription?: string;
};

export default function SeoFieldsSection({
  value,
  onChange,
  fallbackTitle = "",
  fallbackDescription = "",
}: SeoFieldsSectionProps) {
  const setField = <K extends keyof SeoFieldsInput>(key: K, fieldValue: SeoFieldsInput[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <section className="admin-card sm:col-span-2 grid gap-4 p-5">
      <div>
        <h2 className="text-base font-semibold">SEO</h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Optional search and social metadata. Leave blank to use the main title and description.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Meta Title</label>
        <input
          className="admin-input w-full"
          placeholder={fallbackTitle || "Page title for search results"}
          value={value.metaTitle || ""}
          maxLength={70}
          onChange={(event) => setField("metaTitle", event.target.value)}
        />
        <p className="mt-1 text-xs text-[var(--admin-muted)]">{(value.metaTitle || "").length}/70</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Meta Description</label>
        <textarea
          className="admin-input w-full min-h-24"
          placeholder={fallbackDescription || "Short summary for Google and social previews"}
          value={value.metaDescription || ""}
          maxLength={160}
          onChange={(event) => setField("metaDescription", event.target.value)}
        />
        <p className="mt-1 text-xs text-[var(--admin-muted)]">{(value.metaDescription || "").length}/160</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Meta Keywords</label>
        <input
          className="admin-input w-full"
          placeholder="keyword one, keyword two"
          value={value.metaKeywords || ""}
          maxLength={255}
          onChange={(event) => setField("metaKeywords", event.target.value)}
        />
      </div>

      <div className="sm:col-span-2 grid gap-4 rounded-lg border border-[var(--admin-border)] p-4">
        <div>
          <h3 className="text-sm font-semibold">Open Graph (Facebook, WhatsApp, X)</h3>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            Social preview fields. Leave blank to use the meta title and description above.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">OG Title</label>
          <input
            className="admin-input w-full"
            placeholder={value.metaTitle || fallbackTitle || "Social share title"}
            value={value.ogTitle || ""}
            maxLength={70}
            onChange={(event) => setField("ogTitle", event.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">OG Description</label>
          <textarea
            className="admin-input w-full min-h-20"
            placeholder={value.metaDescription || fallbackDescription || "Social share description"}
            value={value.ogDescription || ""}
            maxLength={200}
            onChange={(event) => setField("ogDescription", event.target.value)}
          />
        </div>
      </div>

      <div>
        {value.ogImage ? (
          <Image
            src={value.ogImage}
            alt="Open Graph preview"
            width={180}
            height={95}
            unoptimized
            className="mb-2 h-24 w-44 rounded object-cover"
          />
        ) : null}
        <label className="mb-1 block text-sm font-medium">Open Graph Image URL</label>
        <input
          className="admin-input w-full"
          placeholder="https://..."
          value={value.ogImage || ""}
          onChange={(event) => setField("ogImage", event.target.value)}
        />
        <label className="mb-1 mt-3 block text-sm font-medium">Upload OG Image</label>
        <input
          type="file"
          accept="image/*"
          className="admin-input w-full"
          onChange={(event) => setField("ogImageFile", event.target.files?.[0] || null)}
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={Boolean(value.noindex)}
          onChange={(event) => setField("noindex", event.target.checked)}
          className="h-4 w-4"
        />
        Hide from search engines (noindex)
      </label>
    </section>
  );
}

export const emptySeoFields = (): SeoFieldsInput => ({
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  noindex: false,
  ogImageFile: null,
});

export const seoFromRecord = (seo?: SeoFieldsInput | null): SeoFieldsInput => ({
  metaTitle: seo?.metaTitle || "",
  metaDescription: seo?.metaDescription || "",
  metaKeywords: seo?.metaKeywords || "",
  ogTitle: seo?.ogTitle || "",
  ogDescription: seo?.ogDescription || "",
  ogImage: seo?.ogImage || "",
  noindex: Boolean(seo?.noindex),
  ogImageFile: null,
});
