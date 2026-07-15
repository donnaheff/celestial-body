import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { briefs, quotes } from "@/db/schema";
import { requireUser, ApiError, handleApiError } from "@/lib/api-helpers";
import { loadOwnedBrief } from "@/lib/brief-access";
import { briefToDTO } from "@/lib/dto";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const brief = await loadOwnedBrief(id, user.id);
    if (brief.status !== "quoted") {
      throw new ApiError("This brief doesn't have an active quote to accept.", 409);
    }

    const latestQuote = await db.query.quotes.findFirst({
      where: eq(quotes.briefId, brief.id),
      orderBy: [desc(quotes.createdAt)],
    });
    if (latestQuote) {
      await db.update(quotes).set({ status: "accepted" }).where(eq(quotes.id, latestQuote.id));
    }

    const [updated] = await db
      .update(briefs)
      .set({ status: "escrow_pending", updatedAt: new Date() })
      .where(and(eq(briefs.id, brief.id), eq(briefs.userId, user.id)))
      .returning();
    if (!updated) throw new ApiError("Brief not found.", 404);

    return NextResponse.json({ brief: briefToDTO(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
