import { SEO } from "@/components/seo/SEO";
import { localBusinessSchema } from "@/components/seo/schema";
import { Hero } from "@/components/marketing/Hero";
import { TrustIndicators } from "@/components/marketing/TrustIndicators";
import { ServicesGrid } from "@/components/marketing/ServicesGrid";
import { BeforeAfterGallery } from "@/components/marketing/BeforeAfterGallery";
import { Testimonials } from "@/components/marketing/Testimonials";
import { ServiceAreaSection } from "@/components/marketing/ServiceAreaMap";
import { FAQ } from "@/components/marketing/FAQ";

const HOME_FAQS = [
  { question: "How do I get a price?", answer: "Use the online booking wizard — pick a service, answer a few questions about your home, and see your price before you book." },
  { question: "What areas do you serve?", answer: "Troy, MI and the surrounding Metro Detroit communities, including Royal Oak, Birmingham, Rochester Hills, Sterling Heights, and Warren." },
  { question: "Can I set up recurring cleaning?", answer: "Yes — choose weekly, biweekly, or monthly during booking and your discount is applied automatically." },
];

export function HomePage() {
  return (
    <>
      <SEO
        title="Troy Premier Green Cleaning Co. | House & Commercial Cleaning in Troy, MI"
        description="Locally operated, eco-friendly residential and commercial cleaning in Troy, MI and Metro Detroit. Instant online quotes, easy booking, reliable cleaners."
        path="/"
        jsonLd={localBusinessSchema()}
      />
      <Hero />
      <TrustIndicators />
      <ServicesGrid />
      <BeforeAfterGallery />
      <Testimonials reviews={[]} />
      <ServiceAreaSection />
      <FAQ items={HOME_FAQS} />
    </>
  );
}
