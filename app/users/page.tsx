"use client";

import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getUsersApi } from "../../lib/api";
import { AdminUser } from "../../lib/types";

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

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getUsersApi();
        setUsers(data);
      } catch (_error) {
        setError("Failed to load users");
      }
    };
    void load();
  }, []);

  return (
    <ProtectedRoute>
      <AdminShell title="User List">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        <div className="admin-card overflow-x-auto p-3">
          <table className="admin-table w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)]">
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-[var(--admin-border)] last:border-b-0">
                  <td className="px-3 py-3 font-medium">{user.name || "Unnamed"}</td>
                  <td className="admin-muted px-3 py-3">{user.email}</td>
                  <td className="px-3 py-3">
                    <span className="admin-chip rounded px-2 py-1 text-xs">{user.isActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="admin-muted px-3 py-3">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
              {!users.length ? (
                <tr>
                  <td colSpan={4} className="admin-muted px-3 py-6 text-center">
                    No users found.
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
