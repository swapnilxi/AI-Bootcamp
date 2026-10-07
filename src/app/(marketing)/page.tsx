import { getFeaturedServices } from "@/lib/services/featured";
import { HeroSection } from "@/components/home/HeroSection";
import { CredentialMarquee } from "@/components/home/CredentialMarquee";
import { MoonPhaseDivider } from "@/components/home/MoonPhaseDivider";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { LineageSection } from "@/components/home/LineageSection";
import { ScrollManifesto } from "@/components/home/ScrollManifesto";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { FaqSection } from "@/components/home/FaqSection";

// ISR: revalidate every hour or on-demand when admin edits services
export const revalidate = 3600;

/**
 * Homepage. Each section is its own component in src/components/home/;
 * copy lives in src/content/home.ts.
 */
export default async function HomePage() {
  const services = await getFeaturedServices();

  return (
    <div className="flex flex-col">
      <HeroSection />
      <CredentialMarquee />
      <MoonPhaseDivider />
      <ServicesSection services={services} />
      <ProcessSection />
      <LineageSection />
      <ScrollManifesto />
      <TestimonialsSection />
      <FaqSection />
    </div>
  );
}
