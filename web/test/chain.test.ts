import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_CHAIN_ID = "968";
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = "0x54004efF59C672BB94BD662741589e9Ae6ECFcA8";
  return { state: { total: 0, calls: [] as number[] } };
});

vi.mock("ethers", async (importOriginal) => {
  const real = await importOriginal<typeof import("ethers")>();
  return {
    ...real,
    JsonRpcProvider: class {},
    Contract: class {
      total = async () => BigInt(state.total);
      getAura = async (id: number) => {
        state.calls.push(id);
        return { owner: "0x5219fFbF9A44F96A8931A50A31021E4724518735", username: `user${id}`, title: `T${id}`, vibe: "V", topLang: 1n, savedAt: 1792247042n };
      };
    },
  };
});

import { getAuraById, listAuras, parseAuraId } from "@/lib/chain";

beforeEach(() => {
  state.calls = [];
});

describe("parseAuraId", () => {
  it("accepts plain non-negative integers only", () => {
    expect(parseAuraId("0")).toBe(0);
    expect(parseAuraId("12")).toBe(12);
    expect(parseAuraId(["7", "8"])).toBe(7);
    for (const bad of [undefined, null, "", "-1", "1.5", "1e3", "abc", " 1", "1234567890"]) {
      expect(parseAuraId(bad as string)).toBeNull();
    }
  });
});

describe("getAuraById / listAuras", () => {
  it("returns null past the end without calling getAura", async () => {
    state.total = 2;
    expect(await getAuraById(5)).toBeNull();
    expect(state.calls).toEqual([]);
    expect(await getAuraById(1)).toMatchObject({ id: 1, username: "user1", topLang: 1, savedAt: 1792247042 });
  });

  it("pages newest first with hasMore", async () => {
    state.total = 30;
    const p0 = await listAuras(0, 24);
    expect(p0.items.map((a) => a.id)).toEqual(Array.from({ length: 24 }, (_, i) => 29 - i));
    expect(p0.hasMore).toBe(true);
    const p1 = await listAuras(1, 24);
    expect(p1.items.map((a) => a.id)).toEqual([5, 4, 3, 2, 1, 0]);
    expect(p1.hasMore).toBe(false);
  });

  it("empty contract → no items", async () => {
    state.total = 0;
    expect(await listAuras(0)).toEqual({ items: [], total: 0, hasMore: false });
  });
});
