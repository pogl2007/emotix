"use client";

interface Props {
  color?: string;
  active?: boolean;
  duration?: number;
  className?: string;
}

/**
 * Красная сканирующая линия, скользящая сверху вниз.
 * Главная визуальная фишка интерфейса.
 */
export default function ScanLine({
  color = "#dc2626",
  active = true,
  duration = 2.4,
  className = "",
}: Props) {
  if (!active) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className="animate-scan absolute left-0 h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          boxShadow: `0 0 16px ${color}, 0 0 40px ${color}`,
          animationDuration: `${duration}s`,
        }}
      />
      <div
        className="animate-scan absolute left-0 h-24 w-full"
        style={{
          background: `linear-gradient(to bottom, transparent, ${color}22)`,
          animationDuration: `${duration}s`,
          transform: "translateY(-100%)",
        }}
      />
    </div>
  );
}
