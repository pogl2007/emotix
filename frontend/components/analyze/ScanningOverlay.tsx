"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import CornerBrackets from "@/components/ui/CornerBrackets";
import ScanLine from "@/components/ui/ScanLine";

const STAGES = [
  "Детектируем лица...",
  "Анализируем эмоции...",
  "Формируем результат...",
];

interface Props {
  active: boolean;
  stageMs?: number;
}

/** Красная сканирующая линия + бегущий текст прогресса поверх превью. */
export default function ScanningOverlay({ active, stageMs = 1400 }: Props) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!active) {
      setStage(0);
      return;
    }
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, STAGES.length - 1));
    }, stageMs);
    return () => window.clearInterval(timer);
  }, [active, stageMs]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="absolute inset-0 z-10 bg-bg/45 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ScanLine duration={1.8} />
          <CornerBrackets size={26} inset={10} />

          <div className="absolute inset-x-0 bottom-0 border-t border-accent/40 bg-bg/90 px-4 py-3">
            <p className="mono flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-accent">
              <span className="inline-block h-[6px] w-[6px] animate-blink bg-accent" />
              {STAGES[stage]}
            </p>
            <div className="mt-2 h-[2px] w-full bg-line">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: "8%" }}
                animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
