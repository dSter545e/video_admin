"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  FiAlertTriangle,
  FiArchive,
  FiBarChart2,
  FiFilm,
  FiFolder,
  FiGrid,
  FiLogOut,
  FiPlusCircle,
  FiUsers,
  FiMenu,
  FiX,
  FiActivity,
  FiHardDrive,
} from "react-icons/fi";
import { clearAdminSession } from "../lib/config";
import AdminThemeToggle from "./AdminThemeToggle";

type AdminShellProps = {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  actionHref?: string;
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: FiGrid },
  { href: "/videos", label: "Videos", icon: FiFilm },
  { href: "/videos/add", label: "Add Video", icon: FiPlusCircle },
  { href: "/categories", label: "Categories", icon: FiFolder },
  { href: "/categories/add", label: "Add Category", icon: FiPlusCircle },
  { href: "/users", label: "Users", icon: FiUsers },
  { href: "/analytics", label: "Analytics", icon: FiBarChart2 },
  { href: "/health", label: "Health Monitor", icon: FiActivity },
  { href: "/storage", label: "Storage", icon: FiHardDrive },
  { href: "/removal-requests", label: "Moderation", icon: FiAlertTriangle },
  { href: "/backups", label: "Backups", icon: FiArchive },
];

export default function AdminShell({ title, children, actionLabel, actionHref }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoUnavailable, setLogoUnavailable] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAdminSession();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[var(--admin-background)]">
      <header className="sticky top-0 z-40 w-full border-b border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex shrink-0 items-center">
            {logoUnavailable ? (
              <span className="text-xl font-bold tracking-tight text-[var(--admin-brand)]">xHub4u Admin</span>
            ) : (
              <div className="flex h-[36px] w-[140px] items-center justify-start">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={140}
                  height={36}
                  className="w-full object-contain"
                  style={{ height: "auto" }}
                  onError={() => setLogoUnavailable(true)}
                />
              </div>
            )}
          </Link>
          <div className="flex items-center gap-3">
            <AdminThemeToggle />
            <button
              onClick={handleLogout}
              className="admin-btn flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
            >
              <FiLogOut /> <span className="hidden sm:inline">Logout</span>
            </button>
            <button
              className="rounded border border-[var(--admin-border)] p-2 hover:bg-[var(--admin-surface-muted)] lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden border-t border-[var(--admin-border)] bg-[var(--admin-surface-muted)] lg:block">
          <div className="mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6 no-scrollbar">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--admin-brand)] text-white shadow-sm"
                      : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface)] hover:text-[var(--admin-foreground)]"
                  }`}
                >
                  <Icon className="text-base" />
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-4 lg:hidden shadow-md">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? "bg-[var(--admin-brand)] text-white"
                        : "text-[var(--admin-foreground)] hover:bg-[var(--admin-surface-muted)]"
                    }`}
                  >
                    <Icon className="text-base" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[var(--admin-foreground)] sm:text-3xl">{title}</h1>
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="admin-btn bg-[var(--admin-accent)] text-white shadow hover:brightness-95"
            >
              {actionLabel}
            </Link>
          )}
        </div>
        <div className="min-h-[60vh]">{children}</div>
      </main>
    </div>
  );
}
