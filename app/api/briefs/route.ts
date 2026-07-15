import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { briefs } from "@/db/schema";
import { requireUser, handleApiError } from "@/lib/api-helpers";
import { briefToDTO } from "@/lib/dto";
import { tenderTypes } from "@/lib/site-data";

const createBriefSchema = z.object({
  specification: z.string().trim().min(1, "Specification is required"),
  tenderType: z.enum(tenderTypes),
  timeframeWeeks: z.number().int().min(1).max(104),
  budget: z.number().min(1),
});

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.query.briefs.findMany({
      where: eq(briefs.userId, user.id),
      orderBy: [desc(briefs.createdAt)],
    });
    return NextResponse.json({ briefs: rows.map(briefToDTO) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = createBriefSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const [row] = await db
      .insert(briefs)
      .values({
        userId: user.id,
        specification: parsed.data.specification,
        tenderType: parsed.data.tenderType,
        timeframeWeeks: parsed.data.timeframeWeeks,
        budget: parsed.data.budget.toFixed(2),
        status: "under_review",
      })
      .returning();
    if (!row) throw new Error("Failed to create brief.");

    return NextResponse.json({ brief: briefToDTO(row) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
