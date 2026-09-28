const SITE_URL = (import.meta.env.VITE_SITE_URL as string) || "https://troypremiercleaning.com";
const BUSINESS_PHONE = (import.meta.env.VITE_BUSINESS_PHONE as string) || "";

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: "Troy Premier Green Cleaning Co.",
    alternateName: "ABRI PRO CLEANING SERVICES LLC",
    url: SITE_URL,
    telephone: BUSINESS_PHONE,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Troy",
      addressRegion: "MI",
      addressCountry: "US",
    },
    areaServed: [
      { "@type": "City", name: "Troy" },
      { "@type": "City", name: "Royal Oak" },
      { "@type": "City", name: "Birmingham" },
      { "@type": "City", name: "Rochester Hills" },
      { "@type": "City", name: "Sterling Heights" },
      { "@type": "City", name: "Warren" },
    ],
  };
}

export function serviceSchema(opts: { name: string; description: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: opts.name,
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}/services/${opts.slug}`,
    provider: {
      "@type": "LocalBusiness",
      name: "Troy Premier Green Cleaning Co.",
    },
    areaServed: {
      "@type": "City",
      name: "Troy, MI",
    },
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
