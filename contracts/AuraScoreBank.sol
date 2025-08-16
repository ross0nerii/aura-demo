// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";

/// @title AuraScoreBank — demo bank that derives loan terms from an encrypted Aura Score
contract AuraScoreBank {
    // --- Access control ---
    address public owner;
    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    constructor() { owner = msg.sender; }

    // --- Parameters ---
    uint64 public constant TIER1_MIN = 120;
    uint64 public constant TIER2_MIN = 60;

    uint256 public constant TIER1_CAP_WEI = 1 ether;     // 1 ETH
    uint256 public constant TIER2_CAP_WEI = 0.5 ether;   // 0.5 ETH
    uint256 public constant TIER3_CAP_WEI = 0.1 ether;   // 0.1 ETH

    uint16  public constant TIER1_RATE_BPS = 500;   // 5%
    uint16  public constant TIER2_RATE_BPS = 1000;  // 10%
    uint16  public constant TIER3_RATE_BPS = 1500;  // 15%

    // --- State ---
    mapping(address => uint8) public tierOverride; // 0 => none, 1..3 => fixed tier set by judge
    mapping(address => uint256) public debtWei;

    mapping(address => euint64) private lastCapEnc;   // encrypted cap (wei) as euint64
    mapping(address => euint64) private lastRateEnc;  // encrypted rate (bps) as euint64

    mapping(address => uint256) public lastCapWei;    // plaintext cache after oracle decrypt
    mapping(address => uint16)  public lastRateBps;

    address public decryptionOracle;

    // --- Events ---
    event LiquidityDeposited(address indexed from, uint256 amount);
    event Borrowed(address indexed user, uint256 amountWei, uint16 rateBps);
    event Repaid(address indexed user, uint256 amountWei);
    event TierOverridden(address indexed user, uint8 tier);
    event ScoreSubmitted(address indexed user);
    event TermsRequestedForDecryption(address indexed user, bytes32 requestId);
    event TermsDecrypted(address indexed user, uint256 capWei, uint16 rateBps);

    // --- Admin ---
    function setDecryptionOracle(address _oracle) external onlyOwner { decryptionOracle = _oracle; }

    function depositLiquidity() external payable {
        require(msg.value > 0, "no value");
        emit LiquidityDeposited(msg.sender, msg.value);
    }

    function setTier(address user, uint8 tier) external onlyOwner {
        require(tier <= 3, "tier range");
        tierOverride[user] = tier;
        emit TierOverridden(user, tier);
    }

    // --- Encrypted Score intake & terms ---
    function submitScore(externalEuint64 scoreExt, bytes calldata attestation) external {
        euint64 score = FHE.fromExternal(scoreExt, attestation);

        // emulate gte: (>) OR (==)
        ebool geT1 = FHE.or(FHE.gt(score, FHE.asEuint64(TIER1_MIN)), FHE.eq(score, FHE.asEuint64(TIER1_MIN)));
        ebool geT2 = FHE.or(FHE.gt(score, FHE.asEuint64(TIER2_MIN)), FHE.eq(score, FHE.asEuint64(TIER2_MIN)));

        // caps
        euint64 capT3 = FHE.asEuint64(uint64(TIER3_CAP_WEI));
        euint64 capT2 = FHE.asEuint64(uint64(TIER2_CAP_WEI));
        euint64 capT1 = FHE.asEuint64(uint64(TIER1_CAP_WEI));
        euint64 tempCap = FHE.select(geT2, capT2, capT3);
        euint64 capEnc = FHE.select(geT1, capT1, tempCap);

        // rates (bps)
        euint64 rT3 = FHE.asEuint64(TIER3_RATE_BPS);
        euint64 rT2 = FHE.asEuint64(TIER2_RATE_BPS);
        euint64 rT1 = FHE.asEuint64(TIER1_RATE_BPS);
        euint64 tempRate = FHE.select(geT2, rT2, rT3);
        euint64 rateEnc = FHE.select(geT1, rT1, tempRate);

        lastCapEnc[msg.sender] = capEnc;
        lastRateEnc[msg.sender] = rateEnc;

        FHE.allow(capEnc, msg.sender);
        FHE.allow(rateEnc, msg.sender);
        FHE.allowThis(capEnc);
        FHE.allowThis(rateEnc);

        emit ScoreSubmitted(msg.sender);
    }

    function requestPublicDecryptionOfTerms() external {
        euint64 capEnc = lastCapEnc[msg.sender];
        euint64 rateEnc = lastRateEnc[msg.sender];
        FHE.makePubliclyDecryptable(capEnc);
        FHE.makePubliclyDecryptable(rateEnc);
        bytes32 rid = keccak256(abi.encodePacked(block.number, msg.sender, capEnc, rateEnc));
        emit TermsRequestedForDecryption(msg.sender, rid);
    }

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

    // --- Borrow / Repay ---
    function activeTerms(address user) public view returns (uint256 capWei, uint16 rateBps) {
        uint8 t = tierOverride[user];
        if (t == 1) return (TIER1_CAP_WEI, TIER1_RATE_BPS);
        if (t == 2) return (TIER2_CAP_WEI, TIER2_RATE_BPS);
        if (t == 3) return (TIER3_CAP_WEI, TIER3_RATE_BPS); // <- НЕ ДОЛЖНО БЫТЬ КИРИЛЛИЦЫ
        if (lastCapWei[user] != 0 && lastRateBps[user] != 0) {
            return (lastCapWei[user], lastRateBps[user]);
        }
        return (TIER3_CAP_WEI, TIER3_RATE_BPS);
    }

    function borrow(uint256 amountWei) external {
        (uint256 capWei, uint16 rateBps) = activeTerms(msg.sender);
        require(amountWei > 0, "zero");
        require(address(this).balance >= amountWei, "no liquidity");
        require(debtWei[msg.sender] == 0, "repay first");
        require(amountWei <= capWei, "above cap");

        uint256 interest = (amountWei * rateBps) / 10000;
        uint256 totalDebt = amountWei + interest;
        debtWei[msg.sender] = totalDebt;

        (bool ok, ) = msg.sender.call{value: amountWei}("");
        require(ok, "transfer fail");
        emit Borrowed(msg.sender, amountWei, rateBps);
    }

    function repay() external payable {
        uint256 d = debtWei[msg.sender];
        require(d > 0, "no debt");
        require(msg.value == d, "exact repay");
        debtWei[msg.sender] = 0;
        emit Repaid(msg.sender, d);
    }
}
