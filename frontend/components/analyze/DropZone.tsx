"use client";

import { useCallback, useRef, useState } from "react";

import { IMAGE_EXTENSIONS, MAX_FILE_BYTES, VIDEO_EXTENSIONS, fileKind } from "@/lib/api";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const ACCEPT = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]
  .map((ext) => `.${ext}`)
  .join(",");

export default function DropZone({ onFile, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!fileKind(file)) {
        setError("Такой формат не поддерживается");
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError("Файл больше 50 MB");
        return;
      }
      setError(null);
      onFile(file);
    },
    [onFile],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) accept(e.dataTransfer.files?.[0]);
        }}
        className={`relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center border-2 border-dashed bg-bg px-8 py-12 text-center outline-none ${
          dragging
            ? "border-accent bg-accentSubtle shadow-glow"
            : "border-accent/40 hover:border-accent hover:bg-accentSubtle/40"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <UploadIcon active={dragging} />

        <p className="mt-6 text-[16px] font-bold">Перетащи фото или видео</p>
        <p className="mono mt-2 text-[11px] uppercase tracking-[0.16em] text-dim">
          кликни для выбора или вставь через ctrl+v
        </p>

        <div className="mono mt-8 space-y-1 text-[11px] uppercase tracking-[0.14em] text-dim">
          <p>jpg · png · mp4 · mov · avi</p>
          <p>макс. размер 50 MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="mono mt-3 border border-accent bg-accentSubtle px-4 py-2 text-[12px] text-accentHover">
          {error}
        </p>
      )}
    </div>
  );
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-16 w-16 items-center justify-center border border-accent ${
        active ? "" : "animate-pulseGlow"
      }`}
      style={{ backgroundColor: "#1c0a0a" }}
      aria-hidden
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8">
        <path d="M12 16V4" strokeLinecap="round" />
        <path d="M6 10l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
