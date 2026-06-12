import Link from 'next/link';

export default function DocumentNotFound() {
  return (
    <section
      className="mx-auto max-w-[428px] rounded-[var(--radius-card)] bg-surface p-8 text-center shadow-[var(--shadow-card)]"
      data-id="not-found"
    >
      <h1 className="text-[26px] font-medium tracking-[-0.02em]">
        Document not found
      </h1>
      <p className="mt-2 text-ink-secondary">
        This document doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link
        href="/documents"
        className="mt-6 inline-block rounded-[var(--radius-button)] bg-ink px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Back to your documents
      </Link>
    </section>
  );
}
