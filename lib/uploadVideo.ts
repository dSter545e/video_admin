import { BACKEND_URL, getAdminToken } from "./config";

/** No browser timeout by default; 2h cap for very slow connections. */
const UPLOAD_XHR_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_UPLOAD_TIMEOUT_MS || 2 * 60 * 60 * 1000);

const buildConnectionLostMessage = () => {
  const parts = [
    "Connection lost while uploading (browser got no response from the API).",
    `API URL: ${BACKEND_URL}`,
  ];

  if (typeof window !== "undefined") {
    const pageIsHttps = window.location.protocol === "https:";
    const apiIsHttp = BACKEND_URL.startsWith("http://");
    if (pageIsHttps && apiIsHttp) {
      parts.push("Mixed content: admin is HTTPS but NEXT_PUBLIC_API_URL is HTTP — use https:// for the API.");
    }
    parts.push(`Admin origin: ${window.location.origin}`);
  }

  parts.push(
    "Checklist:",
    "1) Backend running and reachable at the API URL above",
    "2) CORS_ORIGINS (or CORS_ORIGIN_SUFFIX) on the backend includes your admin origin",
    "3) nginx/Caddy: client_max_body_size 1024m; proxy_read_timeout 3600s; proxy_request_buffering off",
    "4) Cloudflare: do not proxy large uploads (use DNS-only / grey cloud for api.*) — free plan ~100MB limit",
    "5) UPLOAD_REQUEST_TIMEOUT_MS=0 on the backend, then restart",
    "Test: open GET /api/health/upload in the browser — corsAllowed should be true"
  );

  return parts.join(" ");
};

const parseXhrUploadError = (xhr: XMLHttpRequest) => {
  if (xhr.status === 413) {
    return "Video file is too large for the server limit.";
  }
  if (xhr.status === 408) {
    return "Upload timed out on the server. Try again with a stable connection.";
  }
  if (xhr.status === 0) {
    return buildConnectionLostMessage();
  }
  try {
    const data = JSON.parse(xhr.responseText || "{}") as { error?: string };
    if (data.error) return data.error;
  } catch {
    // ignore parse errors
  }
  return `Upload failed (HTTP ${xhr.status})`;
};

export const checkUploadApiReachable = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health/upload`, {
      method: "GET",
    });
    const data = (await response.json()) as {
      ok?: boolean;
      corsAllowed?: boolean;
      maxFileMb?: number;
      requestOrigin?: string | null;
    };
    if (!response.ok) {
      return { ok: false, message: `API health check failed (HTTP ${response.status})` };
    }
    if (data.corsAllowed === false) {
      return {
        ok: false,
        message: `CORS blocked for admin origin "${data.requestOrigin || "unknown"}". Add it to backend CORS_ORIGINS or CORS_ORIGIN_SUFFIX.`,
      };
    }
    return {
      ok: true,
      message: `API reachable (max upload ${data.maxFileMb ?? "?"}MB)`,
    };
  } catch {
    return {
      ok: false,
      message: `Cannot reach API at ${BACKEND_URL}. Check NEXT_PUBLIC_API_URL and that the backend is running.`,
    };
  }
};

type UploadVideoFormOptions = {
  formData: FormData;
  onUploadProgress?: (percent: number) => void;
};

export const postVideoUploadForm = async ({ formData, onUploadProgress }: UploadVideoFormOptions) => {
  const preflight = await checkUploadApiReachable();
  if (!preflight.ok) {
    throw new Error(preflight.message);
  }

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BACKEND_URL}/api/videos/process-upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${getAdminToken()}`);
    xhr.timeout = UPLOAD_XHR_TIMEOUT_MS;

    xhr.upload.onprogress = (event) => {
      if (!onUploadProgress || !event.lengthComputable) return;
      const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
      onUploadProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onUploadProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(parseXhrUploadError(xhr)));
    };

    xhr.onerror = () => {
      reject(new Error(parseXhrUploadError(xhr)));
    };

    xhr.ontimeout = () => {
      reject(
        new Error(
          "Upload took too long and was cancelled by the browser. Use a faster connection or increase NEXT_PUBLIC_UPLOAD_TIMEOUT_MS."
        )
      );
    };

    xhr.onabort = () => {
      reject(new Error("Upload was cancelled."));
    };

    xhr.send(formData);
  });
};
