import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";

type NavPage = "home" | "services" | "pricing" | "work" | "about" | "contact" | "signin" | "dashboard";

const LINKS: { key: NavPage; href: string; label: string }[] = [
  { key: "home", href: "/", label: "Home" },
  { key: "services", href: "/services", label: "Services" },
  { key: "pricing", href: "/pricing", label: "Pricing" },
  { key: "work", href: "/work", label: "Work" },
  { key: "about", href: "/about", label: "About" },
  { key: "contact", href: "/contact", label: "Contact" },
];

export async function Nav({ current }: { current: NavPage }) {
  const session = await auth();
  const signedIn = !!session?.user;

  return (
    <nav className="nav" style={{ position: "sticky", top: 0, background: "var(--color-bg)", zIndex: 20, flexWrap: "wrap" }}>
      <Link
        href="/"
        className="nav-brand"
        style={{
          textDecoration: "none",
          color: "inherit",
          fontWeight: 700,
          fontSize: 21,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Logo size={24} />
        Acme Bids
      </Link>
      {LINKS.map((link) => (
        <Link key={link.key} href={link.href} aria-current={current === link.key ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
      {signedIn ? (
        <Link href="/dashboard" className="btn btn-secondary">
          Dashboard
        </Link>
      ) : (
        <Link href="/sign-in" className="btn btn-primary">
          Sign in
        </Link>
      )}
    </nav>
  );
}
