import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

type PillLinkProps = {
  variant?: 'primary' | 'secondary' | 'accent';
} & ComponentPropsWithoutRef<typeof Link>;

const VARIANT_CLASSES = {
  primary: 'bg-ink/90 text-white hover:bg-ink/80',
  secondary: 'bg-surface text-ink hover:bg-surface-muted',
  accent: 'bg-accent text-white hover:opacity-90',
} as const;

export function PillLink({
  variant = 'primary',
  className = '',
  ...props
}: PillLinkProps) {
  return (
    <Link
      className={`inline-flex items-center justify-center rounded-full px-7 py-3.5 text-lg font-semibold tracking-[-0.02em] transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
