import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-10">
      <div className="admin-card w-full p-8 text-center">
        <p className="admin-muted text-sm font-semibold">404</p>
        <h1 className="mt-2 text-3xl font-bold">Page Not Found</h1>
        <p className="admin-muted mt-3 text-sm">The page you requested could not be found.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/dashboard" className="admin-btn bg-[var(--admin-brand)] text-white hover:brightness-95">
            Go to Dashboard
          </Link>
          <Link href="/login" className="admin-btn admin-btn-outline">
            Go to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
