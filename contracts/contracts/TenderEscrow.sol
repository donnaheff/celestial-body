// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TenderEscrow
/// @notice Minimal milestone escrow for Acme Bids engagements. One deployment
///         serves every brief; each brief gets its own `engagementId` derived
///         off-chain as keccak256(briefId). Funds are held natively (ETH on
///         whatever chain this is deployed to — Sepolia for this build) and
///         released per-milestone only once BOTH the client and the provider
///         approve, or by the platform arbiter after a dispute is resolved.
/// @dev Deliberately simple: no upgradeability, no token support, no partial
///      milestone amendment. A production deployment holding real client
///      funds should get an independent audit before use with mainnet value.
contract TenderEscrow is ReentrancyGuard {
    enum Status {
        Uninitialized,
        Funded,
        Disputed,
        Closed
    }

    struct Milestone {
        uint256 amount;
        bool clientApproved;
        bool providerApproved;
        bool released;
    }

    struct Engagement {
        address client;
        address payable provider;
        Status status;
        uint256 disputeRaisedAt;
        Milestone[] milestones;
    }

    /// @notice Platform address that can resolve disputes. Trusted third party —
    ///         should be a multisig in production, not an EOA.
    address public immutable arbiter;

    /// @notice If a dispute sits unresolved this long, either party can trigger
    ///         a default resolution that refunds all remaining funds to the
    ///         client. This is a deliberately simple, payer-favoring fallback —
    ///         review with legal before relying on it for real engagements.
    uint256 public constant DISPUTE_TIMEOUT = 14 days;

    mapping(bytes32 => Engagement) private engagements;

    event EscrowFunded(
        bytes32 indexed engagementId,
        address indexed client,
        address indexed provider,
        uint256 totalAmount,
        uint256[] milestoneAmounts
    );
    event MilestoneApproved(bytes32 indexed engagementId, uint256 index, address approver);
    event MilestoneReleased(bytes32 indexed engagementId, uint256 index, uint256 amount);
    event DisputeRaised(bytes32 indexed engagementId, address raisedBy);
    event DisputeResolved(bytes32 indexed engagementId, uint256 clientAmount, uint256 providerAmount);
    event DisputeTimedOut(bytes32 indexed engagementId, uint256 refundedToClient);

    error NotParticipant();
    error NotArbiter();
    error WrongStatus();
    error AlreadyInitialized();
    error AmountMismatch();
    error NoMilestones();
    error InvalidIndex();
    error AlreadyReleased();
    error TimeoutNotReached();
    error InvalidSplit();
    error TransferFailed();

    modifier onlyArbiter() {
        if (msg.sender != arbiter) revert NotArbiter();
        _;
    }

    constructor(address _arbiter) {
        require(_arbiter != address(0), "arbiter required");
        arbiter = _arbiter;
    }

    /// @notice Opens and funds a new engagement in one transaction.
    /// @param engagementId keccak256 of the off-chain brief id — must be unused.
    /// @param provider Payee for released milestones (the writer/consultancy payout wallet).
    /// @param milestoneAmounts Amounts per milestone, in wei, summing to msg.value.
    function fund(
        bytes32 engagementId,
        address payable provider,
        uint256[] calldata milestoneAmounts
    ) external payable nonReentrant {
        Engagement storage e = engagements[engagementId];
        if (e.status != Status.Uninitialized) revert AlreadyInitialized();
        if (milestoneAmounts.length == 0) revert NoMilestones();

        uint256 total;
        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            total += milestoneAmounts[i];
            e.milestones.push(Milestone({ amount: milestoneAmounts[i], clientApproved: false, providerApproved: false, released: false }));
        }
        if (total != msg.value) revert AmountMismatch();

        e.client = msg.sender;
        e.provider = provider;
        e.status = Status.Funded;

        emit EscrowFunded(engagementId, msg.sender, provider, total, milestoneAmounts);
    }

    /// @notice Client or provider approves a milestone. Once both have approved,
    ///         it releases automatically.
    function approveMilestone(bytes32 engagementId, uint256 index) external nonReentrant {
        Engagement storage e = engagements[engagementId];
        if (e.status != Status.Funded) revert WrongStatus();
        if (index >= e.milestones.length) revert InvalidIndex();
        if (msg.sender != e.client && msg.sender != e.provider) revert NotParticipant();

        Milestone storage m = e.milestones[index];
        if (m.released) revert AlreadyReleased();

        if (msg.sender == e.client) m.clientApproved = true;
        if (msg.sender == e.provider) m.providerApproved = true;

        emit MilestoneApproved(engagementId, index, msg.sender);

        if (m.clientApproved && m.providerApproved) {
            _release(engagementId, e, index);
        }
    }

    function _release(bytes32 engagementId, Engagement storage e, uint256 index) private {
        Milestone storage m = e.milestones[index];
        m.released = true;

        (bool ok, ) = e.provider.call{ value: m.amount }("");
        if (!ok) revert TransferFailed();

        emit MilestoneReleased(engagementId, index, m.amount);

        if (_allReleased(e)) {
            e.status = Status.Closed;
        }
    }

    function _allReleased(Engagement storage e) private view returns (bool) {
        for (uint256 i = 0; i < e.milestones.length; i++) {
            if (!e.milestones[i].released) return false;
        }
        return true;
    }

    /// @notice Either party can flag the engagement as disputed, freezing
    ///         further milestone approvals until the arbiter resolves it.
    function raiseDispute(bytes32 engagementId) external {
        Engagement storage e = engagements[engagementId];
        if (e.status != Status.Funded) revert WrongStatus();
        if (msg.sender != e.client && msg.sender != e.provider) revert NotParticipant();

        e.status = Status.Disputed;
        e.disputeRaisedAt = block.timestamp;

        emit DisputeRaised(engagementId, msg.sender);
    }

    /// @notice Arbiter splits whatever remains unreleased between client and provider.
    /// @param clientBps Share of the remaining balance paid to the client, in basis points (0–10000).
    function resolveDispute(bytes32 engagementId, uint256 clientBps) external onlyArbiter nonReentrant {
        Engagement storage e = engagements[engagementId];
        if (e.status != Status.Disputed) revert WrongStatus();
        if (clientBps > 10_000) revert InvalidSplit();

        uint256 remaining = _remainingBalance(e);
        for (uint256 i = 0; i < e.milestones.length; i++) {
            e.milestones[i].released = true;
        }
        e.status = Status.Closed;

        uint256 clientAmount = (remaining * clientBps) / 10_000;
        uint256 providerAmount = remaining - clientAmount;

        if (clientAmount > 0) {
            (bool okClient, ) = e.client.call{ value: clientAmount }("");
            if (!okClient) revert TransferFailed();
        }
        if (providerAmount > 0) {
            (bool okProvider, ) = e.provider.call{ value: providerAmount }("");
            if (!okProvider) revert TransferFailed();
        }

        emit DisputeResolved(engagementId, clientAmount, providerAmount);
    }

    /// @notice If the arbiter never resolves a dispute within DISPUTE_TIMEOUT,
    ///         either party can trigger a default refund of remaining funds
    ///         to the client. Callable by anyone once the timeout has passed
    ///         so an unresponsive counterparty can't block it.
    function resolveDisputeByTimeout(bytes32 engagementId) external nonReentrant {
        Engagement storage e = engagements[engagementId];
        if (e.status != Status.Disputed) revert WrongStatus();
        if (block.timestamp < e.disputeRaisedAt + DISPUTE_TIMEOUT) revert TimeoutNotReached();

        uint256 remaining = _remainingBalance(e);
        for (uint256 i = 0; i < e.milestones.length; i++) {
            e.milestones[i].released = true;
        }
        e.status = Status.Closed;

        if (remaining > 0) {
            (bool ok, ) = e.client.call{ value: remaining }("");
            if (!ok) revert TransferFailed();
        }

        emit DisputeTimedOut(engagementId, remaining);
    }

    function _remainingBalance(Engagement storage e) private view returns (uint256 sum) {
        for (uint256 i = 0; i < e.milestones.length; i++) {
            if (!e.milestones[i].released) sum += e.milestones[i].amount;
        }
    }

    /* ── Views ──────────────────────────────────────────────────────────── */

    function getEngagement(bytes32 engagementId)
        external
        view
        returns (address client, address provider, Status status, uint256 disputeRaisedAt, uint256 milestoneCount)
    {
        Engagement storage e = engagements[engagementId];
        return (e.client, e.provider, e.status, e.disputeRaisedAt, e.milestones.length);
    }

    function getMilestone(bytes32 engagementId, uint256 index)
        external
        view
        returns (uint256 amount, bool clientApproved, bool providerApproved, bool released)
    {
        Milestone storage m = engagements[engagementId].milestones[index];
        return (m.amount, m.clientApproved, m.providerApproved, m.released);
    }
}
