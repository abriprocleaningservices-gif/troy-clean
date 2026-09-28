import { Link, useSearchParams } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/Button";

export function BookingConfirmedPage() {
  const [params] = useSearchParams();
  const bookingNumber = params.get("booking");

  return (
    <>
      <SEO title="Booking Confirmed | Troy Premier Green Cleaning Co." description="Your cleaning booking is confirmed." path="/book/confirmed" />
      <div className="container-site max-w-xl py-24 text-center">
        <h1 className="font-display text-4xl text-pine-950">You're booked!</h1>
        <p className="mt-3 text-ink/70">
          {bookingNumber ? (
            <>Confirmation number <strong className="text-pine-900">{bookingNumber}</strong>. </>
          ) : null}
          A confirmation email and text message are on the way.
        </p>
        <Link to="/" className="mt-8 inline-block">
          <Button>Back to home</Button>
        </Link>
      </div>
    </>
  );
}
