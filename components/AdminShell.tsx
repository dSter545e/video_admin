"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiArchive,
  FiBarChart2,
  FiFilm,
  FiFolder,
  FiGrid,
  FiLogOut,
  FiUsers,
  FiMenu,
  FiX,
  FiActivity,
  FiHardDrive,
  FiRadio,
  FiImage,
} from "react-icons/fi";
import { clearAdminSession } from "../lib/config";
import AdminThemeToggle from "./AdminThemeToggle";

type AdminShellProps = {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  actionHref?: string;
};

type NavLink = {
  href: string;
  label: string;
  icon: typeof FiGrid;
};

type NavSection = {
  title: string;
  links: NavLink[];
};

const navSections: NavSection[] = [
  {
    title: "Overview",
    links: [{ href: "/dashboard", label: "Dashboard", icon: FiGrid }],
  },
  {
    title: "Content",
    links: [
      { href: "/videos", label: "Videos", icon: FiFilm },
      { href: "/categories", label: "Categories", icon: FiFolder },
    ],
  },
  {
    title: "Audience",
    links: [
      { href: "/users", label: "Users", icon: FiUsers },
      { href: "/analytics", label: "Analytics", icon: FiBarChart2 },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/health", label: "Health Monitor", icon: FiActivity },
      { href: "/storage", label: "Storage", icon: FiHardDrive },
      { href: "/ads", label: "Ads", icon: FiRadio },
      { href: "/watermark", label: "Watermark", icon: FiImage },
      { href: "/removal-requests", label: "Moderation", icon: FiAlertTriangle },
      { href: "/backups", label: "Backups", icon: FiArchive },
    ],
  },
];

const isNavActive = (pathname: string, href: string) => {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function AdminShell({ title, children, actionLabel, actionHref }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoUnavailable, setLogoUnavailable] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    clearAdminSession();
    router.push("/login");
  };

  const renderNav = () =>
    navSections.map((section) => (
      <div key={section.title} className="admin-sidebar__section">
        <p className="admin-sidebar__section-title">{section.title}</p>
        <nav className="admin-sidebar__nav">
          {section.links.map((link) => {
            const Icon = link.icon;
            const active = isNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`admin-sidebar__link ${active ? "admin-sidebar__link--active" : ""}`}
              >
                <Icon className="admin-sidebar__link-icon" aria-hidden />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    ));

  return (
    <div className="admin-layout">
      {sidebarOpen ? (
        <button
          type="button"
          className="admin-sidebar-backdrop lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar--open" : ""}`}>
        <div className="admin-sidebar__header">
          <Link href="/dashboard" className="admin-sidebar__brand" onClick={() => setSidebarOpen(false)}>
            {logoUnavailable ? (
              <span className="admin-sidebar__brand-text">xHub4u Admin</span>
            ) : (
              <div className="admin-sidebar__logo-wrap">
                <Image
                  src="/logo.png"
                  alt="xHub4u Admin"
                  width={132}
                  height={34}
                  className="admin-sidebar__logo"
                  style={{ height: "auto" }}
                  onError={() => setLogoUnavailable(true)}
                />
              </div>
            )}
          </Link>
          <button
            type="button"
            className="admin-sidebar__close lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX />
          </button>
        </div>

        <div className="admin-sidebar__scroll">{renderNav()}</div>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__footer-actions">
            <AdminThemeToggle />
            <button type="button" onClick={handleLogout} className="admin-sidebar__logout">
              <FiLogOut aria-hidden />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="admin-topbar__menu lg:hidden"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu />
            </button>
            <h1 className="admin-topbar__title">{title}</h1>
          </div>
          <div className="admin-topbar__actions">
            {actionLabel && actionHref ? (
              <Link href={actionHref} className="admin-btn bg-[var(--admin-accent)] text-white shadow hover:brightness-95">
                {actionLabel}
              </Link>
            ) : null}
            <div className="admin-topbar__mobile-tools lg:hidden">
              <AdminThemeToggle />
              <button type="button" onClick={handleLogout} className="admin-topbar__logout" aria-label="Logout">
                <FiLogOut />
              </button>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-content__inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
