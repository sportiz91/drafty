import type { ComponentPropsWithoutRef } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthFormFieldProps = {
  label: string;
  error?: string;
  'data-id': string;
} & ComponentPropsWithoutRef<'input'>;

export function AuthFormField({
  label,
  error,
  id,
  'data-id': dataId,
  ...inputProps
}: AuthFormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} data-id={dataId} {...inputProps} />
      {error ? (
        <p className="text-sm text-accent" data-id={`${dataId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
