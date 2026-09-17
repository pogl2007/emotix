"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { emotionColor, emotionLabel, formatPercent } from "@/lib/emotions";
import type { DistributionItem } from "@/lib/types";

interface Props {
  distribution: DistributionItem[];
}

/** Доля каждой эмоции за всё видео. */
export default function EmotionPie({ distribution }: Props) {
  const data = distribution.filter((item) => item.frames > 0);

  if (data.length === 0) {
    return (
      <p className="mono text-[12px] uppercase tracking-[0.14em] text-dim">
        Нет данных для распределения
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="h-[200px] w-full sm:w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="frames"
              nameKey="emotion"
              innerRadius={48}
              outerRadius={82}
              paddingAngle={2}
              stroke="#080808"
              strokeWidth={2}
            >
              {data.map((item) => (
                <Cell key={item.emotion} fill={emotionColor(item.emotion)} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex-1 space-y-2">
        {[...data]
          .sort((a, b) => b.share - a.share)
          .map((item) => {
            const color = emotionColor(item.emotion);
            return (
              <li key={item.emotion} className="flex items-center gap-3">
                <span className="h-[10px] w-[10px]" style={{ backgroundColor: color }} />
                <span className="mono flex-1 text-[12px] uppercase tracking-[0.12em]" style={{ color }}>
                  {item.emotion}
                </span>
                <span className="mono text-[12px] text-muted">
                  {formatPercent(item.share, 0)}
                </span>
                <span className="mono w-[68px] text-right text-[11px] text-dim">
                  {item.frames} кадр.
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as DistributionItem;
  const color = emotionColor(item.emotion);

  return (
    <div className="border border-line bg-surface2 px-3 py-2">
      <p className="mono text-[13px] uppercase tracking-[0.12em]" style={{ color }}>
        {item.emotion}
      </p>
      <p className="text-[11px] text-muted">{emotionLabel(item.emotion)}</p>
      <p className="mono mt-1 text-[11px] text-dim">
        {item.frames} кадров · {formatPercent(item.share, 1)}
      </p>
    </div>
  );
}
