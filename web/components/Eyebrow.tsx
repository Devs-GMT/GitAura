export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-accent md:text-[13px] ${className}`}>
      {children}
    </p>
  );
}
