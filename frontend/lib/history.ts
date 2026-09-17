"use client";

import type { AnalysisKind, HistoryEntry, ImageAnalysis, VideoAnalysis } from "./types";

const KEY_PREFIX = "emotix:history:";
const MAX_ENTRIES = 50;

function key(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

export function loadHistory(userId: string): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(
  userId: string,
  kind: AnalysisKind,
  fileName: string,
  payload: ImageAnalysis | VideoAnalysis,
): HistoryEntry | null {
  if (typeof window === "undefined") return null;

  const confidence =
    kind === "image"
      ? (payload as ImageAnalysis).results[0]?.confidence ?? 0
      : (payload as VideoAnalysis).dominant_emotions[0]?.confidence ?? 0;

  const facesDetected =
    kind === "image"
      ? (payload as ImageAnalysis).faces_detected
      : (payload as VideoAnalysis).frames_analyzed;

  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    kind,
    fileName,
    facesDetected,
    dominantEmotion: payload.dominant_emotion,
    confidence,
    payload,
  };

  try {
    const next = [entry, ...loadHistory(userId)].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    // Хранилище переполнено или недоступно — история не критична, молчим
    return entry;
  }
  return entry;
}

export function removeEntry(userId: string, id: string): HistoryEntry[] {
  const next = loadHistory(userId).filter((entry) => entry.id !== id);
  try {
    window.localStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    /* пусто */
  }
  return next;
}

export function clearHistory(userId: string) {
  try {
    window.localStorage.removeItem(key(userId));
  } catch {
    /* пусто */
  }
}
