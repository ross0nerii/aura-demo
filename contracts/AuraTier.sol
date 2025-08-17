// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";

/// @title AuraScoreBank — demo bank that derives loan terms from an encrypted Aura Score
/// @notice Implements deposits/liquidity, borrow/repay, judge tier override,
///         encrypted-score intake, and public decryption flow hooks (oracle).
contract AuraScoreBank {
    // ----------------
    // Access control
    // ----------------
    address public owner;
    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    constructor() { owner = msg.sender; }

    // ----------------
    // Parameters
    // ----------------
    // Score thresholds -> tiers
    uint64 public constant TIER1_MIN = 120;
    uint64 public constant TIER2_MIN = 60;

    // Caps per tier
    uint256 public constant TIER1_CAP_WEI = 1 ether;     // 1 ETH
    uint256 public constant TIER2_CAP_WEI = 0.5 ether;   // 0.5 ETH
    uint256 public constant TIER3_CAP_WEI = 0.1 ether;   // 0.1 ETH

    // Rates per tier (basis points)
    uint16  public constant TIER1_RATE_BPS = 500;   // 5%
    uint16  public constant TIER2_RATE_BPS = 1000;  // 10%
    uint16  public constant TIER3_RATE_BPS = 1500;  // 15%

    // ----------------
    // State
    // ----------------
    mapping(address => uint8) public tierOverride; // 0 => none, 1..3 => fixed tier set by judge
    mapping(address => uint256) public debtWei;

    // Last computed encrypted terms from a submitted score
    mapping(address => euint64) private lastCapEnc;   // encrypted cap in WEI (fit in 64-bit)
    mapping(address => euint64) private lastRateEnc;  // encrypted rate (bps)

    // Publicly decrypted cache (populated by oracle callback)
    mapping(address => uint256) public lastCapWei;
    mapping(address => uint16)  public lastRateBps;

    // Decryption oracle address
    address public decryptionOracle;

    // ---------- Events ----------
    event LiquidityDeposited(address indexed from, uint256 amount);
    event Borrowed(address indexed user, uint256 amountWei, uint16 rateBps);
    event Repaid(address indexed user, uint256 amountWei);
    event TierOverridden(address indexed user, uint8 tier);
    event ScoreSubmitted(address indexed user);
    event TermsRequestedForDecryption(address indexed user, bytes32 requestId);
    event TermsDecrypted(address indexed user, uint256 capWei, uint16 rateBps);

    // ---------- Admin ----------
    function setDecryptionOracle(address _oracle) external onlyOwner {
        decryptionOracle = _oracle;
    }

    function depositLiquidity() external payable {
        require(msg.value > 0, "no value");
        emit LiquidityDeposited(msg.sender, msg.value);
    }

    /// Judges/testers: set fixed tier (1..3). 0 clears override.
    function setTier(address user, uint8 tier) external onlyOwner {
        require(tier <= 3, "tier range");
        tierOverride[user] = tier;
        emit TierOverridden(user, tier);
    }

    // -----------------------------
    // Encrypted Score Intake & Terms
    // -----------------------------
    /// @notice User submits encrypted score; contract computes encrypted terms (cap/rate) and stores handles.
    function submitScore(externalEuint64 scoreExt, bytes calldata attestation) external {
        // Extract encrypted score handle; validates attestation
        euint64 score = FHE.fromExternal(scoreExt, attestation);

        // Some versions of FHE lib don't have gte/lte.
        // Compute (score >= TIERx_MIN) as (score > MIN) OR (score == MIN)
        ebool geT1 = FHE.or(
            FHE.gt(score, FHE.asEuint64(TIER1_MIN)),
            FHE.eq(score, FHE.asEuint64(TIER1_MIN))
        );
        ebool geT2 = FHE.or(
            FHE.gt(score, FHE.asEuint64(TIER2_MIN)),
            FHE.eq(score, FHE.asEuint64(TIER2_MIN))
        );

        // Caps enc
        euint64 capT3 = FHE.asEuint64(uint64(TIER3_CAP_WEI));
        euint64 capT2 = FHE.asEuint64(uint64(TIER2_CAP_WEI));
        euint64 capT1 = FHE.asEuint64(uint64(TIER1_CAP_WEI));
        euint64 tempCap = FHE.select(geT2, capT2, capT3);
        euint64 capEnc = FHE.select(geT1, capT1, tempCap);

        // Rates enc (bps)
        euint64 rT3 = FHE.asEuint64(TIER3_RATE_BPS);
        euint64 rT2 = FHE.asEuint64(TIER2_RATE_BPS);
        euint64 rT1 = FHE.asEuint64(TIER1_RATE_BPS);
        euint64 tempRate = FHE.select(geT2, rT2, rT3);
        euint64 rateEnc = FHE.select(geT1, rT1, tempRate);

        // Save encrypted handles for this user
        lastCapEnc[msg.sender] = capEnc;
        lastRateEnc[msg.sender] = rateEnc;

        // Allow user and this contract to access them later
        FHE.allow(capEnc, msg.sender);
        FHE.allow(rateEnc, msg.sender);
        FHE.allowThis(capEnc);
        FHE.allowThis(rateEnc);

        emit ScoreSubmitted(msg.sender);
    }

    /// @notice Mark stored encrypted terms as publicly decryptable and emit a request id for offchain oracle.
    function requestPublicDecryptionOfTerms() external {
        euint64 capEnc = lastCapEnc[msg.sender];
        euint64 rateEnc = lastRateEnc[msg.sender];
        FHE.makePubliclyDecryptable(capEnc);
        FHE.makePubliclyDecryptable(rateEnc);
        bytes32 rid = keccak256(abi.encodePacked(block.number, msg.sender, capEnc, rateEnc));
        emit TermsRequestedForDecryption(msg.sender, rid);
    }

    /// @notice Oracle callback — sets lastCapWei/lastRateBps after public decryption (signature checks omitted).
    function oracleCallbackDecryptedTerms(address user, uint256 capWei, uint16 rateBps) external {
        require(msg.sender == decryptionOracle, "bad oracle");
        require(
            rateBps == TIER1_RATE_BPS || rateBps == TIER2_RATE_BPS || rateBps == TIER3_RATE_BPS,
            "rate"
        );
        require(
            capWei == TIER1_CAP_WEI || capWei == TIER2_CAP_WEI || capWei == TIER3_CAP_WEI,
            "cap"
        );
        lastCapWei[user] = capWei;
        lastRateBps[user] = rateBps;
        emit TermsDecrypted(user, capWei, rateBps);
    }

    // -----------------------------
    // Borrow / Repay (uses terms)
    // -----------------------------
    /// @notice Returns active terms for a user (priority: judge override > decrypted cache > defaults)
    function activeTerms(address user) public view returns (uint256 capWei, uint16 rateBps) {
        uint8 t = tierOverride[user];
        if (t == 1) return (TIER1_CAP_WEI, TIER1_RATE_BPS);
        if (t == 2) return (TIER2_CAP_WEI, TIER2_RATE_BPS);
        if (t == 3) return (TIER3_CAP_WEI, TIER3_RATE_BPS);
        if (lastCapWei[user] != 0 && lastRateBps[user] != 0) {
            return (lastCapWei[user], lastRateBps[user]);
        }
        // default conservative until user submits score and decrypts terms
        return (TIER3_CAP_WEI, TIER3_RATE_BPS);
    }

    /// @notice Borrow given amount of wei within your cap; simple interest is accrued up-front.
    function borrow(uint256 amountWei) external {
        (uint256 capWei, uint16 rateBps) = activeTerms(msg.sender);
        require(amountWei > 0, "zero");
        require(address(this).balance >= amountWei, "no liquidity");
        require(debtWei[msg.sender] == 0, "repay first"); // one loan at a time
        require(amountWei <= capWei, "above cap");

        uint256 interest = (amountWei * rateBps) / 10000;
        uint256 totalDebt = amountWei + interest;
        debtWei[msg.sender] = totalDebt;

        (bool ok, ) = msg.sender.call{value: amountWei}("");
        require(ok, "transfer fail");
        emit Borrowed(msg.sender, amountWei, rateBps);
    }

    /// @notice Repay outstanding debt (send exact amount).
    function repay() external payable {
        uint256 d = debtWei[msg.sender];
        require(d > 0, "no debt");
        require(msg.value == d, "exact repay");
        debtWei[msg.sender] = 0;
        emit Repaid(msg.sender, d);
    }
}
