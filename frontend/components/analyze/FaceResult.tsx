"use client";

import { motion } from "framer-motion";

import EmotionBars from "@/components/analyze/EmotionBars";
import CornerBrackets from "@/components/ui/CornerBrackets";
import { emotionColor, emotionLabel, formatPercent } from "@/lib/emotions";
import type { FaceResult as FaceResultData } from "@/lib/types";

interface Props {
  face: FaceResultData;
  index: number;
}

export default function FaceResult({ face, index }: Props) {
  const color = emotionColor(face.emotion);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="card relative p-6"
      style={{ borderColor: `${color}55` }}
    >
      <CornerBrackets color={color} size={14} inset={-1} thickness={2} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mono text-[11px] uppercase tracking-[0.18em] text-dim">
            face_{String(face.face_id).padStart(2, "0")}
          </p>
          <p
            className="mono mt-2 text-[30px] font-bold uppercase leading-none"
            style={{ color }}
          >
            {face.emotion}
          </p>
          <p className="mt-2 text-muted">{emotionLabel(face.emotion)}</p>
        </div>

        <div className="text-right">
          <p className="label">confidence</p>
          <p className="mono mt-1 text-[26px] font-bold" style={{ color }}>
            {formatPercent(face.confidence)}
          </p>
          <p className="mono mt-1 text-[10px] uppercase tracking-[0.14em] text-dim">
            детекция {formatPercent(face.detection_confidence, 0)}
          </p>
        </div>
      </div>

      <div className="my-5 h-px w-full bg-line" />

      <EmotionBars probabilities={face.probabilities} dominant={face.emotion} />

      <p className="mono mt-5 text-[10px] uppercase tracking-[0.14em] text-dim">
        bbox {face.bbox.x},{face.bbox.y} · {face.bbox.width}×{face.bbox.height}
      </p>
    </motion.article>
  );
}
