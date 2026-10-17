import { COPY } from "@/lib/copy";
import { Eyebrow } from "./Eyebrow";

const ICONS = [
  // Sign in — kunci
  <path key="i" d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5zM12 14v2" />,
  // Reveal — kilau
  <path key="r" d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  // Stamp — kubus
  <path key="s" d="M12 3 20 7.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12 4 7.5" />,
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container-page scroll-mt-20 py-[72px] md:py-[120px]">
      <div className="flex flex-col items-center text-center">
        <Eyebrow>{COPY.how.eyebrow}</Eyebrow>
        <h2 className="mt-4 text-[32px] font-semibold tracking-[-0.02em] md:text-[48px]">{COPY.how.title}</h2>
      </div>

      <ol className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
        {COPY.how.steps.map((step, i) => (
          <li key={step.title} className="rounded-card border border-border bg-surface p-6 shadow-card md:p-8">
            <div className="flex items-center justify-between">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-ink">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {ICONS[i]}
                </svg>
              </span>
              <span className="font-mono text-[13px] text-muted">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-6 text-[22px] font-semibold tracking-[-0.01em]">{step.title}</h3>
            <p className="mt-2 text-[16px] leading-[1.55] text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
