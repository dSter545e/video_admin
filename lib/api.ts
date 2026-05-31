import { BACKEND_URL, getAdminToken } from "./config";
import {
  AdminUser,
  AnalyticsSummary,
  BackupItem,
  Category,
  DashboardStats,
  LoginResponse,
  ProcessedVideoUploadPayload,
  Video,
  VideoComment,
  VideoFormPayload,
  VideoRemovalRequest,
} from "./types";
import toast from "react-hot-toast";

const authHeaders = () => {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const loginAdminApi = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }
  return data;
};

export const getDashboardStatsApi = async (): Promise<DashboardStats> => {
  const response = await fetch(`${BACKEND_URL}/api/dashboard`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load dashboard");
  return data;
};

export const getCategoriesApi = async (): Promise<Category[]> => {
  const response = await fetch(`${BACKEND_URL}/api/categories`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load categories");
  return response.json();
};

export const createCategoryApi = async (payload: {
  name: string;
  slug?: string;
  imageUrl: string;
  featured?: boolean;
  imageFile?: File | null;
}) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("slug", payload.slug || "");
  formData.append("imageUrl", payload.imageUrl || "");
  formData.append("featured", payload.featured ? "true" : "false");
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }
  const response = await fetch(`${BACKEND_URL}/api/categories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({} as { error?: string }));
    const message = data.error || "Failed to create category";
    toast.error(message);
    throw new Error(message);
  }
  toast.success("Category created");
};

export const updateCategoryApi = async (
  id: string,
  payload: { name: string; slug?: string; imageUrl: string; featured?: boolean; imageFile?: File | null }
) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("slug", payload.slug || "");
  formData.append("imageUrl", payload.imageUrl || "");
  formData.append("featured", payload.featured ? "true" : "false");
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }
  const response = await fetch(`${BACKEND_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({} as { error?: string }));
    const message = data.error || "Failed to update category";
    toast.error(message);
    throw new Error(message);
  }
  toast.success("Category updated");
};

export const setCategoryFeaturedApi = async (
  id: string,
  payload: { name: string; slug?: string; imageUrl: string; featured: boolean }
) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("slug", payload.slug || "");
  formData.append("imageUrl", payload.imageUrl || "");
  formData.append("featured", payload.featured ? "true" : "false");

  const response = await fetch(`${BACKEND_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({} as { error?: string }));
    const message = data.error || "Failed to update featured status";
    toast.error(message);
    throw new Error(message);
  }

  toast.success(payload.featured ? "Category marked as featured" : "Category removed from featured");
};

export const deleteCategoryApi = async (id: string) => {
  const response = await fetch(`${BACKEND_URL}/api/categories/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) {
    toast.error("Failed to delete category");
    throw new Error("Failed to delete category");
  }
  toast.success("Category deleted");
};

export const getVideosApi = async (params?: { q?: string }): Promise<Video[]> => {
  const query = new URLSearchParams();
  if (params?.q?.trim()) {
    query.set("q", params.q.trim());
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${BACKEND_URL}/api/videos/admin/all${suffix}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) throw new Error("Failed to load videos");
  return response.json();
};

export const getVideoByIdApi = async (id: string): Promise<Video> => {
  const response = await fetch(`${BACKEND_URL}/api/videos/${id}`);
  if (!response.ok) throw new Error("Failed to load video");
  return response.json();
};

export const createProcessedVideoApi = async (
  payload: ProcessedVideoUploadPayload & {
    thumbnailImageFile?: File | null;
    onUploadProgress?: (percent: number) => void;
  }
) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("slug", payload.slug || "");
  formData.append("description", payload.description);
  formData.append("thumbnail", payload.thumbnail || "");
  formData.append("categoryId", payload.categoryId);
  formData.append("status", payload.status || "public");
  for (const tag of payload.tags || []) {
    formData.append("tags[]", tag);
  }
  formData.append("video", payload.videoFile);
  if (payload.thumbnailImageFile) {
    formData.append("thumbnailImage", payload.thumbnailImageFile);
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BACKEND_URL}/api/videos/process-upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${getAdminToken()}`);

    xhr.upload.onprogress = (event) => {
      if (!payload.onUploadProgress || !event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      payload.onUploadProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        payload.onUploadProgress?.(100);
        toast.success("Video uploaded");
        resolve();
        return;
      }
      let errorMessage = "Failed to process and upload video";
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        errorMessage = data.error || errorMessage;
      } catch (_error) {
        // keep default message
      }
      reject(new Error(errorMessage));
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed due to network error"));
    };

    xhr.send(formData);
  });
};

export const updateVideoApi = async (
  id: string,
  payload: VideoFormPayload & { thumbnailImageFile?: File | null }
) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("slug", payload.slug || "");
  formData.append("description", payload.description);
  formData.append("thumbnail", payload.thumbnail || "");
  formData.append("videoUrl", payload.videoUrl || "");
  formData.append("categoryId", payload.categoryId);
  formData.append("status", payload.status || "public");
  for (const tag of payload.tags || []) {
    formData.append("tags[]", tag);
  }
  if (payload.thumbnailImageFile) {
    formData.append("thumbnailImage", payload.thumbnailImageFile);
  }

  const response = await fetch(`${BACKEND_URL}/api/videos/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  if (!response.ok) {
    toast.error("Failed to update video");
    throw new Error("Failed to update video");
  }
  toast.success("Video updated");
};

export const deleteVideoApi = async (id: string) => {
  const response = await fetch(`${BACKEND_URL}/api/videos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) {
    toast.error("Failed to delete video");
    throw new Error("Failed to delete video");
  }
  toast.success("Video deleted");
};

export const suggestVideoTagsApi = async (query: string): Promise<string[]> => {
  const response = await fetch(`${BACKEND_URL}/api/videos/tags/suggest?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) return [];
  const data: Array<{ displayName: string }> = await response.json();
  return data.map((item) => item.displayName);
};

export const getVideoCommentsApi = async (videoId: string): Promise<VideoComment[]> => {
  const response = await fetch(`${BACKEND_URL}/api/videos/${videoId}/comments`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) throw new Error("Failed to load comments");
  return response.json();
};

export const getUsersApi = async (): Promise<AdminUser[]> => {
  const response = await fetch(`${BACKEND_URL}/api/users/admin/all`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) throw new Error("Failed to load users");
  return response.json();
};

export const getAnalyticsSummaryApi = async (): Promise<AnalyticsSummary> => {
  const response = await fetch(`${BACKEND_URL}/api/analytics/admin/summary`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) throw new Error("Failed to load analytics summary");
  return response.json();
};

export const getBackupsApi = async (): Promise<BackupItem[]> => {
  const response = await fetch(`${BACKEND_URL}/api/backups`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) throw new Error("Failed to load backups");
  return response.json();
};

export const createBackupApi = async () => {
  const response = await fetch(`${BACKEND_URL}/api/backups/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({} as { error?: string }));
    throw new Error(data.error || "Failed to create backup");
  }
  toast.success("Backup created");
  return response.json();
};

export const restoreBackupApi = async (backupKey: string) => {
  const response = await fetch(`${BACKEND_URL}/api/backups/restore`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ backupKey }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({} as { error?: string }));
    throw new Error(data.error || "Failed to restore backup");
  }
  toast.success("Database restored from backup");
  return response.json();
};

export const getRemovalRequestsApi = async (status?: string): Promise<VideoRemovalRequest[]> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`${BACKEND_URL}/api/removal-requests/admin/all${query}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) throw new Error("Failed to load removal requests");
  return response.json();
};

export const updateRemovalRequestApi = async (
  id: string,
  payload: { status: "pending" | "approved" | "rejected"; adminNotes?: string; deleteVideo?: boolean }
) => {
  const response = await fetch(`${BACKEND_URL}/api/removal-requests/admin/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({} as { error?: string }));
  if (!response.ok) {
    toast.error(data.error || "Failed to update removal request");
    throw new Error(data.error || "Failed to update removal request");
  }
  toast.success("Removal request updated");
  return data;
};

export const deleteRemovalRequestApi = async (id: string) => {
  const response = await fetch(`${BACKEND_URL}/api/removal-requests/admin/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) {
    toast.error("Failed to delete removal request");
    throw new Error("Failed to delete removal request");
  }
  toast.success("Removal request deleted");
};
