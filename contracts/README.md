# TenderEscrow — smart-contract escrow

A standalone Hardhat project (kept separate from the Next.js app's
dependency tree). Deploys `TenderEscrow.sol`, a milestone escrow contract
used as the "smart contract escrow" funding option on the client dashboard.

## What it does

- One contract instance serves every brief. Each brief gets a deterministic
  `engagementId = keccak256(briefId)`.
- The client calls `fund(engagementId, providerAddress, milestoneAmounts)`
  with `msg.value` equal to the sum of the milestone amounts (deposit +
  balance, mirroring the 40/60 split used elsewhere in the app).
- A milestone releases to the provider once **both** the client and the
  provider call `approveMilestone` for it.
- Either party can `raiseDispute`; the configured `arbiter` address can then
  `resolveDispute` with a client/provider split. If the arbiter never acts,
  either party can call `resolveDisputeByTimeout` after 14 days to refund
  whatever remains to the client — a deliberately simple, payer-favoring
  default that should be reviewed with legal before relying on it for real
  engagements.
- See the NatSpec comments in `contracts/TenderEscrow.sol` for the full
  design; `test/TenderEscrow.test.ts` exercises every path (funding,
  mutual-approval release, disputes, dispute timeout, access control).

## Setup

```bash
cd contracts
npm install
cp .env.example .env   # fill in SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, ARBITER_ADDRESS
```

- `SEPOLIA_RPC_URL` — an RPC endpoint (Alchemy, Infura, or similar).
- `DEPLOYER_PRIVATE_KEY` — a wallet funded with Sepolia test ETH from a
  faucet. Never use a key that holds real funds.
- `ARBITER_ADDRESS` — the address that can resolve disputes. Use a multisig
  in production; a single EOA is fine for testnet development.

## Compile & test

```bash
npm test
```

This downloads the native Solidity compiler from `binaries.soliditylang.org`
the first time you run it. **If you're running inside a network-restricted
sandbox that blocks that host** (this happens in some CI/agent
environments), use the local fallback instead, which compiles with the
pure-JS `solc` npm package and writes a Hardhat-shaped artifact so the same
test suite still runs against Hardhat's local in-memory network:

```bash
npm run test:local
```

Both paths compile the same `contracts/TenderEscrow.sol` and run the same
`test/TenderEscrow.test.ts` — `test:local` just sources the compiler
differently. Prefer plain `npm test` whenever your network allows it.

## Deploy to Sepolia

```bash
npm run deploy:sepolia
```

Prints the deployed contract address. Set it in the **app's** `.env` (not
this directory's) as `NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS`, along with
`NEXT_PUBLIC_ESCROW_PROVIDER_ADDRESS` (Acme Bids' payout wallet — the
address that receives released milestones).

## Known simplifications (documented, not hidden)

- **Currency**: the contract holds native ETH. The app converts each
  brief's GBP amounts to ETH at a fixed, `.env`-configurable indicative
  rate (`NEXT_PUBLIC_TEST_ETH_PER_GBP`) purely so the testnet demo has
  *something* to move on-chain. A production build should settle in a
  stablecoin (e.g. USDC, via ERC-20 `transferFrom`) or price through an
  oracle (e.g. Chainlink) instead.
- **No upgradeability**: intentional, for auditability — a new brief
  category or fee structure would deploy a new contract version rather than
  migrating this one in place.
- **Arbiter is a single trusted address**: fine for a testnet pilot; swap
  for a multisig (e.g. Safe) before holding real client funds.
