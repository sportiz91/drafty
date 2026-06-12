const FEATURES = [
  {
    number: '01',
    title: 'A real rich-text editor',
    description:
      'Headings, lists, bold, italics — proper formatting, with keyboard shortcuts for all of it.',
  },
  {
    number: '02',
    title: 'Autosave as you type',
    description:
      'Your work is saved the moment you write it. Close the tab mid-sentence; nothing is lost.',
  },
  {
    number: '03',
    title: 'One tidy workspace',
    description:
      'Every document in a single sidebar, most recent first. No folder trees to babysit.',
  },
  {
    number: '04',
    title: 'Yours, and only yours',
    description:
      'Sign in with email and password. Documents are private to your account, full stop.',
  },
] as const;

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-6xl scroll-mt-8 px-6 py-16 sm:py-24"
      data-id="features"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div>
          <h2 className="text-[35px] font-medium leading-[1.08] tracking-[-0.02em]">
            Everything you need.{' '}
            <span className="text-ink-muted">Nothing you don&apos;t.</span>
          </h2>
          <p className="mt-4 max-w-xs text-lg text-ink-secondary">
            Drafty keeps the writing front and center — the workspace stays out
            of your way.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(feature => (
            <div
              key={feature.number}
              className="rounded-[var(--radius-card)] bg-surface p-7 shadow-[var(--shadow-card)]"
            >
              <span className="inline-flex rounded-2xl bg-surface-muted px-3.5 py-2 text-sm font-medium">
                {feature.number}
              </span>
              <h3 className="mt-6 text-[26px] font-medium leading-[1.12] tracking-[-0.02em]">
                {feature.title}
              </h3>
              <p className="mt-3 text-base text-ink-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
