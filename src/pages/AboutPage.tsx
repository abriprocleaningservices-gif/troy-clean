import { SEO } from "@/components/seo/SEO";

export function AboutPage() {
  return (
    <>
      <SEO
        title="About Troy Premier Green Cleaning Co."
        description="Locally operated cleaning company based in Troy, Michigan, serving residential and commercial customers across Metro Detroit."
        path="/about"
      />
      <div className="container-site max-w-2xl py-16">
        <h1 className="font-display text-4xl text-pine-950">About us</h1>
        <p className="mt-4 text-ink/70">
          Troy Premier Green Cleaning Co. (operating as ABRI PRO CLEANING SERVICES LLC) is a locally operated
          cleaning company based in Troy, Michigan. We clean homes, apartments, and commercial spaces across
          Troy and the surrounding Metro Detroit communities, with a focus on consistent quality, clear
          communication, and eco-conscious products.
        </p>
        <p className="mt-4 text-ink/70">
          Replace this page with your company's real story, team photos, and history before launch — this
          placeholder intentionally avoids inventing certifications, awards, or claims.
        </p>
      </div>
    </>
  );
}
