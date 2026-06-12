import Link from 'next/link';

import { Reveal } from '@/features/marketing/components/reveal';

const FREE_FEATURES = [
  'Email & password account',
  'Full product tour',
  'Upgrade in two clicks',
  'No card required',
] as const;

const PRO_FEATURES = [
  'Unlimited rich-text documents',
  'Autosave on every keystroke',
  'One tidy document sidebar',
  'Cancel anytime from the billing portal',
] as const;

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-6xl scroll-mt-8 px-6 py-16 sm:py-24"
      data-id="pricing"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-[35px] font-medium leading-[1.08] tracking-[-0.02em]">
          Start free.{' '}
          <span className="text-ink-muted">Go Pro when it clicks.</span>
        </h2>
        <p className="mt-4 text-lg text-ink-secondary">
          No tiers to decode. One paid plan with everything in it.
        </p>
      </Reveal>
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
        <Reveal>
          <PricingCard
            badge="Free"
            descriptor="For trying Drafty"
            price="€0"
            ctaLabel="Start free"
            ctaDataId="pricing-free-cta"
            features={FREE_FEATURES}
          />
        </Reveal>
        <Reveal delayMs={110}>
          <PricingCard
            badge="Pro"
            descriptor="For people who write"
            price="€9"
            ctaLabel="Go Pro"
            ctaDataId="pricing-pro-cta"
            features={PRO_FEATURES}
            isHighlighted
          />
        </Reveal>
      </div>
    </section>
  );
}

type PricingCardProps = {
  badge: string;
  descriptor: string;
  price: string;
  ctaLabel: string;
  ctaDataId: string;
  features: readonly string[];
  isHighlighted?: boolean;
};

function PricingCard({
  badge,
  descriptor,
  price,
  ctaLabel,
  ctaDataId,
  features,
  isHighlighted = false,
}: PricingCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface p-8 shadow-[var(--shadow-card)]">
      {isHighlighted ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_72_5/0.25),transparent)]"
          aria-hidden="true"
        />
      ) : null}
      <div className="relative">
        <span className="inline-flex rounded-2xl bg-surface-muted px-3.5 py-2 text-sm font-medium">
          {badge}
        </span>
        <div className="mt-8 text-center">
          <p className="text-base text-ink-secondary">{descriptor}</p>
          <p className="mt-2 text-[44px] font-medium leading-[1.08] tracking-[-0.02em]">
            {price}{' '}
            <span className="text-base font-normal text-ink-muted">
              / month
            </span>
          </p>
        </div>
        <hr className="mt-6 border-border" />
        <Link
          href="/register"
          data-id={ctaDataId}
          className={`mt-6 flex w-full items-center justify-center px-5 py-3.5 text-lg font-semibold tracking-[-0.02em] transition-colors ${
            isHighlighted
              ? 'rounded-[var(--radius-panel)] bg-ink/90 text-white hover:bg-ink/80'
              : 'rounded-[var(--radius-button)] bg-surface-muted hover:bg-border'
          }`}
        >
          {ctaLabel}
        </Link>
        <ul className="mt-8 space-y-3">
          {features.map(feature => (
            <li
              key={feature}
              className="flex items-start gap-3 text-base text-ink-secondary"
            >
              <CircleCheckIcon />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CircleCheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="mt-1 size-4 shrink-0 fill-ink"
      aria-hidden="true"
    >
      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm3.73 6.16-4.2 4.2a.75.75 0 0 1-1.06 0L4.27 8.16a.75.75 0 1 1 1.06-1.06l1.67 1.66 3.67-3.66a.75.75 0 1 1 1.06 1.06Z" />
    </svg>
  );
}
