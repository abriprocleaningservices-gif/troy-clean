import { Link, useParams, Navigate } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { serviceSchema, faqSchema } from "@/components/seo/schema";
import { Button } from "@/components/ui/Button";
import { FAQ } from "@/components/marketing/FAQ";
import { getServiceSeoContent, SERVICE_SEO_CONTENT } from "@/data/seoContent";

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? getServiceSeoContent(slug) : undefined;

  if (!service) return <Navigate to="/services" replace />;

  const related = SERVICE_SEO_CONTENT.filter((s) => s.category === service.category && s.slug !== service.slug);

  return (
    <>
      <SEO
        title={service.metaTitle}
        description={service.metaDescription}
        path={`/services/${service.slug}`}
        jsonLd={[
          serviceSchema({ name: service.name, description: service.intro, slug: service.slug }),
          faqSchema(service.faqs),
        ]}
      />

      <div className="container-site grid gap-10 py-14 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-sm font-medium uppercase tracking-wide text-clay-600">
            {service.category === "residential" ? "Residential" : service.category === "apartment" ? "Apartment" : "Commercial"}
          </p>
          <h1 className="mt-2 font-display text-4xl text-pine-950">{service.h1}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/70">{service.intro}</p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {service.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-ink/80">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-500" aria-hidden />
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to={`/book?service=${service.slug}`}>
              <Button size="lg">See my price</Button>
            </Link>
          </div>
        </div>

        <aside className="rounded-sm border border-pine-100 bg-pine-50 p-6 md:col-span-1">
          <p className="font-display text-lg text-pine-950">Other {service.category} services</p>
          <ul className="mt-4 space-y-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link to={`/services/${r.slug}`} className="text-sm text-pine-800 hover:text-pine-950">
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <FAQ items={service.faqs} title={`${service.name} FAQs`} />
    </>
  );
}
