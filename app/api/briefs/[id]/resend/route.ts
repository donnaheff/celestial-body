import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { briefs } from "@/db/schema";
import { requireUser, ApiError, handleApiError } from "@/lib/api-helpers";
import { loadOwnedBrief } from "@/lib/brief-access";
import { briefToDTO } from "@/lib/dto";

const resendSchema = z.object({ revisedBudget: z.number().min(1) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const brief = await loadOwnedBrief(id, user.id);
    if (brief.status !== "declined") {
      throw new ApiError("This brief isn't awaiting a revision.", 409);
    }

    const body = await req.json().catch(() => null);
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const [updated] = await db
      .update(briefs)
      .set({
        status: "under_review",
        budget: parsed.data.revisedBudget.toFixed(2),
        quoteAmount: null,
        depositAmount: null,
        balanceAmount: null,
        varianceNote: null,
        updatedAt: new Date(),
      })
      .where(and(eq(briefs.id, brief.id), eq(briefs.userId, user.id)))
      .returning();
    if (!updated) throw new ApiError("Brief not found.", 404);

    return NextResponse.json({ brief: briefToDTO(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
