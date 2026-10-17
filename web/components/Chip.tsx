type ChipProps = {
  children: React.ReactNode;
  variant?: "default" | "accent";
  mono?: boolean;
  className?: string;
};

export function Chip({ children, variant = "default", mono = false, className = "" }: ChipProps) {
  const tone = variant === "accent" ? "border-accent text-ink" : "border-border text-ink";
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-pill border bg-surface px-3 text-[13px] font-medium ${tone} ${mono ? "font-mono" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
