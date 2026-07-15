"use client";

import { useState } from "react";
import { createPublicClient, createWalletClient, custom, http, keccak256, stringToHex } from "viem";
import type { BriefDTO } from "@/lib/dto";
import { ESCROW_ABI, ESCROW_CHAIN, escrowContractAddress, escrowProviderAddress, testnetGbpToEth } from "@/lib/web3";

type Step = "idle" | "connecting" | "depositing" | "confirming" | "recording";

export function SmartContractDeposit({ brief, onFunded }: { brief: BriefDTO; onFunded: (b: BriefDTO) => void }) {
  const [address, setAddress] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  const configured = (() => {
    try {
      escrowContractAddress();
      escrowProviderAddress();
      return true;
    } catch {
      return false;
    }
  })();

  async function connect() {
    if (!window.ethereum) {
      setError("No wallet found — install MetaMask or another browser wallet to use smart-contract escrow.");
      return;
    }
    setStep("connecting");
    setError(null);
    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      setAddress(accounts[0] ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStep("idle");
    }
  }

  async function depositAndRecord() {
    if (!address || !window.ethereum) return;
    setError(null);
    try {
      setStep("depositing");
      const walletClient = createWalletClient({ chain: ESCROW_CHAIN, transport: custom(window.ethereum) });
      const publicClient = createPublicClient({ chain: ESCROW_CHAIN, transport: http() });

      const engagementId = keccak256(stringToHex(brief.id));
      const depositWei = testnetGbpToEth(brief.depositAmount ?? 0);
      const balanceWei = testnetGbpToEth(brief.balanceAmount ?? 0);

      const hash = await walletClient.writeContract({
        address: escrowContractAddress(),
        abi: ESCROW_ABI,
        functionName: "fund",
        args: [engagementId, escrowProviderAddress(), [depositWei, balanceWei]],
        value: depositWei + balanceWei,
        account: address as `0x${string}`,
        chain: ESCROW_CHAIN,
      });

      setStep("confirming");
      await publicClient.waitForTransactionReceipt({ hash });

      setStep("recording");
      const res = await fetch("/api/escrow/smart-contract/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId: brief.id, txHash: hash, clientWalletAddress: address }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not confirm the on-chain deposit.");
      onFunded(body.brief);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStep("idle");
    }
  }

  if (!configured) {
    return (
      <p style={{ fontSize: 13, opacity: 0.7, marginTop: "var(--space-3)" }}>
        Smart-contract escrow isn&rsquo;t configured yet on this deployment — the contract needs to be deployed to
        Sepolia and its address set in the environment (see contracts/README.md).
      </p>
    );
  }

  return (
    <div style={{ marginTop: "var(--space-4)" }}>
      <p style={{ fontSize: 12, opacity: 0.65, marginBottom: "var(--space-2)" }}>
        Sepolia testnet. For this demo, your GBP deposit is converted to ETH at a fixed indicative rate — a
        production build would settle in a stablecoin or use a price oracle.
      </p>
      {error && <p style={{ fontSize: 13, color: "#a3402b", marginBottom: "var(--space-2)" }}>{error}</p>}
      {!address ? (
        <button className="btn btn-secondary btn-block" disabled={step === "connecting"} onClick={connect}>
          {step === "connecting" ? "Connecting…" : "Connect wallet"}
        </button>
      ) : (
        <>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: "var(--space-2)" }}>
            Connected: {address.slice(0, 6)}…{address.slice(-4)}
          </div>
          <button className="btn btn-primary btn-block" disabled={step !== "idle"} onClick={depositAndRecord}>
            {step === "depositing" && "Confirm in wallet…"}
            {step === "confirming" && "Waiting for confirmation…"}
            {step === "recording" && "Finalising…"}
            {step === "idle" && "Deposit to smart contract"}
          </button>
        </>
      )}
    </div>
  );
}
