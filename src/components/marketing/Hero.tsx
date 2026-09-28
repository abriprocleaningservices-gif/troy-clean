import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="border-b border-pine-100 bg-gradient-to-b from-pine-50 to-paper">
      <div className="container-site grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-clay-600">
            Locally operated in Troy, Michigan
          </p>
          <h1 className="mt-3 max-w-xl font-display text-4xl font-medium leading-[1.1] text-pine-950 sm:text-5xl">
            A cleaning crew Troy homeowners actually keep rebooking.
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink/70">
            Eco-friendly residential and commercial cleaning, booked online in minutes with a price you see before
            you commit — no guessing, no hard sell.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/book">
              <Button size="lg">Get an instant price</Button>
            </Link>
            <Link to="/commercial">
              <Button size="lg" variant="outline">Request a commercial quote</Button>
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-pine-100 pt-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink/50">Service area</dt>
              <dd className="mt-1 font-display text-lg text-pine-900">Troy &amp; Metro Detroit</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink/50">Booking</dt>
              <dd className="mt-1 font-display text-lg text-pine-900">Online, in minutes</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink/50">Products</dt>
              <dd className="mt-1 font-display text-lg text-pine-900">Eco-conscious</dd>
            </div>
          </dl>
        </div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-pine-100 md:aspect-[4/5]">
          <div className="flex h-full items-center justify-center p-10 text-center text-pine-700">
            <p className="text-sm">
              Replace with professional photography of your cleaning crew or a finished space before launch.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
