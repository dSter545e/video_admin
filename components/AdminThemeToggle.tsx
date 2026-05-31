"use client";

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

type ThemeMode = "light" | "dark";

export default function AdminThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  const applyTheme = (nextTheme: ThemeMode) => {
    document.documentElement.setAttribute("data-admin-theme", nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
  };

  useEffect(() => {
    const saved = (localStorage.getItem("admin_theme") as ThemeMode | null) || "light";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("admin_theme", nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <button onClick={toggleTheme} className="admin-btn admin-btn-outline" aria-label="Toggle admin theme">
      {theme === "light" ? <FiMoon /> : <FiSun />}
    </button>
  );
}
