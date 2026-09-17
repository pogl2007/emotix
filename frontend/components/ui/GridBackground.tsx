interface Props {
  dense?: boolean;
  className?: string;
}

/** Тонкая красная сетка на фоне (opacity 0.03). */
export default function GridBackground({ dense = false, className = "" }: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${
        dense ? "grid-bg-dense" : "grid-bg"
      } ${className}`}
      aria-hidden
    />
  );
}
