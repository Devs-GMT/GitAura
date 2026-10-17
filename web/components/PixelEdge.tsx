// Tepi "pixel" bertangga antara panel visual dan sisi teks (gaya Relume). Dekoratif, desktop saja.
// Dipasang di dalam panel (relative). `edge` = sisi panel yang berbatasan dengan teks.

// Pola deterministik per baris kotak 16px. OUT: warna panel menjorok ke sisi teks; IN: surface menjorok ke panel.
const OUT = [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0];
const IN = [0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1];

function Column({ pattern, color, className }: { pattern: number[]; color: string; className: string }) {
  return (
    <div className={`absolute inset-y-0 flex w-4 flex-col overflow-hidden ${className}`}>
      {pattern.map((on, i) => (
        <span key={i} className="block size-4 shrink-0" style={{ background: on ? color : "transparent" }} />
      ))}
    </div>
  );
}

export function PixelEdge({ edge, color }: { edge: "left" | "right"; color: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden md:block">
      {edge === "right" ? (
        <>
          <Column pattern={OUT} color={color} className="left-full" />
          <Column pattern={IN} color="var(--color-surface)" className="right-0" />
        </>
      ) : (
        <>
          <Column pattern={OUT} color={color} className="right-full" />
          <Column pattern={IN} color="var(--color-surface)" className="left-0" />
        </>
      )}
    </div>
  );
}
