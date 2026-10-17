import "server-only";
import { AbiCoder, Wallet, getBytes, keccak256 } from "ethers";

// Skema ini HARUS identik dengan contracts/src/GitAura.sol `_checkProof` (CONTRACT_SPEC §3):
//   keccak256(abi.encode(username, msg.sender, expiry, block.chainid, address(this)))
//   lalu EIP-191 (toEthSignedMessageHash) — dipenuhi oleh `signMessage(getBytes(digest))`.

export const ATTEST_TTL_S = 600;

export type AttestInput = {
  username: string; // lowercase, dari session
  wallet: string;
  expiry: bigint;
  chainId: bigint;
  contract: string;
};

export function attestDigest(username: string, wallet: string, expiry: bigint, chainId: bigint, contract: string) {
  return keccak256(
    AbiCoder.defaultAbiCoder().encode(
      ["string", "address", "uint64", "uint256", "address"],
      [username, wallet, expiry, chainId, contract],
    ),
  );
}

/** Lempar jika ATTESTER_PRIVATE_KEY kosong/tidak valid (route memetakan ke SIGNER_NOT_CONFIGURED). */
export function attesterWallet(): Wallet {
  const key = process.env.ATTESTER_PRIVATE_KEY?.trim();
  if (!key) throw new Error("ATTESTER_PRIVATE_KEY not set");
  return new Wallet(key.startsWith("0x") ? key : `0x${key}`);
}

export async function signAttestation({ username, wallet, expiry, chainId, contract }: AttestInput, signer = attesterWallet()) {
  if (username !== username.toLowerCase()) throw new Error("username must be lowercase");
  const digest = attestDigest(username, wallet, expiry, chainId, contract);
  return signer.signMessage(getBytes(digest));
}
