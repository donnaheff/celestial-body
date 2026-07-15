/** Typographic monogram portrait — used in place of team photography. */
export function PortraitArt({ name, variant = 0 }: { name: string; variant?: number }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  // Slightly different ring treatment per person so three in a row don't look identical.
  const ringOpacity = [0.55, 0.35, 0.75][variant % 3];
  const ringDash = [undefined, "2 6", undefined][variant % 3];

  return (
    <svg viewBox="0 0 300 300" width="100%" height="100%" role="img" aria-label={`Monogram portrait for ${name}`}>
      <rect width="300" height="300" fill="var(--color-surface)" />
      <circle cx="150" cy="150" r="92" fill="none" stroke="var(--color-accent)" strokeOpacity={ringOpacity} strokeWidth="1.5" strokeDasharray={ringDash} />
      <circle cx="150" cy="150" r="72" fill="var(--color-bg)" stroke="var(--color-text)" strokeOpacity="0.25" />
      <text
        x="150"
        y="150"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-heading)"
        fontWeight={600}
        fontSize="56"
        fill="var(--color-text)"
      >
        {initials}
      </text>
    </svg>
  );
}
