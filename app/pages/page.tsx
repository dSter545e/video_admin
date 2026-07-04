"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { deletePageApi, getPagesAdminApi } from "../../lib/api";
import { CmsPage } from "../../lib/types";

export default function PagesAdminPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [error, setError] = useState("");

  const loadPages = async () => {
    try {
      setPages(await getPagesAdminApi());
    } catch {
      setError("Failed to load pages");
    }
  };

  useEffect(() => {
    void loadPages();
  }, []);

  const deletePage = async (page: CmsPage) => {
    if (page.isSystem) {
      setError("System pages cannot be deleted");
      return;
    }
    try {
      await deletePageApi(page._id);
      await loadPages();
    } catch {
      setError("Could not delete page");
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Pages" actionLabel="Add Custom Page" actionHref="/pages/add">
        <p className="mb-4 text-sm text-[var(--admin-muted)]">
          Manage SEO, Open Graph, and content for home, policy pages, listings, auth pages, and custom pages.
        </p>
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        <div className="admin-card overflow-x-auto p-3">
          <table className="admin-table w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)]">
                <th className="px-3 py-3 font-semibold">Title</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Public URL</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page._id} className="border-b border-[var(--admin-border)]">
                  <td className="px-3 py-3">
                    <div className="font-medium">{page.title}</div>
                    <div className="text-xs text-[var(--admin-muted)]">{page.slug}</div>
                  </td>
                  <td className="px-3 py-3">
                    {page.isSystem ? "Built-in" : "Custom"}
                    {page.pageKind === "meta-only" ? " · SEO only" : " · Content"}
                  </td>
                  <td className="px-3 py-3">{page.path || `/pages/${page.slug}`}</td>
                  <td className="px-3 py-3 capitalize">{page.status}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/pages/${page._id}/edit`} className="admin-btn inline-flex items-center gap-1 px-3 py-1.5">
                        <FiEdit2 /> Edit
                      </Link>
                      {!page.isSystem ? (
                        <button
                          type="button"
                          onClick={() => void deletePage(page)}
                          className="admin-btn inline-flex items-center gap-1 px-3 py-1.5 text-red-600"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pages.length ? <p className="p-4 text-sm text-[var(--admin-muted)]">Loading pages...</p> : null}
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
