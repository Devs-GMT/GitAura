import { CHAIN, CONTRACT_ADDRESS } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { shortAddress } from "@/lib/format";
import { Badge } from "./Badge";
import { PixelSparkles } from "./PixelSparkles";

// Ilustrasi bukti stamp on-chain (id & tx contoh). Dekoratif.
export function StampMock() {
  const rows = [
    ["Network", CHAIN.name],
    ["Contract", CONTRACT_ADDRESS ? shortAddress(CONTRACT_ADDRESS) : "0x12ab…9f3c"],
    ["Owner", "0x5219…8735"],
    ["Status", "Confirmed"],
  ] as const;

  return (
    <div className="relative h-full w-full">
      <PixelSparkles corner="top-right" size={260} rotate={-6} className="max-md:hidden" />
      <div className="absolute left-6 top-8 w-[300px] max-w-[calc(100%-1.5rem)] rounded-[24px] border border-border bg-surface p-5 shadow-card md:-bottom-8 md:left-12 md:top-auto md:w-[440px] md:max-w-none md:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[17px] font-semibold tracking-[-0.01em] md:text-[22px]">{COPY.save.success(12)}</p>
          <Badge kind="verified" />
        </div>
        <dl className="mt-5 divide-y divide-border text-[13px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5">
              <dt className="text-muted">{k}</dt>
              <dd className="flex items-center gap-1.5 font-mono">
                {k === "Status" && <span className="size-2 rounded-full bg-success" />}
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex h-10 items-center justify-center rounded-pill bg-accent text-[14px] font-semibold text-white">
          {COPY.save.viewTx}
        </div>
      </div>
    </div>
  );
}
