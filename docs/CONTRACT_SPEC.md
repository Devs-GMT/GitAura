# Spesifikasi Kontrak — `GitAura.sol`

Solidity `^0.8.20` · Foundry · OpenZeppelin `utils/cryptography/ECDSA.sol` + `MessageHashUtils.sol`

## 1. Storage & tipe
```solidity
address public immutable attester;

struct Aura {
    address owner;
    string  username;   // lowercase
    string  title;
    string  vibe;
    uint8   topLang;    // indeks ke tabel §5
    uint64  savedAt;    // block.timestamp
}

Aura[] public auras;
mapping(bytes32 => uint256) public auraOfUser; // keccak256(bytes(username)) => id + 1 (0 = belum ada)

uint256 public constant MAX_USERNAME = 39;
uint256 public constant MAX_TITLE    = 80;
uint256 public constant MAX_VIBE     = 160;
```

## 2. Fungsi
```solidity
constructor(address _attester);   // revert ZeroAttester jika address(0)

function saveAura(
    string calldata username,
    string calldata title,
    string calldata vibe,
    uint8  topLang,
    uint64 expiry,
    bytes  calldata sig
) external returns (uint256 id);

function getAura(uint256 id) external view returns (Aura memory);   // revert AuraNotFound
function auraIdOf(string calldata username) external view returns (bool exists, uint256 id);
function total() external view returns (uint256);

event AuraSaved(uint256 indexed id, address indexed owner, string username);
```

**Urutan di `saveAura`:**
1. `if (block.timestamp >= expiry) revert ProofExpired();`
2. Validasi panjang: username 1..39, title 1..80, vibe 1..160 → `InvalidLength()`
3. Validasi karakter username: hanya `a-z`, `0-9`, `-` → `InvalidUsername()`
4. Recover signer (§3) → jika ≠ `attester` → `InvalidProof()`
5. `key = keccak256(bytes(username))`; jika `auraOfUser[key] == 0` → push baru, set `auraOfUser[key] = id + 1`; jika sudah ada → overwrite di id yang sama
6. `emit AuraSaved(id, msg.sender, username)`; return id

**Custom errors:** `ZeroAttester`, `ProofExpired`, `InvalidLength`, `InvalidUsername`, `InvalidProof`, `AuraNotFound`.

## 3. Skema signature (HARUS identik di TS)

**Solidity**
```solidity
bytes32 digest = keccak256(abi.encode(username, msg.sender, expiry, block.chainid, address(this)));
address signer = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(digest), sig);
```

**TypeScript (`web/lib/attest.ts`)**
```ts
import "server-only";
import { AbiCoder, Wallet, getBytes, keccak256 } from "ethers";

export function attestDigest(username: string, wallet: string, expiry: bigint, chainId: bigint, contract: string) {
  return keccak256(
    AbiCoder.defaultAbiCoder().encode(
      ["string", "address", "uint64", "uint256", "address"],
      [username, wallet, expiry, chainId, contract],
    ),
  );
}

export async function signAttestation(/* ... */) {
  const signer = new Wallet(process.env.ATTESTER_PRIVATE_KEY!);
  return signer.signMessage(getBytes(digest)); // EIP-191 prefix, cocok dengan toEthSignedMessageHash
}
```
Catatan: `username` di sini sudah lowercase (dari session). `chainId` dan `contract` dari `lib/config.ts`.

## 4. Test matrix (`test/GitAura.t.sol`)
| # | Kasus | Ekspektasi |
|---|---|---|
| 1 | Signature valid, user baru | id 0, `total()==1`, event terpancar, `getAura(0)` cocok |
| 2 | Signer bukan attester | `InvalidProof` |
| 3 | `expiry` sudah lewat (`vm.warp`) | `ProofExpired` |
| 4 | `msg.sender` ≠ wallet di digest (`vm.prank` lain) | `InvalidProof` |
| 5 | Digest untuk chainid lain (`vm.chainId`) / kontrak lain | `InvalidProof` |
| 6 | Save kedua username sama, wallet baru | id sama, owner berubah, `total()` tetap 1 |
| 7 | Username huruf besar / karakter `_` / kosong / 40 char | `InvalidUsername` / `InvalidLength` |
| 8 | Title 81 char, vibe 161 char | `InvalidLength` |
| 9 | `getAura(99)` | `AuraNotFound` |
| 10 | `auraIdOf` untuk user ada/tidak ada | `(true,id)` / `(false,0)` |
| 11 | Constructor attester nol | `ZeroAttester` |

Helper test: buat signature dengan `vm.sign(attesterPk, MessageHashUtils.toEthSignedMessageHash(digest))`, gabungkan `abi.encodePacked(r, s, v)`.

## 5. Tabel `topLang` (sumber tunggal; salin ke `web/lib/config.ts`)
| idx | Bahasa | Gradient (from → to) |
|---|---|---|
| 0 | Other | `#5E5B55 → #111111` |
| 1 | TypeScript | `#3178C6 → #E83AD6` |
| 2 | JavaScript | `#F6C945 → #E8642C` |
| 3 | Python | `#3776AB → #F6C945` |
| 4 | Rust | `#E8642C → #111111` |
| 5 | Go | `#00ADD8 → #3178C6` |
| 6 | Java | `#E8642C → #B07219` |
| 7 | C++ | `#F34B7D → #3178C6` |
| 8 | C | `#555555 → #3178C6` |
| 9 | C# | `#178600 → #3178C6` |
| 10 | PHP | `#777BB4 → #E83AD6` |
| 11 | Ruby | `#CC342D → #E83AD6` |
| 12 | Swift | `#F05138 → #F6C945` |
| 13 | Kotlin | `#A97BFF → #E83AD6` |
| 14 | Dart | `#00B4AB → #3178C6` |
| 15 | Solidity | `#363636 → #E83AD6` |
| 16 | HTML | `#E34C26 → #F6C945` |
| 17 | CSS | `#663399 → #E83AD6` |
| 18 | Shell | `#89E051 → #111111` |
| 19 | Jupyter Notebook | `#DA5B0B → #F6C945` |

Bahasa yang tidak ada di tabel → 0.

## 6. Upgrade opsional: tandatangani teks AI
Tambahkan `bytes32 contentHash = keccak256(abi.encode(title, vibe, topLang))` ke digest, dan server mengembalikan signature hanya untuk hasil AI yang ia hasilkan (server perlu menerima `title/vibe/topLang` di `/api/auth/attest` dan memverifikasi via HMAC token yang dikeluarkan `/api/aura`). Kerjakan hanya jika MVP sudah jalan.

## 7. Deploy
`script/Deploy.s.sol` membaca `ATTESTER_ADDRESS` dari env, `vm.startBroadcast()`, `new GitAura(attester)`, log alamat.
`foundry.toml`:
```toml
[rpc_endpoints]
bohr = "https://rpc.bohr.life"
botchain = "https://rpc.botchain.ai"
```
