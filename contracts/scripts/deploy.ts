import { ethers } from "hardhat";

async function main() {
  const arbiter = process.env.ARBITER_ADDRESS;
  if (!arbiter) throw new Error("ARBITER_ADDRESS is not set — see .env.example");

  const TenderEscrow = await ethers.getContractFactory("TenderEscrow");
  const contract = await TenderEscrow.deploy(arbiter);
  await contract.waitForDeployment();

  console.log("TenderEscrow deployed to:", await contract.getAddress());
  console.log("Arbiter:", arbiter);
  console.log("\nSet NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS in the app's .env to the address above.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
