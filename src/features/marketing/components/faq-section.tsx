import { Reveal } from '@/features/marketing/components/reveal';

const FAQ_ITEMS = [
  {
    question: 'What is Drafty?',
    answer:
      'A fast, focused writing workspace: rich-text documents, autosaved as you type, organized in one sidebar.',
  },
  {
    question: 'What does the Free plan include?',
    answer:
      'An account and a full look around. Creating and editing documents is part of Pro.',
  },
  {
    question: 'How does billing work?',
    answer:
      'Pro is €9/month, billed through Stripe. This is a demo product, so checkout runs in Stripe test mode. Use card 4242 4242 4242 4242.',
  },
  {
    question: 'Is my work saved automatically?',
    answer:
      'Yes. Drafty autosaves as you type, so there is no Save button to forget.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. Manage billing opens the Stripe customer portal, where you can cancel in one click. Access runs to the end of the paid period.',
  },
] as const;

export function FaqSection() {
  return (
    <section
      id="faq"
      className="mx-auto w-full max-w-6xl scroll-mt-8 px-6 py-16 sm:py-24"
      data-id="faq"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-[35px] font-medium leading-[1.08] tracking-[-0.02em]">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-lg text-ink-secondary">
          Everything you need to know before you start writing.
        </p>
      </Reveal>
      <div className="mx-auto mt-12 max-w-3xl space-y-3">
        {FAQ_ITEMS.map((item, index) => (
          <details
            key={item.question}
            className="group rounded-3xl bg-surface px-6 py-5 shadow-[var(--shadow-card)]"
            data-id={`faq-item-${index}`}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium tracking-[-0.02em] [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                <PlusIcon />
              </span>
            </summary>
            <p className="mt-4 max-w-[60ch] text-base text-ink-secondary">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 fill-ink" aria-hidden="true">
      <path d="M8.75 3a.75.75 0 0 0-1.5 0v4.25H3a.75.75 0 0 0 0 1.5h4.25V13a.75.75 0 0 0 1.5 0V8.75H13a.75.75 0 0 0 0-1.5H8.75V3Z" />
    </svg>
  );
}
