// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * AuraTier — ERC1155 бейджи уровней: 1=Bronze, 2=Silver, 3=Gold.
 * Минт разрешён только по подписи "аттестора" (EIP-712-like).
 * На чейне не раскрываем скор — только tier.
 */
contract AuraTier is ERC1155, Ownable {
    using ECDSA for bytes32;

    address public attester;              // наш оффчейн аттестор
    mapping(address => bool) public hasBadge; // 1 бейдж на адрес (для простоты)
    string public name = "Aura Tier Badge";
    string public symbol = "AURATIER";

    // EIP-712 domain separator (упрощённый)
    bytes32 public constant MINT_TYPEHASH =
        keccak256("MintTier(address user,uint256 tier,uint256 deadline)");

    bytes32 public DOMAIN_SEPARATOR;

    event AttesterUpdated(address attester);
    event Minted(address indexed user, uint256 tier);

    constructor(address _attester, string memory _uri) ERC1155(_uri) Ownable(msg.sender) {
        attester = _attester;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("AuraTier")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
        emit AttesterUpdated(_attester);
    }

    function setAttester(address _attester) external onlyOwner {
        attester = _attester;
        emit AttesterUpdated(_attester);
    }

    /**
     * @notice Минт бейджа по подписи аттестора
     * @param tier 1=Bronze, 2=Silver, 3=Gold
     * @param deadline unix time; подпись недействительна после него
     * @param sig подпись attester над (user, tier, deadline)
     */
    function mintTier(uint256 tier, uint256 deadline, bytes calldata sig) external {
        require(!hasBadge[msg.sender], "already minted");
        require(tier >= 1 && tier <= 3, "bad tier");
        require(block.timestamp <= deadline, "expired");
        require(attester != address(0), "attester not set");

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(MINT_TYPEHASH, msg.sender, tier, deadline))
            )
        );
        address signer = ECDSA.recover(digest, sig);
        require(signer == attester, "bad signature");

        hasBadge[msg.sender] = true;
        _mint(msg.sender, tier, 1, "");
        emit Minted(msg.sender, tier);
    }
}
