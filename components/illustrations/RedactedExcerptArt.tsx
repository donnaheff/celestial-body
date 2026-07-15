/** Editorial line-art illustration for case-study cards: an excerpt with client-confidential lines redacted. */
export function RedactedExcerptArt({ variant = 0 }: { variant?: number }) {
  // Rotates which lines are "redacted" per card so the three case studies don't look identical.
  const redactedRows = [
    [1, 3, 6],
    [0, 4, 5],
    [2, 3, 7],
  ][variant % 3]!;

  const rows = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <svg viewBox="0 0 400 300" width="100%" height="100%" role="img" aria-label="A tender excerpt with confidential passages redacted">
      <rect width="400" height="300" fill="var(--color-surface)" />

      <g transform="translate(50,40)">
        <rect x="0" y="0" width="300" height="220" rx="4" fill="var(--color-bg)" stroke="var(--color-text)" strokeOpacity="0.35" />

        <rect x="26" y="26" width="90" height="9" rx="2" fill="var(--color-accent)" />

        {rows.map((i) => {
          const y = 56 + i * 20;
          const redacted = redactedRows.includes(i);
          const width = redacted ? 130 + (i % 3) * 20 : 240 - (i % 4) * 12;
          return (
            <rect
              key={i}
              x="26"
              y={y}
              width={width}
              height={redacted ? 9 : 6}
              rx={redacted ? 1 : 2}
              fill="var(--color-text)"
              fillOpacity={redacted ? 0.82 : 0.16}
            />
          );
        })}
      </g>
    </svg>
  );
}
