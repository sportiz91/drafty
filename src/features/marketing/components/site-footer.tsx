import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
  { href: '/login', label: 'Log in' },
  { href: '/register', label: 'Create account' },
] as const;

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 pb-10" data-id="footer">
      <div className="flex flex-col items-center justify-between gap-6 border-t border-border pt-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink/90 text-sm font-semibold text-white">
            D
          </span>
          <span className="text-lg font-semibold tracking-[-0.02em]">
            Drafty
          </span>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-ink-secondary transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mt-8 text-center text-sm text-ink-muted">
        © 2026 Drafty. A demo product — payments run in Stripe test mode.
      </p>
    </footer>
  );
}
