"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "../../../../components/AdminShell";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { getVideoByIdApi, getVideoCommentsApi } from "../../../../lib/api";
import { Video, VideoComment } from "../../../../lib/types";

const formatDate = (value?: string) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

export default function VideoCommentsPage() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [videoData, commentsData] = await Promise.all([getVideoByIdApi(id), getVideoCommentsApi(id)]);
        setVideo(videoData);
        setComments(commentsData);
      } catch (_error) {
        setError("Failed to load video comments");
      }
    };
    void load();
  }, [id]);

  return (
    <ProtectedRoute>
      <AdminShell title={`Comments - ${video?.title || "Video"}`} actionLabel="Back to Videos" actionHref="/videos">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="admin-card p-4">
          <p className="admin-muted text-sm">Total Comments: {comments.length}</p>
        </div>

        <div className="mt-4 space-y-3">
          {comments.map((comment) => (
            <article key={comment._id} className="admin-card p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{comment.authorName || "User"}</p>
                <span className="admin-muted text-xs">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm">{comment.message}</p>
              <p className="admin-muted mt-2 text-xs">User ID: {comment.userIdentifier || "Anonymous"}</p>
            </article>
          ))}
          {!comments.length ? (
            <div className="admin-card p-6 text-center">
              <p className="admin-muted text-sm">No comments found for this video.</p>
              <Link href="/videos" className="admin-btn admin-btn-outline mt-3 inline-block">
                Back
              </Link>
            </div>
          ) : null}
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
