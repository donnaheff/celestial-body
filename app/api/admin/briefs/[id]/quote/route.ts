import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { briefs, quotes } from "@/db/schema";
import { requireAdmin, ApiError, handleApiError } from "@/lib/api-helpers";
import { briefToDTO } from "@/lib/dto";
import { computeDeposit, computeVarianceNote } from "@/lib/quote";

const issueQuoteSchema = z.object({
  amount: z.number().min(1),
  note: z.string().trim().max(2000).optional(),
});

/**
 * Real quote issuance — replaces the prototype's client-side timer +
 * auto-computed quote. Staff review the brief in /admin and set the final
 * figure themselves (the formula in lib/quote.ts only pre-fills a suggestion).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await requireAdmin();
    const brief = await db.query.briefs.findFirst({ where: eq(briefs.id, id) });
    if (!brief) throw new ApiError("Brief not found.", 404);
    if (brief.status !== "under_review") {
      throw new ApiError("This brief isn't awaiting a quote.", 409);
    }

    const body = await req.json().catch(() => null);
    const parsed = issueQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const amount = parsed.data.amount;
    const deposit = computeDeposit(amount);
    const balance = amount - deposit;
    const budgetAtQuote = Number(brief.budget);
    const varianceNote = computeVarianceNote(amount, budgetAtQuote, brief.timeframeWeeks);

    await db.insert(quotes).values({
      briefId: brief.id,
      budgetAtQuote: budgetAtQuote.toFixed(2),
      amount: amount.toFixed(2),
      depositAmount: deposit.toFixed(2),
      balanceAmount: balance.toFixed(2),
      varianceNote,
      status: "issued",
      issuedByUserId: admin.id,
      note: parsed.data.note ?? null,
    });

    const [updated] = await db
      .update(briefs)
      .set({
        status: "quoted",
        quoteAmount: amount.toFixed(2),
        depositAmount: deposit.toFixed(2),
        balanceAmount: balance.toFixed(2),
        varianceNote,
        updatedAt: new Date(),
      })
      .where(eq(briefs.id, brief.id))
      .returning();
    if (!updated) throw new ApiError("Brief not found.", 404);

    return NextResponse.json({ brief: briefToDTO(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
