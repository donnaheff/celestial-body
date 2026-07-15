import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Plate } from "@/components/Plate";

const PROCESS_STEPS = [
  { kicker: "Step 1", title: "Brief", body: "Sign in and tell us the specification, your timeframe and your budget." },
  { kicker: "Step 2", title: "Quote", body: "We review privately and return one formal, itemised quote to accept or decline." },
  { kicker: "Step 3", title: "Escrow", body: "Once accepted, funds are held in escrow — by card and bank, or an on-chain contract." },
  { kicker: "Step 4", title: "Delivery", body: "A named writer drafts, reviews and delivers against agreed milestones, tracked from your dashboard." },
];

export default function HomePage() {
  return (
    <div className="page-shell">
      <Nav current="home" />

      <section
        className="section"
        style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "var(--space-8)", alignItems: "center" }}
      >
        <div>
          <div className="tag tag-outline" style={{ marginBottom: "var(--space-3)" }}>
            HEALTH &amp; SOCIAL CARE BID WRITING
          </div>
          <h1 style={{ maxWidth: "11ch" }}>Technical writing that wins NHS and social care tenders.</h1>
          <p style={{ fontSize: 17, maxWidth: "46ch", opacity: 0.85 }}>
            We turn service detail and operational evidence into compliant, evaluator-ready bid responses — plus
            CQC and Ofsted applications and policy documentation — scoped to your specification, your timeframe
            and your budget, with price agreed before a word is written.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
            <Link href="/sign-in" className="btn btn-primary">Start a brief</Link>
            <Link href="/services" className="btn btn-secondary">See our services</Link>
          </div>
        </div>
        <Plate aspect="4/5" stripe="hero" caption={"PHOTO\nwriter reviewing\na tender document"} />
      </section>

      <hr className="hr" style={{ maxWidth: 1080, margin: "0 auto" }} />

      <section id="process" className="section">
        <h6 style={{ color: "var(--color-accent)" }}>How it works</h6>
        <h2>A brief becomes a bid</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--space-4)", marginTop: "var(--space-6)" }}>
          {PROCESS_STEPS.map((step) => (
            <div className="card" key={step.title}>
              <div className="card-kicker">{step.kicker}</div>
              <div className="card-title">{step.title}</div>
              <p className="card-body">{step.body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "var(--space-6)" }}>
          <Link href="/sign-in" className="btn btn-primary">Start a brief</Link>
        </div>
      </section>

      <hr className="hr" style={{ maxWidth: 1080, margin: "0 auto" }} />

      <section className="section">
        <h6 style={{ color: "var(--color-accent)" }}>What we do</h6>
        <h2>Care, residential and regulatory bid writing</h2>
        <p style={{ maxWidth: "62ch", opacity: 0.85, marginBottom: "var(--space-4)" }}>
          From domiciliary care to CQC and Ofsted applications, every category of submission is written to the
          standard of its own regulator.
        </p>
        <Link href="/services" className="btn btn-secondary">View all services</Link>
      </section>

      <hr className="hr" style={{ maxWidth: 1080, margin: "0 auto" }} />

      <Footer />
    </div>
  );
}
