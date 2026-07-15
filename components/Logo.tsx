/**
 * Acme Bids mark — a seal-ring monogram, drawn in outline strokes only
 * (never a filled shape) to match the design system's "color as stroke,
 * not fill" rule used throughout (.btn-primary, .card, .tag-outline, etc).
 */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Acme Bids"
      style={{ flex: "none", display: "block" }}
    >
      <circle cx="16" cy="16" r="14.25" stroke="var(--color-accent)" strokeWidth="1.5" />
      <path
        d="M16 8.5 L22.5 23.5 M16 8.5 L9.5 23.5 M11.7 18.5 H20.3"
        stroke="var(--color-accent)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
