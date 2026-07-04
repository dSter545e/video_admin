import { BACKEND_URL, getAdminToken } from "./config";
import {
  AdminUser,
  AnalyticsSummary,
  BackupsResponse,
  Category,
  DashboardStats,
  LoginResponse,
  ProcessedVideoUploadPayload,
  Video,
  VideoComment,
  VideoFormPayload,
  VideoRemovalRequest,
  HealthMonitorSnapshot,
  StorageServer,
  AdItem,
  AdDeviceMeta,
  AdSlotMeta,
  WatermarkSettings,
  SiteSeoSettings,
  SiteBrandingSettings,
  CmsPage,
  SeoFieldsInput,
} from "./types";
import toast from "react-hot-toast";
import { postVideoUploadForm } from "./uploadVideo";

const appendSeoToFormData = (formData: FormData, seo?: SeoFieldsInput) => {
  if (!seo) return;
  formData.append("metaTitle", seo.metaTitle || "");
  formData.append("metaDescription", seo.metaDescription || "");
  formData.append("metaKeywords", seo.metaKeywords || "");
  formData.append("ogTitle", seo.ogTitle || "");
  formData.append("ogDescription", seo.ogDescription || "");
  formData.append("ogImage", seo.ogImage || "");
  formData.append("noindex", seo.noindex ? "true" : "false");
  if (seo.ogImageFile) {
    formData.append("ogImageFile", seo.ogImageFile);
  }
};

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
  seo?: SeoFieldsInput;
}) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("slug", payload.slug || "");
  formData.append("imageUrl", payload.imageUrl || "");
  formData.append("featured", payload.featured ? "true" : "false");
  appendSeoToFormData(formData, payload.seo);
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
  payload: {
    name: string;
    slug?: string;
    imageUrl: string;
    featured?: boolean;
    imageFile?: File | null;
    seo?: SeoFieldsInput;
  }
) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("slug", payload.slug || "");
  formData.append("imageUrl", payload.imageUrl || "");
  formData.append("featured", payload.featured ? "true" : "false");
  appendSeoToFormData(formData, payload.seo);
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
  formData.append("categoryId", payload.categoryId || "");
  formData.append("status", payload.status || "public");
  for (const tag of payload.tags || []) {
    formData.append("tags[]", tag);
  }
  appendSeoToFormData(formData, payload.seo);
  formData.append("video", payload.videoFile);
  if (payload.thumbnailImageFile) {
    formData.append("thumbnailImage", payload.thumbnailImageFile);
  }

  await postVideoUploadForm({
    formData,
    onUploadProgress: payload.onUploadProgress,
  });
  toast.success("Video uploaded");
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
  formData.append("categoryId", payload.categoryId || "");
  formData.append("status", payload.status || "public");
  for (const tag of payload.tags || []) {
    formData.append("tags[]", tag);
  }
  appendSeoToFormData(formData, payload.seo);
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

export const getBackupsApi = async (): Promise<BackupsResponse> => {
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

export const getHealthMonitorApi = async (): Promise<HealthMonitorSnapshot> => {
  const response = await fetch(`${BACKEND_URL}/api/health-monitor`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load health monitor");
  return data;
};

export const runHealthMonitorApi = async (): Promise<HealthMonitorSnapshot> => {
  const response = await fetch(`${BACKEND_URL}/api/health-monitor/run`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Health check failed");
    throw new Error(data.error || "Health check failed");
  }
  toast.success("Health check completed");
  return data;
};

export const getStorageServersApi = async (): Promise<StorageServer[]> => {
  const response = await fetch(`${BACKEND_URL}/api/storage-servers`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load storage servers");
  return data;
};

export const testStorageServerApi = async (payload: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}) => {
  const response = await fetch(`${BACKEND_URL}/api/storage-servers/test`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Connection test failed");
  return data;
};

export const testStoredStorageServerApi = async (id: string) => {
  const response = await fetch(`${BACKEND_URL}/api/storage-servers/${id}/test`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Connection test failed");
  return data;
};

export const createStorageServerApi = async (payload: Omit<StorageServer, "_id" | "secretAccessKey"> & { secretAccessKey: string }) => {
  const response = await fetch(`${BACKEND_URL}/api/storage-servers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to create storage server");
    throw new Error(data.error || "Failed to create storage server");
  }
  toast.success("Storage server added");
  return data;
};

export const updateStorageServerApi = async (id: string, payload: Partial<StorageServer>) => {
  const response = await fetch(`${BACKEND_URL}/api/storage-servers/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to update storage server");
    throw new Error(data.error || "Failed to update storage server");
  }
  toast.success("Storage server updated");
  return data;
};

export const deleteStorageServerApi = async (id: string) => {
  const response = await fetch(`${BACKEND_URL}/api/storage-servers/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({} as { error?: string }));
    toast.error(data.error || "Failed to delete storage server");
    throw new Error(data.error || "Failed to delete storage server");
  }
  toast.success("Storage server deleted");
};

export const getAdSlotsMetaApi = async (): Promise<{
  slots: AdSlotMeta[];
  pages: string[];
  devices: AdDeviceMeta[];
}> => {
  const response = await fetch(`${BACKEND_URL}/api/ads/slots`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load ad slots");
  return response.json();
};

export const getAdsAdminApi = async (): Promise<AdItem[]> => {
  const response = await fetch(`${BACKEND_URL}/api/ads/admin/all`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load ads");
  return data;
};

export const createAdApi = async (payload: Omit<AdItem, "_id" | "createdAt" | "updatedAt">) => {
  const response = await fetch(`${BACKEND_URL}/api/ads/admin`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to create ad");
    throw new Error(data.error || "Failed to create ad");
  }
  toast.success("Ad created");
  return data;
};

export const updateAdApi = async (id: string, payload: Partial<AdItem>) => {
  const response = await fetch(`${BACKEND_URL}/api/ads/admin/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to update ad");
    throw new Error(data.error || "Failed to update ad");
  }
  toast.success("Ad updated");
  return data;
};

export const deleteAdApi = async (id: string) => {
  const response = await fetch(`${BACKEND_URL}/api/ads/admin/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({} as { error?: string }));
    toast.error(data.error || "Failed to delete ad");
    throw new Error(data.error || "Failed to delete ad");
  }
  toast.success("Ad deleted");
};

export const getWatermarkSettingsApi = async (): Promise<WatermarkSettings> => {
  const response = await fetch(`${BACKEND_URL}/api/settings/watermark`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load watermark settings");
  return data.watermark;
};

export const updateWatermarkSettingsApi = async (payload: Partial<WatermarkSettings>) => {
  const response = await fetch(`${BACKEND_URL}/api/settings/watermark`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to save watermark settings");
    throw new Error(data.error || "Failed to save watermark settings");
  }
  toast.success("Watermark settings saved");
  return data.watermark as WatermarkSettings;
};

export const uploadWatermarkLogoApi = async (file: File): Promise<WatermarkSettings> => {
  const formData = new FormData();
  formData.append("logo", file);
  const response = await fetch(`${BACKEND_URL}/api/settings/watermark/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to upload watermark logo");
    throw new Error(data.error || "Failed to upload watermark logo");
  }
  toast.success("Watermark logo uploaded");
  return data.watermark as WatermarkSettings;
};

export const removeWatermarkLogoApi = async (): Promise<WatermarkSettings> => {
  const response = await fetch(`${BACKEND_URL}/api/settings/watermark/logo`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to remove watermark logo");
    throw new Error(data.error || "Failed to remove watermark logo");
  }
  toast.success("Watermark logo removed");
  return data.watermark as WatermarkSettings;
};

export const getSeoSettingsApi = async (): Promise<SiteSeoSettings> => {
  const response = await fetch(`${BACKEND_URL}/api/settings/seo/admin`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load SEO settings");
  return data.seo as SiteSeoSettings;
};

export const updateSeoSettingsApi = async (payload: Partial<SiteSeoSettings>) => {
  const response = await fetch(`${BACKEND_URL}/api/settings/seo`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to save SEO settings");
    throw new Error(data.error || "Failed to save SEO settings");
  }
  toast.success("SEO settings saved");
  return data.seo as SiteSeoSettings;
};

export const uploadSeoDefaultOgImageApi = async (file: File): Promise<SiteSeoSettings> => {
  const formData = new FormData();
  formData.append("ogImage", file);
  const response = await fetch(`${BACKEND_URL}/api/settings/seo/og-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to upload default OG image");
    throw new Error(data.error || "Failed to upload default OG image");
  }
  toast.success("Default OG image uploaded");
  return data.seo as SiteSeoSettings;
};

export const removeSeoDefaultOgImageApi = async (): Promise<SiteSeoSettings> => {
  const response = await fetch(`${BACKEND_URL}/api/settings/seo/og-image`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to remove default OG image");
    throw new Error(data.error || "Failed to remove default OG image");
  }
  toast.success("Default OG image removed");
  return data.seo as SiteSeoSettings;
};

export const getSiteSettingsApi = async (): Promise<SiteBrandingSettings> => {
  const response = await fetch(`${BACKEND_URL}/api/settings/site/admin`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load site settings");
  return data.site as SiteBrandingSettings;
};

export const updateSiteSettingsApi = async (payload: Partial<SiteBrandingSettings>) => {
  const response = await fetch(`${BACKEND_URL}/api/settings/site`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to save site settings");
    throw new Error(data.error || "Failed to save site settings");
  }
  toast.success("Site settings saved");
  return data.site as SiteBrandingSettings;
};

export const uploadSiteLogoApi = async (file: File): Promise<SiteBrandingSettings> => {
  const formData = new FormData();
  formData.append("logo", file);
  const response = await fetch(`${BACKEND_URL}/api/settings/site/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to upload site logo");
    throw new Error(data.error || "Failed to upload site logo");
  }
  toast.success("Site logo uploaded");
  return data.site as SiteBrandingSettings;
};

export const removeSiteLogoApi = async (): Promise<SiteBrandingSettings> => {
  const response = await fetch(`${BACKEND_URL}/api/settings/site/logo`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to remove site logo");
    throw new Error(data.error || "Failed to remove site logo");
  }
  toast.success("Site logo removed");
  return data.site as SiteBrandingSettings;
};

export const uploadSiteFaviconApi = async (file: File): Promise<SiteBrandingSettings> => {
  const formData = new FormData();
  formData.append("favicon", file);
  const response = await fetch(`${BACKEND_URL}/api/settings/site/favicon`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to upload favicon");
    throw new Error(data.error || "Failed to upload favicon");
  }
  toast.success("Favicon uploaded");
  return data.site as SiteBrandingSettings;
};

export const removeSiteFaviconApi = async (): Promise<SiteBrandingSettings> => {
  const response = await fetch(`${BACKEND_URL}/api/settings/site/favicon`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to remove favicon");
    throw new Error(data.error || "Failed to remove favicon");
  }
  toast.success("Favicon removed");
  return data.site as SiteBrandingSettings;
};

export const getPagesAdminApi = async (): Promise<CmsPage[]> => {
  const response = await fetch(`${BACKEND_URL}/api/pages/admin/all`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to load pages");
  return response.json();
};

export const getPageByIdAdminApi = async (id: string): Promise<CmsPage> => {
  const response = await fetch(`${BACKEND_URL}/api/pages/admin/${id}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to load page");
  return response.json();
};

export const createPageApi = async (payload: {
  title: string;
  slug?: string;
  path?: string;
  content: string;
  status: "published" | "draft";
  seo?: SeoFieldsInput;
}) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("slug", payload.slug || "");
  formData.append("path", payload.path || "");
  formData.append("content", payload.content);
  formData.append("status", payload.status);
  appendSeoToFormData(formData, payload.seo);
  const response = await fetch(`${BACKEND_URL}/api/pages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to create page");
    throw new Error(data.error || "Failed to create page");
  }
  toast.success("Page created");
  return data as CmsPage;
};

export const updatePageApi = async (
  id: string,
  payload: {
    title: string;
    slug?: string;
    path?: string;
    content: string;
    status: "published" | "draft";
    seo?: SeoFieldsInput;
  }
) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("slug", payload.slug || "");
  formData.append("path", payload.path || "");
  formData.append("content", payload.content);
  formData.append("status", payload.status);
  appendSeoToFormData(formData, payload.seo);
  const response = await fetch(`${BACKEND_URL}/api/pages/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    toast.error(data.error || "Failed to update page");
    throw new Error(data.error || "Failed to update page");
  }
  toast.success("Page updated");
  return data as CmsPage;
};

export const deletePageApi = async (id: string) => {
  const response = await fetch(`${BACKEND_URL}/api/pages/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    toast.error("Failed to delete page");
    throw new Error("Failed to delete page");
  }
  toast.success("Page deleted");
};
