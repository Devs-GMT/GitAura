// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {GitAura} from "../src/GitAura.sol";

/// Test matrix: docs/CONTRACT_SPEC.md §4
contract GitAuraTest is Test {
    event AuraSaved(uint256 indexed id, address indexed owner, string username);

    GitAura internal ga;

    uint256 internal attesterPk = 0xA11CE;
    address internal attester;
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    string internal constant USER = "octo-cat42";
    string internal constant TITLE = "The TypeScript Wizard";
    string internal constant VIBE = "Ships types faster than coffee cools.";
    uint8 internal constant LANG = 1;

    function setUp() public {
        attester = vm.addr(attesterPk);
        ga = new GitAura(attester);
        vm.warp(1_700_000_000);
    }

    // ---------- helpers ----------

    function _sign(uint256 pk, string memory username, address wallet, uint64 expiry, uint256 chainId, address target)
        internal
        pure
        returns (bytes memory)
    {
        bytes32 digest = keccak256(abi.encode(username, wallet, expiry, chainId, target));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, MessageHashUtils.toEthSignedMessageHash(digest));
        return abi.encodePacked(r, s, v);
    }

    function _proof(string memory username, address wallet, uint64 expiry) internal view returns (bytes memory) {
        return _sign(attesterPk, username, wallet, expiry, block.chainid, address(ga));
    }

    function _exp() internal view returns (uint64) {
        return uint64(block.timestamp + 10 minutes);
    }

    function _save(address who, string memory username, string memory title, string memory vibe)
        internal
        returns (uint256)
    {
        uint64 expiry = _exp();
        bytes memory sig = _proof(username, who, expiry);
        vm.prank(who);
        return ga.saveAura(username, title, vibe, LANG, expiry, sig);
    }

    function _repeat(bytes1 c, uint256 n) internal pure returns (string memory) {
        bytes memory b = new bytes(n);
        for (uint256 i; i < n; ++i) {
            b[i] = c;
        }
        return string(b);
    }

    // ---------- #1 save sukses ----------

    function test_SaveNewUser() public {
        vm.expectEmit(true, true, false, true, address(ga));
        emit AuraSaved(0, alice, USER);

        uint256 id = _save(alice, USER, TITLE, VIBE);

        assertEq(id, 0);
        assertEq(ga.total(), 1);
        GitAura.Aura memory a = ga.getAura(0);
        assertEq(a.owner, alice);
        assertEq(a.username, USER);
        assertEq(a.title, TITLE);
        assertEq(a.vibe, VIBE);
        assertEq(a.topLang, LANG);
        assertEq(a.savedAt, uint64(block.timestamp));
    }

    function test_SaveAtMaxLengths() public {
        string memory u = _repeat("a", 39);
        uint256 id = _save(alice, u, _repeat("t", 80), _repeat("v", 160));
        assertEq(ga.getAura(id).username, u);
    }

    // ---------- #2 signer salah ----------

    function test_RevertWhen_WrongSigner() public {
        uint64 expiry = _exp();
        bytes memory sig = _sign(0xB0B, USER, alice, expiry, block.chainid, address(ga));
        vm.prank(alice);
        vm.expectRevert(GitAura.InvalidProof.selector);
        ga.saveAura(USER, TITLE, VIBE, LANG, expiry, sig);
    }

    function test_RevertWhen_MalformedSignature() public {
        vm.prank(alice);
        vm.expectRevert(GitAura.InvalidProof.selector);
        ga.saveAura(USER, TITLE, VIBE, LANG, _exp(), hex"1234");
    }

    function test_RevertWhen_UsernameDiffersFromSigned() public {
        uint64 expiry = _exp();
        bytes memory sig = _proof("someone-else", alice, expiry);
        vm.prank(alice);
        vm.expectRevert(GitAura.InvalidProof.selector);
        ga.saveAura(USER, TITLE, VIBE, LANG, expiry, sig);
    }

    // ---------- #3 expired ----------

    function test_RevertWhen_Expired() public {
        uint64 expiry = _exp();
        bytes memory sig = _proof(USER, alice, expiry);
        vm.warp(expiry); // block.timestamp >= expiry
        vm.prank(alice);
        vm.expectRevert(GitAura.ProofExpired.selector);
        ga.saveAura(USER, TITLE, VIBE, LANG, expiry, sig);
    }

    function test_SaveJustBeforeExpiry() public {
        uint64 expiry = _exp();
        bytes memory sig = _proof(USER, alice, expiry);
        vm.warp(expiry - 1);
        vm.prank(alice);
        ga.saveAura(USER, TITLE, VIBE, LANG, expiry, sig);
        assertEq(ga.total(), 1);
    }

    // ---------- #4 msg.sender beda ----------

    function test_RevertWhen_SenderNotSignedWallet() public {
        uint64 expiry = _exp();
        bytes memory sig = _proof(USER, alice, expiry);
        vm.prank(bob);
        vm.expectRevert(GitAura.InvalidProof.selector);
        ga.saveAura(USER, TITLE, VIBE, LANG, expiry, sig);
    }

    // ---------- #5 replay chain / kontrak lain ----------

    function test_RevertWhen_OtherChainId() public {
        uint64 expiry = _exp();
        bytes memory sig = _proof(USER, alice, expiry); // ditandatangani untuk chain saat ini
        vm.chainId(677);
        vm.prank(alice);
        vm.expectRevert(GitAura.InvalidProof.selector);
        ga.saveAura(USER, TITLE, VIBE, LANG, expiry, sig);
    }

    function test_RevertWhen_OtherContract() public {
        GitAura other = new GitAura(attester);
        uint64 expiry = _exp();
        bytes memory sig = _sign(attesterPk, USER, alice, expiry, block.chainid, address(other));
        vm.prank(alice);
        vm.expectRevert(GitAura.InvalidProof.selector);
        ga.saveAura(USER, TITLE, VIBE, LANG, expiry, sig);
    }

    // ---------- #6 update di tempat ----------

    function test_SecondSaveUpdatesSameId() public {
        uint256 id0 = _save(alice, USER, TITLE, VIBE);
        _save(alice, "other-user", TITLE, VIBE);
        vm.warp(block.timestamp + 1 days);

        vm.expectEmit(true, true, false, true, address(ga));
        emit AuraSaved(id0, bob, USER);
        uint256 id1 = _save(bob, USER, "The Rust Explorer", "New vibe.");

        assertEq(id1, id0);
        assertEq(ga.total(), 2);
        GitAura.Aura memory a = ga.getAura(id0);
        assertEq(a.owner, bob);
        assertEq(a.username, USER);
        assertEq(a.title, "The Rust Explorer");
        assertEq(a.vibe, "New vibe.");
        assertEq(a.savedAt, uint64(block.timestamp));
    }

    function test_ResaveKeepsTotal() public {
        _save(alice, USER, TITLE, VIBE);
        _save(bob, USER, TITLE, VIBE);
        assertEq(ga.total(), 1);
    }

    // ---------- #7 username ----------

    function _expectSaveRevert(string memory username, string memory title, string memory vibe, bytes4 sel) internal {
        uint64 expiry = _exp();
        bytes memory sig = _proof(username, alice, expiry);
        vm.prank(alice);
        vm.expectRevert(sel);
        ga.saveAura(username, title, vibe, LANG, expiry, sig);
    }

    function test_RevertWhen_UsernameUppercase() public {
        _expectSaveRevert("Octocat", TITLE, VIBE, GitAura.InvalidUsername.selector);
    }

    function test_RevertWhen_UsernameUnderscore() public {
        _expectSaveRevert("octo_cat", TITLE, VIBE, GitAura.InvalidUsername.selector);
    }

    function test_RevertWhen_UsernameOtherChars() public {
        _expectSaveRevert("octo cat", TITLE, VIBE, GitAura.InvalidUsername.selector);
        _expectSaveRevert("octo.cat", TITLE, VIBE, GitAura.InvalidUsername.selector);
        _expectSaveRevert(unicode"octöcat", TITLE, VIBE, GitAura.InvalidUsername.selector);
    }

    function test_RevertWhen_UsernameEmpty() public {
        _expectSaveRevert("", TITLE, VIBE, GitAura.InvalidLength.selector);
    }

    function test_RevertWhen_Username40Chars() public {
        _expectSaveRevert(_repeat("a", 40), TITLE, VIBE, GitAura.InvalidLength.selector);
    }

    // ---------- #8 title / vibe ----------

    function test_RevertWhen_Title81Chars() public {
        _expectSaveRevert(USER, _repeat("t", 81), VIBE, GitAura.InvalidLength.selector);
    }

    function test_RevertWhen_Vibe161Chars() public {
        _expectSaveRevert(USER, TITLE, _repeat("v", 161), GitAura.InvalidLength.selector);
    }

    function test_RevertWhen_TitleOrVibeEmpty() public {
        _expectSaveRevert(USER, "", VIBE, GitAura.InvalidLength.selector);
        _expectSaveRevert(USER, TITLE, "", GitAura.InvalidLength.selector);
    }

    // ---------- #9 getAura ----------

    function test_RevertWhen_GetAuraMissing() public {
        vm.expectRevert(GitAura.AuraNotFound.selector);
        ga.getAura(99);
        _save(alice, USER, TITLE, VIBE);
        vm.expectRevert(GitAura.AuraNotFound.selector);
        ga.getAura(1);
    }

    // ---------- #10 auraIdOf ----------

    function test_AuraIdOf() public {
        (bool exists, uint256 id) = ga.auraIdOf(USER);
        assertFalse(exists);
        assertEq(id, 0);

        _save(alice, "first", TITLE, VIBE);
        _save(alice, USER, TITLE, VIBE);

        (exists, id) = ga.auraIdOf(USER);
        assertTrue(exists);
        assertEq(id, 1);
        assertEq(ga.auraOfUser(keccak256(bytes(USER))), 2);
    }

    // ---------- #11 constructor ----------

    function test_RevertWhen_ZeroAttester() public {
        vm.expectRevert(GitAura.ZeroAttester.selector);
        new GitAura(address(0));
    }

    function test_AttesterSet() public view {
        assertEq(ga.attester(), attester);
    }

    // ---------- fuzz ----------

    function testFuzz_OnlyAttesterCanAuthorize(uint256 pk) public {
        pk = bound(pk, 1, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140);
        vm.assume(pk != attesterPk);
        uint64 expiry = _exp();
        bytes memory sig = _sign(pk, USER, alice, expiry, block.chainid, address(ga));
        vm.prank(alice);
        vm.expectRevert(GitAura.InvalidProof.selector);
        ga.saveAura(USER, TITLE, VIBE, LANG, expiry, sig);
    }
}
