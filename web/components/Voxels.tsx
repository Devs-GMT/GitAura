import { useId } from "react";

// Kubus voxel isometrik — SVG buatan sendiri (DESIGN_SYSTEM §4). Top lebih terang, tekstur grid 6px opacity .15.

const PALETTE = {
  yellow: { top: "#FADA7C", left: "#F6C945", right: "#D9A52C" },
  orange: { top: "#F28A5A", left: "#E8642C", right: "#C24A18" },
} as const;

type Tone = keyof typeof PALETTE;

// Tumpukan kecil kubus (x, y dalam satuan kubus pada grid isometrik; z = tingkat).
const CLUSTER: { x: number; y: number; z: number; tone: Tone }[] = [
  { x: 0, y: 1, z: 0, tone: "orange" },
  { x: 1, y: 1, z: 0, tone: "yellow" },
  { x: 1, y: 0, z: 0, tone: "yellow" },
  { x: 1, y: 1, z: 1, tone: "yellow" },
  { x: 2, y: 0, z: 0, tone: "orange" },
];

const W = 60; // lebar satu kubus
const H = W / 2; // tinggi rhombus atas

function Cube({ cx, cy, tone, gridId }: { cx: number; cy: number; tone: Tone; gridId: string }) {
  const c = PALETTE[tone];
  const top = `${cx},${cy} ${cx + W / 2},${cy + H / 2} ${cx},${cy + H} ${cx - W / 2},${cy + H / 2}`;
  const left = `${cx - W / 2},${cy + H / 2} ${cx},${cy + H} ${cx},${cy + H + W / 2} ${cx - W / 2},${cy + H / 2 + W / 2}`;
  const right = `${cx},${cy + H} ${cx + W / 2},${cy + H / 2} ${cx + W / 2},${cy + H / 2 + W / 2} ${cx},${cy + H + W / 2}`;
  return (
    <g>
      {(
        [
          [top, c.top],
          [left, c.left],
          [right, c.right],
        ] as const
      ).map(([points, fill]) => (
        <g key={points}>
          <polygon points={points} fill={fill} />
          <polygon points={points} fill={`url(#${gridId})`} />
        </g>
      ))}
    </g>
  );
}

type VoxelsProps = {
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: number;
  rotate?: number;
  className?: string;
};

const CORNER: Record<VoxelsProps["corner"], string> = {
  "top-left": "left-0 top-0 -translate-x-1/3 -translate-y-1/4",
  "top-right": "right-0 top-0 translate-x-1/3 -translate-y-1/4",
  "bottom-left": "bottom-0 left-0 -translate-x-1/3 translate-y-1/4",
  "bottom-right": "bottom-0 right-0 translate-x-1/3 translate-y-1/4",
};

export function Voxels({ corner, size = 220, rotate = 0, className = "" }: VoxelsProps) {
  const gridId = `vox-grid-${useId().replace(/:/g, "")}`;
  // Urutkan belakang → depan agar kubus depan menutupi yang belakang.
  const cubes = [...CLUSTER].sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z);
  return (
    <svg
      viewBox="-40 -40 260 200"
      width={size}
      height={(size * 200) / 260}
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${CORNER[corner]} ${className}`}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}
    >
      <defs>
        <pattern id={gridId} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M6 0H0V6" fill="none" stroke="#111" strokeWidth="0.6" opacity="0.15" />
        </pattern>
      </defs>
      {cubes.map(({ x, y, z, tone }) => (
        <Cube
          key={`${x}-${y}-${z}`}
          cx={60 + (x - y) * (W / 2)}
          cy={30 + (x + y) * (H / 2) - z * (W / 2)}
          tone={tone}
          gridId={gridId}
        />
      ))}
    </svg>
  );
}
