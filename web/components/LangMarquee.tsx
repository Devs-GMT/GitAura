import { LANGUAGES } from "@/lib/config";

const NAMES = LANGUAGES.slice(1).map((l) => l.name);

/** Baris nama bahasa bergulir pelan (40s). Daftar digandakan agar loop mulus; reduced motion → diam. */
export function LangMarquee() {
  return (
    <section className="container-page py-6" aria-label="Languages">
      <div className="overflow-hidden rounded-card border border-border bg-surface py-6 shadow-card [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="flex w-max animate-marquee gap-10 pr-10 motion-reduce:animate-none">
          {[...NAMES, ...NAMES].map((name, i) => (
            <li
              key={`${name}-${i}`}
              aria-hidden={i >= NAMES.length || undefined}
              className="whitespace-nowrap font-mono text-[15px] text-muted"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
