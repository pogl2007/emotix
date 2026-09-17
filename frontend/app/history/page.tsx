"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import ImageResults from "@/components/analyze/ImageResults";
import VideoResults from "@/components/analyze/VideoResults";
import AuthDialog from "@/components/ui/AuthDialog";
import CornerBrackets from "@/components/ui/CornerBrackets";
import EmotionBadge from "@/components/ui/EmotionBadge";
import GridBackground from "@/components/ui/GridBackground";
import { useAuth } from "@/lib/auth";
import { clearHistory, loadHistory, removeEntry } from "@/lib/history";
import type { HistoryEntry, ImageAnalysis, VideoAnalysis } from "@/lib/types";

export default function HistoryPage() {
  const { user, ready } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState<HistoryEntry | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (user) setEntries(loadHistory(user.id));
    else setEntries([]);
  }, [user]);

  if (!ready) return null;

  if (!user) {
    return (
      <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-5">
        <GridBackground />
        <div className="card relative max-w-md p-10 text-center">
          <CornerBrackets size={16} inset={-1} />
          <p className="label">история анализов</p>
          <h1 className="mt-3 text-[26px] font-bold">Нужен аккаунт</h1>
          <p className="mt-3 leading-relaxed text-muted">
            История хранится локально в этом браузере и привязана к аккаунту.
            Сам анализ работает и без входа.
          </p>
          <button onClick={() => setAuthOpen(true)} className="btn-primary mt-7 w-full">
            [ ВОЙТИ ]
          </button>
        </div>
        <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      <GridBackground />

      <div className="relative mx-auto max-w-5xl px-5 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="label">архив</p>
            <h1 className="mt-2 text-[28px] font-bold">История анализов</h1>
            <p className="mono mt-2 text-[11px] uppercase tracking-[0.14em] text-dim">
              {user.email} · записей: {entries.length}
            </p>
          </div>

          {entries.length > 0 && (
            <button
              onClick={() => {
                clearHistory(user.id);
                setEntries([]);
                setOpen(null);
              }}
              className="btn-ghost"
            >
              очистить
            </button>
          )}
        </header>

        {entries.length === 0 ? (
          <div className="card relative flex min-h-[240px] items-center justify-center p-10">
            <CornerBrackets size={16} inset={10} color="#2a2a2a" />
            <p className="mono text-[13px] uppercase tracking-[0.16em] text-dim">
              Здесь пока пусто
              <span className="ml-1 inline-block h-[14px] w-[8px] translate-y-[2px] animate-blink bg-accent" />
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry, index) => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="card flex flex-wrap items-center gap-4 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="mono truncate text-[13px] text-text">{entry.fileName}</p>
                  <p className="mono mt-1 text-[10px] uppercase tracking-[0.14em] text-dim">
                    {new Date(entry.createdAt).toLocaleString("ru-RU")} ·{" "}
                    {entry.kind === "image" ? "фото" : "видео"} ·{" "}
                    {entry.kind === "image"
                      ? `лиц: ${entry.facesDetected}`
                      : `кадров: ${entry.facesDetected}`}
                  </p>
                </div>

                {entry.dominantEmotion ? (
                  <EmotionBadge
                    emotion={entry.dominantEmotion}
                    confidence={entry.confidence}
                    size="sm"
                  />
                ) : (
                  <span className="mono text-[11px] uppercase tracking-[0.14em] text-dim">
                    лиц нет
                  </span>
                )}

                <button
                  onClick={() => setOpen(open?.id === entry.id ? null : entry)}
                  className="mono border border-line px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-muted hover:border-accent hover:text-text"
                >
                  {open?.id === entry.id ? "Закрыть" : "Открыть"}
                </button>

                <button
                  onClick={() => {
                    setEntries(removeEntry(user.id, entry.id));
                    if (open?.id === entry.id) setOpen(null);
                  }}
                  className="mono text-[11px] uppercase tracking-[0.14em] text-dim hover:text-accent"
                >
                  удалить
                </button>
              </motion.li>
            ))}
          </ul>
        )}

        <AnimatePresence>
          {open && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-10 border-t border-line pt-8"
            >
              <p className="label mb-6">{open.fileName}</p>
              {open.kind === "video" ? (
                <VideoResults analysis={open.payload as VideoAnalysis} />
              ) : (
                <ImageFallback analysis={open.payload as ImageAnalysis} />
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Само изображение в истории не хранится (localStorage бы переполнился),
 * поэтому показываем карточки лиц без картинки с рамками.
 */
function ImageFallback({ analysis }: { analysis: ImageAnalysis }) {
  return (
    <div>
      <p className="mono mb-5 text-[11px] uppercase tracking-[0.14em] text-dim">
        исходное изображение не сохраняется — только результаты
      </p>
      <ImageResults analysis={analysis} />
    </div>
  );
}
