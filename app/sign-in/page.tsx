import { Nav } from "@/components/Nav";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in — Acme Bids" };

const OAUTH_PROVIDERS = [
  { id: "google", label: "Continue with Google", envKeys: ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"] },
  { id: "apple", label: "Continue with Apple", envKeys: ["AUTH_APPLE_ID", "AUTH_APPLE_SECRET"] },
  { id: "facebook", label: "Continue with Facebook", envKeys: ["AUTH_FACEBOOK_ID", "AUTH_FACEBOOK_SECRET"] },
  { id: "twitter", label: "Continue with X (Twitter)", envKeys: ["AUTH_TWITTER_ID", "AUTH_TWITTER_SECRET"] },
] as const;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const availableProviders = OAUTH_PROVIDERS.filter((p) => p.envKeys.every((k) => !!process.env[k])).map(
    (p) => ({ id: p.id, label: p.label })
  );

  return (
    <div className="page-shell">
      <Nav current="signin" />

      <section className="section" style={{ maxWidth: 420 }}>
        <h6 style={{ color: "var(--color-accent)" }}>Client access</h6>
        <h2>Sign in or sign up</h2>
        <p style={{ opacity: 0.85, marginBottom: "var(--space-6)" }}>
          Access your project management dashboard to submit a brief, review a quote and fund escrow. New here?
          Create an account in a few seconds.
        </p>

        <SignInForm availableProviders={availableProviders} callbackUrl={callbackUrl ?? "/dashboard"} />
      </section>
    </div>
  );
}
