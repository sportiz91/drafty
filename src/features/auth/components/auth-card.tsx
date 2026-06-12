import Link from 'next/link';
import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[428px] rounded-[var(--radius-card)] bg-surface p-8 shadow-[var(--shadow-card)]">
      <Link
        href="/"
        className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-ink/90 text-xl font-semibold text-white"
        aria-label="Drafty home"
      >
        D
      </Link>
      <h1 className="mt-6 text-center text-[26px] font-medium leading-[1.12] tracking-[-0.02em]">
        {title}
      </h1>
      <p className="mt-1.5 text-center text-base text-ink-secondary">
        {subtitle}
      </p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
