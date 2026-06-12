import type { ComponentPropsWithoutRef } from 'react';

type InputProps = ComponentPropsWithoutRef<'input'>;

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-[var(--radius-button)] border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-ink/40 focus:outline-none ${className}`}
      {...props}
    />
  );
}
