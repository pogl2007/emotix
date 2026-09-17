"use client";

import { emotionColor, formatPercent } from "@/lib/emotions";

interface Props {
  emotion: string;
  confidence?: number;
  size?: "sm" | "md";
  className?: string;
}

export default function EmotionBadge({
  emotion,
  confidence,
  size = "md",
  className = "",
}: Props) {
  const color = emotionColor(emotion);
  const padding = size === "sm" ? "px-2 py-[2px] text-[10px]" : "px-3 py-1 text-[11px]";

  return (
    <span
      className={`mono inline-flex items-center gap-2 border uppercase tracking-[0.14em] ${padding} ${className}`}
      style={{
        color,
        borderColor: color,
        backgroundColor: `${color}14`,
        boxShadow: `0 0 14px ${color}26`,
      }}
    >
      {emotion}
      {confidence !== undefined && (
        <span className="text-text/80">{formatPercent(confidence)}</span>
      )}
    </span>
  );
}
