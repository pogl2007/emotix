"use client";

import EmotionBars from "@/components/analyze/EmotionBars";
import EmotionPie from "@/components/analyze/EmotionPie";
import VideoTimeline from "@/components/analyze/VideoTimeline";
import EmotionBadge from "@/components/ui/EmotionBadge";
import { emotionColor, formatPercent, formatTimecode } from "@/lib/emotions";
import type { VideoAnalysis } from "@/lib/types";

interface Props {
  analysis: VideoAnalysis;
}

export default function VideoResults({ analysis }: Props) {
  // Средняя вероятность по каждому классу за всё видео
  const meanProbabilities = Object.fromEntries(
    analysis.emotion_distribution.map((item) => [item.emotion, item.mean_probability]),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="label">результат анализа видео</p>
          <p className="mono mt-1 text-[13px] text-text">
            {formatTimecode(analysis.duration_seconds)} ·{" "}
            {analysis.frames_analyzed} кадров проанализировано
          </p>
        </div>
        <p className="mono text-[10px] uppercase tracking-[0.14em] text-dim">
          каждый {analysis.frame_step}-й кадр · {analysis.fps} fps ·{" "}
          {analysis.processing_ms} ms
        </p>
      </div>

      <section className="card p-6">
        <p className="label mb-4">timeline эмоций</p>
        <VideoTimeline timeline={analysis.emotion_timeline} />
      </section>

      <section className="card p-6">
        <p className="label mb-4">распределение за всё видео</p>
        <EmotionPie distribution={analysis.emotion_distribution} />
      </section>

      <section className="card p-6">
        <p className="label mb-4">топ моментов</p>
        {analysis.dominant_emotions.length === 0 ? (
          <p className="mono text-[12px] text-dim">Пиковых моментов нет</p>
        ) : (
          <ul className="space-y-3">
            {analysis.dominant_emotions.map((moment) => (
              <li
                key={`${moment.time}-${moment.emotion}`}
                className="flex items-center gap-4 border border-line bg-bg px-4 py-3"
                style={{ borderLeft: `3px solid ${emotionColor(moment.emotion)}` }}
              >
                <span className="mono text-[16px] font-bold text-text">
                  {moment.timecode}
                </span>
                <span className="mono text-dim">—</span>
                <EmotionBadge emotion={moment.emotion} confidence={moment.confidence} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <p className="label mb-4">средняя вероятность по классам</p>
        <EmotionBars
          probabilities={meanProbabilities}
          dominant={analysis.dominant_emotion ?? undefined}
        />
        {analysis.dominant_emotion && (
          <p className="mono mt-5 text-[11px] uppercase tracking-[0.14em] text-dim">
            доминирующая эмоция:{" "}
            <span style={{ color: emotionColor(analysis.dominant_emotion) }}>
              {analysis.dominant_emotion}
            </span>{" "}
            {formatPercent(analysis.dominant_emotions[0]?.confidence ?? 0)}
          </p>
        )}
      </section>
    </div>
  );
}
