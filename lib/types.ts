export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type DashboardStats = {
  totalVideos: number;
  totalCategories: number;
};

export type AnalyticsSummary = {
  dau: number;
  mau: number;
  totalSessionsLast30Days: number;
  totalPageViewsLast30Days: number;
  totalEventsLast30Days: number;
  avgSessionDurationSeconds: number;
  bounceRatePercent: number;
  dailyActiveTrend: Array<{ date: string; count: number }>;
  monthlyActiveTrend: Array<{ month: string; count: number }>;
  videoWatchTrend: Array<{ date: string; count: number }>;
  popularCategories: Array<{
    categoryId: string;
    name: string;
    slug?: string;
    totalViews: number;
    totalVideos: number;
  }>;
  topPages: Array<{ path: string; views: number }>;
  eventBreakdown: Array<{ eventType: string; count: number }>;
  hourlyActivity: Array<{ hour: number; count: number }>;
  deviceBreakdown: Array<{ deviceType: string; count: number }>;
  referrerBreakdown: Array<{ source: string; count: number }>;
  generatedAt: string;
};

export type Category = {
  _id: string;
  name: string;
  slug?: string;
  imageUrl: string;
  featured?: boolean;
};

export type Video = {
  _id: string;
  videoId?: string;
  title: string;
  slug?: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  durationSeconds?: number;
  maxSourceHeight?: number;
  qualityVariants?: Array<{
    label: string;
    height: number;
    width?: number;
    url: string;
    key: string;
  }>;
  processingStatus?: "public" | "private" | "processing" | "draft" | "active" | "inactive" | "ready" | "failed";
  finalStatus?: "public" | "private" | "draft" | "active" | "inactive";
  viewsCount?: number;
  likesCount?: number;
  dislikesCount?: number;
  commentsCount?: number;
  tags?: Array<{
    _id: string;
    name: string;
    displayName: string;
  }>;
  category?: {
    _id: string;
    name: string;
    imageUrl?: string;
  };
  healthStatus?: "online" | "offline" | "processing" | "unknown";
  healthCheckedAt?: string;
  healthMessage?: string;
};

export type HealthMonitorSnapshot = {
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  durationMs?: number;
  storageSummary: { total: number; online: number; offline: number };
  videoSummary: {
    total: number;
    online: number;
    offline: number;
    processing: number;
    skipped: number;
    checkedLast24h: number;
  };
  storageServers: Array<{
    serverId?: string | null;
    name: string;
    bucketName: string;
    status: "online" | "offline" | "unknown";
    message: string;
    checkedAt?: string;
  }>;
  offlineVideos: Array<{
    videoId: string;
    shortId?: string;
    title: string;
    status: string;
    message: string;
    checkedAt?: string;
  }>;
};

export type StorageServer = {
  _id: string;
  name: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl?: string;
  isDefault?: boolean;
  isActive?: boolean;
  healthStatus?: "online" | "offline" | "unknown";
  healthCheckedAt?: string;
  healthMessage?: string;
};

export type LoginResponse = {
  token: string;
  admin: AdminProfile;
};

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export type BackupItem = {
  key: string;
  size: number;
  lastModified: string | null;
};

export type BackupStatus = {
  firstRunAt: string | null;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  nextRunAt: string | null;
  lastInitiatedBy: string;
  lastStatus: "success" | "failure" | "unknown";
  lastError: string;
  lastBackupKey: string;
  totalRuns: number;
  totalBackupFiles: number;
  firstBackupFileAt: string | null;
  lastBackupFileAt: string | null;
  autoBackupEnabled: boolean;
  intervalHours: number;
};

export type BackupsResponse = {
  items: BackupItem[];
  status: BackupStatus;
};

export type VideoFormPayload = {
  title: string;
  slug?: string;
  description: string;
  thumbnail?: string;
  videoUrl?: string;
  categoryId: string;
  status?: "public" | "private" | "draft";
  tags?: string[];
};

export type ProcessedVideoUploadPayload = {
  title: string;
  slug?: string;
  description: string;
  thumbnail?: string;
  categoryId: string;
  videoFile: File;
  status?: "public" | "private" | "draft";
  tags?: string[];
};

export type VideoComment = {
  _id: string;
  video: string;
  userIdentifier?: string;
  authorName: string;
  message: string;
  createdAt: string;
};

export type VideoRemovalRequest = {
  _id: string;
  video?: {
    _id: string;
    title: string;
    slug?: string;
    thumbnail?: string;
  } | null;
  videoTitle?: string;
  videoReference?: string;
  requesterName: string;
  requesterEmail: string;
  reason: string;
  additionalInfo?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  videoDeleted?: boolean;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdDeviceMeta = {
  id: string;
  label: string;
};

export type AdSlotMeta = {
  id: string;
  label: string;
  placementType: "fixed" | "in_feed" | "video" | "popup";
  pages: string[];
  defaultInFeedEvery?: number;
  defaultSkipAfterSeconds?: number;
  defaultPopupDelaySeconds?: number;
  defaultPopupCooldownMinutes?: number;
};

export type AdItem = {
  _id: string;
  name: string;
  slot: string;
  type: "html" | "image" | "video";
  htmlContent: string;
  imageUrl: string;
  videoUrl: string;
  linkUrl: string;
  altText: string;
  pages: string[];
  devices: string[];
  inFeedEvery: number;
  skipAfterSeconds: number;
  popupDelaySeconds: number;
  popupCooldownMinutes: number;
  priority: number;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
