import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { escrowTransactions } from "@/db/schema";
import { requireUser, ApiError, handleApiError } from "@/lib/api-helpers";
import { loadOwnedBrief } from "@/lib/brief-access";
import { initializePayment } from "@/lib/flutterwave";

const initSchema = z.object({ briefId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = initSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const brief = await loadOwnedBrief(parsed.data.briefId, user.id);
    if (brief.status !== "escrow_pending") {
      throw new ApiError("This brief isn't awaiting escrow funding.", 409);
    }
    if (!brief.depositAmount) {
      throw new ApiError("No deposit amount on this brief.", 409);
    }

    const txRef = `acmebids_${brief.id}_${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    await db.insert(escrowTransactions).values({
      briefId: brief.id,
      method: "flutterwave",
      status: "pending",
      amount: brief.depositAmount,
      currency: "GBP",
      flwTxRef: txRef,
    });

    const paymentLink = await initializePayment({
      txRef,
      amount: Number(brief.depositAmount),
      currency: "GBP",
      redirectUrl: `${appUrl}/dashboard`,
      customerEmail: user.email!,
      customerName: user.name ?? undefined,
      title: "Acme Bids — escrow deposit",
      description: `Deposit for ${brief.tenderType}`,
    });

    return NextResponse.json({ paymentLink });
  } catch (err) {
    return handleApiError(err);
  }
}
