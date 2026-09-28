import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  image?: string;
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string) || "https://troypremiercleaning.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

/**
 * Lightweight document-head manager. Sets title, meta description, canonical,
 * Open Graph tags, and injects JSON-LD structured data. Runs client-side; for
 * a Netlify static build this is sufficient for crawlers that execute JS
 * (Googlebot does). If stricter SSR/SEO is later required, this component's
 * props are already shaped to drop into a prerendering step.
 */
export function SEO({ title, description, path = "/", jsonLd, image = DEFAULT_IMAGE }: SEOProps) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:url", `${SITE_URL}${path}`, "property");
    setMeta("og:image", image, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE_URL}${path}`;

    const scriptId = "structured-data";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, jsonLd, image]);

  return null;
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}
