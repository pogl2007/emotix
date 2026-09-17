"use client";

import { motion } from "framer-motion";

import { EMOTIONS, emotionColor, formatPercent } from "@/lib/emotions";

interface Props {
  probabilities: Record<string, number>;
  dominant?: string;
  compact?: boolean;
}

/** Горизонтальные бары вероятностей по всем семи классам. */
export default function EmotionBars({ probabilities, dominant, compact = false }: Props) {
  const ordered = [...EMOTIONS].sort(
    (a, b) => (probabilities[b] ?? 0) - (probabilities[a] ?? 0),
  );

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {ordered.map((emotion, index) => {
        const value = probabilities[emotion] ?? 0;
        const color = emotionColor(emotion);
        const active = emotion === dominant;

        return (
          <div key={emotion} className="flex items-center gap-3">
            <span
              className="mono w-[72px] shrink-0 text-[11px] uppercase tracking-[0.1em]"
              style={{ color: active ? color : "#a1a1aa" }}
            >
              {emotion}
            </span>

            <div className="relative h-[10px] flex-1 overflow-hidden bg-surface3">
              <motion.div
                className="h-full"
                style={{
                  backgroundColor: color,
                  boxShadow: active ? `0 0 12px ${color}88` : undefined,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(value * 100, 0.5)}%` }}
                transition={{ duration: 0.5, delay: index * 0.04, ease: "easeOut" }}
              />
            </div>

            <span
              className="mono w-[52px] shrink-0 text-right text-[11px]"
              style={{ color: active ? color : "#52525b" }}
            >
              {formatPercent(value)}
            </span>

            <span className="mono w-3 shrink-0 text-[11px] text-accent">
              {active ? "←" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
