"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { emotionColor, emotionLabel, formatPercent, formatTimecode } from "@/lib/emotions";
import type { TimelinePoint } from "@/lib/types";

interface Props {
  timeline: TimelinePoint[];
}

/**
 * Timeline эмоций: X — время, Y — confidence доминирующей эмоции.
 * Заливка переливается цветами эмоций по ходу видео.
 */
export default function VideoTimeline({ timeline }: Props) {
  if (timeline.length === 0) {
    return (
      <p className="mono text-[12px] uppercase tracking-[0.14em] text-dim">
        Лиц в кадрах не найдено
      </p>
    );
  }

  const data = timeline.map((point) => ({
    time: point.time,
    confidence: point.confidence,
    emotion: point.emotion,
  }));

  // Градиент по позиции: каждая точка красит свой участок в цвет эмоции
  const stops = data.map((point, index) => ({
    offset: `${(index / Math.max(data.length - 1, 1)) * 100}%`,
    color: emotionColor(point.emotion),
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="emotixStroke" x1="0" y1="0" x2="1" y2="0">
              {stops.map((stop, index) => (
                <stop key={index} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
            <linearGradient id="emotixFill" x1="0" y1="0" x2="1" y2="0">
              {stops.map((stop, index) => (
                <stop
                  key={index}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={0.28}
                />
              ))}
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#2a2a2a" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(value: number) => formatTimecode(value)}
            stroke="#52525b"
            tick={{ fontSize: 11, fontFamily: "var(--font-jetbrains-mono)" }}
            tickLine={false}
            axisLine={{ stroke: "#2a2a2a" }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
            stroke="#52525b"
            tick={{ fontSize: 11, fontFamily: "var(--font-jetbrains-mono)" }}
            tickLine={false}
            axisLine={{ stroke: "#2a2a2a" }}
          />
          <Tooltip content={<TimelineTooltip />} cursor={{ stroke: "#dc2626" }} />
          <Area
            type="monotone"
            dataKey="confidence"
            stroke="url(#emotixStroke)"
            strokeWidth={2}
            fill="url(#emotixFill)"
            dot={false}
            activeDot={{ r: 4, fill: "#dc2626", stroke: "#080808" }}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TimelineTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { time: number; confidence: number; emotion: string };
  const color = emotionColor(point.emotion);

  return (
    <div className="border border-line bg-surface2 px-3 py-2 shadow-glow">
      <p className="mono text-[11px] text-dim">{formatTimecode(point.time)}</p>
      <p className="mono mt-1 text-[13px] uppercase tracking-[0.12em]" style={{ color }}>
        {point.emotion} {formatPercent(point.confidence)}
      </p>
      <p className="text-[11px] text-muted">{emotionLabel(point.emotion)}</p>
    </div>
  );
}
