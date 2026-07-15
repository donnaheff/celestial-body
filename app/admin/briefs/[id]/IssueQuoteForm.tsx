"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IssueQuoteForm({
  briefId,
  suggestedAmount,
  suggestedDeposit,
  clientBudget,
}: {
  briefId: string;
  suggestedAmount: number;
  suggestedDeposit: number;
  clientBudget: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(suggestedAmount);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function issueQuote() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/briefs/${briefId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note: note.trim() || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not issue quote.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card elev-sm" style={{ marginBottom: "var(--space-4)" }}>
      <div className="card-kicker">Issue formal quote</div>
      <p className="card-body" style={{ opacity: 1 }}>
        Suggested by the standard formula: £{suggestedAmount.toLocaleString("en-GB")} (deposit £
        {suggestedDeposit.toLocaleString("en-GB")}), against a client budget of £{clientBudget.toLocaleString("en-GB")}.
        Adjust before sending if the scope warrants it.
      </p>

      <div className="field">
        <label>Quote amount (£)</label>
        <input
          className="input"
          type="number"
          min={1}
          step={50}
          value={amount}
          onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
        />
      </div>
      <div className="field">
        <label>Internal note (optional)</label>
        <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {error && <p style={{ fontSize: 13, color: "#a3402b", marginBottom: "var(--space-2)" }}>{error}</p>}

      <button className="btn btn-primary btn-block" disabled={amount <= 0 || busy} onClick={issueQuote}>
        {busy ? "Sending…" : "Send quote to client"}
      </button>
    </div>
  );
}
