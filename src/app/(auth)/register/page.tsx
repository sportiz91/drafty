import type { Metadata } from 'next';

import { AuthCard } from '@/features/auth/components/auth-card';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="A fast, simple writing workspace"
    >
      <RegisterForm />
    </AuthCard>
  );
}
