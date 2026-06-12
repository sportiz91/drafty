import { PillLink } from '@/features/marketing/components/pill-link';
import { Reveal } from '@/features/marketing/components/reveal';

export function CtaSection() {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24"
      data-id="cta-band"
    >
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[35px] font-medium leading-[1.08] tracking-[-0.02em]">
            Start writing today
          </h2>
          <p className="mt-4 text-lg text-ink-secondary">
            Free to look around. One plan when you need it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PillLink href="/register" data-id="cta-band-cta">
              Try Drafty for free
            </PillLink>
            <PillLink href="#pricing" variant="secondary">
              See pricing
            </PillLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
