import { Eyebrow } from "./Eyebrow";
import { PixelEdge } from "./PixelEdge";

export const PANEL_TONES = {
  yellow: "#F9DC85",
  pink: "#F6A9EE",
  orange: "#F5A882",
} as const;

type Feature = { title: string; body: string };

type StepCardProps = {
  eyebrow: string;
  heading: string;
  body: string;
  features: readonly Feature[];
  featureIcons: React.ReactNode[];
  icon: React.ReactNode;
  actions: React.ReactNode;
  visual: React.ReactNode;
  tone: keyof typeof PANEL_TONES;
  /** true → panel visual di kanan (desktop). */
  reverse?: boolean;
};

const GRID = "rgb(255 255 255 / 0.55)";

export function StepCard({ eyebrow, heading, body, features, featureIcons, icon, actions, visual, tone, reverse = false }: StepCardProps) {
  const color = PANEL_TONES[tone];
  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card md:grid md:min-h-[560px] md:grid-cols-2">
      <div
        aria-hidden="true"
        className={`relative h-[340px] md:h-auto ${reverse ? "md:order-2" : ""}`}
        style={{
          backgroundColor: color,
          backgroundImage: `linear-gradient(to right, ${GRID} 1px, transparent 1px), linear-gradient(to bottom, ${GRID} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      >
        <div className="absolute inset-0 overflow-hidden">{visual}</div>
        <PixelEdge edge={reverse ? "left" : "right"} color={color} />
      </div>

      <div className="flex flex-col justify-center p-6 sm:p-8 md:p-12 lg:p-14">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-white">{icon}</span>
        <Eyebrow className="mt-5">{eyebrow}</Eyebrow>
        <h3 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[36px]">{heading}</h3>
        <p className="mt-4 max-w-[46ch] text-[16px] leading-[1.55] text-muted md:text-[17px]">{body}</p>
        <div className="mt-6 flex flex-wrap gap-2">{actions}</div>

        <ul className="mt-8 space-y-4 border-t border-border pt-6">
          {features.map((f, i) => (
            <li key={f.title} className="flex gap-3">
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-ink">
                {featureIcons[i]}
              </span>
              <div>
                <p className="text-[15px] font-medium">{f.title}</p>
                <p className="text-[14px] text-muted">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
