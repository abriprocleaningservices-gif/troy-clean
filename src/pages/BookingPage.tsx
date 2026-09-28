import { useSearchParams } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { BookingWizard } from "@/components/booking/BookingWizard";

export function BookingPage() {
  const [params] = useSearchParams();
  const serviceSlug = params.get("service") ?? undefined;

  return (
    <>
      <SEO
        title="Book Cleaning Service Online | Troy Premier Green Cleaning Co."
        description="Book residential, apartment, or commercial cleaning in Troy, MI. See your price instantly and pick a time that works."
        path="/book"
      />
      <BookingWizard initialServiceSlug={serviceSlug} />
    </>
  );
}
