/**
 * Landing page — server component, no auth required.
 * Renders the full marketing page: nav, hero, features, testimonials, pricing, FAQ, footer.
 */

import { LandingNav } from "@/features/landing/LandingNav";
import { LandingHero } from "@/features/landing/LandingHero";
import { LandingFeatures } from "@/features/landing/LandingFeatures";
import { LandingTestimonials } from "@/features/landing/LandingTestimonials";
import { LandingPricing } from "@/features/landing/LandingPricing";
import { LandingFaq } from "@/features/landing/LandingFaq";
import { LandingFooter } from "@/features/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingTestimonials />
        <LandingPricing />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}
