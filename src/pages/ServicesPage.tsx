import { SEO } from "@/components/seo/SEO";
import { ServicesGrid } from "@/components/marketing/ServicesGrid";

export function ServicesPage() {
  return (
    <>
      <SEO
        title="Cleaning Services Troy MI | Troy Premier Green Cleaning Co."
        description="Residential, apartment, and commercial cleaning services in Troy, MI. Compare services and get an instant price."
        path="/services"
      />
      <div className="container-site py-10">
        <h1 className="font-display text-4xl text-pine-950">Cleaning Services in Troy, MI</h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Residential, apartment turnover, and commercial cleaning — all booked and managed through one system.
        </p>
      </div>
      <ServicesGrid />
    </>
  );
}
