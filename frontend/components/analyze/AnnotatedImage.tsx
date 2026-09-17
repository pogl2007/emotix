"use client";

import { useCallback, useEffect, useRef } from "react";

import { emotionColor } from "@/lib/emotions";
import type { FaceResult } from "@/lib/types";

interface Props {
  src: string;
  faces: FaceResult[];
  className?: string;
}

/**
 * Рисует изображение и bbox лиц через Canvas API.
 * Цвет рамки — цвет доминирующей эмоции, сверху бейдж [EMOTION 94%].
 */
export default function AnnotatedImage({ src, faces, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);

    // Толщина линий и шрифта — от размера кадра, чтобы читалось на любом фото
    const scale = Math.max(canvas.width, canvas.height) / 720;
    const lineWidth = Math.max(2, 2.5 * scale);
    const fontSize = Math.max(12, 15 * scale);
    const bracket = Math.max(14, 22 * scale);

    faces.forEach((face) => {
      const { x, y, width, height } = face.bbox;
      const color = emotionColor(face.emotion);

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 * scale;

      // Тонкая рамка + акцентные уголки
      ctx.globalAlpha = 0.55;
      ctx.strokeRect(x, y, width, height);
      ctx.globalAlpha = 1;

      ctx.beginPath();
      // ┌
      ctx.moveTo(x, y + bracket); ctx.lineTo(x, y); ctx.lineTo(x + bracket, y);
      // ┐
      ctx.moveTo(x + width - bracket, y); ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + bracket);
      // └
      ctx.moveTo(x, y + height - bracket); ctx.lineTo(x, y + height);
      ctx.lineTo(x + bracket, y + height);
      // ┘
      ctx.moveTo(x + width - bracket, y + height); ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width, y + height - bracket);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Бейдж над рамкой
      const label = `${face.emotion.toUpperCase()} ${(face.confidence * 100).toFixed(0)}%`;
      ctx.font = `600 ${fontSize}px ui-monospace, "JetBrains Mono", monospace`;
      const padding = fontSize * 0.5;
      const textWidth = ctx.measureText(label).width;
      const badgeHeight = fontSize + padding;
      const badgeY = y - badgeHeight - lineWidth > 0 ? y - badgeHeight - lineWidth : y + lineWidth;

      ctx.fillStyle = color;
      ctx.fillRect(x, badgeY, textWidth + padding * 2, badgeHeight);
      ctx.fillStyle = "#080808";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + padding, badgeY + badgeHeight / 2);
    });
  }, [faces]);

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imageRef.current = image;
      draw();
    };
    image.src = src;
    return () => {
      image.onload = null;
    };
  }, [src, draw]);

  useEffect(() => {
    if (imageRef.current) draw();
  }, [faces, draw]);

  return (
    <canvas
      ref={canvasRef}
      className={`block h-auto w-full ${className}`}
      aria-label="Результат анализа с рамками вокруг лиц"
    />
  );
}
