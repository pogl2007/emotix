"use client";

import { useEffect, useState } from "react";

/**
 * Картинка или анимация в hero.
 *
 * Порядок поиска — что первым найдётся в /public, то и покажем:
 *   hero.mp4            → видео (autoplay, muted, loop)
 *   hero.jpg / hero.png → картинка
 *   ничего нет          → SVG-заглушка с точками лицевых ориентиров
 *
 * Ничего настраивать не нужно: положил файл в frontend/public — он подхватился.
 */

// Держим список коротким: каждый кандидат — это лишний 404 в консоли,
// пока файла нет. Другое расширение просто переименуй в одно из этих.
const VIDEO_SOURCES = ["/hero.mp4"];
const IMAGE_SOURCES = ["/hero.jpg", "/hero.png"];

type Media =
  | { kind: "video"; src: string }
  | { kind: "image"; src: string }
  | { kind: "fallback" };

async function exists(src: string): Promise<boolean> {
  try {
    const res = await fetch(src, { method: "HEAD" });
    // dev-сервер Next на несуществующий файл отдаёт HTML-страницу 404,
    // поэтому проверяем ещё и content-type
    const type = res.headers.get("content-type") ?? "";
    return res.ok && !type.includes("text/html");
  } catch {
    return false;
  }
}

// Что нашлось в прошлый раз. Поиск идёт один раз за загрузку страницы,
// повторные монтирования берут готовый результат и не мигают заглушкой.
let resolved: Media | null = null;

export default function HeroMedia() {
  const [media, setMedia] = useState<Media>(resolved ?? { kind: "fallback" });

  useEffect(() => {
    if (resolved) return;
    let cancelled = false;

    (async () => {
      for (const src of VIDEO_SOURCES) {
        if (await exists(src)) {
          resolved = { kind: "video", src };
          if (!cancelled) setMedia(resolved);
          return;
        }
      }
      for (const src of IMAGE_SOURCES) {
        if (await exists(src)) {
          resolved = { kind: "image", src };
          if (!cancelled) setMedia(resolved);
          return;
        }
      }
      // Ничего не нашлось — запоминаем и это, чтобы не проверять снова
      resolved = { kind: "fallback" };
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (media.kind === "video") {
    return (
      <video
        src={media.src}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
    );
  }

  if (media.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
    );
  }

  return <FaceSilhouette />;
}

/** SVG-заглушка лица под сканирующей линией. */
function FaceSilhouette() {
  return (
    <svg
      viewBox="0 0 200 250"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="faceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#111111" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="118" rx="52" ry="66" fill="url(#faceFill)" stroke="#2a2a2a" />
      <ellipse cx="100" cy="215" rx="72" ry="46" fill="#111111" stroke="#2a2a2a" />

      {/* Точки лицевых ориентиров — как в биометрическом сканере */}
      <g fill="#dc2626" opacity="0.85">
        {[
          [82, 105], [118, 105], [100, 125], [86, 148], [114, 148], [100, 152],
          [70, 92], [130, 92], [100, 62], [78, 168], [122, 168],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" />
        ))}
      </g>
      <g stroke="#dc2626" strokeWidth="0.5" opacity="0.35" fill="none">
        <path d="M70 92 L82 105 L118 105 L130 92" />
        <path d="M82 105 L100 125 L118 105" />
        <path d="M78 168 L100 152 L122 168" />
        <path d="M100 62 L100 125 L100 152" />
      </g>

      <ellipse cx="86" cy="106" rx="9" ry="5" fill="#080808" stroke="#2a2a2a" strokeWidth="0.7" />
      <ellipse cx="114" cy="106" rx="9" ry="5" fill="#080808" stroke="#2a2a2a" strokeWidth="0.7" />
      <path d="M84 152 Q100 166 116 152" stroke="#2a2a2a" strokeWidth="1.4" fill="none" />
    </svg>
  );
}
