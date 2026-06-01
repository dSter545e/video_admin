"use client";

import { FormEvent, useEffect, useState } from "react";
import { FiCheckCircle, FiEdit2, FiHardDrive, FiTrash2, FiX } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  createStorageServerApi,
  deleteStorageServerApi,
  getStorageServersApi,
  testStorageServerApi,
  testStoredStorageServerApi,
  updateStorageServerApi,
} from "../../lib/api";
import { StorageServer } from "../../lib/types";

type StorageForm = {
  name: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
  isDefault: boolean;
  isActive: boolean;
};

const emptyForm: StorageForm = {
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

const serverToForm = (server: StorageServer): StorageForm => ({
  name: server.name,
  accountId: server.accountId,
  accessKeyId: server.accessKeyId,
  secretAccessKey: "",
  bucketName: server.bucketName,
  publicBaseUrl: server.publicBaseUrl || "",
  isDefault: Boolean(server.isDefault),
  isActive: server.isActive !== false,
});

export default function StoragePage() {
  const [servers, setServers] = useState<StorageServer[]>([]);
  const [form, setForm] = useState<StorageForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [testMessage, setTestMessage] = useState("");

  const isEditing = Boolean(editingId);

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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setTestMessage("");
    setError("");
  };

  const startEdit = (server: StorageServer) => {
    setEditingId(server._id);
    setForm(serverToForm(server));
    setTestMessage("");
    setError("");
  };

  const handleTest = async () => {
    setTesting(true);
    setTestMessage("");
    setError("");
    try {
      if (isEditing && editingId && !form.secretAccessKey.trim()) {
        await testStoredStorageServerApi(editingId);
      } else {
        if (!form.secretAccessKey.trim()) {
          setTestMessage("Secret Access Key is required to test new credentials");
          return;
        }
        await testStorageServerApi({
          accountId: form.accountId,
          accessKeyId: form.accessKeyId,
          secretAccessKey: form.secretAccessKey,
          bucketName: form.bucketName,
        });
      }
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
      if (isEditing && editingId) {
        const payload: Partial<StorageServer> & { secretAccessKey?: string } = {
          name: form.name,
          accountId: form.accountId,
          accessKeyId: form.accessKeyId,
          bucketName: form.bucketName,
          publicBaseUrl: form.publicBaseUrl,
          isDefault: form.isDefault,
          isActive: form.isActive,
        };
        if (form.secretAccessKey.trim()) {
          payload.secretAccessKey = form.secretAccessKey;
        }
        await updateStorageServerApi(editingId, payload);
      } else {
        if (!form.secretAccessKey.trim()) {
          setError("Secret Access Key is required");
          return;
        }
        await createStorageServerApi(form);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save storage server");
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
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete storage server");
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Storage Servers">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <form onSubmit={handleSubmit} className="admin-card space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">
                {isEditing ? "Edit Cloudflare R2 Server" : "Add Cloudflare R2 Server"}
              </h3>
              {isEditing ? (
                <button type="button" onClick={resetForm} className="admin-btn admin-btn-outline flex items-center gap-1 text-xs">
                  <FiX /> Cancel
                </button>
              ) : null}
            </div>
            <p className="admin-muted text-xs leading-relaxed">
              Create an R2 API token in Cloudflare → R2 → Manage R2 API Tokens. Use{" "}
              <strong>Object Read &amp; Write</strong> scoped to your bucket (or Admin Read &amp; Write). Copy Account
              ID from the R2 overview page and bucket name exactly as shown in the dashboard.
            </p>
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
              placeholder={isEditing ? "Secret Access Key (leave blank to keep current)" : "Secret Access Key"}
              type="password"
              value={form.secretAccessKey}
              onChange={(e) => setForm({ ...form, secretAccessKey: e.target.value })}
              required={!isEditing}
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
            {isEditing ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Server is active
              </label>
            ) : null}
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
                {saving ? "Saving..." : isEditing ? "Update Server" : "Save Server"}
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
                <div
                  key={server._id}
                  className={`rounded border p-3 ${
                    editingId === server._id ? "border-[var(--admin-brand)] bg-[var(--admin-brand)]/5" : "border-[var(--admin-border)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {server.name}{" "}
                        {server.isDefault ? <span className="text-xs text-[var(--admin-brand)]">(Default)</span> : null}
                        {!server.isActive ? <span className="text-xs text-amber-700"> (Disabled)</span> : null}
                      </p>
                      <p className="admin-muted text-xs">Account: {server.accountId}</p>
                      <p className="admin-muted text-xs">Bucket: {server.bucketName}</p>
                      <p className="admin-muted text-xs">{server.publicBaseUrl || "No public URL"}</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs font-semibold uppercase ${statusClass(server.healthStatus)}`}>
                      {server.healthStatus || "unknown"}
                    </span>
                  </div>
                  {server.healthMessage ? <p className="admin-muted mt-2 text-xs">{server.healthMessage}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => startEdit(server)} className="admin-btn admin-btn-outline flex items-center gap-1 text-xs">
                      <FiEdit2 /> Edit
                    </button>
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
