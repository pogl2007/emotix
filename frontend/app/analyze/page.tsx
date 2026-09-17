"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import DropZone from "@/components/analyze/DropZone";
import ImageResults from "@/components/analyze/ImageResults";
import ScanningOverlay from "@/components/analyze/ScanningOverlay";
import VideoResults from "@/components/analyze/VideoResults";
import CornerBrackets from "@/components/ui/CornerBrackets";
import GridBackground from "@/components/ui/GridBackground";
import { ApiError, analyzeImage, analyzeVideo, fileKind } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatBytes, formatTimecode } from "@/lib/emotions";
import { saveAnalysis } from "@/lib/history";
import type { AnalysisKind, ImageAnalysis, VideoAnalysis } from "@/lib/types";

export default function AnalyzePage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<AnalysisKind | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<ImageAnalysis | null>(null);
  const [videoResult, setVideoResult] = useState<VideoAnalysis | null>(null);
  const [pasted, setPasted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = useCallback(() => {
    setImageResult(null);
    setVideoResult(null);
    setError(null);
    setVideoDuration(null);
  }, []);

  const handleFile = useCallback(
    (next: File) => {
      const nextKind = fileKind(next);
      if (!nextKind) return;

      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(next);
      });
      setFile(next);
      setKind(nextKind);
      reset();
    },
    [reset],
  );

  // Ctrl+V: картинка из буфера обмена (скриншот, копия из браузера или проводника)
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (busy) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.kind !== "file") continue;
        const blob = item.getAsFile();
        if (!blob || !fileKind(blob)) continue;

        event.preventDefault();
        // У скриншота из буфера имя обычно "image.png" или вовсе пустое —
        // даём своё, чтобы в истории было понятно, откуда файл
        const named = blob.name && blob.name !== "image.png"
          ? blob
          : new File([blob], `clipboard-${Date.now()}.png`, { type: blob.type });

        handleFile(named);
        setPasted(true);
        window.setTimeout(() => setPasted(false), 1600);
        return;
      }
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [busy, handleFile]);

  const clearFile = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setFile(null);
    setKind(null);
    reset();
  }, [reset]);

  async function runAnalysis() {
    if (!file || !kind) return;
    setBusy(true);
    reset();

    try {
      if (kind === "image") {
        const result = await analyzeImage(file);
        setImageResult(result);
        if (user) saveAnalysis(user.id, "image", file.name, result);
      } else {
        const result = await analyzeVideo(file);
        setVideoResult(result);
        if (user) saveAnalysis(user.id, "video", file.name, result);
      }
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Неизвестная ошибка анализа",
      );
    } finally {
      setBusy(false);
    }
  }

  const hasResult = Boolean(imageResult || videoResult);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      <GridBackground />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-10 lg:grid-cols-2">
        {/* ЛЕВАЯ ЗОНА — загрузка */}
        <section className="space-y-6">
          <header>
            <p className="label">шаг 01</p>
            <h1 className="mt-2 text-[28px] font-bold">Загрузка</h1>
          </header>

          {!file ? (
            <DropZone onFile={handleFile} disabled={busy} />
          ) : (
            <div className="space-y-4">
              <div className="relative border border-line bg-surface">
                {kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl ?? ""}
                    alt="Превью загруженного файла"
                    className="block max-h-[420px] w-full object-contain"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={previewUrl ?? ""}
                    className="block max-h-[420px] w-full object-contain"
                    controls
                    onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                  />
                )}
                <CornerBrackets size={22} inset={10} />
                <ScanningOverlay active={busy} />
              </div>

              <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="mono truncate text-[12px] text-text">{file.name}</p>
                  <p className="mono mt-1 text-[10px] uppercase tracking-[0.14em] text-dim">
                    {kind === "image" ? "изображение" : "видео"} · {formatBytes(file.size)}
                    {videoDuration ? ` · ${formatTimecode(videoDuration)}` : ""}
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  disabled={busy}
                  className="mono text-[11px] uppercase tracking-[0.14em] text-dim hover:text-accent disabled:opacity-40"
                >
                  сбросить
                </button>
              </div>

              <button onClick={runAnalysis} disabled={busy} className="btn-primary w-full">
                {busy
                  ? "[ АНАЛИЗ... ]"
                  : kind === "image"
                    ? "[ АНАЛИЗИРОВАТЬ ]"
                    : "[ АНАЛИЗИРОВАТЬ ВИДЕО ]"}
              </button>

              {kind === "video" && (
                <p className="mono text-[10px] uppercase tracking-[0.14em] text-dim">
                  видео разбирается по каждому 10-му кадру — это занимает время
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="relative border border-accent bg-accentSubtle p-4">
              <CornerBrackets size={12} inset={-1} />
              <p className="mono text-[12px] leading-relaxed text-accentHover">{error}</p>
            </div>
          )}

          {pasted && (
            <p className="mono border border-accent bg-accentSubtle px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-accentHover">
              ◈ вставлено из буфера обмена
            </p>
          )}

          {!user && (
            <p className="mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-dim">
              войди в аккаунт, чтобы анализы сохранялись в историю
            </p>
          )}
        </section>

        {/* ПРАВАЯ ЗОНА — результаты */}
        <section className="lg:border-l lg:border-line lg:pl-8">
          <header className="mb-6">
            <p className="label">шаг 02</p>
            <h2 className="mt-2 text-[28px] font-bold">Результаты</h2>
          </header>

          <AnimatePresence mode="wait">
            {busy ? (
              <motion.div
                key="busy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card flex min-h-[300px] flex-col items-center justify-center gap-3 p-8"
              >
                <span className="mono text-[12px] uppercase tracking-[0.18em] text-accent">
                  Обработка...
                </span>
                <span className="mono text-[11px] text-dim">
                  модель считает вероятности семи классов
                </span>
              </motion.div>
            ) : hasResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {imageResult && previewUrl && (
                  <ImageResults analysis={imageResult} previewUrl={previewUrl} />
                )}
                {videoResult && <VideoResults analysis={videoResult} />}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card relative flex min-h-[300px] items-center justify-center p-8"
              >
                <CornerBrackets size={16} inset={10} color="#2a2a2a" />
                <p className="mono text-[13px] uppercase tracking-[0.16em] text-dim">
                  Загрузи файл для анализа
                  <span className="ml-1 inline-block h-[14px] w-[8px] translate-y-[2px] animate-blink bg-accent" />
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
