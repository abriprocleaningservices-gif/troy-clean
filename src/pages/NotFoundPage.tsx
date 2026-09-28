import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { SEO } from "@/components/seo/SEO";

export function NotFoundPage() {
  return (
    <>
      <SEO title="Page not found | Troy Premier Green Cleaning Co." description="This page could not be found." path="/404" />
      <div className="container-site flex flex-col items-center justify-center py-32 text-center">
        <h1 className="font-display text-4xl text-pine-950">Page not found</h1>
        <p className="mt-3 text-ink/70">The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="mt-6">
          <Button>Back to home</Button>
        </Link>
      </div>
    </>
  );
}
