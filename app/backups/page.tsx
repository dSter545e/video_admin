"use client";

import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { createBackupApi, getBackupsApi, restoreBackupApi } from "../../lib/api";
import { BackupItem } from "../../lib/types";

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

const formatSize = (size = 0) => `${(size / (1024 * 1024)).toFixed(2)} MB`;

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBackups = async () => {
    try {
      const data = await getBackupsApi();
      setBackups(data);
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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={createBackup}
            disabled={loading}
            className="admin-btn bg-[var(--admin-brand)] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Working..." : "Create Backup Now"}
          </button>
          <span className="admin-muted text-xs">Auto backup runs every 24h and keeps last 30 days.</span>
        </div>
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
