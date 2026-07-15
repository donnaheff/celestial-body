import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { briefs } from "@/db/schema";
import { Nav } from "@/components/Nav";
import { briefToDTO, quoteToDTO, escrowToDTO } from "@/lib/dto";
import { computeSuggestedQuote, computeDeposit } from "@/lib/quote";
import { IssueQuoteForm } from "./IssueQuoteForm";

export const metadata = { title: "Brief — Admin — Acme Bids" };
export const dynamic = "force-dynamic";

export default async function AdminBriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brief = await db.query.briefs.findFirst({
    where: eq(briefs.id, id),
    with: {
      user: { columns: { email: true, name: true } },
      quotes: { orderBy: (q, { desc }) => [desc(q.createdAt)] },
      escrowTransactions: { orderBy: (e, { desc }) => [desc(e.createdAt)] },
    },
  });
  if (!brief) notFound();

  const dto = briefToDTO(brief);
  const suggestedAmount = computeSuggestedQuote(dto.budget, dto.timeframeWeeks);
  const suggestedDeposit = computeDeposit(suggestedAmount);

  return (
    <div className="page-shell">
      <Nav current="admin" />
      <section className="section" style={{ maxWidth: 780 }}>
        <h6 style={{ color: "var(--color-accent)" }}>Operations</h6>
        <h2>{brief.tenderType}</h2>
        <p style={{ opacity: 0.7, fontSize: 13, marginBottom: "var(--space-4)" }}>
          {brief.user.email} · submitted {new Date(dto.createdAt).toLocaleString("en-GB")}
        </p>

        <div className="card" style={{ marginBottom: "var(--space-4)" }}>
          <div className="card-kicker">Specification</div>
          <p className="card-body" style={{ whiteSpace: "pre-wrap", opacity: 1 }}>{brief.specification}</p>
          <div className="card-meta">
            {brief.timeframeWeeks} weeks · £{dto.budget.toLocaleString("en-GB")} client budget · status: {dto.status}
          </div>
        </div>

        {dto.status === "under_review" ? (
          <IssueQuoteForm
            briefId={brief.id}
            suggestedAmount={suggestedAmount}
            suggestedDeposit={suggestedDeposit}
            clientBudget={dto.budget}
          />
        ) : (
          <div className="card" style={{ marginBottom: "var(--space-4)" }}>
            <div className="card-kicker">Current quote</div>
            <div className="card-title">
              {dto.quoteAmount != null ? `£${dto.quoteAmount.toLocaleString("en-GB")}` : "No quote issued"}
            </div>
            {dto.varianceNote && <p className="card-body">{dto.varianceNote}</p>}
          </div>
        )}

        {brief.quotes.length > 0 && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <h6 style={{ color: "var(--color-accent)" }}>Negotiation history</h6>
            <table className="table">
              <thead>
                <tr><th>Amount</th><th>Budget at quote</th><th>Status</th><th>Issued</th></tr>
              </thead>
              <tbody>
                {brief.quotes.map((q) => {
                  const qd = quoteToDTO(q);
                  return (
                    <tr key={q.id}>
                      <td>£{qd.amount.toLocaleString("en-GB")}</td>
                      <td>£{qd.budgetAtQuote.toLocaleString("en-GB")}</td>
                      <td>{qd.status}</td>
                      <td>{new Date(qd.createdAt).toLocaleString("en-GB")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {brief.escrowTransactions.length > 0 && (
          <div>
            <h6 style={{ color: "var(--color-accent)" }}>Escrow transactions</h6>
            <table className="table">
              <thead>
                <tr><th>Method</th><th>Amount</th><th>Status</th><th>Reference</th></tr>
              </thead>
              <tbody>
                {brief.escrowTransactions.map((e) => {
                  const ed = escrowToDTO(e);
                  return (
                    <tr key={e.id}>
                      <td>{ed.method === "flutterwave" ? "Card & bank" : "Smart contract"}</td>
                      <td>£{ed.amount.toLocaleString("en-GB")}</td>
                      <td>{ed.status}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                        {ed.depositTxHash ?? ed.id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
