import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Pricing — Acme Bids" };

const ROWS = [
  { engagement: "Standalone tender response", turnaround: "1–3 weeks", range: "£2,500 – £9,000" },
  { engagement: "CQC or Ofsted application", turnaround: "1–4 weeks", range: "£1,800 – £6,000" },
  { engagement: "Framework or DPS application", turnaround: "3–6 weeks", range: "£6,000 – £18,000" },
  { engagement: "Full bid management retainer", turnaround: "Ongoing", range: "From £4,000 / month" },
];

export default function PricingPage() {
  return (
    <div className="page-shell">
      <Nav current="pricing" />

      <section className="section">
        <h6 style={{ color: "var(--color-accent)" }}>Pricing</h6>
        <h2>How pricing works</h2>
        <p style={{ maxWidth: "62ch", opacity: 0.85 }}>
          There&rsquo;s no rate card. Every brief is scoped on its own scope, evidence needs and deadline, and
          priced accordingly. The ranges below are indicative — your formal quote is issued after we&rsquo;ve read
          your specification.
        </p>
        <table className="table" style={{ marginTop: "var(--space-4)" }}>
          <thead>
            <tr>
              <th>Engagement</th>
              <th>Typical turnaround</th>
              <th>Indicative range</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.engagement}>
                <td>{row.engagement}</td>
                <td>{row.turnaround}</td>
                <td>{row.range}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: "var(--space-3)", opacity: 0.85 }}>
          Nothing is charged until you accept a formal quote, and funds only move once you fund escrow.
        </p>
        <Link href="/sign-in" className="btn btn-primary">Get a quote</Link>
      </section>

      <Footer />
    </div>
  );
}
