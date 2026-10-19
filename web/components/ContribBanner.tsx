import type { ContribWeeks } from "@/lib/contrib";

// Opacity kotak putih per level kontribusi (0 = tidak ada commit).
const ALPHA = [0.14, 0.38, 0.58, 0.78, 0.96];
const CELL = 10;
const GAP = 3;
const STEP = CELL + GAP;

/**
 * Banner kartu: warna solid bahasa teratas + grid commit GitHub (≈1 tahun) dalam putih transparan.
 * Minggu terbaru menempel di kanan; `slice` memotong minggu lama di layar sempit (memudar di kiri).
 * Tanpa data → banner solid saja.
 */
export function ContribBanner({ color, weeks, className = "h-28 md:h-32" }: { color: string; weeks?: ContribWeeks | null; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: color }} aria-hidden="true">
      {weeks && weeks.length > 0 && (
        <div className="absolute inset-y-4 left-0 right-5 animate-fade-in [mask-image:linear-gradient(to_right,transparent,black_35%)]">
          <svg viewBox={`0 0 ${weeks.length * STEP - GAP} ${7 * STEP - GAP}`} preserveAspectRatio="xMaxYMid slice" className="size-full">
            {weeks.map((week, x) =>
              week.map((level, y) =>
                level < 0 ? null : (
                  <rect key={`${x}-${y}`} x={x * STEP} y={y * STEP} width={CELL} height={CELL} rx={2.5} fill="#fff" fillOpacity={ALPHA[level]} />
                ),
              ),
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
