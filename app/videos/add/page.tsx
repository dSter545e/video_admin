"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "../../../components/AdminShell";
import ProtectedRoute from "../../../components/ProtectedRoute";
import TagInput from "../../../components/TagInput";
import SeoFieldsSection, { emptySeoFields } from "../../../components/SeoFieldsSection";
import ThumbnailPicker from "../../../components/ThumbnailPicker";
import { createProcessedVideoApi, getCategoriesApi, suggestVideoTagsApi } from "../../../lib/api";
import {
  extractLocalVideoThumbnailOptions,
  getVideoFileKey,
  localThumbnailOptionToFile,
  LocalThumbnailOption,
} from "../../../lib/videoThumbnailOptions";
import { Category, SeoFieldsInput, VideoFormPayload } from "../../../lib/types";

const toSlug = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const initialVideo: VideoFormPayload = {
  title: "",
  slug: "",
  description: "",
  thumbnail: "",
  videoUrl: "",
  categoryId: "",
  status: "public",
  tags: [],
};

type UploadQueueItem = {
  id: string;
  file: File;
  title: string;
  status: "pending" | "uploading" | "done" | "failed";
  progress: number;
  error?: string;
};

type VideoThumbnailState = {
  options: LocalThumbnailOption[];
  selectedSeekSeconds: number | null;
  thumbnailFile: File | null;
  loading: boolean;
  error: string;
};

const MAX_PARALLEL_UPLOADS = 3;

const titleFromFile = (file: File) =>
  file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();

const revokeThumbnailOptions = (state?: VideoThumbnailState) => {
  for (const option of state?.options || []) {
    URL.revokeObjectURL(option.previewUrl);
  }
};

export default function AddVideoPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<VideoFormPayload>(initialVideo);
  const [seo, setSeo] = useState<SeoFieldsInput>(emptySeoFields);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [thumbnailByFileKey, setThumbnailByFileKey] = useState<Record<string, VideoThumbnailState>>({});
  const thumbnailByFileKeyRef = useRef<Record<string, VideoThumbnailState>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    thumbnailByFileKeyRef.current = thumbnailByFileKey;
  }, [thumbnailByFileKey]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCategoriesApi();
        setCategories(data);
      } catch (_error) {
        setError("Failed to load categories");
      }
    };
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadThumbnailOptions = async () => {
      if (!videoFiles.length) {
        setThumbnailByFileKey((current) => {
          Object.values(current).forEach(revokeThumbnailOptions);
          return {};
        });
        return;
      }

      const nextKeys = new Set(videoFiles.map(getVideoFileKey));
      setThumbnailByFileKey((current) => {
        const next: Record<string, VideoThumbnailState> = {};
        for (const file of videoFiles) {
          const key = getVideoFileKey(file);
          next[key] = current[key] || {
            options: [],
            selectedSeekSeconds: null,
            thumbnailFile: null,
            loading: true,
            error: "",
          };
        }
        for (const [key, state] of Object.entries(current)) {
          if (!nextKeys.has(key)) {
            revokeThumbnailOptions(state);
          }
        }
        return next;
      });

      await Promise.all(
        videoFiles.map(async (file) => {
          const key = getVideoFileKey(file);
          try {
            const options = await extractLocalVideoThumbnailOptions(file);
            if (cancelled) {
              options.forEach((option) => URL.revokeObjectURL(option.previewUrl));
              return;
            }
            const firstOption = options[0];
            setThumbnailByFileKey((current) => ({
              ...current,
              [key]: {
                options,
                selectedSeekSeconds: firstOption?.seekSeconds ?? null,
                thumbnailFile: firstOption ? localThumbnailOptionToFile(firstOption, file.name) : null,
                loading: false,
                error: "",
              },
            }));
          } catch (thumbnailError) {
            if (cancelled) return;
            setThumbnailByFileKey((current) => ({
              ...current,
              [key]: {
                options: [],
                selectedSeekSeconds: null,
                thumbnailFile: null,
                loading: false,
                error:
                  thumbnailError instanceof Error ? thumbnailError.message : "Could not generate thumbnail options",
              },
            }));
          }
        })
      );
    };

    void loadThumbnailOptions();
    return () => {
      cancelled = true;
    };
  }, [videoFiles]);

  useEffect(
    () => () => {
      Object.values(thumbnailByFileKeyRef.current).forEach(revokeThumbnailOptions);
    },
    []
  );

  const uploadOne = async (
    item: UploadQueueItem,
    sharedForm: VideoFormPayload,
    thumbnails: Record<string, VideoThumbnailState>
  ) => {
    setUploadQueue((prev) =>
      prev.map((entry) => (entry.id === item.id ? { ...entry, status: "uploading", progress: 0, error: "" } : entry))
    );

    try {
      const title = videoFiles.length > 1 ? item.title : sharedForm.title;
      const slug = videoFiles.length > 1 ? toSlug(item.title) : sharedForm.slug || toSlug(sharedForm.title);
      const fileKey = getVideoFileKey(item.file);
      const thumbnailImageFile = thumbnails[fileKey]?.thumbnailFile || null;

      await createProcessedVideoApi({
        title,
        slug,
        description: sharedForm.description,
        thumbnail: "",
        categoryId: sharedForm.categoryId,
        status: sharedForm.status || "public",
        tags: sharedForm.tags || [],
        seo,
        videoFile: item.file,
        thumbnailImageFile,
        onUploadProgress: (percent) => {
          setUploadQueue((prev) =>
            prev.map((entry) => (entry.id === item.id ? { ...entry, progress: percent } : entry))
          );
        },
      });

      setUploadQueue((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, status: "done", progress: 100 } : entry))
      );
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Upload failed";
      setUploadQueue((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, status: "failed", error: message } : entry))
      );
      throw uploadError;
    }
  };

  const runUploadQueue = async (queue: UploadQueueItem[], thumbnails: Record<string, VideoThumbnailState>) => {
    const pending = [...queue];
    const outcomes: Array<{ id: string; ok: boolean }> = [];

    const workers = Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, pending.length) }, async () => {
      while (pending.length) {
        const next = pending.shift();
        if (!next) break;
        try {
          await uploadOne(next, form, thumbnails);
          outcomes.push({ id: next.id, ok: true });
        } catch {
          outcomes.push({ id: next.id, ok: false });
        }
      }
    });
    await Promise.all(workers);
    return outcomes;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!videoFiles.length) {
        throw new Error("Please select at least one video file");
      }
      if (videoFiles.length === 1 && !form.title.trim()) {
        throw new Error("Please enter a video title");
      }

      const stillLoading = videoFiles.some((file) => thumbnailByFileKeyRef.current[getVideoFileKey(file)]?.loading);
      if (stillLoading) {
        throw new Error("Please wait for thumbnail options to finish loading");
      }

      const queue: UploadQueueItem[] = videoFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        title: titleFromFile(file) || `Video ${index + 1}`,
        status: "pending" as const,
        progress: 0,
      }));
      setUploadQueue(queue);

      const outcomes = await runUploadQueue(queue, thumbnailByFileKeyRef.current);
      const failedCount = outcomes.filter((item) => !item.ok).length;
      if (failedCount === outcomes.length) {
        throw new Error("All uploads failed");
      }

      router.push("/videos");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create video(s)");
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailSelect = (file: File, seekSeconds: number) => {
    const key = getVideoFileKey(file);
    setThumbnailByFileKey((current) => {
      const state = current[key];
      if (!state) return current;
      const match = state.options.find((option) => option.seekSeconds === seekSeconds);
      if (!match) return current;
      return {
        ...current,
        [key]: {
          ...state,
          selectedSeekSeconds: seekSeconds,
          thumbnailFile: localThumbnailOptionToFile(match, file.name),
        },
      };
    });
  };

  const handleCustomThumbnailUpload = (file: File, imageFile: File | null) => {
    const key = getVideoFileKey(file);
    setThumbnailByFileKey((current) => {
      const state = current[key];
      if (!state) return current;
      return {
        ...current,
        [key]: {
          ...state,
          selectedSeekSeconds: null,
          thumbnailFile: imageFile,
        },
      };
    });
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Add Video">
        <form onSubmit={onSubmit} className="admin-card grid gap-4 p-6 sm:grid-cols-2">
          <input
            className="admin-input"
            placeholder={videoFiles.length > 1 ? "Title prefix (optional for multi-upload)" : "Video Title"}
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug: slugEdited ? prev.slug : toSlug(title),
              }));
            }}
          />
          <input
            className="admin-input"
            placeholder="Slug (auto-generated)"
            value={form.slug || ""}
            onChange={(event) => {
              setSlugEdited(true);
              setForm({ ...form, slug: toSlug(event.target.value) });
            }}
            disabled={videoFiles.length > 1}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Category (optional)</label>
            <select
              className="admin-input w-full"
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <select
            className="admin-input"
            value={form.status || "public"}
            onChange={(event) => setForm({ ...form, status: event.target.value as "public" | "private" | "draft" })}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="draft">Draft</option>
          </select>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Video File(s)</label>
            <input
              type="file"
              accept="video/*"
              multiple
              className="admin-input w-full"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                setVideoFiles(files);
                setUploadQueue([]);
              }}
            />
            <p className="admin-muted mt-1 text-xs">
              Select one or more videos. Up to {MAX_PARALLEL_UPLOADS} uploads run at the same time; each video processes
              in the background after upload.
            </p>
          </div>
          {videoFiles.length ? (
            <div className="space-y-6 sm:col-span-2">
              {videoFiles.map((file) => {
                const fileKey = getVideoFileKey(file);
                const thumbState = thumbnailByFileKey[fileKey];
                return (
                  <div key={fileKey} className="rounded border border-[var(--admin-border)] p-4">
                    <p className="mb-2 text-sm font-medium">{file.name}</p>
                    <p className="admin-muted mb-3 text-xs">
                      Pick a frame every minute for longer videos, or every 30 seconds when under 1 minute. The first
                      frame is selected by default.
                    </p>
                    <ThumbnailPicker
                      options={(thumbState?.options || []).map((option) => ({
                        seekSeconds: option.seekSeconds,
                        previewUrl: option.previewUrl,
                      }))}
                      selectedSeekSeconds={thumbState?.selectedSeekSeconds ?? null}
                      loading={thumbState?.loading}
                      emptyMessage={thumbState?.error || "Generating thumbnail frames..."}
                      onSelect={(option) => handleThumbnailSelect(file, option.seekSeconds)}
                    />
                    <div className="mt-4">
                      <label className="mb-1 block text-sm font-medium">Or upload custom thumbnail</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="admin-input w-full"
                        onChange={(event) => handleCustomThumbnailUpload(file, event.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          <textarea
            className="admin-input sm:col-span-2"
            placeholder="Description (shared for all uploads in this batch)"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <TagInput
            value={form.tags || []}
            onChange={(tags) => setForm({ ...form, tags })}
            placeholder="Add tags (Enter or comma)"
            fetchSuggestions={suggestVideoTagsApi}
          />
          <SeoFieldsSection
            value={seo}
            onChange={setSeo}
            fallbackTitle={form.title}
            fallbackDescription={form.description}
          />
          <button
            type="submit"
            disabled={loading || videoFiles.some((file) => thumbnailByFileKey[getVideoFileKey(file)]?.loading)}
            className="admin-btn bg-[var(--admin-brand)] text-white disabled:opacity-50 sm:col-span-2"
          >
            {loading
              ? `Uploading ${uploadQueue.filter((item) => item.status === "done").length}/${uploadQueue.length || videoFiles.length}...`
              : videoFiles.length > 1
                ? `Upload ${videoFiles.length} Videos`
                : "Save Video"}
          </button>
          {uploadQueue.length ? (
            <div className="space-y-3 sm:col-span-2">
              {uploadQueue.map((item) => (
                <div key={item.id} className="rounded border border-[var(--admin-border)] p-3">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium">{item.title}</span>
                    <span className="admin-muted uppercase">{item.status}</span>
                  </div>
                  {item.status === "uploading" || item.status === "done" ? (
                    <div className="admin-progress-track">
                      <div className="admin-progress-fill" style={{ width: `${item.progress}%` }} />
                    </div>
                  ) : null}
                  {item.error ? <p className="mt-1 text-xs text-red-600">{item.error}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
