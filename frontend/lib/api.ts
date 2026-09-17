import type { ImageAnalysis, ModelInfo, VideoAnalysis } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "webm"];

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function post<T>(path: string, file: File): Promise<T> {
  const body = new FormData();
  body.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { method: "POST", body });
  } catch {
    throw new ApiError(
      `Бэкенд недоступен по адресу ${API_URL}. Запусти его: uvicorn main:app`,
      0,
    );
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((data) => data?.detail)
      .catch(() => null);
    throw new ApiError(detail ?? `Ошибка запроса (${response.status})`, response.status);
  }

  return (await response.json()) as T;
}

export function analyzeImage(file: File) {
  return post<ImageAnalysis>("/analyze/image", file);
}

export function analyzeVideo(file: File) {
  return post<VideoAnalysis>("/analyze/video", file);
}

export async function fetchModelInfo(): Promise<ModelInfo | null> {
  try {
    const response = await fetch(`${API_URL}/model/info`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as ModelInfo;
  } catch {
    return null;
  }
}

export function fileKind(file: File): "image" | "video" | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type.startsWith("image/") || IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (file.type.startsWith("video/") || VIDEO_EXTENSIONS.includes(ext)) return "video";
  return null;
}
