import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Plate } from "@/components/Plate";
import { RedactedExcerptArt } from "@/components/illustrations/RedactedExcerptArt";
import { workCases } from "@/lib/site-data";

export const metadata = { title: "Work — Acme Bids" };

export default function WorkPage() {
  return (
    <div className="page-shell">
      <Nav current="work" />

      <section className="section">
        <h6 style={{ color: "var(--color-accent)" }}>Track record</h6>
        <h2>Recent outcomes</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--space-4)", marginTop: "var(--space-6)" }}>
          {workCases.map((c, i) => (
            <div className="card" key={c.title}>
              <Plate aspect="4/3" illustration={<RedactedExcerptArt variant={i} />} />
              <div className="tag tag-accent" style={{ marginTop: "var(--space-2)" }}>{c.tag}</div>
              <div className="card-title">{c.title}</div>
              <p className="card-body">{c.body}</p>
              <div className="card-meta">{c.meta}</div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
