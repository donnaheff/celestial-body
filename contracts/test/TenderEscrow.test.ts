import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("TenderEscrow", function () {
  async function deployFixture() {
    const [arbiter, client, provider, stranger] = await ethers.getSigners();
    const TenderEscrow = await ethers.getContractFactory("TenderEscrow");
    const contract = await TenderEscrow.deploy(arbiter.address);
    await contract.waitForDeployment();

    const engagementId = ethers.keccak256(ethers.toUtf8Bytes("brief-123"));
    const deposit = ethers.parseEther("0.4");
    const balance = ethers.parseEther("0.6");

    return { contract, arbiter, client, provider, stranger, engagementId, deposit, balance };
  }

  it("funds an engagement with milestones summing to msg.value", async function () {
    const { contract, client, provider, engagementId, deposit, balance } = await loadFixture(deployFixture);

    await expect(
      contract.connect(client).fund(engagementId, provider.address, [deposit, balance], { value: deposit + balance })
    )
      .to.emit(contract, "EscrowFunded")
      .withArgs(engagementId, client.address, provider.address, deposit + balance, [deposit, balance]);

    const engagement = await contract.getEngagement(engagementId);
    expect(engagement.client).to.equal(client.address);
    expect(engagement.status).to.equal(1); // Funded
  });

  it("rejects funding when milestone amounts don't sum to msg.value", async function () {
    const { contract, client, provider, engagementId, deposit, balance } = await loadFixture(deployFixture);
    await expect(
      contract.connect(client).fund(engagementId, provider.address, [deposit, balance], { value: deposit })
    ).to.be.revertedWithCustomError(contract, "AmountMismatch");
  });

  it("releases a milestone only once both client and provider approve", async function () {
    const { contract, client, provider, engagementId, deposit, balance } = await loadFixture(deployFixture);
    await contract.connect(client).fund(engagementId, provider.address, [deposit, balance], { value: deposit + balance });

    await contract.connect(client).approveMilestone(engagementId, 0);
    let milestone = await contract.getMilestone(engagementId, 0);
    expect(milestone.released).to.equal(false);

    const before = await ethers.provider.getBalance(provider.address);
    const txResponse = await contract.connect(provider).approveMilestone(engagementId, 0);
    await expect(txResponse).to.emit(contract, "MilestoneReleased").withArgs(engagementId, 0, deposit);
    const receipt = await txResponse.wait();
    const gasCost = receipt!.gasUsed * receipt!.gasPrice;

    milestone = await contract.getMilestone(engagementId, 0);
    expect(milestone.released).to.equal(true);
    const after = await ethers.provider.getBalance(provider.address);
    // Provider both sent the tx (paying gas) and received the milestone payout.
    expect(after - before + gasCost).to.equal(deposit);
  });

  it("prevents a stranger from approving a milestone", async function () {
    const { contract, client, provider, stranger, engagementId, deposit, balance } = await loadFixture(deployFixture);
    await contract.connect(client).fund(engagementId, provider.address, [deposit, balance], { value: deposit + balance });
    await expect(contract.connect(stranger).approveMilestone(engagementId, 0)).to.be.revertedWithCustomError(
      contract,
      "NotParticipant"
    );
  });

  it("lets the arbiter split remaining funds after a dispute", async function () {
    const { contract, client, provider, arbiter, engagementId, deposit, balance } = await loadFixture(deployFixture);
    await contract.connect(client).fund(engagementId, provider.address, [deposit, balance], { value: deposit + balance });
    await contract.connect(client).raiseDispute(engagementId);

    const clientBefore = await ethers.provider.getBalance(client.address);
    const providerBefore = await ethers.provider.getBalance(provider.address);

    await contract.connect(arbiter).resolveDispute(engagementId, 5000); // 50/50 split

    const clientAfter = await ethers.provider.getBalance(client.address);
    const providerAfter = await ethers.provider.getBalance(provider.address);
    const half = (deposit + balance) / 2n;

    expect(clientAfter - clientBefore).to.equal(half);
    expect(providerAfter - providerBefore).to.equal(half);
  });

  it("refunds the client after the dispute timeout if the arbiter never resolves", async function () {
    const { contract, client, provider, engagementId, deposit, balance } = await loadFixture(deployFixture);
    await contract.connect(client).fund(engagementId, provider.address, [deposit, balance], { value: deposit + balance });
    await contract.connect(client).raiseDispute(engagementId);

    await expect(contract.resolveDisputeByTimeout(engagementId)).to.be.revertedWithCustomError(
      contract,
      "TimeoutNotReached"
    );

    await time.increase(14 * 24 * 60 * 60 + 1);

    const clientBefore = await ethers.provider.getBalance(client.address);
    await contract.resolveDisputeByTimeout(engagementId);
    const clientAfter = await ethers.provider.getBalance(client.address);

    expect(clientAfter - clientBefore).to.equal(deposit + balance);
  });
});
