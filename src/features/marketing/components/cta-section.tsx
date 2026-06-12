import Link from 'next/link';

export function CtaSection() {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24"
      data-id="cta-band"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/register"
          data-id="cta-band-cta"
          className="flex h-36 items-center justify-center rounded-full bg-accent text-[26px] font-medium tracking-[-0.02em] text-white transition-opacity hover:opacity-90 sm:h-44"
        >
          Try Drafty for free
        </Link>
        <Link
          href="#pricing"
          className="flex h-36 items-center justify-center rounded-full bg-surface text-[26px] font-medium tracking-[-0.02em] shadow-[var(--shadow-card)] transition-colors hover:bg-surface-muted sm:h-44"
        >
          See pricing
        </Link>
      </div>
    </section>
  );
}
