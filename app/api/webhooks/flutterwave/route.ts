import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { briefs, escrowTransactions } from "@/db/schema";
import { verifyTransaction } from "@/lib/flutterwave";

/**
 * Flutterwave webhook. Verification is two-layered:
 *  1. The `verif-hash` header must match the secret hash configured in the
 *     Flutterwave dashboard (Settings → Webhooks) — this is Flutterwave's
 *     documented verification scheme (a shared secret string, not HMAC).
 *  2. We never trust the webhook body's amount/status directly — we
 *     re-fetch the transaction from Flutterwave's API with our secret key
 *     and compare before marking anything funded.
 */
export async function POST(req: Request) {
  const expectedHash = process.env.FLW_WEBHOOK_SECRET_HASH;
  const receivedHash = req.headers.get("verif-hash");

  if (!expectedHash || !receivedHash || receivedHash !== expectedHash) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const txRef: string | undefined = payload?.data?.tx_ref;
  const transactionId: number | undefined = payload?.data?.id;
  if (!txRef || !transactionId) {
    return NextResponse.json({ ok: true }); // acknowledge, nothing actionable
  }

  const escrowTx = await db.query.escrowTransactions.findFirst({
    where: eq(escrowTransactions.flwTxRef, txRef),
  });
  if (!escrowTx) {
    return NextResponse.json({ ok: true }); // unknown tx_ref, acknowledge and ignore
  }
  if (escrowTx.status === "successful") {
    return NextResponse.json({ ok: true }); // already processed — webhook delivery is at-least-once
  }

  try {
    const verified = await verifyTransaction(transactionId);

    const amountMatches = Math.round(verified.amount) === Math.round(Number(escrowTx.amount));
    const isSuccessful = verified.status === "successful" && verified.tx_ref === txRef && amountMatches;

    await db
      .update(escrowTransactions)
      .set({
        status: isSuccessful ? "successful" : "failed",
        flwTransactionId: String(verified.id),
        rawPayload: payload,
        updatedAt: new Date(),
      })
      .where(eq(escrowTransactions.id, escrowTx.id));

    if (isSuccessful) {
      await db
        .update(briefs)
        .set({ status: "escrow_funded", escrowMethod: "flutterwave", updatedAt: new Date() })
        .where(eq(briefs.id, escrowTx.briefId));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Flutterwave webhook verification failed", err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
