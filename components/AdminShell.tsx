"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { FiAlertTriangle, FiArchive, FiBarChart2, FiChevronDown, FiFilm, FiFolder, FiGrid, FiLogOut, FiPlusCircle, FiUsers } from "react-icons/fi";
import { clearAdminSession } from "../lib/config";
import AdminThemeToggle from "./AdminThemeToggle";

type AdminShellProps = {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  actionHref?: string;
};

const linkGroups = [
  {
    id: "dashboard",
    label: "Dashboard",
    items: [{ href: "/dashboard", label: "Dashboard", icon: FiGrid }],
  },
  {
    id: "video",
    label: "Video",
    items: [
      { href: "/videos", label: "Video List", icon: FiFilm },
      { href: "/videos/add", label: "Add Video", icon: FiPlusCircle },
    ],
  },
  {
    id: "category",
    label: "Category",
    items: [
      { href: "/categories", label: "Category List", icon: FiFolder },
      { href: "/categories/add", label: "Add Category", icon: FiPlusCircle },
    ],
  },
  {
    id: "users",
    label: "Users",
    items: [{ href: "/users", label: "User List", icon: FiUsers }],
  },
  {
    id: "analytics",
    label: "Analytics",
    items: [{ href: "/analytics", label: "Analytics", icon: FiBarChart2 }],
  },
  {
    id: "moderation",
    label: "Moderation",
    items: [{ href: "/removal-requests", label: "Removal Requests", icon: FiAlertTriangle }],
  },
  {
    id: "backup",
    label: "Backup",
    items: [{ href: "/backups", label: "Backups", icon: FiArchive }],
  },
];

export default function AdminShell({ title, children, actionLabel, actionHref }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoUnavailable, setLogoUnavailable] = useState(false);

  return (
    <main className="admin-layout min-h-screen">
      <aside className="admin-sidebar fixed left-0 top-0 z-40 hidden h-screen w-[260px] border-r border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 lg:block">
        <div className="mb-6 flex items-center gap-2 border-b border-[var(--admin-border)] pb-4">
          {logoUnavailable ? (
            <p className="text-sm font-semibold">xHub4u</p>
          ) : (
            <div className="flex h-[42px] w-[162px] items-center justify-center">
              <Image
                src="/logo.png"
                alt="xHub4u logo"
                width={270}
                height={70}
                className="w-full object-contain"
                style={{ height: "auto" }}
                onError={() => setLogoUnavailable(true)}
              />
            </div>
          )}
        </div>
        <nav className="space-y-3">
          {linkGroups.map((group) => (
            <details key={group.id} open className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-2">
              <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                {group.label}
                <FiChevronDown className="text-sm" />
              </summary>
              <div className="mt-2 space-y-1">
                {group.items.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                        pathname === link.href ? "bg-[var(--admin-brand)] text-white" : "admin-chip"
                      }`}
                    >
                      <Icon className="text-base" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </details>
          ))}
        </nav>
      </aside>

      <section className="admin-main lg:ml-[260px]">
        <header className="admin-topbar sticky top-0 z-30 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/95 px-3 py-3 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
            <div className="flex items-center gap-2">
              {actionLabel && actionHref ? (
                <Link href={actionHref} className="admin-btn bg-[var(--admin-accent)] text-white hover:brightness-95">
                  {actionLabel}
                </Link>
              ) : null}
              <AdminThemeToggle />
              <button
                onClick={() => {
                  clearAdminSession();
                  router.push("/login");
                }}
                className="admin-btn flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
              >
                <FiLogOut />
                Logout
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {linkGroups.flatMap((group) =>
              group.items.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex shrink-0 items-center gap-1 rounded px-3 py-2 text-xs font-medium ${
                      active ? "bg-[var(--admin-brand)] text-white" : "admin-chip"
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span>{link.label}</span>
                  </Link>
                );
              })
            )}
          </div>
        </header>
        <div className="px-3 py-4 sm:px-6">{children}</div>
      </section>
    </main>
  );
}
