export const EMOTIONS = [
  "angry",
  "disgust",
  "fear",
  "happy",
  "neutral",
  "sad",
  "surprise",
] as const;

export type Emotion = (typeof EMOTIONS)[number];

export const EMOTION_COLORS: Record<Emotion, string> = {
  angry: "#dc2626",
  disgust: "#84cc16",
  fear: "#8b5cf6",
  happy: "#22c55e",
  neutral: "#94a3b8",
  sad: "#3b82f6",
  surprise: "#f59e0b",
};

export const EMOTION_LABELS_RU: Record<Emotion, string> = {
  angry: "Злость",
  disgust: "Отвращение",
  fear: "Страх",
  happy: "Радость",
  neutral: "Нейтрально",
  sad: "Грусть",
  surprise: "Удивление",
};

export const EMOTION_GLYPHS: Record<Emotion, string> = {
  angry: "▲",
  disgust: "◆",
  fear: "◐",
  happy: "●",
  neutral: "■",
  sad: "▼",
  surprise: "✦",
};

export function emotionColor(emotion: string): string {
  return EMOTION_COLORS[emotion as Emotion] ?? "#94a3b8";
}

export function emotionLabel(emotion: string): string {
  return EMOTION_LABELS_RU[emotion as Emotion] ?? emotion;
}

export function emotionGlyph(emotion: string): string {
  return EMOTION_GLYPHS[emotion as Emotion] ?? "■";
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatTimecode(seconds: number): string {
  const total = Math.round(seconds);
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Точность по классам на тестовой выборке FER-2013 (7 178 изображений).
 * Источник — trainer/results/metrics.json, модель 96x96 с TTA.
 */
export const EMOTION_ACCURACY: Record<Emotion, number> = {
  angry: 0.6315,
  disgust: 0.6937,
  fear: 0.5,
  happy: 0.8444,
  neutral: 0.7121,
  sad: 0.579,
  surprise: 0.846,
};

/** Короткое описание мимических признаков класса — подпись в карточке. */
export const EMOTION_CUES: Record<Emotion, string> = {
  angry: "Брови сведены, челюсть напряжена",
  disgust: "Сморщен нос, поднята верхняя губа",
  fear: "Глаза расширены, брови сведены вверх",
  happy: "Подняты щёки, морщинки у глаз",
  neutral: "Лицо расслаблено, прямой взгляд",
  sad: "Внутренние края бровей вверх, уголки рта вниз",
  surprise: "Брови дугой, челюсть опущена",
};

/** Путь к портрету класса в /public. */
export function emotionPhoto(emotion: string): string {
  return `/emotions/${emotion}.jpg`;
}

export function emotionAccuracy(emotion: string): number {
  return EMOTION_ACCURACY[emotion as Emotion] ?? 0;
}
