"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import type { BriefDTO } from "@/lib/dto";
import { tenderTypes } from "@/lib/site-data";
import { EscrowFunding } from "./EscrowFunding";

const TERMINAL_STATUSES: BriefDTO["status"][] = ["escrow_funded", "completed"];
const WIZARD_LABELS = ["Specification", "Timeframe", "Budget", "Review"];
const THREAD_LABELS = ["Brief submitted", "Under review", "Quote issued", "Escrow funded"];

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-GB");
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
  return body as T;
}

export function DashboardClient({ email, initialBriefs }: { email: string; initialBriefs: BriefDTO[] }) {
  const [briefs, setBriefs] = useState<BriefDTO[]>(initialBriefs);
  const [flowVariant, setFlowVariant] = useState<"wizard" | "thread">("wizard");
  const [wizStep, setWizStep] = useState(0);
  const [spec, setSpec] = useState("");
  const [tenderType, setTenderType] = useState<(typeof tenderTypes)[number]>(tenderTypes[0]);
  const [timeframeWeeks, setTimeframeWeeks] = useState(4);
  const [budget, setBudget] = useState(8000);
  const [revisedBudget, setRevisedBudget] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justFunded, setJustFunded] = useState<BriefDTO | null>(null);

  const activeBrief = useMemo(
    () => briefs.find((b) => !TERMINAL_STATUSES.includes(b.status)) ?? null,
    [briefs]
  );
  const pastBriefs = useMemo(
    () => briefs.filter((b) => TERMINAL_STATUSES.includes(b.status)),
    [briefs]
  );

  const refresh = useCallback(async () => {
    try {
      const { briefs: rows } = await api<{ briefs: BriefDTO[] }>("/api/briefs");
      setBriefs(rows);
    } catch {
      // transient network hiccup during polling — ignore, next tick retries
    }
  }, []);

  // Poll while the client's brief is with staff (no quote yet) so the quote
  // appears without a manual refresh, mirroring the prototype's "reviewing" step.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (activeBrief?.status === "under_review") {
      pollRef.current = setInterval(refresh, 4000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeBrief?.status, refresh]);

  useEffect(() => {
    if (activeBrief?.status === "declined") setRevisedBudget(activeBrief.budget);
  }, [activeBrief?.id, activeBrief?.status, activeBrief?.budget]);

  async function submitBrief() {
    setBusy(true);
    setError(null);
    try {
      const { brief } = await api<{ brief: BriefDTO }>("/api/briefs", {
        method: "POST",
        body: JSON.stringify({ specification: spec, tenderType, timeframeWeeks, budget }),
      });
      setBriefs((prev) => [brief, ...prev]);
      setWizStep(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function acceptQuote() {
    if (!activeBrief) return;
    setBusy(true);
    setError(null);
    try {
      const { brief } = await api<{ brief: BriefDTO }>(`/api/briefs/${activeBrief.id}/accept`, { method: "POST" });
      setBriefs((prev) => prev.map((b) => (b.id === brief.id ? brief : b)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function declineQuote() {
    if (!activeBrief) return;
    setBusy(true);
    setError(null);
    try {
      const { brief } = await api<{ brief: BriefDTO }>(`/api/briefs/${activeBrief.id}/decline`, { method: "POST" });
      setBriefs((prev) => prev.map((b) => (b.id === brief.id ? brief : b)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resendBrief() {
    if (!activeBrief || revisedBudget == null) return;
    setBusy(true);
    setError(null);
    try {
      const { brief } = await api<{ brief: BriefDTO }>(`/api/briefs/${activeBrief.id}/resend`, {
        method: "POST",
        body: JSON.stringify({ revisedBudget }),
      });
      setBriefs((prev) => prev.map((b) => (b.id === brief.id ? brief : b)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleFunded(fundedBrief: BriefDTO) {
    setBriefs((prev) => prev.map((b) => (b.id === fundedBrief.id ? fundedBrief : b)));
    setJustFunded(fundedBrief);
  }

  function startOver() {
    setJustFunded(null);
    setSpec("");
    setTenderType(tenderTypes[0]);
    setTimeframeWeeks(4);
    setBudget(8000);
    setWizStep(0);
  }

  const canProceedSpec = spec.trim().length > 0;
  const canProceedBudget = budget > 0;
  const canSubmitThread = spec.trim().length > 0 && budget > 0;
  const specPreview = spec.length > 220 ? spec.slice(0, 220) + "…" : spec || "No specification text provided.";

  const newBriefForm = (
    <>
      <div className="field">
        <label>Specification</label>
        <textarea
          className="input"
          rows={flowVariant === "wizard" ? 6 : 5}
          placeholder="Paste the scope, service lines, or link the ITT section."
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          disabled={!!activeBrief}
        />
      </div>
      <div className="field">
        <label>Submission type</label>
        <select
          className="input"
          value={tenderType}
          onChange={(e) => setTenderType(e.target.value as (typeof tenderTypes)[number])}
          disabled={!!activeBrief}
        >
          {tenderTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
    </>
  );

  return (
    <section className="section" style={{ maxWidth: 1080 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
        <div>
          <h6 style={{ color: "var(--color-accent)" }}>Project management</h6>
          <h2>Your brief</h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Signed in as {email}</div>
          <button className="btn btn-ghost" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </button>
        </div>
      </div>
      <p style={{ maxWidth: "62ch", opacity: 0.85, marginBottom: "var(--space-4)" }}>
        Tell us the specification, your timeframe and your budget. We&rsquo;ll come back with a formal quote to
        accept or negotiate — nothing is charged until you accept it.
      </p>

      {pastBriefs.length > 0 && (
        <div style={{ marginBottom: "var(--space-6)" }}>
          <h6 style={{ color: "var(--color-accent)" }}>Past briefs</h6>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Quote</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {pastBriefs.map((b) => (
                <tr key={b.id}>
                  <td>{b.tenderType}</td>
                  <td>£{b.quoteAmount != null ? fmt(b.quoteAmount) : "—"}</td>
                  <td>{b.escrowMethod === "flutterwave" ? "Card & bank transfer" : "Smart contract escrow"}</td>
                  <td>{new Date(b.updatedAt).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="seg" style={{ marginBottom: "var(--space-6)" }}>
        <label className="seg-opt">
          <input type="radio" name="flow" checked={flowVariant === "wizard"} onChange={() => setFlowVariant("wizard")} />
          Guided steps
        </label>
        <label className="seg-opt">
          <input type="radio" name="flow" checked={flowVariant === "thread"} onChange={() => setFlowVariant("thread")} />
          Single page
        </label>
      </div>

      {error && <p style={{ fontSize: 13, color: "#a3402b", marginBottom: "var(--space-3)" }}>{error}</p>}

      {justFunded && !activeBrief && (
        <FundedCard brief={justFunded} onStartOver={startOver} />
      )}

      {!justFunded && flowVariant === "wizard" && (
        <div className="card elev-md" style={{ padding: "var(--space-6)", maxWidth: 640 }}>
          {!activeBrief ? (
            <>
              <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
                {WIZARD_LABELS.map((label, i) => (
                  <div style={{ flex: 1 }} key={label}>
                    <div
                      style={{
                        height: 3,
                        borderRadius: 2,
                        background: i === wizStep ? "var(--color-accent)" : "var(--color-divider)",
                      }}
                    />
                    <div style={{ fontSize: 11, marginTop: 6, opacity: 0.7 }}>{label}</div>
                  </div>
                ))}
              </div>

              {wizStep === 0 && (
                <>
                  {newBriefForm}
                  <button className="btn btn-primary btn-block" disabled={!canProceedSpec} onClick={() => setWizStep(1)}>
                    Next
                  </button>
                </>
              )}

              {wizStep === 1 && (
                <>
                  <div className="field">
                    <label>Timeframe</label>
                    <div className="seg" style={{ width: "100%" }}>
                      {[2, 4, 8, 12].map((w) => (
                        <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }} key={w}>
                          <input type="radio" name="weeks" checked={timeframeWeeks === w} onChange={() => setTimeframeWeeks(w)} />
                          {w} weeks
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label>Or specify exact weeks</label>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={timeframeWeeks}
                      onChange={(e) => setTimeframeWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-secondary" onClick={() => setWizStep(0)}>Back</button>
                    <button className="btn btn-primary btn-block" onClick={() => setWizStep(2)}>Next</button>
                  </div>
                </>
              )}

              {wizStep === 2 && (
                <>
                  <div className="field">
                    <label>Budget (£)</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      step={50}
                      value={budget}
                      onChange={(e) => setBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
                      Your budget guides our quote — we&rsquo;ll tell you plainly if it doesn&rsquo;t fit the scope.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-secondary" onClick={() => setWizStep(1)}>Back</button>
                    <button className="btn btn-primary btn-block" disabled={!canProceedBudget} onClick={() => setWizStep(3)}>Next</button>
                  </div>
                </>
              )}

              {wizStep === 3 && (
                <>
                  <div className="card" style={{ background: "var(--color-surface)", marginBottom: "var(--space-4)" }}>
                    <div className="card-kicker">{tenderType}</div>
                    <p className="card-body" style={{ whiteSpace: "pre-wrap" }}>{specPreview}</p>
                    <div className="card-meta">{timeframeWeeks} weeks · £{fmt(budget)} budget</div>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-secondary" onClick={() => setWizStep(2)}>Back</button>
                    <button className="btn btn-primary btn-block" disabled={busy} onClick={submitBrief}>
                      {busy ? "Submitting…" : "Submit brief"}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <StageBody
              brief={activeBrief}
              busy={busy}
              revisedBudget={revisedBudget}
              setRevisedBudget={setRevisedBudget}
              onAccept={acceptQuote}
              onDecline={declineQuote}
              onResend={resendBrief}
              onFunded={handleFunded}
              onStartOver={startOver}
              variant="wizard"
            />
          )}
        </div>
      )}

      {!justFunded && flowVariant === "thread" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "var(--space-6)", alignItems: "start" }}>
          <div className="card elev-md" style={{ padding: "var(--space-6)" }}>
            {newBriefForm}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div className="field">
                <label>Timeframe (weeks)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={timeframeWeeks}
                  onChange={(e) => setTimeframeWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={!!activeBrief}
                />
              </div>
              <div className="field">
                <label>Budget (£)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={50}
                  value={budget}
                  onChange={(e) => setBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={!!activeBrief}
                />
              </div>
            </div>
            {!activeBrief && (
              <button className="btn btn-primary btn-block" disabled={!canSubmitThread || busy} onClick={submitBrief}>
                {busy ? "Submitting…" : "Submit brief"}
              </button>
            )}
          </div>

          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {THREAD_LABELS.map((label, i) => {
                const currentIndex = activeBrief
                  ? { under_review: 0, quoted: 1, declined: 1, escrow_pending: 2, escrow_funded: 3, completed: 3 }[activeBrief.status]
                  : -1;
                const filled = i <= currentIndex;
                return (
                  <div style={{ display: "flex", gap: "var(--space-3)", paddingBottom: "var(--space-4)" }} key={label}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          border: "1.5px solid var(--color-accent)",
                          flex: "none",
                          background: filled ? "var(--color-accent)" : "transparent",
                        }}
                      />
                      <span style={{ width: 1.5, flex: 1, background: "var(--color-divider)", marginTop: 4 }} />
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.85 }}>{label}</div>
                  </div>
                );
              })}
            </div>

            {activeBrief && (
              <StageBody
                brief={activeBrief}
                busy={busy}
                revisedBudget={revisedBudget}
                setRevisedBudget={setRevisedBudget}
                onAccept={acceptQuote}
                onDecline={declineQuote}
                onResend={resendBrief}
                onFunded={handleFunded}
                onStartOver={startOver}
                variant="thread"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function StageBody({
  brief,
  busy,
  revisedBudget,
  setRevisedBudget,
  onAccept,
  onDecline,
  onResend,
  onFunded,
  onStartOver,
  variant,
}: {
  brief: BriefDTO;
  busy: boolean;
  revisedBudget: number | null;
  setRevisedBudget: (n: number) => void;
  onAccept: () => void;
  onDecline: () => void;
  onResend: () => void;
  onFunded: (b: BriefDTO) => void;
  onStartOver: () => void;
  variant: "wizard" | "thread";
}) {
  if (brief.status === "under_review") {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-6) 0" }} className="stage-enter">
        <div className="dots-pulse" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: "var(--space-3)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", animationDelay: "0s" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", animationDelay: "0.2s" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", animationDelay: "0.4s" }} />
        </div>
        <p style={{ opacity: 0.8 }}>Reviewing your brief against similar submissions…</p>
        <div style={{ fontSize: 11, opacity: 0.5 }}>
          Formal quotes are typically returned within one working day — this page updates automatically.
        </div>
      </div>
    );
  }

  if (brief.status === "quoted") {
    return (
      <div className="stage-enter">
        <div className="card" style={{ background: "var(--color-surface)" }}>
          <div className="card-kicker">Formal quote</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: variant === "wizard" ? 36 : 32, fontWeight: 400 }}>
            £{fmt(brief.quoteAmount ?? 0)}
          </div>
          <p className="card-body">{brief.varianceNote}</p>
          <div className="card-meta">
            £{fmt(brief.depositAmount ?? 0)} on acceptance · £{fmt(brief.balanceAmount ?? 0)} on delivery
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
          <button className="btn btn-secondary" disabled={busy} onClick={onDecline}>Decline</button>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={onAccept}>Accept quote</button>
        </div>
      </div>
    );
  }

  if (brief.status === "declined") {
    return (
      <div className="stage-enter">
        <p style={{ opacity: 0.85 }}>No problem — adjust your budget and resend, or talk to us directly.</p>
        <div className="field">
          <label>Revised budget (£)</label>
          <input
            className="input"
            type="number"
            min={0}
            step={50}
            value={revisedBudget ?? brief.budget}
            onChange={(e) => setRevisedBudget(Math.max(0, parseFloat(e.target.value) || 0))}
          />
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <a href="/contact" className="btn btn-ghost">Email the team instead</a>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={onResend}>Resend brief</button>
        </div>
      </div>
    );
  }

  if (brief.status === "escrow_pending") {
    return <EscrowFunding brief={brief} onFunded={onFunded} />;
  }

  return null;
}

function FundedCard({ brief, onStartOver }: { brief: BriefDTO; onStartOver: () => void }) {
  return (
    <div className="card elev-md stage-enter" style={{ padding: "var(--space-6)", maxWidth: 640 }}>
      <div className="tag tag-accent" style={{ marginBottom: "var(--space-3)" }}>Escrow funded</div>
      <h4>You&rsquo;re set — a writer is being assigned.</h4>
      <table className="table">
        <tbody>
          <tr><td>Deposit released now</td><td>£{fmt(brief.depositAmount ?? 0)}</td></tr>
          <tr><td>Balance on delivery</td><td>£{fmt(brief.balanceAmount ?? 0)}</td></tr>
          <tr><td>Method</td><td>{brief.escrowMethod === "flutterwave" ? "Card & bank transfer" : "Smart contract escrow"}</td></tr>
        </tbody>
      </table>
      <p style={{ opacity: 0.85, marginTop: "var(--space-3)" }}>A named writer will be in touch within one working day.</p>
      <button className="btn btn-ghost" onClick={onStartOver}>Start another brief</button>
    </div>
  );
}
