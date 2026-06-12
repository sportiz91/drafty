import type { ReactNode } from 'react';

import { MarketingNav } from '@/features/marketing/components/marketing-nav';
import { SiteFooter } from '@/features/marketing/components/site-footer';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingNav />
      {children}
      <SiteFooter />
    </>
  );
}
