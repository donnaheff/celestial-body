/** Editorial line-art illustration for the home hero: a reviewed document with a pen. */
export function DocumentArt() {
  return (
    <svg viewBox="0 0 400 500" width="100%" height="100%" role="img" aria-label="A tender document under review, marked up with notes">
      <rect width="400" height="500" fill="var(--color-surface)" />

      {/* back sheet, slightly rotated */}
      <g transform="translate(60,50) rotate(-4 140 200)">
        <rect x="0" y="0" width="260" height="360" rx="4" fill="var(--color-bg)" stroke="var(--color-divider)" />
      </g>

      {/* front sheet */}
      <g transform="translate(75,70)">
        <rect x="0" y="0" width="250" height="350" rx="4" fill="var(--color-bg)" stroke="var(--color-text)" strokeOpacity="0.35" />

        {/* heading block */}
        <rect x="28" y="34" width="120" height="10" rx="2" fill="var(--color-accent)" />
        <rect x="28" y="52" width="80" height="6" rx="2" fill="var(--color-text)" fillOpacity="0.35" />

        {/* body lines */}
        {[92, 112, 132, 152, 172, 192, 212].map((y, i) => (
          <rect
            key={y}
            x="28"
            y={y}
            width={i % 3 === 2 ? 150 : 194}
            height="6"
            rx="2"
            fill="var(--color-text)"
            fillOpacity="0.16"
          />
        ))}

        {/* accent underline, as if highlighted during review */}
        <rect x="28" y="152" width="194" height="10" rx="2" fill="var(--color-accent)" fillOpacity="0.18" />

        {/* margin tick marks, as if annotated */}
        <path d="M8 92 l10 10 M8 132 l10 10 M8 212 l10 10" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* second block */}
        {[250, 270, 290, 310].map((y, i) => (
          <rect
            key={y}
            x="28"
            y={y}
            width={i === 3 ? 110 : 194}
            height="6"
            rx="2"
            fill="var(--color-text)"
            fillOpacity="0.16"
          />
        ))}
      </g>

      {/* pen, laid diagonally across the page */}
      <g transform="translate(230,290) rotate(38)">
        <rect x="0" y="0" width="150" height="10" rx="5" fill="var(--color-text)" />
        <rect x="0" y="0" width="18" height="10" rx="5" fill="var(--color-accent)" />
        <path d="M150 0 L166 5 L150 10 Z" fill="var(--color-text)" />
      </g>
    </svg>
  );
}
