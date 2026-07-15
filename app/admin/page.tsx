import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { briefs } from "@/db/schema";
import { Nav } from "@/components/Nav";
import { briefToDTO } from "@/lib/dto";

export const metadata = { title: "Admin — Acme Bids" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  under_review: "Under review",
  quoted: "Quote issued",
  declined: "Declined by client",
  escrow_pending: "Awaiting escrow",
  escrow_funded: "Escrow funded",
  completed: "Completed",
};

type BriefWithUser = Awaited<ReturnType<typeof db.query.briefs.findMany<{
  with: { user: { columns: { email: true; name: true } } };
}>>>;

export default async function AdminBriefsPage() {
  const rows: BriefWithUser = await db.query.briefs.findMany({
    orderBy: [desc(briefs.createdAt)],
    with: { user: { columns: { email: true, name: true } } },
  });

  const needsAttention = rows.filter((r) => r.status === "under_review");
  const rest = rows.filter((r) => r.status !== "under_review");

  return (
    <div className="page-shell">
      <Nav current="admin" />
      <section className="section" style={{ maxWidth: 1080 }}>
        <h6 style={{ color: "var(--color-accent)" }}>Operations</h6>
        <h2>Briefs</h2>

        {needsAttention.length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h6 style={{ color: "var(--color-accent)" }}>Awaiting a quote ({needsAttention.length})</h6>
            <BriefTable rows={needsAttention} />
          </div>
        )}

        <h6 style={{ color: "var(--color-accent)" }}>All briefs</h6>
        <BriefTable rows={rest} />
      </section>
    </div>
  );
}

function BriefTable({ rows }: { rows: BriefWithUser }) {
  return (
    <table className="table" style={{ marginBottom: "var(--space-4)" }}>
      <thead>
        <tr>
          <th>Client</th>
          <th>Type</th>
          <th>Budget</th>
          <th>Status</th>
          <th>Submitted</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const dto = briefToDTO(r);
          return (
            <tr key={r.id}>
              <td>{r.user.email}</td>
              <td>{dto.tenderType}</td>
              <td>£{dto.budget.toLocaleString("en-GB")}</td>
              <td>{STATUS_LABEL[dto.status] ?? dto.status}</td>
              <td>{new Date(dto.createdAt).toLocaleDateString("en-GB")}</td>
              <td>
                <Link href={`/admin/briefs/${r.id}`} className="btn btn-ghost">
                  Open
                </Link>
              </td>
            </tr>
          );
        })}
        {rows.length === 0 && (
          <tr>
            <td colSpan={6} style={{ opacity: 0.6 }}>
              Nothing here.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
