const STRIPE_SIZES = { hero: 10, standard: 8 } as const;

export function Plate({
  aspect,
  caption,
  illustration,
  stripe = "standard",
  style,
}: {
  aspect: string;
  /** Fallback text shown only when no illustration is supplied. */
  caption?: string;
  /** A real (illustrated) image — when set, replaces the striped placeholder. */
  illustration?: React.ReactNode;
  stripe?: keyof typeof STRIPE_SIZES;
  style?: React.CSSProperties;
}) {
  const s = STRIPE_SIZES[stripe];

  if (illustration) {
    return (
      <div
        className="plate"
        style={{
          aspectRatio: aspect,
          overflow: "hidden",
          filter: "none", // flat illustration art, not photography — skip the sepia photo-toning
          ...style,
        }}
      >
        {illustration}
      </div>
    );
  }

  return (
    <div
      className="plate"
      style={{
        aspectRatio: aspect,
        background: `repeating-linear-gradient(135deg, var(--color-neutral-200), var(--color-neutral-200) ${s}px, var(--color-neutral-300) ${s}px, var(--color-neutral-300) ${s * 2}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
        textAlign: "center",
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 11,
          letterSpacing: "0.04em",
          color: "var(--color-neutral-700)",
          whiteSpace: "pre-line",
        }}
      >
        {caption}
      </span>
    </div>
  );
}
