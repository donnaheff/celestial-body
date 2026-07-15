import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { briefs } from "@/db/schema";
import { requireAdmin, ApiError, handleApiError } from "@/lib/api-helpers";
import { briefToDTO, quoteToDTO } from "@/lib/dto";
import { computeSuggestedQuote, computeDeposit } from "@/lib/quote";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const brief = await db.query.briefs.findFirst({
      where: eq(briefs.id, id),
      with: {
        user: { columns: { email: true, name: true } },
        quotes: { orderBy: (q, { desc }) => [desc(q.createdAt)] },
        escrowTransactions: { orderBy: (e, { desc }) => [desc(e.createdAt)] },
      },
    });
    if (!brief) throw new ApiError("Brief not found.", 404);

    const suggestedAmount = computeSuggestedQuote(Number(brief.budget), brief.timeframeWeeks);

    return NextResponse.json({
      brief: { ...briefToDTO(brief), clientEmail: brief.user.email, clientName: brief.user.name },
      quotes: brief.quotes.map(quoteToDTO),
      suggestedQuote: {
        amount: suggestedAmount,
        depositAmount: computeDeposit(suggestedAmount),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
