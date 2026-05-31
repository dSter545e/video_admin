"use client";

import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiCalendar, FiClock, FiGlobe, FiMousePointer, FiPieChart, FiTrendingUp, FiUsers } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getAnalyticsSummaryApi } from "../../lib/api";
import { AnalyticsSummary } from "../../lib/types";

const defaultSummary: AnalyticsSummary = {
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

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary>(defaultSummary);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAnalyticsSummaryApi();
        setSummary(data);
      } catch (_error) {
        setError("Unable to load analytics");
      }
    };
    void load();
  }, []);

  const maxDaily = useMemo(() => Math.max(1, ...summary.dailyActiveTrend.map((item) => item.count)), [summary.dailyActiveTrend]);
  const maxMonthly = useMemo(
    () => Math.max(1, ...summary.monthlyActiveTrend.map((item) => item.count)),
    [summary.monthlyActiveTrend]
  );
  const maxCategoryViews = useMemo(
    () => Math.max(1, ...summary.popularCategories.map((item) => item.totalViews)),
    [summary.popularCategories]
  );
  const maxWatchTrend = useMemo(() => Math.max(1, ...summary.videoWatchTrend.map((item) => item.count)), [summary.videoWatchTrend]);
  const maxHourly = useMemo(() => Math.max(1, ...summary.hourlyActivity.map((item) => item.count)), [summary.hourlyActivity]);

  return (
    <ProtectedRoute>
      <AdminShell title="Analytics">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="admin-card p-5">
            <div className="mb-2 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
              <FiUsers />
            </div>
            <p className="admin-muted text-sm">Daily Active Users (DAU)</p>
            <p className="mt-1 text-3xl font-bold">{summary.dau}</p>
          </div>
          <div className="admin-card p-5">
            <div className="mb-2 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
              <FiCalendar />
            </div>
            <p className="admin-muted text-sm">Monthly Active Users (MAU)</p>
            <p className="mt-1 text-3xl font-bold">{summary.mau}</p>
          </div>
          <div className="admin-card p-5">
            <div className="mb-2 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
              <FiActivity />
            </div>
            <p className="admin-muted text-sm">Sessions (30d)</p>
            <p className="mt-1 text-3xl font-bold">{summary.totalSessionsLast30Days}</p>
          </div>
          <div className="admin-card p-5">
            <div className="mb-2 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
              <FiMousePointer />
            </div>
            <p className="admin-muted text-sm">Page Views (30d)</p>
            <p className="mt-1 text-3xl font-bold">{summary.totalPageViewsLast30Days}</p>
          </div>
          <div className="admin-card p-5">
            <div className="mb-2 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
              <FiClock />
            </div>
            <p className="admin-muted text-sm">Avg Session Duration</p>
            <p className="mt-1 text-3xl font-bold">{summary.avgSessionDurationSeconds}s</p>
          </div>
          <div className="admin-card p-5">
            <div className="mb-2 inline-flex rounded-lg bg-[var(--admin-surface-muted)] p-2">
              <FiPieChart />
            </div>
            <p className="admin-muted text-sm">Bounce Rate</p>
            <p className="mt-1 text-3xl font-bold">{summary.bounceRatePercent}%</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="admin-card p-5">
            <h3 className="text-lg font-semibold">Daily Active Trend (Last 30 Days)</h3>
            <div className="mt-3 space-y-2">
              {summary.dailyActiveTrend.map((item) => (
                <div key={item.date}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="admin-muted">{item.date}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 rounded bg-[var(--admin-surface-muted)]">
                    <div
                      className="h-2 rounded bg-[var(--admin-brand)]"
                      style={{ width: `${Math.max(4, Math.round((item.count / maxDaily) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
              {!summary.dailyActiveTrend.length ? <p className="admin-muted text-sm">No daily trend data yet.</p> : null}
            </div>
          </div>

          <div className="admin-card p-5">
            <h3 className="text-lg font-semibold">Monthly Active Trend (Last 12 Months)</h3>
            <div className="mt-3 space-y-2">
              {summary.monthlyActiveTrend.map((item) => (
                <div key={item.month}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="admin-muted">{item.month}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 rounded bg-[var(--admin-surface-muted)]">
                    <div
                      className="h-2 rounded bg-emerald-500"
                      style={{ width: `${Math.max(4, Math.round((item.count / maxMonthly) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
              {!summary.monthlyActiveTrend.length ? <p className="admin-muted text-sm">No monthly trend data yet.</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="admin-card p-5">
            <h3 className="text-lg font-semibold">Video Watch Trend (Last 30 Days)</h3>
            <div className="mt-3 space-y-2">
              {summary.videoWatchTrend.map((item) => (
                <div key={item.date}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="admin-muted">{item.date}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 rounded bg-[var(--admin-surface-muted)]">
                    <div
                      className="h-2 rounded bg-purple-500"
                      style={{ width: `${Math.max(4, Math.round((item.count / maxWatchTrend) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
              {!summary.videoWatchTrend.length ? <p className="admin-muted text-sm">No watch trend data yet.</p> : null}
            </div>
          </div>

          <div className="admin-card p-5">
            <h3 className="text-lg font-semibold">Hourly Activity (Last 7 Days)</h3>
            <div className="mt-3 space-y-2">
              {summary.hourlyActivity.map((item) => (
                <div key={item.hour}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="admin-muted">{String(item.hour).padStart(2, "0")}:00</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 rounded bg-[var(--admin-surface-muted)]">
                    <div
                      className="h-2 rounded bg-amber-500"
                      style={{ width: `${Math.max(4, Math.round((item.count / maxHourly) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
              {!summary.hourlyActivity.length ? <p className="admin-muted text-sm">No hourly activity data yet.</p> : null}
            </div>
          </div>
        </div>

        <div className="admin-card mt-4 p-5">
          <h3 className="text-lg font-semibold">Popular Categories (By Total Views)</h3>
          <div className="mt-3 space-y-3">
            {summary.popularCategories.map((category, index) => (
              <div key={category.categoryId} className="rounded border border-[var(--admin-border)] p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    #{index + 1} {category.name}
                  </p>
                  <p className="admin-muted text-xs">
                    Views: {category.totalViews} | Videos: {category.totalVideos}
                  </p>
                </div>
                <div className="h-2 rounded bg-[var(--admin-surface-muted)]">
                  <div
                    className="h-2 rounded bg-indigo-500"
                    style={{ width: `${Math.max(4, Math.round((category.totalViews / maxCategoryViews) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
            {!summary.popularCategories.length ? <p className="admin-muted text-sm">No category popularity data yet.</p> : null}
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="admin-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FiTrendingUp />
              <h3 className="text-lg font-semibold">Top Pages</h3>
            </div>
            <div className="space-y-2">
              {summary.topPages.map((page) => (
                <div key={page.path} className="flex items-center justify-between rounded border border-[var(--admin-border)] px-3 py-2 text-sm">
                  <span className="truncate">{page.path}</span>
                  <span className="font-semibold">{page.views}</span>
                </div>
              ))}
              {!summary.topPages.length ? <p className="admin-muted text-sm">No top page data yet.</p> : null}
            </div>
          </div>

          <div className="admin-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FiActivity />
              <h3 className="text-lg font-semibold">Event Breakdown</h3>
            </div>
            <div className="space-y-2">
              {summary.eventBreakdown.map((event) => (
                <div
                  key={event.eventType}
                  className="flex items-center justify-between rounded border border-[var(--admin-border)] px-3 py-2 text-sm"
                >
                  <span className="truncate">{event.eventType}</span>
                  <span className="font-semibold">{event.count}</span>
                </div>
              ))}
              {!summary.eventBreakdown.length ? <p className="admin-muted text-sm">No event breakdown yet.</p> : null}
            </div>
          </div>

          <div className="admin-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FiGlobe />
              <h3 className="text-lg font-semibold">Device & Source Mix</h3>
            </div>
            <p className="admin-muted text-xs">Devices</p>
            <div className="mt-2 space-y-2">
              {summary.deviceBreakdown.map((device) => (
                <div
                  key={device.deviceType}
                  className="flex items-center justify-between rounded border border-[var(--admin-border)] px-3 py-2 text-sm"
                >
                  <span className="capitalize">{device.deviceType}</span>
                  <span className="font-semibold">{device.count}</span>
                </div>
              ))}
              {!summary.deviceBreakdown.length ? <p className="admin-muted text-sm">No device data yet.</p> : null}
            </div>
            <p className="admin-muted mt-4 text-xs">Top Referrers</p>
            <div className="mt-2 space-y-2">
              {summary.referrerBreakdown.map((source) => (
                <div
                  key={source.source}
                  className="flex items-center justify-between rounded border border-[var(--admin-border)] px-3 py-2 text-sm"
                >
                  <span className="truncate">{source.source}</span>
                  <span className="font-semibold">{source.count}</span>
                </div>
              ))}
              {!summary.referrerBreakdown.length ? <p className="admin-muted text-sm">No referrer data yet.</p> : null}
            </div>
          </div>
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
