"use client";

import { useEffect, useState } from "react";
import { FiActivity, FiAlertCircle, FiCheckCircle, FiClock, FiEye, FiFilm, FiFolder, FiMessageSquare, FiServer, FiThumbsUp, FiTrendingUp, FiUsers } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getAnalyticsSummaryApi, getCategoriesApi, getDashboardStatsApi, getHealthMonitorApi, getUsersApi, getVideosApi } from "../../lib/api";
import { AnalyticsSummary, DashboardStats, HealthMonitorSnapshot } from "../../lib/types";

const formatDate = (value?: string) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

export default function DashboardPage() {
  const defaultAnalytics: AnalyticsSummary = {
    dau: 0,
    mau: 0,
    totalSessionsLast30Days: 0,
    totalPageViewsLast30Days: 0,
    totalEventsLast30Days: 0,
    avgSessionDurationSeconds: 0,
    bounceRatePercent: 0,
    dailyActiveTrend: [],
    monthlyActiveTrend: [],
    videoWatchTrend: [],
    popularCategories: [],
    topPages: [],
    eventBreakdown: [],
    hourlyActivity: [],
    deviceBreakdown: [],
    referrerBreakdown: [],
    generatedAt: "",
  };
  const [stats, setStats] = useState<DashboardStats>({ totalVideos: 0, totalCategories: 0 });
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(defaultAnalytics);
  const [totalUsers, setTotalUsers] = useState(0);
  const [publicCount, setPublicCount] = useState(0);
  const [privateCount, setPrivateCount] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [featuredCategoryCount, setFeaturedCategoryCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [topVideos, setTopVideos] = useState<
    Array<{ _id: string; title: string; viewsCount?: number; likesCount?: number; commentsCount?: number }>
  >([]);
  const [recentUsers, setRecentUsers] = useState<Array<{ _id: string; name: string; email: string; createdAt: string }>>([]);
  const [health, setHealth] = useState<HealthMonitorSnapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, videos, categories, users, analyticsData, healthData] = await Promise.all([
          getDashboardStatsApi(),
          getVideosApi(),
          getCategoriesApi(),
          getUsersApi(),
          getAnalyticsSummaryApi(),
          getHealthMonitorApi().catch(() => null),
        ]);
        setStats(statsData);
        setTotalUsers(users.length);
        setFeaturedCategoryCount(categories.filter((category) => category.featured).length);
        setPublicCount(
          videos.filter((video) => ["public", "active", "ready"].includes(String(video.processingStatus || "").toLowerCase())).length
        );
        setPrivateCount(videos.filter((video) => ["private", "inactive"].includes(String(video.processingStatus || "").toLowerCase())).length);
        setProcessingCount(videos.filter((video) => video.processingStatus === "processing").length);
        setDraftCount(videos.filter((video) => video.processingStatus === "draft").length);
        setTotalViews(videos.reduce((sum, video) => sum + (video.viewsCount || 0), 0));
        setTotalLikes(videos.reduce((sum, video) => sum + (video.likesCount || 0), 0));
        setTotalComments(videos.reduce((sum, video) => sum + (video.commentsCount || 0), 0));
        setTopVideos(
          [...videos]
            .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
            .slice(0, 5)
            .map((video) => ({
              _id: video._id,
              title: video.title,
              viewsCount: video.viewsCount || 0,
              likesCount: video.likesCount || 0,
              commentsCount: video.commentsCount || 0,
            }))
        );
        setRecentUsers(
          [...users]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 5)
            .map((user) => ({
              _id: user._id,
              name: user.name,
              email: user.email,
              createdAt: user.createdAt,
            }))
        );
        setAnalytics(analyticsData);
        setHealth(healthData);
      } catch (_error) {
        setError("Unable to load dashboard stats");
      }
    };

    load();
  }, []);

  return (
    <ProtectedRoute>
      <AdminShell title="Dashboard">
        {error ? <p className="mb-4 text-red-600">{error}</p> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="admin-card p-5">
            <div className="mb-3 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
              <FiFilm className="text-lg" />
            </div>
            <p className="admin-muted text-sm">Total Videos</p>
            <h2 className="mt-1 text-3xl font-bold">{stats.totalVideos}</h2>
          </div>
          <div className="admin-card p-5">
            <div className="mb-3 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
              <FiFolder className="text-lg" />
            </div>
            <p className="admin-muted text-sm">Total Categories</p>
            <h2 className="mt-1 text-3xl font-bold">{stats.totalCategories}</h2>
            <p className="admin-muted mt-1 text-xs">Featured: {featuredCategoryCount}</p>
          </div>
          <div className="admin-card p-5">
            <div className="mb-3 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
              <FiUsers className="text-lg" />
            </div>
            <p className="admin-muted text-sm">Total Users</p>
            <h2 className="mt-1 text-3xl font-bold">{totalUsers}</h2>
          </div>
          <div className="admin-card p-5">
            <div className="mb-3 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
              <FiEye className="text-lg" />
            </div>
            <p className="admin-muted text-sm">Total Views</p>
            <h2 className="mt-1 text-3xl font-bold">{totalViews}</h2>
          </div>
        </div>

        {health ? (
          <div className="mt-4 admin-card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FiActivity />
                <h3 className="text-lg font-semibold">System Health (24h Monitor)</h3>
              </div>
              <p className="admin-muted text-xs">Last check: {formatDate(health.lastRunAt || undefined)}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded border border-[var(--admin-border)] p-3">
                <p className="admin-muted flex items-center gap-1 text-xs">
                  <FiServer /> R2 Online
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {health.storageSummary.online}/{health.storageSummary.total}
                </p>
              </div>
              <div className="rounded border border-[var(--admin-border)] p-3">
                <p className="admin-muted flex items-center gap-1 text-xs">
                  <FiCheckCircle /> Videos Online
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{health.videoSummary.online}</p>
              </div>
              <div className="rounded border border-[var(--admin-border)] p-3">
                <p className="admin-muted flex items-center gap-1 text-xs">
                  <FiAlertCircle /> Videos Offline
                </p>
                <p className="mt-1 text-2xl font-bold text-red-700">{health.videoSummary.offline}</p>
              </div>
              <div className="rounded border border-[var(--admin-border)] p-3">
                <p className="admin-muted flex items-center gap-1 text-xs">
                  <FiClock /> Checked (24h)
                </p>
                <p className="mt-1 text-2xl font-bold">{health.videoSummary.checkedLast24h}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="admin-card p-5">
            <p className="admin-muted text-sm">Public Videos</p>
            <h3 className="mt-1 text-2xl font-semibold">{publicCount}</h3>
          </div>
          <div className="admin-card p-5">
            <p className="admin-muted text-sm">Private Videos</p>
            <h3 className="mt-1 text-2xl font-semibold">{privateCount}</h3>
          </div>
          <div className="admin-card p-5">
            <p className="admin-muted text-sm">Processing / Draft</p>
            <h3 className="mt-1 text-2xl font-semibold">
              {processingCount} / {draftCount}
            </h3>
          </div>
          <div className="admin-card p-5">
            <p className="admin-muted text-sm">Engagement</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="admin-chip inline-flex items-center gap-1 rounded px-2 py-1">
                <FiThumbsUp /> {totalLikes} Likes
              </span>
              <span className="admin-chip inline-flex items-center gap-1 rounded px-2 py-1">
                <FiMessageSquare /> {totalComments} Comments
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="admin-card p-5">
            <p className="admin-muted text-sm">DAU / MAU</p>
            <h3 className="mt-1 text-2xl font-semibold">
              {analytics.dau} / {analytics.mau}
            </h3>
          </div>
          <div className="admin-card p-5">
            <p className="admin-muted text-sm">Sessions (30d)</p>
            <h3 className="mt-1 text-2xl font-semibold">{analytics.totalSessionsLast30Days}</h3>
          </div>
          <div className="admin-card p-5">
            <p className="admin-muted text-sm">Avg Session Duration</p>
            <h3 className="mt-1 text-2xl font-semibold">{analytics.avgSessionDurationSeconds}s</h3>
          </div>
          <div className="admin-card p-5">
            <p className="admin-muted text-sm">Bounce Rate</p>
            <h3 className="mt-1 text-2xl font-semibold">{analytics.bounceRatePercent}%</h3>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="admin-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FiActivity />
              <h3 className="text-lg font-semibold">Top Videos By Views</h3>
            </div>
            <div className="space-y-3">
              {topVideos.map((video, index) => (
                <div key={video._id} className="flex items-start justify-between gap-3 rounded border border-[var(--admin-border)] p-3">
                  <div>
                    <p className="font-medium">
                      #{index + 1} {video.title}
                    </p>
                    <p className="admin-muted mt-1 text-xs">ID: {video._id}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="admin-muted">Views: {video.viewsCount || 0}</p>
                    <p className="admin-muted">Likes: {video.likesCount || 0}</p>
                    <p className="admin-muted">Comments: {video.commentsCount || 0}</p>
                  </div>
                </div>
              ))}
              {!topVideos.length ? <p className="admin-muted text-sm">No videos found.</p> : null}
            </div>
          </div>

          <div className="admin-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FiClock />
              <h3 className="text-lg font-semibold">Recent Users</h3>
            </div>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user._id} className="rounded border border-[var(--admin-border)] p-3">
                  <p className="font-medium">{user.name || "Unnamed"}</p>
                  <p className="admin-muted text-sm">{user.email}</p>
                  <p className="admin-muted mt-1 text-xs">Joined: {formatDate(user.createdAt)}</p>
                </div>
              ))}
              {!recentUsers.length ? <p className="admin-muted text-sm">No users found.</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="admin-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FiTrendingUp />
              <h3 className="text-lg font-semibold">Top Pages (30 Days)</h3>
            </div>
            <div className="space-y-2">
              {analytics.topPages.slice(0, 6).map((page) => (
                <div key={page.path} className="flex items-center justify-between rounded border border-[var(--admin-border)] px-3 py-2 text-sm">
                  <span className="truncate">{page.path}</span>
                  <span className="font-semibold">{page.views}</span>
                </div>
              ))}
              {!analytics.topPages.length ? <p className="admin-muted text-sm">No page data yet.</p> : null}
            </div>
          </div>

          <div className="admin-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FiActivity />
              <h3 className="text-lg font-semibold">Event Mix (30 Days)</h3>
            </div>
            <div className="space-y-2">
              {analytics.eventBreakdown.slice(0, 6).map((event) => (
                <div
                  key={event.eventType}
                  className="flex items-center justify-between rounded border border-[var(--admin-border)] px-3 py-2 text-sm"
                >
                  <span className="truncate">{event.eventType}</span>
                  <span className="font-semibold">{event.count}</span>
                </div>
              ))}
              {!analytics.eventBreakdown.length ? <p className="admin-muted text-sm">No event data yet.</p> : null}
            </div>
          </div>
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
