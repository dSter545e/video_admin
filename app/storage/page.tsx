"use client";

import { FormEvent, useEffect, useState } from "react";
import { FiCheckCircle, FiHardDrive, FiPlus, FiTrash2 } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  createStorageServerApi,
  deleteStorageServerApi,
  getStorageServersApi,
  testStorageServerApi,
  updateStorageServerApi,
} from "../../lib/api";
import { StorageServer } from "../../lib/types";

const emptyForm = {
  name: "",
  accountId: "",
  accessKeyId: "",
  secretAccessKey: "",
  bucketName: "",
  publicBaseUrl: "",
  isDefault: false,
  isActive: true,
};

const statusClass = (status?: string) => {
  if (status === "online") return "bg-emerald-100 text-emerald-800";
  if (status === "offline") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
};

export default function StoragePage() {
  const [servers, setServers] = useState<StorageServer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [testMessage, setTestMessage] = useState("");

  const load = async () => {
    try {
      const data = await getStorageServersApi();
      setServers(data);
    } catch (_error) {
      setError("Failed to load storage servers");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestMessage("");
    setError("");
    try {
      await testStorageServerApi({
        accountId: form.accountId,
        accessKeyId: form.accessKeyId,
        secretAccessKey: form.secretAccessKey,
        bucketName: form.bucketName,
      });
      setTestMessage("Connection successful");
    } catch (err) {
      setTestMessage(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createStorageServerApi(form);
      setForm(emptyForm);
      setTestMessage("");
      await load();
    } catch (_error) {
      setError("Could not save storage server");
    } finally {
      setSaving(false);
    }
  };

  const toggleDefault = async (server: StorageServer) => {
    await updateStorageServerApi(server._id, { isDefault: true });
    await load();
  };

  const toggleActive = async (server: StorageServer) => {
    await updateStorageServerApi(server._id, { isActive: !server.isActive });
    await load();
  };

  const removeServer = async (id: string) => {
    try {
      await deleteStorageServerApi(id);
      await load();
    } catch (_error) {
      setError("Could not delete storage server");
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Storage Servers">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <form onSubmit={handleSubmit} className="admin-card space-y-3 p-5">
            <h3 className="text-lg font-semibold">Add Cloudflare R2 Server</h3>
            <input
              className="admin-input w-full"
              placeholder="Server name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="admin-input w-full"
              placeholder="Account ID"
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              required
            />
            <input
              className="admin-input w-full"
              placeholder="Access Key ID"
              value={form.accessKeyId}
              onChange={(e) => setForm({ ...form, accessKeyId: e.target.value })}
              required
            />
            <input
              className="admin-input w-full"
              placeholder="Secret Access Key"
              type="password"
              value={form.secretAccessKey}
              onChange={(e) => setForm({ ...form, secretAccessKey: e.target.value })}
              required
            />
            <input
              className="admin-input w-full"
              placeholder="Bucket name"
              value={form.bucketName}
              onChange={(e) => setForm({ ...form, bucketName: e.target.value })}
              required
            />
            <input
              className="admin-input w-full"
              placeholder="Public base URL (https://pub-xxx.r2.dev)"
              value={form.publicBaseUrl}
              onChange={(e) => setForm({ ...form, publicBaseUrl: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Set as default storage
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="admin-btn admin-btn-outline"
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>
              <button type="submit" disabled={saving} className="admin-btn bg-[var(--admin-brand)] text-white">
                {saving ? "Saving..." : "Save Server"}
              </button>
            </div>
            {testMessage ? (
              <p className={`text-sm ${testMessage.includes("successful") ? "text-emerald-700" : "text-red-600"}`}>
                {testMessage}
              </p>
            ) : null}
          </form>

          <div className="admin-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FiHardDrive />
              <h3 className="text-lg font-semibold">Configured Servers</h3>
            </div>
            <div className="space-y-3">
              {servers.map((server) => (
                <div key={server._id} className="rounded border border-[var(--admin-border)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {server.name} {server.isDefault ? <span className="text-xs text-[var(--admin-brand)]">(Default)</span> : null}
                      </p>
                      <p className="admin-muted text-xs">{server.bucketName}</p>
                      <p className="admin-muted text-xs">{server.publicBaseUrl || "No public URL"}</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs font-semibold uppercase ${statusClass(server.healthStatus)}`}>
                      {server.healthStatus || "unknown"}
                    </span>
                  </div>
                  {server.healthMessage ? <p className="admin-muted mt-2 text-xs">{server.healthMessage}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!server.isDefault ? (
                      <button onClick={() => toggleDefault(server)} className="admin-btn admin-btn-outline text-xs">
                        Make Default
                      </button>
                    ) : null}
                    <button onClick={() => toggleActive(server)} className="admin-btn admin-btn-outline text-xs">
                      {server.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => removeServer(server._id)}
                      className="admin-btn flex items-center gap-1 bg-red-600 text-xs text-white"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {!servers.length ? (
                <p className="admin-muted text-sm">No storage servers yet. Add one to enable uploads and backups.</p>
              ) : null}
            </div>
          </div>
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
