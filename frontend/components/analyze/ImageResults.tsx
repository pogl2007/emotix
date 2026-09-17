"use client";

import AnnotatedImage from "@/components/analyze/AnnotatedImage";
import FaceResult from "@/components/analyze/FaceResult";
import CornerBrackets from "@/components/ui/CornerBrackets";
import { emotionColor } from "@/lib/emotions";
import type { ImageAnalysis } from "@/lib/types";

interface Props {
  analysis: ImageAnalysis;
  previewUrl?: string;
}

export default function ImageResults({ analysis, previewUrl }: Props) {
  const color = analysis.dominant_emotion
    ? emotionColor(analysis.dominant_emotion)
    : "#dc2626";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="label">результат анализа</p>
          <p className="mono mt-1 text-[13px] text-text">
            Найдено лиц:{" "}
            <span style={{ color }}>{analysis.faces_detected}</span>
          </p>
        </div>
        <p className="mono text-[10px] uppercase tracking-[0.14em] text-dim">
          {analysis.detector} · {analysis.processing_ms} ms ·{" "}
          {analysis.image_size.width}×{analysis.image_size.height}
        </p>
      </div>

      {previewUrl && (
        <div className="relative border border-line bg-surface">
          <AnnotatedImage src={previewUrl} faces={analysis.results} />
          <CornerBrackets size={20} inset={8} />
        </div>
      )}

      {analysis.faces_detected === 0 ? (
        <p className="mono border border-accent bg-accentSubtle px-4 py-3 text-[12px] text-accentHover">
          Лиц в кадре не найдено. Попробуй фото, где лицо крупнее и лучше освещено.
        </p>
      ) : (
        <div className="space-y-4">
          {analysis.results.map((face, index) => (
            <FaceResult key={face.face_id} face={face} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
