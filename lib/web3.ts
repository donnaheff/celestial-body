import { sepolia } from "viem/chains";

/** ABI subset actually used by the app — generated from contracts/TenderEscrow.sol. */
export const ESCROW_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "engagementId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "client", type: "address" },
      { indexed: true, internalType: "address", name: "provider", type: "address" },
      { indexed: false, internalType: "uint256", name: "totalAmount", type: "uint256" },
      { indexed: false, internalType: "uint256[]", name: "milestoneAmounts", type: "uint256[]" },
    ],
    name: "EscrowFunded",
    type: "event",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "engagementId", type: "bytes32" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "approveMilestone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "engagementId", type: "bytes32" },
      { internalType: "address payable", name: "provider", type: "address" },
      { internalType: "uint256[]", name: "milestoneAmounts", type: "uint256[]" },
    ],
    name: "fund",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "engagementId", type: "bytes32" }],
    name: "getEngagement",
    outputs: [
      { internalType: "address", name: "client", type: "address" },
      { internalType: "address", name: "provider", type: "address" },
      { internalType: "enum TenderEscrow.Status", name: "status", type: "uint8" },
      { internalType: "uint256", name: "disputeRaisedAt", type: "uint256" },
      { internalType: "uint256", name: "milestoneCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "engagementId", type: "bytes32" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "getMilestone",
    outputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bool", name: "clientApproved", type: "bool" },
      { internalType: "bool", name: "providerApproved", type: "bool" },
      { internalType: "bool", name: "released", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ESCROW_STATUS = ["Uninitialized", "Funded", "Disputed", "Closed"] as const;

export const ESCROW_CHAIN = sepolia;

export function escrowContractAddress(): `0x${string}` {
  const addr = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS;
  if (!addr) throw new Error("NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS is not set — deploy contracts/ first, see contracts/README.");
  return addr as `0x${string}`;
}

export function escrowProviderAddress(): `0x${string}` {
  const addr = process.env.NEXT_PUBLIC_ESCROW_PROVIDER_ADDRESS;
  if (!addr) throw new Error("NEXT_PUBLIC_ESCROW_PROVIDER_ADDRESS is not set — Acme Bids' payout wallet.");
  return addr as `0x${string}`;
}

/**
 * Testnet-only, indicative GBP→ETH rate used purely so the demo has *some*
 * on-chain value to move. A production build would settle in a stablecoin
 * (e.g. USDC) or price via an oracle (e.g. Chainlink) instead of a fixed rate.
 */
export function testnetGbpToEth(gbp: number): bigint {
  const rate = Number(process.env.NEXT_PUBLIC_TEST_ETH_PER_GBP ?? "0.0003");
  const eth = gbp * rate;
  return BigInt(Math.round(eth * 1e18));
}
