"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { deleteRemovalRequestApi, getRemovalRequestsApi, updateRemovalRequestApi } from "../../lib/api";
import { USER_APP_URL } from "../../lib/config";
import { VideoRemovalRequest } from "../../lib/types";

const formatDate = (value?: string | null) => {
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

const statusStyles: Record<VideoRemovalRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function RemovalRequestsPage() {
  const [requests, setRequests] = useState<VideoRemovalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | VideoRemovalRequest["status"]>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const loadRequests = async () => {
    try {
      const data = await getRemovalRequestsApi(statusFilter === "all" ? undefined : statusFilter);
      setRequests(data);
      setNotesById(Object.fromEntries(data.map((item) => [item._id, item.adminNotes || ""])));
    } catch (_error) {
      setError("Failed to load removal requests");
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [statusFilter]);

  const pendingCount = useMemo(() => requests.filter((item) => item.status === "pending").length, [requests]);

  const handleUpdate = async (id: string, status: VideoRemovalRequest["status"], deleteVideo = false) => {
    const confirmMessage =
      status === "approved" && deleteVideo
        ? "Approve this request and delete the linked video?"
        : status === "rejected"
          ? "Reject this removal request?"
          : "Update this removal request?";

    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    setError("");
    try {
      await updateRemovalRequestApi(id, {
        status,
        adminNotes: notesById[id] || "",
        deleteVideo,
      });
      await loadRequests();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Failed to update request");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this removal request permanently?")) return;
    setLoading(true);
    setError("");
    try {
      await deleteRemovalRequestApi(id);
      await loadRequests();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Failed to delete request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Removal Requests">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`admin-btn border px-3 py-1.5 text-xs capitalize ${
                statusFilter === status
                  ? "border-[var(--admin-brand)] bg-[var(--admin-brand)] text-white"
                  : "border-[var(--admin-border)] bg-[var(--admin-surface)]"
              }`}
            >
              {status}
            </button>
          ))}
          <span className="admin-muted text-xs">
            {statusFilter === "pending" ? `${pendingCount} pending in current view` : "Review user-submitted removal requests"}
          </span>
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="space-y-4">
          {requests.map((request) => {
            const videoTitle = request.video?.title || request.videoTitle || "Unknown video";
            const videoLink = request.video?.slug || request.video?._id;
            return (
              <article key={request._id} className="admin-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{videoTitle}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${statusStyles[request.status]}`}>
                        {request.status}
                      </span>
                      {request.videoDeleted ? (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          Video deleted
                        </span>
                      ) : null}
                    </div>
                    <p className="admin-muted mt-1 text-xs">
                      Submitted {formatDate(request.createdAt)} by {request.requesterName} ({request.requesterEmail})
                    </p>
                    {request.videoReference ? (
                      <p className="admin-muted mt-1 break-all text-xs">Reference: {request.videoReference}</p>
                    ) : null}
                  </div>
                  {videoLink ? (
                    <a
                      href={`${USER_APP_URL}/videos/${videoLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-btn border border-[var(--admin-border)] px-3 py-1.5 text-xs"
                    >
                      View Video
                    </a>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide">Reason</p>
                    <p className="admin-muted whitespace-pre-wrap text-sm">{request.reason}</p>
                  </div>
                  {request.additionalInfo ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide">Additional Info</p>
                      <p className="admin-muted whitespace-pre-wrap text-sm">{request.additionalInfo}</p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide">Admin Notes</label>
                  <textarea
                    value={notesById[request._id] || ""}
                    onChange={(event) =>
                      setNotesById((prev) => ({
                        ...prev,
                        [request._id]: event.target.value,
                      }))
                    }
                    className="admin-input min-h-[80px] w-full rounded border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm"
                    placeholder="Internal notes about this request..."
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {request.status === "pending" ? (
                    <>
                      <button
                        disabled={loading || !request.video || request.videoDeleted}
                        onClick={() => handleUpdate(request._id, "approved", true)}
                        className="admin-btn bg-green-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Approve & Delete Video
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => handleUpdate(request._id, "approved", false)}
                        className="admin-btn bg-emerald-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Approve Only
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => handleUpdate(request._id, "rejected")}
                        className="admin-btn bg-red-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  <button
                    disabled={loading}
                    onClick={() => handleDelete(request._id)}
                    className="admin-btn border border-[var(--admin-border)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete Request
                  </button>
                </div>
              </article>
            );
          })}

          {!requests.length ? (
            <div className="admin-card p-8 text-center">
              <p className="admin-muted text-sm">No removal requests found.</p>
            </div>
          ) : null}
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
