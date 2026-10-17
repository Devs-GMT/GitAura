// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title GitAura — personality card GitHub yang diverifikasi attester, disimpan on-chain.
/// @notice Server (attester) menandatangani `(username, wallet, expiry, chainid, kontrak)` setelah
///         user membuktikan kepemilikan akun GitHub via OAuth. Lihat docs/CONTRACT_SPEC.md.
contract GitAura {
    struct Aura {
        address owner;
        string username; // lowercase
        string title;
        string vibe;
        uint8 topLang; // indeks ke tabel CONTRACT_SPEC §5
        uint64 savedAt; // block.timestamp
    }

    uint256 public constant MAX_USERNAME = 39;
    uint256 public constant MAX_TITLE = 80;
    uint256 public constant MAX_VIBE = 160;

    address public immutable attester;

    Aura[] public auras;
    /// @dev keccak256(bytes(username)) => id + 1 (0 = belum ada)
    mapping(bytes32 => uint256) public auraOfUser;

    event AuraSaved(uint256 indexed id, address indexed owner, string username);

    error ZeroAttester();
    error ProofExpired();
    error InvalidLength();
    error InvalidUsername();
    error InvalidProof();
    error AuraNotFound();

    constructor(address _attester) {
        if (_attester == address(0)) revert ZeroAttester();
        attester = _attester;
    }

    function saveAura(
        string calldata username,
        string calldata title,
        string calldata vibe,
        uint8 topLang,
        uint64 expiry,
        bytes calldata sig
    ) external returns (uint256 id) {
        if (block.timestamp >= expiry) revert ProofExpired();
        _checkLengths(username, title, vibe);
        _checkUsername(username);
        _checkProof(username, expiry, sig);

        bytes32 key = keccak256(bytes(username));
        uint256 slot = auraOfUser[key];
        if (slot == 0) {
            id = auras.length;
            auras.push(Aura(msg.sender, username, title, vibe, topLang, uint64(block.timestamp)));
            auraOfUser[key] = id + 1;
        } else {
            id = slot - 1;
            Aura storage a = auras[id];
            a.owner = msg.sender;
            a.title = title;
            a.vibe = vibe;
            a.topLang = topLang;
            a.savedAt = uint64(block.timestamp);
        }

        emit AuraSaved(id, msg.sender, username);
    }

    function getAura(uint256 id) external view returns (Aura memory) {
        if (id >= auras.length) revert AuraNotFound();
        return auras[id];
    }

    function auraIdOf(string calldata username) external view returns (bool exists, uint256 id) {
        uint256 slot = auraOfUser[keccak256(bytes(username))];
        if (slot == 0) return (false, 0);
        return (true, slot - 1);
    }

    function total() external view returns (uint256) {
        return auras.length;
    }

    function _checkLengths(string calldata username, string calldata title, string calldata vibe) private pure {
        uint256 uLen = bytes(username).length;
        uint256 tLen = bytes(title).length;
        uint256 vLen = bytes(vibe).length;
        if (uLen == 0 || uLen > MAX_USERNAME || tLen == 0 || tLen > MAX_TITLE || vLen == 0 || vLen > MAX_VIBE) {
            revert InvalidLength();
        }
    }

    /// @dev Skema ini HARUS identik dengan web/lib/attest.ts (CONTRACT_SPEC §3).
    function _checkProof(string calldata username, uint64 expiry, bytes calldata sig) private view {
        bytes32 digest = keccak256(abi.encode(username, msg.sender, expiry, block.chainid, address(this)));
        // tryRecover: signature rusak juga dilaporkan sebagai InvalidProof, bukan error OZ.
        (address signer, ECDSA.RecoverError err,) =
            ECDSA.tryRecover(MessageHashUtils.toEthSignedMessageHash(digest), sig);
        if (err != ECDSA.RecoverError.NoError || signer != attester) revert InvalidProof();
    }

    /// @dev Hanya `a-z`, `0-9`, `-`.
    function _checkUsername(string calldata username) private pure {
        bytes calldata b = bytes(username);
        for (uint256 i; i < b.length; ++i) {
            bytes1 c = b[i];
            if (!((c >= "a" && c <= "z") || (c >= "0" && c <= "9") || c == "-")) revert InvalidUsername();
        }
    }
}
