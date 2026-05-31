"use client";

import { useEffect, useState } from "react";
import { FiArchive, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { createBackupApi, getBackupsApi, restoreBackupApi } from "../../lib/api";
import { BackupItem, BackupStatus } from "../../lib/types";

const formatDate = (value?: string | null) => {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatSize = (size = 0) => `${(size / (1024 * 1024)).toFixed(2)} MB`;

const statusClass = (status: BackupStatus["lastStatus"]) => {
  if (status === "success") return "bg-emerald-100 text-emerald-800";
  if (status === "failure") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
};

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBackups = async () => {
    try {
      const data = await getBackupsApi();
      setBackups(data.items);
      setStatus(data.status);
    } catch (_error) {
      setError("Failed to load backups");
    }
  };

  useEffect(() => {
    void loadBackups();
  }, []);

  const createBackup = async () => {
    setLoading(true);
    setError("");
    try {
      await createBackupApi();
      await loadBackups();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Failed to create backup");
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (key: string) => {
    if (!window.confirm("Restore this backup? This will replace current database data.")) return;
    setLoading(true);
    setError("");
    try {
      await restoreBackupApi(key);
      await loadBackups();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Failed to restore backup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Backups">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-muted text-sm">
              {status?.autoBackupEnabled
                ? `Automatic backup every ${status.intervalHours}h. Keeps last 30 days.`
                : "Automatic backup is disabled."}
            </p>
            <p className="admin-muted mt-1 text-xs">
              First run: {formatDate(status?.firstRunAt)} · Last run: {formatDate(status?.lastRunAt)} · Next run:{" "}
              {formatDate(status?.nextRunAt)}
            </p>
          </div>
          <button
            onClick={createBackup}
            disabled={loading}
            className="admin-btn bg-[var(--admin-brand)] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Working..." : "Create Backup Now"}
          </button>
        </div>

        {status ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="admin-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <FiClock className="text-[var(--admin-brand)]" />
                First Backup
              </div>
              <p className="text-lg font-semibold">{formatDate(status.firstRunAt)}</p>
              <p className="admin-muted mt-1 text-xs">First backup attempt</p>
            </div>
            <div className="admin-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <FiArchive className="text-[var(--admin-brand)]" />
                Last Backup
              </div>
              <p className="text-lg font-semibold">{formatDate(status.lastRunAt)}</p>
              <p className="admin-muted mt-1 text-xs">
                {status.lastInitiatedBy ? `By ${status.lastInitiatedBy}` : "No runs recorded yet"}
              </p>
            </div>
            <div className="admin-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <FiCheckCircle className="text-[var(--admin-brand)]" />
                Last Success
              </div>
              <p className="text-lg font-semibold">{formatDate(status.lastSuccessAt)}</p>
              <p className="admin-muted mt-1 text-xs">{status.totalBackupFiles} backup file(s) stored</p>
            </div>
            <div className="admin-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <FiAlertCircle className="text-[var(--admin-brand)]" />
                Last Status
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(status.lastStatus)}`}>
                {status.lastStatus}
              </span>
              {status.lastStatus === "failure" && status.lastError ? (
                <p className="admin-muted mt-2 text-xs">{status.lastError}</p>
              ) : null}
              <p className="admin-muted mt-1 text-xs">{status.totalRuns} total run(s)</p>
            </div>
          </div>
        ) : null}

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        <div className="admin-card overflow-x-auto p-3">
          <table className="admin-table w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)]">
                <th className="px-3 py-3 font-semibold">Backup Key</th>
                <th className="px-3 py-3 font-semibold">Size</th>
                <th className="px-3 py-3 font-semibold">Created</th>
                <th className="px-3 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((item) => (
                <tr key={item.key} className="border-b border-[var(--admin-border)] last:border-b-0">
                  <td className="admin-muted px-3 py-3">{item.key}</td>
                  <td className="admin-muted px-3 py-3">{formatSize(item.size)}</td>
                  <td className="admin-muted px-3 py-3">{formatDate(item.lastModified)}</td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => restoreBackup(item.key)}
                      disabled={loading}
                      className="admin-btn bg-amber-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
              {!backups.length ? (
                <tr>
                  <td colSpan={4} className="admin-muted px-3 py-6 text-center">
                    No backups found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
