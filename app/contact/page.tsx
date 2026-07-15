import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Contact — Acme Bids" };

const FAQS = [
  {
    q: "Do you charge before you write anything?",
    a: "No. We issue a formal quote first; funds only move once you've accepted it and funded escrow.",
  },
  {
    q: "What if we don't accept the quote?",
    a: "Revise your budget or timeframe and resend, or talk to us directly — there's no obligation either way.",
  },
  {
    q: "How does escrow protect us?",
    a: "Funds are held by a third party — either our card and bank processor, or an on-chain contract — and only released against agreed milestones.",
  },
  {
    q: "Can you work with CQC and Ofsted-regulated providers?",
    a: "Yes — registration, variation and inspection-ready documentation are a core part of our work.",
  },
  {
    q: "Who owns the copy you write?",
    a: "You do, in full, on completion.",
  },
];

export default function ContactPage() {
  return (
    <div className="page-shell">
      <Nav current="contact" />

      <section
        className="section"
        style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "var(--space-8)" }}
      >
        <div>
          <h6 style={{ color: "var(--color-accent)" }}>Questions</h6>
          <h2>Frequently asked</h2>
          {FAQS.map((faq) => (
            <details key={faq.q} style={{ padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-divider)" }}>
              <summary style={{ cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                {faq.q}
              </summary>
              <p style={{ opacity: 0.85, marginTop: "var(--space-2)" }}>{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="card elev-sm" style={{ height: "fit-content" }}>
          <div className="card-kicker">Get in touch</div>
          <div className="card-title">Prefer to talk first?</div>
          <p className="card-body">
            hello@acmebids.co.uk
            <br />
            020 7946 0192
            <br />
            Mon–Fri, 9:00–17:30
          </p>
          <a href="mailto:hello@acmebids.co.uk" className="btn btn-secondary btn-block">
            Email the team
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
