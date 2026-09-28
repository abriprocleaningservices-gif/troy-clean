import { Link } from "react-router-dom";
import { SERVICE_SEO_CONTENT } from "@/data/seoContent";

const CATEGORY_LABEL: Record<string, string> = {
  residential: "Residential",
  apartment: "Apartment",
  commercial: "Commercial",
};

export function ServicesGrid() {
  return (
    <section className="py-16">
      <div className="container-site">
        <h2 className="font-display text-3xl text-pine-950">Every cleaning service, one system</h2>
        <p className="mt-2 max-w-xl text-ink/70">
          From a single standard cleaning to recurring janitorial coverage — pick a service to see what's included.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_SEO_CONTENT.map((service) => (
            <Link
              key={service.slug}
              to={`/services/${service.slug}`}
              className="group rounded-sm border border-pine-100 p-6 transition-colors hover:border-pine-400 hover:bg-pine-50"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
                {CATEGORY_LABEL[service.category]}
              </span>
              <h3 className="mt-2 font-display text-xl text-pine-950">{service.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-ink/70">{service.intro}</p>
              <span className="mt-4 inline-block text-sm font-medium text-pine-700 group-hover:text-pine-900">
                Learn more
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
