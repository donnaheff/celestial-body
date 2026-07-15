import { NextResponse } from "next/server";
import { createPublicClient, http, keccak256, stringToHex, isAddress } from "viem";
import { z } from "zod";
import { db } from "@/db";
import { briefs, escrowTransactions } from "@/db/schema";
import { requireUser, ApiError, handleApiError } from "@/lib/api-helpers";
import { loadOwnedBrief } from "@/lib/brief-access";
import { briefToDTO } from "@/lib/dto";
import { ESCROW_ABI, ESCROW_CHAIN, escrowContractAddress } from "@/lib/web3";
import { eq } from "drizzle-orm";

const recordSchema = z.object({
  briefId: z.string().uuid(),
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  clientWalletAddress: z.string().refine(isAddress, "Invalid wallet address"),
});

/**
 * Confirms an on-chain deposit before marking escrow funded. We never trust
 * the browser's say-so alone — the transaction receipt and the contract's
 * own state are both re-read server-side via RPC.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = recordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const brief = await loadOwnedBrief(parsed.data.briefId, user.id);
    if (brief.status !== "escrow_pending") {
      throw new ApiError("This brief isn't awaiting escrow funding.", 409);
    }

    const contractAddress = escrowContractAddress();
    const rpcUrl = process.env.ESCROW_RPC_URL;
    const publicClient = createPublicClient({
      chain: ESCROW_CHAIN,
      transport: rpcUrl ? http(rpcUrl) : http(),
    });

    const receipt = await publicClient.getTransactionReceipt({ hash: parsed.data.txHash as `0x${string}` });
    if (receipt.status !== "success") throw new ApiError("That transaction did not succeed on-chain.", 422);
    if (receipt.to?.toLowerCase() !== contractAddress.toLowerCase()) {
      throw new ApiError("That transaction wasn't sent to the escrow contract.", 422);
    }

    const engagementId = keccak256(stringToHex(brief.id));
    const [client, , status] = await publicClient.readContract({
      address: contractAddress,
      abi: ESCROW_ABI,
      functionName: "getEngagement",
      args: [engagementId],
    });

    if (client.toLowerCase() !== parsed.data.clientWalletAddress.toLowerCase()) {
      throw new ApiError("Wallet address doesn't match the on-chain engagement.", 422);
    }
    if (status !== 1 /* Funded */) {
      throw new ApiError("Escrow contract isn't in a funded state for this brief.", 422);
    }

    await db.insert(escrowTransactions).values({
      briefId: brief.id,
      method: "smart_contract",
      status: "successful",
      amount: brief.depositAmount ?? "0",
      currency: "GBP",
      chainId: ESCROW_CHAIN.id,
      contractAddress,
      depositTxHash: parsed.data.txHash,
      clientWalletAddress: parsed.data.clientWalletAddress,
    });

    const [updated] = await db
      .update(briefs)
      .set({ status: "escrow_funded", escrowMethod: "smart_contract", updatedAt: new Date() })
      .where(eq(briefs.id, brief.id))
      .returning();
    if (!updated) throw new ApiError("Brief not found.", 404);

    return NextResponse.json({ brief: briefToDTO(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
