export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const USER_APP_URL = process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3000";

export const getAdminToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "";

export const clearAdminSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_profile");
};
