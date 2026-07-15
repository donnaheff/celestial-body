const FLW_BASE = "https://api.flutterwave.com/v3";

function secretKey(): string {
  const key = process.env.FLW_SECRET_KEY;
  if (!key) throw new Error("FLW_SECRET_KEY is not set — see .env.example");
  return key;
}

interface InitializePaymentArgs {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customerEmail: string;
  customerName?: string;
  title: string;
  description: string;
}

interface FlutterwaveInitResponse {
  status: "success" | "error";
  message: string;
  data?: { link: string };
}

/** Creates a Flutterwave Standard hosted checkout session. Server-side only — never expose FLW_SECRET_KEY to the client. */
export async function initializePayment(args: InitializePaymentArgs): Promise<string> {
  const res = await fetch(`${FLW_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: args.txRef,
      amount: args.amount,
      currency: args.currency,
      redirect_url: args.redirectUrl,
      customer: { email: args.customerEmail, name: args.customerName },
      customizations: { title: args.title, description: args.description },
    }),
  });

  const body: FlutterwaveInitResponse = await res.json();
  if (!res.ok || body.status !== "success" || !body.data?.link) {
    throw new Error(body.message || "Flutterwave payment initialization failed.");
  }
  return body.data.link;
}

export interface FlutterwaveVerifiedTransaction {
  id: number;
  tx_ref: string;
  status: string;
  amount: number;
  currency: string;
}

/**
 * Re-verifies a transaction directly with Flutterwave using our secret key.
 * Always call this before trusting a webhook payload — never mark escrow
 * funded from the webhook body alone.
 */
export async function verifyTransaction(transactionId: string | number): Promise<FlutterwaveVerifiedTransaction> {
  const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const body = await res.json();
  if (!res.ok || body.status !== "success") {
    throw new Error(body.message || "Flutterwave transaction verification failed.");
  }
  return body.data as FlutterwaveVerifiedTransaction;
}
