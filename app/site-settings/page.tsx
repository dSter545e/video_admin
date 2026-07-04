"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiExternalLink, FiTrash2 } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  getPagesAdminApi,
  getSeoSettingsApi,
  getSiteSettingsApi,
  removeSeoDefaultOgImageApi,
  removeSiteFaviconApi,
  removeSiteLogoApi,
  updateSeoSettingsApi,
  updateSiteSettingsApi,
  uploadSeoDefaultOgImageApi,
  uploadSiteFaviconApi,
  uploadSiteLogoApi,
} from "../../lib/api";
import { CmsPage, SiteBrandingSettings, SiteSeoSettings } from "../../lib/types";

const defaultSite: SiteBrandingSettings = {
  tagline: "",
  logoUrl: "",
  logoKey: "",
  faviconUrl: "",
  faviconKey: "",
  footerAbout: "",
  contactEmail: "",
  supportEmail: "",
};

const defaultSeo: SiteSeoSettings = {
  siteName: "xHub4u",
  defaultTitle: "",
  defaultDescription: "",
  defaultKeywords: "",
  defaultOgImage: "",
};

const LEGAL_PAGE_KEYS = ["privacy-policy", "terms-and-conditions", "cookie-policy", "report-removal"];

export default function SiteSettingsPage() {
  const [site, setSite] = useState<SiteBrandingSettings>(defaultSite);
  const [seo, setSeo] = useState<SiteSeoSettings>(defaultSeo);
  const [legalPages, setLegalPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSite, setSavingSite] = useState(false);
  const [savingSeo, setSavingSeo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([getSiteSettingsApi(), getSeoSettingsApi(), getPagesAdminApi()])
      .then(([siteData, seoData, pages]) => {
        setSite(siteData);
        setSeo(seoData);
        setLegalPages(pages.filter((page) => page.systemKey && LEGAL_PAGE_KEYS.includes(page.systemKey)));
      })
      .catch(() => setError("Failed to load site settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSite = async (event: FormEvent) => {
    event.preventDefault();
    setSavingSite(true);
    setError("");
    try {
      const [updatedSite, updatedSeo] = await Promise.all([
        updateSiteSettingsApi(site),
        updateSeoSettingsApi({ siteName: seo.siteName }),
      ]);
      setSite(updatedSite);
      setSeo(updatedSeo);
    } catch {
      setError("Could not save site details");
    } finally {
      setSavingSite(false);
    }
  };

  const handleSaveSeo = async (event: FormEvent) => {
    event.preventDefault();
    setSavingSeo(true);
    setError("");
    try {
      setSeo(await updateSeoSettingsApi(seo));
    } catch {
      setError("Could not save SEO settings");
    } finally {
      setSavingSeo(false);
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingLogo(true);
    setError("");
    try {
      setSite(await uploadSiteLogoApi(file));
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
      setSite(await removeSiteLogoApi());
    } catch {
      setError("Could not remove logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingFavicon(true);
    setError("");
    try {
      setSite(await uploadSiteFaviconApi(file));
    } catch {
      setError("Could not upload favicon");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleRemoveFavicon = async () => {
    setUploadingFavicon(true);
    setError("");
    try {
      setSite(await removeSiteFaviconApi());
    } catch {
      setError("Could not remove favicon");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleOgUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingOg(true);
    setError("");
    try {
      setSeo(await uploadSeoDefaultOgImageApi(file));
    } catch {
      setError("Could not upload default OG image");
    } finally {
      setUploadingOg(false);
    }
  };

  const handleRemoveOg = async () => {
    setUploadingOg(true);
    setError("");
    try {
      setSeo(await removeSeoDefaultOgImageApi());
    } catch {
      setError("Could not remove default OG image");
    } finally {
      setUploadingOg(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Site Settings">
        {loading ? <p className="text-sm text-[var(--admin-muted)]">Loading...</p> : null}
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        {!loading ? (
          <div className="grid gap-6">
            <form onSubmit={handleSaveSite} className="admin-card grid gap-4 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h2 className="text-base font-semibold">Branding</h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  Site name, logo, favicon, and footer content shown across the public site.
                </p>
              </div>

              <input
                className="admin-input sm:col-span-2"
                placeholder="Site Name"
                value={seo.siteName}
                onChange={(event) => setSeo({ ...seo, siteName: event.target.value })}
              />
              <input
                className="admin-input sm:col-span-2"
                placeholder="Tagline (optional short line under logo)"
                value={site.tagline}
                maxLength={160}
                onChange={(event) => setSite({ ...site, tagline: event.target.value })}
              />

              <div>
                <label className="mb-1 block text-sm font-medium">Site Logo</label>
                {site.logoUrl ? (
                  <Image
                    src={site.logoUrl}
                    alt="Site logo"
                    width={220}
                    height={70}
                    unoptimized
                    className="mb-2 h-16 w-52 rounded object-contain"
                  />
                ) : (
                  <p className="mb-2 text-sm text-[var(--admin-muted)]">No logo uploaded. The site uses /logo.png as fallback.</p>
                )}
                <input type="file" accept="image/*" className="admin-input w-full" onChange={handleLogoUpload} />
                {site.logoUrl ? (
                  <button
                    type="button"
                    onClick={() => void handleRemoveLogo()}
                    disabled={uploadingLogo}
                    className="admin-btn mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-red-600"
                  >
                    <FiTrash2 /> Remove logo
                  </button>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Favicon</label>
                {site.faviconUrl ? (
                  <Image
                    src={site.faviconUrl}
                    alt="Favicon"
                    width={48}
                    height={48}
                    unoptimized
                    className="mb-2 h-12 w-12 rounded object-contain"
                  />
                ) : (
                  <p className="mb-2 text-sm text-[var(--admin-muted)]">No favicon uploaded. The site uses /favicon.ico as fallback.</p>
                )}
                <input type="file" accept="image/*,.ico" className="admin-input w-full" onChange={handleFaviconUpload} />
                {site.faviconUrl ? (
                  <button
                    type="button"
                    onClick={() => void handleRemoveFavicon()}
                    disabled={uploadingFavicon}
                    className="admin-btn mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-red-600"
                  >
                    <FiTrash2 /> Remove favicon
                  </button>
                ) : null}
              </div>

              <textarea
                className="admin-input min-h-24 sm:col-span-2"
                placeholder="Footer about text (leave empty to use default SEO description)"
                value={site.footerAbout}
                maxLength={500}
                onChange={(event) => setSite({ ...site, footerAbout: event.target.value })}
              />
              <input
                className="admin-input"
                placeholder="Contact email"
                value={site.contactEmail}
                onChange={(event) => setSite({ ...site, contactEmail: event.target.value })}
              />
              <input
                className="admin-input"
                placeholder="Support email"
                value={site.supportEmail}
                onChange={(event) => setSite({ ...site, supportEmail: event.target.value })}
              />

              <button
                type="submit"
                disabled={savingSite}
                className="admin-btn bg-[var(--admin-brand)] text-white disabled:opacity-50 sm:col-span-2"
              >
                {savingSite ? "Saving..." : "Save Branding & Footer"}
              </button>
            </form>

            <form onSubmit={handleSaveSeo} className="admin-card grid gap-4 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h2 className="text-base font-semibold">SEO Defaults</h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  Default metadata when pages, videos, or categories do not provide their own SEO values.
                </p>
              </div>
              <input
                className="admin-input sm:col-span-2"
                placeholder="Default Title"
                value={seo.defaultTitle}
                maxLength={70}
                onChange={(event) => setSeo({ ...seo, defaultTitle: event.target.value })}
              />
              <textarea
                className="admin-input min-h-24 sm:col-span-2"
                placeholder="Default Description"
                value={seo.defaultDescription}
                maxLength={160}
                onChange={(event) => setSeo({ ...seo, defaultDescription: event.target.value })}
              />
              <input
                className="admin-input sm:col-span-2"
                placeholder="Default Keywords"
                value={seo.defaultKeywords}
                maxLength={255}
                onChange={(event) => setSeo({ ...seo, defaultKeywords: event.target.value })}
              />
              <div className="sm:col-span-2">
                {seo.defaultOgImage ? (
                  <Image
                    src={seo.defaultOgImage}
                    alt="Default OG"
                    width={220}
                    height={115}
                    unoptimized
                    className="mb-2 h-28 w-52 rounded object-cover"
                  />
                ) : null}
                <label className="mb-1 block text-sm font-medium">Default OG Image</label>
                <input type="file" accept="image/*" className="admin-input w-full" onChange={handleOgUpload} />
                {seo.defaultOgImage ? (
                  <button
                    type="button"
                    onClick={() => void handleRemoveOg()}
                    disabled={uploadingOg}
                    className="admin-btn mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-red-600"
                  >
                    <FiTrash2 /> Remove image
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={savingSeo}
                className="admin-btn bg-[var(--admin-brand)] text-white disabled:opacity-50 sm:col-span-2"
              >
                {savingSeo ? "Saving..." : "Save SEO Defaults"}
              </button>
            </form>

            <div className="admin-card p-6">
              <h2 className="text-base font-semibold">Legal & Policy Pages</h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                Edit policy content and page SEO from the Pages section. Changes appear on the live site immediately when published.
              </p>
              <div className="mt-4 grid gap-2">
                {legalPages.map((page) => (
                  <Link
                    key={page._id}
                    href={`/pages/${page._id}/edit`}
                    className="flex items-center justify-between rounded border border-[var(--admin-border)] px-4 py-3 text-sm hover:bg-[var(--admin-surface-muted)]"
                  >
                    <span>
                      <span className="font-medium">{page.title}</span>
                      <span className="ml-2 text-[var(--admin-muted)]">{page.path}</span>
                    </span>
                    <FiExternalLink />
                  </Link>
                ))}
              </div>
              <Link href="/pages" className="admin-btn mt-4 inline-flex px-4 py-2">
                Manage all pages
              </Link>
            </div>
          </div>
        ) : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
