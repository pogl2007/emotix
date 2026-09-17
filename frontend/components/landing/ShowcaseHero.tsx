"use client";

import Link from "next/link";
import { useState } from "react";

import HeroMedia from "@/components/landing/HeroMedia";
import CornerBrackets from "@/components/ui/CornerBrackets";
import GridBackground from "@/components/ui/GridBackground";
import ScanLine from "@/components/ui/ScanLine";
import {
  EMOTIONS,
  emotionAccuracy,
  emotionColor,
  emotionLabel,
  emotionPhoto,
  formatPercent,
} from "@/lib/emotions";

const SPECS = [
  { label: "модель", value: "ResNet-18" },
  { label: "вход", value: "96 × 96" },
  { label: "классы", value: "7" },
  { label: "датасет", value: "FER-2013" },
];

/**
 * Герой-витрина: тёмная карточка во всю ширину, слева типографика и
 * спецификации, справа портрет со сканером и лентой из семи классов.
 */
export default function ShowcaseHero() {
  // null — показываем основной кадр, иначе портрет наведённого класса
  const [active, setActive] = useState<string | null>(null);

  const photo = active ? emotionPhoto(active) : "/hero.jpg";
  const badgeEmotion = active ?? "happy";
  const badgeValue = active ? emotionAccuracy(active) : 0.942;
  const badgeColor = emotionColor(badgeEmotion);

  return (
    <section className="relative overflow-hidden px-4 pb-6 pt-4 sm:px-6">
      <GridBackground />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[640px] w-[640px] -translate-x-1/2"
        style={{
          background: "radial-gradient(circle, rgba(220,38,38,0.14), transparent 65%)",
        }}
        aria-hidden
      />

      <div className="animate-heroIn relative border border-line bg-surface/70 backdrop-blur-sm">
        <CornerBrackets size={26} inset={-1} />

        <div className="grid grid-cols-1 gap-10 p-7 sm:p-10 lg:grid-cols-[1fr_minmax(320px,46%)] lg:gap-12">
          {/* Левая колонка — текст и спецификации */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="mono text-[11px] uppercase tracking-[0.24em] text-dim">
                [ EMOTIX ] — [ SYSTEM 01 ] — [ EMOTION AI ]
              </p>

              <h1 className="mt-8 text-[44px] font-bold leading-[0.95] tracking-tight sm:text-[64px] xl:text-[76px]">
                ЧИТАЕМ
                <br />
                ЭМОЦИИ
                <span className="text-accent">.</span>
                <br />
                <span className="text-accent">МГНОВЕННО</span>
              </h1>

              <dl className="mt-10 grid max-w-md grid-cols-[80px_1fr] gap-x-6 gap-y-3 border-t border-line pt-6">
                {SPECS.map((spec) => (
                  <div key={spec.label} className="contents">
                    <dt className="mono text-[10px] uppercase tracking-[0.18em] text-dim">
                      {spec.label}
                    </dt>
                    <dd className="mono text-[12px] tracking-[0.08em] text-text">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-10 flex items-center gap-6">
              <Link
                href="/analyze"
                className="group flex h-16 w-16 shrink-0 items-center justify-center border border-accent bg-accentSubtle text-accent hover:bg-accent hover:text-black hover:shadow-glowStrong"
                aria-label="Начать анализ"
              >
                <span className="mono text-[20px] leading-none">↗</span>
              </Link>

              <div>
                <p className="mono text-[10px] uppercase tracking-[0.18em] text-dim">
                  точность модели
                </p>
                <p className="mono text-[30px] font-bold leading-none text-text">
                  69<span className="text-accent">.6</span>%
                </p>
              </div>

              <Link href="/analyze" className="btn-primary hidden sm:inline-flex">
                [ НАЧАТЬ АНАЛИЗ ]
              </Link>
            </div>
          </div>

          {/* Правая колонка — портрет и лента классов */}
          <div>
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-line bg-bg">
              {/* Основной кадр висит всегда и не размонтируется — иначе при
                  каждом уходе с миниатюры мелькала бы SVG-заглушка.
                  HeroMedia сам подхватит hero.mp4, если положить его в /public */}
              <HeroMedia />

              {active && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo}
                  src={photo}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <CornerBrackets size={28} inset={14} />
              <ScanLine />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-line bg-bg/85 px-4 py-3 backdrop-blur">
                <span className="mono text-[10px] uppercase tracking-[0.18em] text-dim">
                  face_01 · detected
                </span>
                <span
                  className="mono border px-3 py-1 text-[11px] uppercase tracking-[0.14em]"
                  style={{
                    color: badgeColor,
                    borderColor: badgeColor,
                    backgroundColor: `${badgeColor}14`,
                  }}
                >
                  {badgeEmotion} {formatPercent(badgeValue)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-dim">
                01 —— 07
              </p>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-dim">
                {active ? emotionLabel(active) : "наведи на класс"}
              </p>
            </div>

            <ul className="mt-3 grid grid-cols-7 gap-2">
              {EMOTIONS.map((emotion) => {
                const color = emotionColor(emotion);
                const on = active === emotion;
                return (
                  <li key={emotion}>
                    <button
                      onMouseEnter={() => setActive(emotion)}
                      onFocus={() => setActive(emotion)}
                      onMouseLeave={() => setActive(null)}
                      onBlur={() => setActive(null)}
                      className="relative block aspect-[3/4] w-full overflow-hidden border bg-bg"
                      style={{
                        borderColor: on ? color : "#2a2a2a",
                        boxShadow: on ? `0 0 18px ${color}40` : undefined,
                      }}
                      aria-label={`${emotion} — ${emotionLabel(emotion)}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={emotionPhoto(emotion)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                        style={{ opacity: on ? 1 : 0.45 }}
                      />
                      <span
                        className="absolute inset-x-0 bottom-0 h-[3px]"
                        style={{ backgroundColor: color, opacity: on ? 1 : 0.5 }}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
