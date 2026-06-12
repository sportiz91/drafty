import Link from 'next/link';

import { PillLink } from '@/features/marketing/components/pill-link';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const;

export function MarketingNav() {
  return (
    <header
      className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6"
      data-id="marketing-nav"
    >
      <Link
        href="/"
        className="flex items-center gap-2.5"
        aria-label="Drafty home"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-ink/90 text-sm font-semibold text-white">
          D
        </span>
        <span className="text-lg font-semibold tracking-[-0.02em]">Drafty</span>
      </Link>
      <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-base text-ink-secondary transition-colors hover:text-ink"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-base text-ink-secondary transition-colors hover:text-ink"
          data-id="nav-login"
        >
          Log in
        </Link>
        <PillLink
          href="/register"
          className="px-5 py-2.5 text-base"
          data-id="nav-cta"
        >
          Try it free
        </PillLink>
      </div>
    </header>
  );
}
