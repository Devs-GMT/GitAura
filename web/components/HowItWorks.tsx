import Link from "next/link";
import { CONTRACT_ADDRESS, explorerAddressUrl } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { Eyebrow } from "./Eyebrow";
import { GitHubButton } from "./GitHubButton";
import { RevealMock } from "./RevealMock";
import { SignInMock } from "./SignInMock";
import { StampMock } from "./StampMock";
import { StepCard } from "./StepCard";

function Icon({ d, className = "size-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const P = {
  lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5zM12 14v2",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  cube: "M12 3 20 7.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12 4 7.5",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  pen: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  refresh: "M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
};

const PINK_CTA =
  "inline-flex h-10 items-center justify-center rounded-[12px] bg-accent px-4 text-[14px] font-semibold text-white transition-[filter] duration-200 ease-out hover:brightness-95";
const OUTLINE_CTA =
  "inline-flex h-10 items-center justify-center rounded-[12px] border border-border bg-surface px-4 text-[14px] font-medium text-ink hover:border-ink";

export function HowItWorks() {
  const [signIn, reveal, stamp] = COPY.how.steps;
  return (
    <section id="how-it-works" className="container-page scroll-mt-20 py-[72px] md:py-[120px]">
      <div className="flex flex-col items-center text-center">
        <Eyebrow>{COPY.how.eyebrow}</Eyebrow>
        <h2 className="mt-4 text-[32px] font-semibold tracking-[-0.02em] md:text-[48px]">{COPY.how.title}</h2>
      </div>

      <div className="mt-12 flex flex-col gap-6 md:mt-16 md:gap-8">
        <StepCard
          {...signIn}
          tone="yellow"
          icon={<Icon d={P.lock} className="size-5" />}
          featureIcons={[<Icon key="e" d={P.eye} />, <Icon key="t" d={P.trash} />, <Icon key="s" d={P.search} />]}
          visual={<SignInMock />}
          actions={<GitHubButton compact />}
        />
        <StepCard
          {...reveal}
          tone="pink"
          reverse
          icon={<Icon d={P.sparkle} className="size-5" />}
          featureIcons={[<Icon key="c" d={P.chart} />, <Icon key="h" d={P.heart} />, <Icon key="k" d={P.clock} />]}
          visual={<RevealMock />}
          actions={
            <a href="#peek" className={PINK_CTA}>
              {COPY.how.peekCta}
            </a>
          }
        />
        <StepCard
          {...stamp}
          tone="orange"
          icon={<Icon d={P.cube} className="size-5" />}
          featureIcons={[<Icon key="p" d={P.pen} />, <Icon key="r" d={P.refresh} />, <Icon key="l" d={P.link} />]}
          visual={<StampMock />}
          actions={
            <>
              {CONTRACT_ADDRESS && (
                <a href={explorerAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer" className={PINK_CTA}>
                  {COPY.footer.explorer}
                </a>
              )}
              <Link href="/gallery" className={OUTLINE_CTA}>
                {COPY.gallery.teaser}
              </Link>
            </>
          }
        />
      </div>
    </section>
  );
}
