"use client";

interface Props {
  color?: string;
  size?: number;
  thickness?: number;
  inset?: number;
  className?: string;
}

/**
 * Уголки ┌ ┐ └ ┘ поверх изображения — как в интерфейсах распознавания лиц.
 */
export default function CornerBrackets({
  color = "#dc2626",
  size = 22,
  thickness = 2,
  inset = 8,
  className = "",
}: Props) {
  const corners = [
    { key: "tl", style: { top: inset, left: inset, borderTopWidth: thickness, borderLeftWidth: thickness } },
    { key: "tr", style: { top: inset, right: inset, borderTopWidth: thickness, borderRightWidth: thickness } },
    { key: "bl", style: { bottom: inset, left: inset, borderBottomWidth: thickness, borderLeftWidth: thickness } },
    { key: "br", style: { bottom: inset, right: inset, borderBottomWidth: thickness, borderRightWidth: thickness } },
  ];

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      {corners.map(({ key, style }) => (
        <span
          key={key}
          className="absolute border-solid"
          style={{
            width: size,
            height: size,
            borderColor: color,
            ...style,
          }}
        />
      ))}
    </div>
  );
}
