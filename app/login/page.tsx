"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdminApi } from "../../lib/api";
import { clearAdminSession } from "../../lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await loginAdminApi(email, password);

      clearAdminSession();
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_profile", JSON.stringify(data.admin || {}));
      setMessage(`Welcome ${data.admin?.name || "Admin"}`);
      router.push("/dashboard");
    } catch (error) {
      setError("Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">Admin Login</h1>
      <form onSubmit={onSubmit} className="admin-card p-6">
        <input
          className="admin-input mb-4 w-full"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          type="password"
          className="admin-input mb-4 w-full"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="admin-btn w-full bg-[var(--admin-brand)] py-2 text-white"
        >
          {loading ? "Please wait..." : "Login"}
        </button>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-green-600">{message}</p> : null}
      </form>
    </main>
  );
}
