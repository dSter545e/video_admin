import { BACKEND_URL, getAdminToken } from "./config";

/** No browser timeout by default; 2h cap for very slow connections. */
const UPLOAD_XHR_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_UPLOAD_TIMEOUT_MS || 2 * 60 * 60 * 1000);

const parseXhrUploadError = (xhr: XMLHttpRequest) => {
  if (xhr.status === 413) {
    return "Video file is too large for the server limit.";
  }
  if (xhr.status === 408) {
    return "Upload timed out on the server. Try again with a stable connection.";
  }
  if (xhr.status === 0) {
    return (
      "Connection lost while uploading. Ensure the API is running, CORS allows your admin URL, " +
      "and any reverse proxy (nginx/Cloudflare) allows bodies of 50MB or more. Then restart the backend."
    );
  }
  try {
    const data = JSON.parse(xhr.responseText || "{}") as { error?: string };
    if (data.error) return data.error;
  } catch {
    // ignore parse errors
  }
  return `Upload failed (HTTP ${xhr.status})`;
};

type UploadVideoFormOptions = {
  formData: FormData;
  onUploadProgress?: (percent: number) => void;
};

export const postVideoUploadForm = ({ formData, onUploadProgress }: UploadVideoFormOptions) =>
  new Promise<void>((resolve, reject) => {
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
