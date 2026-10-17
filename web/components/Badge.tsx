import { COPY } from "@/lib/copy";

const STYLES = {
  verified: "border border-accent text-ink bg-surface",
  preview: "bg-preview text-muted",
  classic: "border border-muted/50 text-muted",
} as const;

export type BadgeKind = keyof typeof STYLES;

export function Badge({ kind }: { kind: BadgeKind }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-pill px-2.5 font-mono text-[12px] font-medium ${STYLES[kind]}`}
    >
      {COPY.card.badges[kind]}
    </span>
  );
}
