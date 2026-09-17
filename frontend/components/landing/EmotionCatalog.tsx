"use client";

import Link from "next/link";
import { useState } from "react";

import CornerBrackets from "@/components/ui/CornerBrackets";
import ScanLine from "@/components/ui/ScanLine";
import {
  EMOTIONS,
  EMOTION_CUES,
  emotionAccuracy,
  emotionColor,
  emotionLabel,
  emotionPhoto,
  formatPercent,
  type Emotion,
} from "@/lib/emotions";

/**
 * Каталог классов: большая карточка-призыв плюс сетка из семи портретов.
 * Наведение запускает сканирующую линию — тот же жест, что и в анализе.
 */
export default function EmotionCatalog() {
  const sorted = [...EMOTIONS].sort(
    (a, b) => emotionAccuracy(b) - emotionAccuracy(a),
  );

  return (
    <section id="emotions" className="px-4 pb-6 sm:px-6">
      <div className="border border-line bg-surface/70 p-7 sm:p-10">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
          <h2 className="text-[32px] font-bold leading-none sm:text-[44px]">
            КАТАЛОГ ЭМОЦИЙ
          </h2>

          <div className="mono flex flex-wrap gap-x-6 gap-y-1 text-[10px] uppercase tracking-[0.16em] text-dim">
            <span>[ 7 классов ]</span>
            <span>[ 35 887 изображений ]</span>
            <span>[ точность по тесту FER-2013 ]</span>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <FeatureCard />
          {sorted.slice(0, 2).map((emotion) => (
            <EmotionCard key={emotion} emotion={emotion} />
          ))}
          {sorted.slice(2).map((emotion) => (
            <EmotionCard key={emotion} emotion={emotion} />
          ))}
          <SummaryTile />
        </div>

        <p className="mono mt-6 border-t border-line pt-5 text-[10px] uppercase leading-relaxed tracking-[0.14em] text-dim">
          проценты — доля верных ответов на тестовой выборке FER-2013,
          а не оценка конкретного снимка
        </p>
      </div>
    </section>
  );
}

/** Большая карточка на два столбца — ведёт на анализ. */
function FeatureCard() {
  return (
    <Link
      href="/analyze"
      className="group relative col-span-2 row-span-1 overflow-hidden border border-line bg-bg lg:row-span-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/feature.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
        // Лицо в кадре справа — держим его в правой части карточки,
        // иначе оно наползает на заголовок
        style={{ objectPosition: "78% 40%" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, #080808 12%, rgba(8,8,8,0.75) 42%, transparent 72%)",
        }}
      />

      <div className="relative flex h-full min-h-[280px] flex-col justify-between p-6 sm:p-8">
        <div>
          <span className="mono border border-accent bg-accentSubtle px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
            ◈ твоё лицо
          </span>
          <h3 className="mt-6 max-w-[10ch] text-[30px] font-bold leading-[0.95] sm:text-[40px]">
            ЗАГРУЗИ
            <br />
            СВОЙ КАДР
          </h3>
          <p className="mt-4 max-w-[26ch] leading-relaxed text-muted">
            Фото или видео. Модель разложит лицо на семь вероятностей
            и покажет каждую.
          </p>
        </div>

        <span className="mono mt-8 inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.16em] text-accent">
          [ начать анализ ]
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>

      <CornerBrackets size={18} inset={10} />
    </Link>
  );
}

function EmotionCard({ emotion }: { emotion: Emotion }) {
  const [hover, setHover] = useState(false);
  const color = emotionColor(emotion);
  const accuracy = emotionAccuracy(emotion);

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative overflow-hidden border bg-bg"
      style={{
        borderColor: hover ? color : "#2a2a2a",
        boxShadow: hover ? `0 0 28px ${color}33` : undefined,
      }}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={emotionPhoto(emotion)}
          alt={`Эмоция ${emotionLabel(emotion)}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <ScanLine color={color} active={hover} duration={1.6} />
        {hover && <CornerBrackets color={color} size={16} inset={8} />}

        <span
          className="mono absolute left-3 top-3 border px-2 py-[3px] text-[10px] uppercase tracking-[0.14em]"
          style={{
            color,
            borderColor: hover ? color : "transparent",
            backgroundColor: hover ? `${color}1a` : "rgba(8,8,8,0.6)",
          }}
        >
          {emotion}
        </span>
      </div>

      <div className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13px] text-text">
            <span
              className="inline-block h-[8px] w-[8px] shrink-0"
              style={{ backgroundColor: color }}
            />
            {emotionLabel(emotion)}
          </span>
          <span className="mono text-[12px]" style={{ color }}>
            {formatPercent(accuracy, 1)}
          </span>
        </div>

        <p className="mono mt-2 text-[10px] uppercase leading-relaxed tracking-[0.1em] text-dim">
          {EMOTION_CUES[emotion]}
        </p>

        <div className="mt-3 h-[3px] w-full bg-surface3">
          <span
            className="block h-full transition-all duration-500"
            style={{ width: `${accuracy * 100}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </article>
  );
}

/** Замыкающая плитка сетки — сводка по всем семи классам. */
function SummaryTile() {
  return (
    <div className="flex flex-col justify-between border border-line bg-bg p-6">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.18em] text-dim">
          все классы
        </p>
        <p className="mono mt-4 text-[44px] font-bold leading-none text-text">
          69<span className="text-accent">.6</span>
          <span className="text-[24px]">%</span>
        </p>
        <p className="mono mt-2 text-[10px] uppercase leading-relaxed tracking-[0.14em] text-dim">
          7 178 тестовых изображений
        </p>
      </div>

      <ul className="mt-6 space-y-[6px]">
        {EMOTIONS.map((emotion) => (
          <li key={emotion} className="flex items-center gap-2">
            <span
              className="block h-[4px] shrink-0"
              style={{
                width: `${emotionAccuracy(emotion) * 100}%`,
                backgroundColor: emotionColor(emotion),
              }}
            />
          </li>
        ))}
      </ul>

      <p className="mono mt-6 text-[10px] uppercase tracking-[0.14em] text-dim">
        человек на этом датасете — ~65%
      </p>
    </div>
  );
}
