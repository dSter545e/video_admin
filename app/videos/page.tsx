"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { FiEdit2, FiEye, FiMessageSquare, FiSearch, FiThumbsDown, FiThumbsUp, FiTrash2 } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { deleteVideoApi, getVideosApi } from "../../lib/api";
import { USER_APP_URL } from "../../lib/config";
import { Video } from "../../lib/types";

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState("");
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const itemsPerPage = 30;

  const loadAll = async (search?: string | null) => {
    const videosData = await getVideosApi(search ? { q: search } : undefined);
    setVideos(videosData);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll(activeSearch);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [videos.length, activeSearch]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = searchQuery.trim();
    setActiveSearch(q || null);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch(null);
  };

  const deleteVideo = async (id: string) => {
    if (deletingVideoId === id) return;
    setDeletingVideoId(id);
    try {
      await deleteVideoApi(id);
      await loadAll(activeSearch);
    } catch (_error) {
      setError("Could not delete video");
    } finally {
      setDeletingVideoId(null);
    }
  };

  const getVideoWatchUrl = (video: Video) => `${USER_APP_URL}/videos/${video.slug || video._id}`;
  const totalPages = Math.max(1, Math.ceil(videos.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedVideos = videos.slice(startIndex, startIndex + itemsPerPage);
  const pageWindowStart = Math.max(1, safeCurrentPage - 2);
  const pageWindowEnd = Math.min(totalPages, safeCurrentPage + 2);
  const pageNumbers = Array.from({ length: pageWindowEnd - pageWindowStart + 1 }, (_, index) => pageWindowStart + index);

  return (
    <ProtectedRoute>
      <AdminShell title="Video List" actionLabel="Add Video" actionHref="/videos/add">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <form onSubmit={handleSearch} className="admin-card mb-4 flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[220px] flex-1">
            <label className="admin-muted mb-1 block text-xs font-semibold uppercase">Search</label>
            <div className="relative">
              <FiSearch className="admin-muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Video ID, title, or category"
                className="admin-input w-full py-2 pl-9 pr-3"
              />
            </div>
          </div>
          <button type="submit" className="admin-btn bg-blue-600 text-white">
            Search
          </button>
          {activeSearch ? (
            <button type="button" onClick={clearSearch} className="admin-btn">
              Clear
            </button>
          ) : null}
        </form>

        <div className="admin-card overflow-x-auto p-3">
          <table className="admin-table w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)]">
                <th className="px-3 py-3 font-semibold">ID</th>
                <th className="px-3 py-3 font-semibold">Thumbnail</th>
                <th className="px-3 py-3 font-semibold">Title</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Views</th>
                <th className="px-3 py-3 font-semibold">Reactions</th>
                <th className="px-3 py-3 font-semibold">Comments</th>
                <th className="px-3 py-3 font-semibold">Tags</th>
                <th className="px-3 py-3 font-semibold">Qualities</th>
                <th className="px-3 py-3 font-semibold">Duration</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVideos.map((video) => (
                <tr key={video._id} className="border-b border-[var(--admin-border)] last:border-b-0">
                  <td className="admin-muted px-3 py-3 font-mono text-xs">{video.videoId || "--"}</td>
                  <td className="px-3 py-3">
                    {video.thumbnail ? (
                      <Image
                        src={video.thumbnail}
                        alt={video.title || "Thumbnail"}
                        width={80}
                        height={48}
                        unoptimized
                        className="h-12 w-20 rounded object-cover"
                      />
                    ) : (
                      <div className="admin-muted text-xs">No image</div>
                    )}
                  </td>
                  <td className="px-3 py-3 font-medium">{video.title}</td>
                  <td className="admin-muted px-3 py-3">{video.category?.name || "Uncategorized"}</td>
                  <td className="px-3 py-3">
                    <span className="admin-chip rounded px-2 py-1 text-xs uppercase">
                      {video.processingStatus === "active"
                        ? "public"
                        : video.processingStatus === "inactive"
                          ? "private"
                          : video.processingStatus === "ready"
                            ? "public"
                            : video.processingStatus || "draft"}
                    </span>
                  </td>
                  <td className="admin-muted px-3 py-3">{video.viewsCount || 0}</td>
                  <td className="admin-muted px-3 py-3">
                    <span className="inline-flex items-center gap-1">
                      <FiThumbsUp className="text-sm" />
                      {video.likesCount || 0}
                    </span>
                    <span className="mx-2">/</span>
                    <span className="inline-flex items-center gap-1">
                      <FiThumbsDown className="text-sm" />
                      {video.dislikesCount || 0}
                    </span>
                  </td>
                  <td className="admin-muted px-3 py-3">{video.commentsCount || 0}</td>
                  <td className="admin-muted max-w-[220px] px-3 py-3">
                    {(video.tags || []).length ? (
                      <span className="line-clamp-2">{(video.tags || []).map((tag) => tag.displayName).join(", ")}</span>
                    ) : (
                      "No tags"
                    )}
                  </td>
                  <td className="admin-muted px-3 py-3">
                    {video.qualityVariants?.length
                      ? (() => {
                          const sorted = [...video.qualityVariants].sort((a, b) => (b.height || 0) - (a.height || 0));
                          return sorted[0]?.label || `${sorted[0]?.height || 0}p`;
                        })()
                      : "Pending"}
                  </td>
                  <td className="admin-muted px-3 py-3">
                    {video.durationSeconds ? `${Math.round(video.durationSeconds)}s` : "--"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/videos/${video._id}/edit`}
                        className="admin-btn bg-blue-600 text-white"
                        aria-label="Edit video"
                        title="Edit"
                      >
                        <FiEdit2 aria-hidden />
                      </Link>
                      <Link
                        href={`/videos/${video._id}/comments`}
                        className="admin-btn bg-indigo-600 text-white"
                        aria-label="Video comments"
                        title="Comments"
                      >
                        <FiMessageSquare aria-hidden />
                      </Link>
                      <a
                        href={getVideoWatchUrl(video)}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn bg-emerald-600 text-white"
                        aria-label="View video"
                        title="View"
                      >
                        <FiEye aria-hidden />
                      </a>
                      <button
                        onClick={() => deleteVideo(video._id)}
                        disabled={deletingVideoId === video._id}
                        className="admin-btn bg-red-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Delete video"
                        title="Delete"
                      >
                        {deletingVideoId === video._id ? "..." : <FiTrash2 aria-hidden />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="admin-muted text-sm">
            Page {safeCurrentPage} of {totalPages} | Total Videos: {videos.length}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="admin-btn admin-btn-outline disabled:opacity-60"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            {pageWindowStart > 1 ? (
              <>
                <button className="admin-btn admin-btn-outline" onClick={() => setCurrentPage(1)}>
                  1
                </button>
                {pageWindowStart > 2 ? <span className="admin-muted px-1 text-sm">...</span> : null}
              </>
            ) : null}
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                className={`admin-btn ${pageNumber === safeCurrentPage ? "bg-[var(--admin-brand)] text-white" : "admin-btn-outline"}`}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            {pageWindowEnd < totalPages ? (
              <>
                {pageWindowEnd < totalPages - 1 ? <span className="admin-muted px-1 text-sm">...</span> : null}
                <button className="admin-btn admin-btn-outline" onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </button>
              </>
            ) : null}
            <button
              className="admin-btn admin-btn-outline disabled:opacity-60"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
