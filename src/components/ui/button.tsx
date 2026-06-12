import type { ComponentPropsWithoutRef } from 'react';

type ButtonProps = {
  variant?: 'primary' | 'secondary';
} & ComponentPropsWithoutRef<'button'>;

const VARIANT_CLASSES = {
  primary: 'bg-ink/90 text-white hover:bg-ink/80 rounded-[var(--radius-panel)]',
  secondary:
    'bg-surface-muted text-ink hover:bg-border rounded-[var(--radius-button)]',
} as const;

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`px-5 py-3.5 text-lg font-semibold tracking-[-0.02em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
