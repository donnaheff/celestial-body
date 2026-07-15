import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Plate } from "@/components/Plate";
import { PortraitArt } from "@/components/illustrations/PortraitArt";

export const metadata = { title: "About — Acme Bids" };

const TEAM = [
  { name: "Eleanor Rye", meta: "Founder · ex-ICB commissioning lead" },
  { name: "Marcus Ashcombe", meta: "Head of bid writing" },
  { name: "Priya Nandan", meta: "Quality review & regulatory applications" },
];

export default function AboutPage() {
  return (
    <div className="page-shell">
      <Nav current="about" />

      <section className="section">
        <h6 style={{ color: "var(--color-accent)" }}>Who&rsquo;s behind it</h6>
        <h2>About Acme Bids</h2>
        <p style={{ maxWidth: "62ch", opacity: 0.85, marginBottom: "var(--space-6)" }}>
          An independent consultancy of bid writers and former commissioners, working exclusively on health,
          social care and public-sector procurement.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--space-4)" }}>
          {TEAM.map((member, i) => (
            <div className="card" key={member.name}>
              <Plate aspect="1/1" illustration={<PortraitArt name={member.name} variant={i} />} />
              <div className="card-title" style={{ marginTop: "var(--space-2)" }}>{member.name}</div>
              <div className="card-meta">{member.meta}</div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
