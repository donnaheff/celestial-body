/**
 * Quote-calculation logic ported exactly from the design handoff's
 * prototype (Dashboard.dc.html `computeQuote`). In the real app this is
 * only ever used server-side to pre-fill the admin's "suggested quote" —
 * staff can override it before issuing, so pricing power isn't exposed to
 * the client the way it was in the client-side prototype.
 */
export function computeSuggestedQuote(budget: number, weeks: number): number {
  let factor: number;
  if (weeks <= 2) factor = 1.28;
  else if (weeks <= 4) factor = 1.12;
  else if (weeks <= 8) factor = 1.0;
  else factor = 0.92;
  return Math.max(500, Math.round((budget * factor) / 50) * 50);
}

export function computeDeposit(quoteAmount: number): number {
  return Math.round((quoteAmount * 0.4) / 50) * 50;
}

export function computeVarianceNote(quoteAmount: number, budgetAtQuote: number, weeks: number): string {
  if (!quoteAmount || !budgetAtQuote) return "In line with your indicated budget.";
  const pct = Math.round((Math.abs(quoteAmount - budgetAtQuote) / budgetAtQuote) * 100);
  if (quoteAmount > budgetAtQuote) {
    return `${pct}% above your indicated budget, reflecting the ${weeks}-week turnaround.`;
  }
  if (quoteAmount < budgetAtQuote) {
    return `${pct}% under your indicated budget.`;
  }
  return "In line with your indicated budget.";
}

export function formatGBP(n: number): string {
  return Math.round(n).toLocaleString("en-GB");
}
