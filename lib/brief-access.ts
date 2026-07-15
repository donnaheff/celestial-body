import { eq } from "drizzle-orm";
import { db } from "@/db";
import { briefs } from "@/db/schema";
import { ApiError } from "@/lib/api-helpers";

/** Loads a brief and asserts it belongs to `userId` (unless `allowAdmin` bypasses ownership). */
export async function loadOwnedBrief(id: string, userId: string, allowAdminBypass = false) {
  const brief = await db.query.briefs.findFirst({ where: eq(briefs.id, id) });
  if (!brief) throw new ApiError("Brief not found.", 404);
  if (brief.userId !== userId && !allowAdminBypass) throw new ApiError("Brief not found.", 404);
  return brief;
}
