// Gugus bintang kilau 4 sudut ala pixel-art — dekorasi "aura" (DESIGN_SYSTEM §4). SVG buatan sendiri.
// Tiap pixel diarsir: kiri-atas terang, diagonal dasar, kanan-bawah gelap → kesan permata berfaset.

const SHAPES = {
  lg: [
    "......#......",
    "......#......",
    ".....###.....",
    ".....###.....",
    "....#####....",
    "..#########..",
    "#############",
    "..#########..",
    "....#####....",
    ".....###.....",
    ".....###.....",
    "......#......",
    "......#......",
  ],
  md: ["...#...", "...#...", "..###..", "#######", "..###..", "...#...", "...#..."],
  sm: ["..#..", "..#..", "#####", "..#..", "..#.."],
} as const;

const TONES = {
  yellow: { light: "#FBE39A", base: "#F6C945", dark: "#D9A52C" },
  orange: { light: "#F49A6C", base: "#E8642C", dark: "#C24A18" },
  pink: { light: "#F6A9EE", base: "#E83AD6", dark: "#C42AB4" },
} as const;

type Shape = keyof typeof SHAPES;
type Tone = keyof typeof TONES;

// Posisi dalam satuan pixel (cell). Twinkle hanya untuk sparkle kecil.
const CLUSTER: { shape: Shape; tone: Tone; x: number; y: number; twinkle?: string }[] = [
  { shape: "lg", tone: "yellow", x: 0, y: 3 },
  { shape: "md", tone: "orange", x: 14, y: 11, twinkle: "0s" },
  { shape: "sm", tone: "pink", x: 15, y: 0, twinkle: "1.3s" },
];

const VIEW_W = 22;
const VIEW_H = 18;

function Sparkle({ shape, tone, x, y, twinkle }: (typeof CLUSTER)[number]) {
  const rows = SHAPES[shape];
  const n = rows.length;
  const c = TONES[tone];
  const cells: React.ReactNode[] = [];
  rows.forEach((row, r) =>
    [...row].forEach((ch, col) => {
      if (ch !== "#") return;
      const d = col + r - (n - 1); // <0 kiri-atas, 0 diagonal, >0 kanan-bawah
      const fill = d < 0 ? c.light : d === 0 ? c.base : c.dark;
      cells.push(
        <rect key={`${r}-${col}`} x={col} y={r} width={1} height={1} fill={fill} stroke="#111" strokeOpacity={0.12} strokeWidth={0.06} />,
      );
    }),
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      <g
        className={twinkle ? "animate-twinkle" : undefined}
        style={twinkle ? { animationDelay: twinkle, transformBox: "fill-box", transformOrigin: "center" } : undefined}
      >
        {cells}
      </g>
    </g>
  );
}

type PixelSparklesProps = {
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: number;
  rotate?: number;
  className?: string;
};

const CORNER: Record<PixelSparklesProps["corner"], string> = {
  "top-left": "left-0 top-0 -translate-x-[12%] -translate-y-[12%]",
  "top-right": "right-0 top-0 translate-x-[12%] -translate-y-[12%]",
  "bottom-left": "bottom-0 left-0 -translate-x-[12%] translate-y-[12%]",
  "bottom-right": "bottom-0 right-0 translate-x-[12%] translate-y-[12%]",
};

export function PixelSparkles({ corner, size = 220, rotate = 0, className = "" }: PixelSparklesProps) {
  return (
    <svg
      viewBox={`-0.5 -0.5 ${VIEW_W + 1} ${VIEW_H + 1}`}
      width={size}
      height={(size * (VIEW_H + 1)) / (VIEW_W + 1)}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${CORNER[corner]} ${className}`}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}
    >
      {CLUSTER.map((s) => (
        <Sparkle key={`${s.shape}-${s.x}`} {...s} />
      ))}
    </svg>
  );
}
