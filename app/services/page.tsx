import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { serviceCategories } from "@/lib/site-data";

export const metadata = { title: "Services — Acme Bids" };

export default function ServicesPage() {
  return (
    <div className="page-shell">
      <Nav current="services" />

      <section className="section">
        <h6 style={{ color: "var(--color-accent)" }}>What we do</h6>
        <h2>Services</h2>
        <p style={{ maxWidth: "62ch", opacity: 0.85, marginBottom: "var(--space-6)" }}>
          Every engagement is scoped to a specific tender, application or submission — organised by the service
          and regulator it&rsquo;s written for.
        </p>

        {serviceCategories.map((cat) => (
          <div key={cat.title}>
            <h3>{cat.title}</h3>
            <p style={{ opacity: 0.7, fontSize: 14, marginBottom: "var(--space-3)" }}>{cat.subtitle}</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))",
                gap: "var(--space-3)",
                marginBottom: "var(--space-6)",
              }}
            >
              {cat.items.map((item) => (
                <div className="card" key={item.title}>
                  {item.kicker && <div className="card-kicker">{item.kicker}</div>}
                  <div className="card-title">{item.title}</div>
                  {item.body && <p className="card-body">{item.body}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}

        <Link href="/sign-in" className="btn btn-primary">Start a brief</Link>
      </section>

      <Footer />
    </div>
  );
}
