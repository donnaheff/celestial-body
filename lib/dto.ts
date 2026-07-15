import type { briefs, quotes, escrowTransactions } from "@/db/schema";

type BriefRow = typeof briefs.$inferSelect;
type QuoteRow = typeof quotes.$inferSelect;
type EscrowRow = typeof escrowTransactions.$inferSelect;

const num = (v: string | null) => (v === null ? null : Number(v));

export function briefToDTO(b: BriefRow) {
  return {
    id: b.id,
    specification: b.specification,
    tenderType: b.tenderType,
    timeframeWeeks: b.timeframeWeeks,
    budget: num(b.budget)!,
    status: b.status,
    quoteAmount: num(b.quoteAmount),
    depositAmount: num(b.depositAmount),
    balanceAmount: num(b.balanceAmount),
    varianceNote: b.varianceNote,
    escrowMethod: b.escrowMethod,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}
export type BriefDTO = ReturnType<typeof briefToDTO>;

export function quoteToDTO(q: QuoteRow) {
  return {
    id: q.id,
    briefId: q.briefId,
    budgetAtQuote: num(q.budgetAtQuote)!,
    amount: num(q.amount)!,
    depositAmount: num(q.depositAmount)!,
    balanceAmount: num(q.balanceAmount)!,
    varianceNote: q.varianceNote,
    status: q.status,
    note: q.note,
    createdAt: q.createdAt.toISOString(),
  };
}
export type QuoteDTO = ReturnType<typeof quoteToDTO>;

export function escrowToDTO(e: EscrowRow) {
  return {
    id: e.id,
    briefId: e.briefId,
    method: e.method,
    status: e.status,
    amount: num(e.amount)!,
    currency: e.currency,
    chainId: e.chainId,
    contractAddress: e.contractAddress,
    depositTxHash: e.depositTxHash,
    createdAt: e.createdAt.toISOString(),
  };
}
export type EscrowDTO = ReturnType<typeof escrowToDTO>;
