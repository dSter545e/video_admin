"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL, clearAdminSession, getAdminToken } from "../lib/config";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const validate = async () => {
      const token = getAdminToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Unauthorized");
        setReady(true);
      } catch (_error) {
        clearAdminSession();
        router.replace("/login");
      }
    };

    validate();
  }, [router]);

  if (!ready) {
    return (
      <main className="admin-page flex min-h-screen items-center justify-center">
        <p className="admin-muted text-sm">Checking session...</p>
      </main>
    );
  }

  return <>{children}</>;
}
