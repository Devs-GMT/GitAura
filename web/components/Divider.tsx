export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-border" />
      <span className="font-mono text-[12px] text-muted">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
