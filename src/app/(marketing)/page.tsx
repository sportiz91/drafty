import { CtaSection } from '@/features/marketing/components/cta-section';
import { FaqSection } from '@/features/marketing/components/faq-section';
import { FeaturesSection } from '@/features/marketing/components/features-section';
import { HeroSection } from '@/features/marketing/components/hero-section';
import { PricingSection } from '@/features/marketing/components/pricing-section';

export default function MarketingHomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </main>
  );
}
