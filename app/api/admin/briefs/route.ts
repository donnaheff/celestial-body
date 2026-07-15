import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { briefs } from "@/db/schema";
import { requireAdmin, handleApiError } from "@/lib/api-helpers";
import { briefToDTO } from "@/lib/dto";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.query.briefs.findMany({
      orderBy: [desc(briefs.createdAt)],
      with: { user: { columns: { email: true, name: true } } },
    });
    return NextResponse.json({
      briefs: rows.map((r) => ({ ...briefToDTO(r), clientEmail: r.user.email, clientName: r.user.name })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
