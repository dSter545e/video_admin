"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiActivity, FiAlertCircle, FiCheckCircle, FiClock, FiRefreshCw, FiServer } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getHealthMonitorApi, runHealthMonitorApi } from "../../lib/api";
import { HealthMonitorSnapshot } from "../../lib/types";

const formatDate = (value?: string | null) => {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const statusClass = (status: string) => {
  if (status === "online") return "bg-emerald-100 text-emerald-800";
  if (status === "offline") return "bg-red-100 text-red-800";
  if (status === "processing") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
};

export default function HealthMonitorPage() {
  const [snapshot, setSnapshot] = useState<HealthMonitorSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getHealthMonitorApi();
      setSnapshot(data);
    } catch (_error) {
      setError("Unable to load health monitor data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRunNow = async () => {
    setRunning(true);
    setError("");
    try {
      const data = await runHealthMonitorApi();
      setSnapshot(data);
    } catch (_error) {
      setError("Health check failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Health Monitor">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-muted text-sm">
              Automatic check every 24 hours. Verifies all R2 storage servers and whether video files are online.
            </p>
            <p className="admin-muted mt-1 text-xs">
              Last run: {formatDate(snapshot?.lastRunAt)} · Next run: {formatDate(snapshot?.nextRunAt)}
            </p>
          </div>
          <button
            onClick={handleRunNow}
            disabled={running}
            className="admin-btn flex items-center gap-2 bg-[var(--admin-brand)] text-white disabled:opacity-60"
          >
            <FiRefreshCw className={running ? "animate-spin" : ""} />
            {running ? "Running..." : "Run Check Now"}
          </button>
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="admin-muted text-sm">Loading health data...</p> : null}

        {snapshot ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="admin-card p-5">
                <div className="mb-2 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
                  <FiServer />
                </div>
                <p className="admin-muted text-sm">R2 Servers Online</p>
                <h2 className="mt-1 text-3xl font-bold">
                  {snapshot.storageSummary.online}/{snapshot.storageSummary.total}
                </h2>
              </div>
              <div className="admin-card p-5">
                <div className="mb-2 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
                  <FiCheckCircle />
                </div>
                <p className="admin-muted text-sm">Videos Online</p>
                <h2 className="mt-1 text-3xl font-bold text-emerald-700">{snapshot.videoSummary.online}</h2>
              </div>
              <div className="admin-card p-5">
                <div className="mb-2 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
                  <FiAlertCircle />
                </div>
                <p className="admin-muted text-sm">Videos Offline</p>
                <h2 className="mt-1 text-3xl font-bold text-red-700">{snapshot.videoSummary.offline}</h2>
              </div>
              <div className="admin-card p-5">
                <div className="mb-2 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
                  <FiClock />
                </div>
                <p className="admin-muted text-sm">Checked (Last 24h)</p>
                <h2 className="mt-1 text-3xl font-bold">{snapshot.videoSummary.checkedLast24h}</h2>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="admin-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <FiServer />
                  <h3 className="text-lg font-semibold">R2 Storage Servers</h3>
                </div>
                <div className="space-y-3">
                  {snapshot.storageServers.map((server, index) => (
                    <div key={`${server.name}-${index}`} className="rounded border border-[var(--admin-border)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{server.name}</p>
                          <p className="admin-muted text-xs">{server.bucketName}</p>
                        </div>
                        <span className={`rounded px-2 py-1 text-xs font-semibold uppercase ${statusClass(server.status)}`}>
                          {server.status}
                        </span>
                      </div>
                      <p className="admin-muted mt-2 text-xs">{server.message}</p>
                      <p className="admin-muted mt-1 text-xs">Checked: {formatDate(server.checkedAt)}</p>
                    </div>
                  ))}
                  {!snapshot.storageServers.length ? (
                    <p className="admin-muted text-sm">No storage servers configured yet.</p>
                  ) : null}
                </div>
              </div>

              <div className="admin-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <FiActivity />
                  <h3 className="text-lg font-semibold">Offline Videos</h3>
                </div>
                <div className="space-y-3">
                  {snapshot.offlineVideos.map((video) => (
                    <div key={String(video.videoId)} className="rounded border border-[var(--admin-border)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{video.title}</p>
                          <p className="admin-muted text-xs">ID: {video.shortId || video.videoId}</p>
                        </div>
                        <Link href={`/videos/${video.videoId}/edit`} className="text-xs text-[var(--admin-brand)]">
                          Edit
                        </Link>
                      </div>
                      <p className="admin-muted mt-2 text-xs">{video.message}</p>
                    </div>
                  ))}
                  {!snapshot.offlineVideos.length ? (
                    <p className="admin-muted text-sm">All checked videos are online.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="admin-card mt-4 p-5">
              <h3 className="mb-3 text-lg font-semibold">Video Status Breakdown</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded border border-[var(--admin-border)] p-3 text-center">
                  <p className="admin-muted text-xs">Total</p>
                  <p className="text-xl font-bold">{snapshot.videoSummary.total}</p>
                </div>
                <div className="rounded border border-[var(--admin-border)] p-3 text-center">
                  <p className="admin-muted text-xs">Online</p>
                  <p className="text-xl font-bold text-emerald-700">{snapshot.videoSummary.online}</p>
                </div>
                <div className="rounded border border-[var(--admin-border)] p-3 text-center">
                  <p className="admin-muted text-xs">Offline</p>
                  <p className="text-xl font-bold text-red-700">{snapshot.videoSummary.offline}</p>
                </div>
                <div className="rounded border border-[var(--admin-border)] p-3 text-center">
                  <p className="admin-muted text-xs">Processing</p>
                  <p className="text-xl font-bold text-amber-700">{snapshot.videoSummary.processing}</p>
                </div>
                <div className="rounded border border-[var(--admin-border)] p-3 text-center">
                  <p className="admin-muted text-xs">Skipped</p>
                  <p className="text-xl font-bold">{snapshot.videoSummary.skipped}</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
