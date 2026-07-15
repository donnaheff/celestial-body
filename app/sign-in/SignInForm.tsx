"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

export function SignInForm({
  availableProviders,
  callbackUrl,
}: {
  availableProviders: { id: string; label: string }[];
  callbackUrl: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function continueWithEmail() {
    setBusy(true);
    setError(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    // NextAuth v5's client signIn() sets `ok` from the HTTP fetch status,
    // which is 200 even when credentials are wrong — the actual result is
    // `error` (set to "CredentialsSignin" on failure), not `ok`.
    if (result && !result.error) {
      router.push(callbackUrl);
      router.refresh();
      return;
    }
    setError("Incorrect email or password.");
  }

  async function createAccount() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name.trim() || undefined }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(body.error ?? "Could not create account.");
      return;
    }
    const result = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (result && !result.error) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setError("Account created — switch to Sign in above to continue.");
    }
  }

  const canSubmitSignIn = email.trim().length > 0 && password.length > 0;
  const canSubmitSignUp = email.trim().length > 0 && password.length >= 8;

  return (
    <>
      <div className="seg" style={{ marginBottom: "var(--space-4)" }}>
        <label className="seg-opt">
          <input type="radio" name="auth-mode" checked={mode === "signin"} onChange={() => switchMode("signin")} />
          Sign in
        </label>
        <label className="seg-opt">
          <input type="radio" name="auth-mode" checked={mode === "signup"} onChange={() => switchMode("signup")} />
          Create account
        </label>
      </div>

      <div className="card elev-md" style={{ padding: "var(--space-6)" }}>
        {mode === "signup" && (
          <div className="field">
            <label>Name (optional)</label>
            <input
              className="input"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

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
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (mode === "signin" && canSubmitSignIn) continueWithEmail();
              if (mode === "signup" && canSubmitSignUp) createAccount();
            }}
          />
          {mode === "signup" && (
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>At least 8 characters.</div>
          )}
        </div>

        {error && <p style={{ fontSize: 12, color: "#a3402b", marginBottom: "var(--space-2)" }}>{error}</p>}

        {mode === "signin" ? (
          <button className="btn btn-primary btn-block" disabled={!canSubmitSignIn || busy} onClick={continueWithEmail}>
            {busy ? "Signing in…" : "Continue with email"}
          </button>
        ) : (
          <button className="btn btn-primary btn-block" disabled={!canSubmitSignUp || busy} onClick={createAccount}>
            {busy ? "Creating account…" : "Create account"}
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
