"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminSession } from "../lib/config";
import AdminThemeToggle from "./AdminThemeToggle";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/categories", label: "Categories" },
    { href: "/videos", label: "Videos" },
  ];

  return (
    <header className="admin-card mb-8 flex flex-wrap items-center justify-between gap-3 p-4">
      <nav className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm ${
              pathname === link.href ? "bg-[var(--admin-brand)] text-white" : "admin-chip"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <AdminThemeToggle />
        <button
          onClick={() => {
            clearAdminSession();
            router.push("/login");
          }}
          className="admin-btn bg-red-600 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
