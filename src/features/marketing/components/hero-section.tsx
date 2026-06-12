import { PillLink } from '@/features/marketing/components/pill-link';

const SIDEBAR_DOCS = [
  'Q3 launch notes',
  'Weekly review',
  'Blog: shipping fast',
  'Reading list',
] as const;

const PARAGRAPH_WIDTHS = [
  'w-full',
  'w-11/12',
  'w-4/5',
  'w-10/12',
  'w-2/3',
] as const;

export function HeroSection() {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-6 pb-20 pt-14 sm:pt-20"
      data-id="hero"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span
          className="animate-rise flex size-14 items-center justify-center rounded-2xl bg-ink/90 text-2xl font-semibold text-white"
          aria-hidden="true"
        >
          D
        </span>
        <h1 className="animate-rise mt-8 text-[40px] font-medium leading-[1.08] tracking-[-0.02em] [animation-delay:90ms] sm:text-[58px]">
          Write faster, think clearer.{' '}
          <span className="text-ink-muted">All in one place.</span>
        </h1>
        <p className="animate-rise mt-6 max-w-md text-lg text-ink-secondary [animation-delay:180ms]">
          Drafty is a fast, focused writing workspace. Rich documents, autosaved
          as you type, organized without effort.
        </p>
        <div className="animate-rise mt-8 flex flex-wrap items-center justify-center gap-3 [animation-delay:270ms]">
          <PillLink href="/register" data-id="hero-cta">
            Try Drafty free
          </PillLink>
          <PillLink
            href="#pricing"
            variant="secondary"
            data-id="hero-pricing-link"
          >
            See pricing
          </PillLink>
        </div>
      </div>
      <HeroEditorMock />
    </section>
  );
}

function HeroEditorMock() {
  return (
    <div
      className="animate-rise mt-16 rounded-[var(--radius-card)] bg-surface p-2 shadow-[var(--shadow-card)] [animation-delay:360ms] sm:p-3"
      aria-hidden="true"
    >
      <div className="overflow-hidden rounded-[24px] border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
          </div>
          <span className="text-sm text-ink-secondary">Q3 launch notes</span>
          <span className="animate-rise text-xs text-ink-muted [animation-delay:2000ms]">
            Saved just now
          </span>
        </div>
        <div className="grid sm:grid-cols-[220px_1fr]">
          <div className="hidden space-y-1.5 border-r border-border p-4 sm:block">
            {SIDEBAR_DOCS.map((doc, index) => (
              <div
                key={doc}
                className={`rounded-xl px-3 py-2 text-sm ${
                  index === 0
                    ? 'bg-surface-muted text-ink'
                    : 'text-ink-secondary'
                }`}
              >
                {doc}
              </div>
            ))}
          </div>
          <div className="px-6 py-8 sm:px-10">
            <p className="text-[26px] font-medium leading-[1.12] tracking-[-0.02em]">
              Q3 launch notes
            </p>
            <div className="mt-6 space-y-3">
              {/* The paragraph skeleton "types itself", then "Saved just
                  now" appears — the autosave promise, animated. */}
              {PARAGRAPH_WIDTHS.map((width, index) => (
                <div
                  key={width}
                  className={`mock-bar h-3 rounded-full bg-surface-muted ${width}`}
                  style={{ animationDelay: `${700 + index * 240}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
