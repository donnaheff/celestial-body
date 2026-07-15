"use client";

import { useState } from "react";
import type { BriefDTO } from "@/lib/dto";
import { SmartContractDeposit } from "@/components/SmartContractDeposit";

export function EscrowFunding({ brief, onFunded }: { brief: BriefDTO; onFunded: (b: BriefDTO) => void }) {
  const [method, setMethod] = useState<"flutterwave" | "smart_contract">("flutterwave");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fundWithFlutterwave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/escrow/flutterwave/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId: brief.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not start checkout.");
      window.location.href = body.paymentLink;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="stage-enter">
      <h4>Choose how to fund escrow</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <label className="card" style={{ cursor: "pointer", flexDirection: "row", alignItems: "center" }}>
          <span className="radio">
            <input type="radio" name="escrow" checked={method === "flutterwave"} onChange={() => setMethod("flutterwave")} />
            <span className="dot" />
          </span>
          <span>
            <span className="card-title" style={{ display: "block" }}>Card &amp; bank transfer</span>
            <span className="card-body" style={{ display: "block" }}>
              Held by us until milestones are met — familiar checkout, receipts for finance teams.
            </span>
          </span>
        </label>
        <label className="card" style={{ cursor: "pointer", flexDirection: "row", alignItems: "center" }}>
          <span className="radio">
            <input type="radio" name="escrow" checked={method === "smart_contract"} onChange={() => setMethod("smart_contract")} />
            <span className="dot" />
          </span>
          <span>
            <span className="card-title" style={{ display: "block" }}>Smart contract escrow</span>
            <span className="card-body" style={{ display: "block" }}>
              Funds lock on-chain and release automatically when both parties mark a milestone complete.
            </span>
          </span>
        </label>
      </div>

      {error && <p style={{ fontSize: 13, color: "#a3402b", marginTop: "var(--space-2)" }}>{error}</p>}

      {method === "flutterwave" ? (
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: "var(--space-4)" }}
          disabled={busy}
          onClick={fundWithFlutterwave}
        >
          {busy ? "Starting checkout…" : "Fund escrow"}
        </button>
      ) : (
        <SmartContractDeposit brief={brief} onFunded={onFunded} />
      )}
    </div>
  );
}
