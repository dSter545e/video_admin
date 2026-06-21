export type LocalThumbnailOption = {
  seekSeconds: number;
  previewUrl: string;
  blob: Blob;
};

export const THUMBNAIL_INTERVAL_SECONDS = 60;
export const THUMBNAIL_SHORT_VIDEO_INTERVAL_SECONDS = 30;
export const THUMBNAIL_SHORT_VIDEO_THRESHOLD_SECONDS = 60;

export const buildThumbnailSeekPoints = (durationSeconds: number) => {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return [0];
  }
  const interval =
    durationSeconds < THUMBNAIL_SHORT_VIDEO_THRESHOLD_SECONDS
      ? THUMBNAIL_SHORT_VIDEO_INTERVAL_SECONDS
      : THUMBNAIL_INTERVAL_SECONDS;
  const points: number[] = [];
  for (let sec = 0; sec < durationSeconds; sec += interval) {
    points.push(Number(sec.toFixed(3)));
  }
  return points.length ? points : [0];
};

export const formatThumbnailSeekLabel = (seekSeconds: number) => {
  const mins = Math.floor(seekSeconds / 60);
  const secs = Math.floor(seekSeconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const waitForVideoEvent = (video: HTMLVideoElement, eventName: keyof HTMLMediaElementEventMap) =>
  new Promise<void>((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Could not read video file"));
    };
    const cleanup = () => {
      video.removeEventListener(eventName, onSuccess);
      video.removeEventListener("error", onError);
    };
    video.addEventListener(eventName, onSuccess, { once: true });
    video.addEventListener("error", onError, { once: true });
  });

const seekVideoTo = async (video: HTMLVideoElement, time: number) => {
  const safeTime = Math.max(0, Math.min(time, Math.max(0, video.duration - 0.05)));
  if (Math.abs(video.currentTime - safeTime) < 0.05) return;
  video.currentTime = safeTime;
  await waitForVideoEvent(video, "seeked");
};

export const extractLocalVideoThumbnailOptions = async (file: File): Promise<LocalThumbnailOption[]> => {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  try {
    await waitForVideoEvent(video, "loadedmetadata");
    const duration = video.duration;
    const seekPoints = buildThumbnailSeekPoints(duration);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare thumbnail canvas");
    }

    const options: LocalThumbnailOption[] = [];
    for (const seekSeconds of seekPoints) {
      await seekVideoTo(video, seekSeconds);
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (!result) {
              reject(new Error("Could not capture thumbnail frame"));
              return;
            }
            resolve(result);
          },
          "image/jpeg",
          0.92
        );
      });
      options.push({
        seekSeconds,
        previewUrl: URL.createObjectURL(blob),
        blob,
      });
    }
    return options;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
};

export const localThumbnailOptionToFile = (option: LocalThumbnailOption, baseName = "thumbnail") => {
  const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, "-") || "thumbnail";
  return new File([option.blob], `${safeName}-${Math.round(option.seekSeconds)}s.jpg`, {
    type: "image/jpeg",
  });
};

export const getVideoFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;
