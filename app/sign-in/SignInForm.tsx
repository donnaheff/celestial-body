"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignInForm({
  availableProviders,
  callbackUrl,
}: {
  availableProviders: { id: string; label: string }[];
  callbackUrl: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"signin" | "register" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);

  async function continueWithEmail() {
    setBusy("signin");
    setError(null);
    setNoAccount(false);
    const result = await signIn("credentials", { email, password, redirect: false });
    setBusy(null);
    // NextAuth v5's client signIn() sets `ok` from the HTTP fetch status,
    // which is 200 even when credentials are wrong — the actual result is
    // `error` (set to "CredentialsSignin" on failure), not `ok`.
    if (result && !result.error) {
      router.push(callbackUrl);
      router.refresh();
      return;
    }
    setError("Incorrect email or password.");
    setNoAccount(true);
  }

  async function createAccount() {
    setBusy("register");
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(null);
      setError(body.error ?? "Could not create account.");
      return;
    }
    const result = await signIn("credentials", { email, password, redirect: false });
    setBusy(null);
    if (result && !result.error) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setError("Account created — sign in above.");
      setNoAccount(false);
    }
  }

  return (
    <>
      <div className="card elev-md" style={{ padding: "var(--space-6)" }}>
        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@organisation.nhs.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email && password && continueWithEmail()}
          />
        </div>

        {error && (
          <p style={{ fontSize: 12, color: "#a3402b", marginBottom: "var(--space-2)" }}>{error}</p>
        )}

        <button
          className="btn btn-primary btn-block"
          disabled={email.trim().length === 0 || password.length === 0 || busy !== null}
          onClick={continueWithEmail}
        >
          {busy === "signin" ? "Signing in…" : "Continue with email"}
        </button>

        {noAccount && (
          <button
            className="btn btn-ghost btn-block"
            disabled={busy !== null}
            onClick={createAccount}
            style={{ marginTop: "var(--space-1)" }}
          >
            {busy === "register" ? "Creating account…" : "New here? Create an account instead"}
          </button>
        )}

        {availableProviders.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", margin: "var(--space-4) 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
              <div style={{ fontSize: 11, opacity: 0.6 }}>OR</div>
              <div style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {availableProviders.map((p) => (
                <button
                  key={p.id}
                  className="btn btn-secondary btn-block"
                  onClick={() => signIn(p.id, { callbackUrl })}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <p style={{ fontSize: 11, opacity: 0.55, marginTop: "var(--space-3)" }}>
        Your session is authenticated server-side; passwords are never stored in plain text.
      </p>
    </>
  );
}
