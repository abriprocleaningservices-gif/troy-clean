export interface ServiceSeoContent {
  slug: string;
  name: string;
  category: "residential" | "commercial" | "apartment";
  h1: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  bullets: string[];
  faqs: { question: string; answer: string }[];
}

export const SERVICE_SEO_CONTENT: ServiceSeoContent[] = [
  {
    slug: "standard-cleaning",
    name: "Standard Residential Cleaning",
    category: "residential",
    h1: "House Cleaning in Troy, MI",
    intro:
      "Recurring or one-time house cleaning for Troy and the surrounding Metro Detroit area — kitchens, bathrooms, living spaces, and bedrooms, cleaned to a consistent standard every visit.",
    metaTitle: "House Cleaning Troy MI | Troy Premier Green Cleaning Co.",
    metaDescription:
      "Locally operated house cleaning in Troy, MI. Eco-friendly products, upfront online pricing, and easy booking in minutes.",
    bullets: [
      "Kitchens, bathrooms, bedrooms, and living areas",
      "Weekly, biweekly, monthly, or one-time scheduling",
      "Eco-conscious cleaning products",
      "Consistent checklist followed on every visit",
    ],
    faqs: [
      {
        question: "What's included in a standard cleaning?",
        answer:
          "Kitchen and bathroom surfaces, floors, dusting, trash removal, and tidying of living areas and bedrooms. You can add extras like inside-oven or inside-fridge cleaning during booking.",
      },
      {
        question: "Do I need to be home during the cleaning?",
        answer:
          "No. Many customers provide access instructions at booking and aren't home. You'll get a text when your cleaner is en route and when the job is complete.",
      },
    ],
  },
  {
    slug: "deep-cleaning",
    name: "Deep Cleaning",
    category: "residential",
    h1: "Deep Cleaning in Troy, MI",
    intro:
      "A detailed, top-to-bottom clean for homes that need extra attention — baseboards, buildup, and the spots a routine clean doesn't reach. A common first-time booking before switching to recurring service.",
    metaTitle: "Deep Cleaning Troy MI | Detailed Home Cleaning",
    metaDescription:
      "Professional deep cleaning in Troy, Michigan. Baseboards, buildup, and detail work included. See your price before you book.",
    bullets: [
      "Ideal for first-time bookings or infrequently cleaned homes",
      "Extra time budgeted for buildup and detail work",
      "Optional add-ons for ovens, fridges, and cabinets",
      "A strong foundation before switching to recurring cleaning",
    ],
    faqs: [
      {
        question: "How is deep cleaning different from standard cleaning?",
        answer:
          "Deep cleaning budgets significantly more time per room and focuses on buildup, detail work, and areas not covered in a routine visit, like baseboards and interior glass.",
      },
      {
        question: "Should I book deep cleaning before starting recurring service?",
        answer:
          "Most customers do. It resets the home to a consistent baseline, so recurring visits can maintain rather than catch up.",
      },
    ],
  },
  {
    slug: "move-in-cleaning",
    name: "Move-In Cleaning",
    category: "residential",
    h1: "Move-In Cleaning in Troy, MI",
    intro:
      "A full clean of an empty home before your furniture arrives — cabinets, closets, floors, and fixtures, so you start in a genuinely clean space.",
    metaTitle: "Move In Cleaning Troy MI | Move-In Ready Homes",
    metaDescription: "Start fresh in your new Troy, MI home with a full move-in cleaning service, booked online.",
    bullets: [
      "Best scheduled before furniture delivery",
      "Interior cabinets and closets included as add-ons",
      "Floors, fixtures, and surfaces throughout",
      "Available for houses, condos, and apartments",
    ],
    faqs: [
      {
        question: "When should I schedule move-in cleaning?",
        answer: "Ideally after the previous residents or contractors are out, and before your furniture arrives.",
      },
    ],
  },
  {
    slug: "move-out-cleaning",
    name: "Move-Out Cleaning",
    category: "residential",
    h1: "Move-Out Cleaning in Troy, MI",
    intro:
      "A thorough clean built to help you hand back a spotless home — whether that's for a landlord inspection, a deposit return, or the next resident.",
    metaTitle: "Move Out Cleaning Troy MI | Deposit-Ready Cleaning",
    metaDescription: "Move-out cleaning in Troy, MI built around landlord and property manager expectations.",
    bullets: [
      "Built around typical move-out inspection checklists",
      "Empty-home pricing based on square footage and layout",
      "Available on short notice where scheduling allows",
      "Popular add-ons: inside cabinets, baseboards, interior windows",
    ],
    faqs: [
      {
        question: "Will this guarantee I get my deposit back?",
        answer:
          "We clean thoroughly to a consistent checklist, but deposit decisions are made by your landlord or property manager based on their own inspection criteria.",
      },
    ],
  },
  {
    slug: "apartment-turnover",
    name: "Apartment Turnover Cleaning",
    category: "apartment",
    h1: "Apartment Turnover Cleaning in Troy, MI",
    intro:
      "Fast, consistent turnover cleaning between residents, built for property managers and leasing offices who need reliable scheduling and predictable quality.",
    metaTitle: "Apartment Turnover Cleaning Troy MI | Property Managers",
    metaDescription: "Dependable turnover cleaning for Troy, MI property managers and leasing offices.",
    bullets: [
      "Built for property managers and leasing offices",
      "Consistent checklist across every unit",
      "Fast turnaround to minimize vacancy time",
      "Dedicated property manager request workflow",
    ],
    faqs: [
      {
        question: "Do you work directly with property management companies?",
        answer:
          "Yes. Property managers can submit turnover, move-out, and recurring janitorial requests through a dedicated portal rather than the standard consumer booking flow.",
      },
    ],
  },
  {
    slug: "office-cleaning",
    name: "Office Cleaning",
    category: "commercial",
    h1: "Office Cleaning in Troy, MI",
    intro:
      "Routine office cleaning covering workstations, common areas, kitchens, and restrooms — scheduled around your business hours.",
    metaTitle: "Office Cleaning Troy MI | Commercial Office Cleaning",
    metaDescription: "Professional office cleaning for Troy, MI businesses. Flexible scheduling, consistent quality.",
    bullets: [
      "Scheduled around your business hours",
      "Workstations, common areas, kitchens, restrooms",
      "Recurring service with a consistent crew",
      "Request a walkthrough for a custom quote",
    ],
    faqs: [
      {
        question: "Can you clean after hours?",
        answer: "Yes — evening and early-morning scheduling is available for most office accounts.",
      },
    ],
  },
  {
    slug: "commercial-cleaning",
    name: "Commercial Cleaning",
    category: "commercial",
    h1: "Commercial Cleaning in Troy, MI",
    intro:
      "General commercial cleaning for retail, medical, and professional spaces throughout Troy and Metro Detroit.",
    metaTitle: "Commercial Cleaning Troy MI | Business Cleaning Services",
    metaDescription: "Commercial cleaning for Troy, MI businesses of all sizes. Request a walkthrough and custom quote.",
    bullets: [
      "Retail, medical, and professional spaces",
      "Custom scope built around your facility",
      "Walkthrough-based quoting for complex spaces",
      "Recurring or one-time scheduling",
    ],
    faqs: [
      {
        question: "How do you price commercial jobs?",
        answer:
          "Larger or complex commercial spaces are quoted after a walkthrough rather than an automatic online estimate, so the price reflects your actual facility.",
      },
    ],
  },
  {
    slug: "janitorial-services",
    name: "Janitorial Services",
    category: "commercial",
    h1: "Janitorial Services in Troy, MI",
    intro:
      "Recurring janitorial coverage for facilities that need ongoing daily, weekly, or nightly service, with a consistent crew and clear reporting.",
    metaTitle: "Janitorial Services Troy MI | Recurring Facility Cleaning",
    metaDescription: "Reliable janitorial services in Troy, MI for offices, facilities, and commercial properties.",
    bullets: [
      "Daily, weekly, or nightly recurring coverage",
      "Consistent crew assigned to your facility",
      "Custom scope of work per contract",
      "Built for offices, facilities, and multi-tenant properties",
    ],
    faqs: [
      {
        question: "Do you offer contracts for ongoing janitorial service?",
        answer: "Yes — recurring janitorial accounts are set up after a walkthrough and a scoped proposal.",
      },
    ],
  },
];

export function getServiceSeoContent(slug: string): ServiceSeoContent | undefined {
  return SERVICE_SEO_CONTENT.find((s) => s.slug === slug);
}
