import { Link } from "react-router-dom";
import { SERVICE_SEO_CONTENT } from "@/data/seoContent";
import { track } from "@/lib/analytics";

const BUSINESS_PHONE = (import.meta.env.VITE_BUSINESS_PHONE as string) || "(248) 555-0100";
const BUSINESS_EMAIL = (import.meta.env.VITE_BUSINESS_EMAIL as string) || "info@troypremiercleaning.com";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-pine-100 bg-pine-950 text-pine-50">
      <div className="container-site grid gap-10 py-14 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold">Troy Premier Green Cleaning Co.</p>
          <p className="mt-1 text-sm text-pine-200">ABRI PRO CLEANING SERVICES LLC</p>
          <p className="mt-4 text-sm text-pine-200">Troy, MI &amp; Metro Detroit</p>
          <a
            href={`tel:${BUSINESS_PHONE.replace(/[^\d+]/g, "")}`}
            onClick={() => track("phone_click", { location: "footer" })}
            className="mt-2 block text-sm text-pine-100 hover:text-white"
          >
            {BUSINESS_PHONE}
          </a>
          <a
            href={`mailto:${BUSINESS_EMAIL}`}
            onClick={() => track("email_click", { location: "footer" })}
            className="mt-1 block text-sm text-pine-100 hover:text-white"
          >
            {BUSINESS_EMAIL}
          </a>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pine-300">Residential</p>
          <ul className="mt-3 space-y-2 text-sm">
            {SERVICE_SEO_CONTENT.filter((s) => s.category === "residential").map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`} className="text-pine-100 hover:text-white">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pine-300">Commercial &amp; Apartment</p>
          <ul className="mt-3 space-y-2 text-sm">
            {SERVICE_SEO_CONTENT.filter((s) => s.category !== "residential").map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`} className="text-pine-100 hover:text-white">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pine-300">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/about" className="text-pine-100 hover:text-white">About</Link></li>
            <li><Link to="/commercial" className="text-pine-100 hover:text-white">Commercial Quote Request</Link></li>
            <li><Link to="/property-managers" className="text-pine-100 hover:text-white">Property Managers</Link></li>
            <li><Link to="/portal" className="text-pine-100 hover:text-white">Customer Portal</Link></li>
            <li><Link to="/cleaner" className="text-pine-100 hover:text-white">Cleaner Login</Link></li>
            <li><Link to="/admin" className="text-pine-100 hover:text-white">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-pine-800 py-5 text-center text-xs text-pine-300">
        © {new Date().getFullYear()} Troy Premier Green Cleaning Co. (ABRI PRO CLEANING SERVICES LLC). All rights reserved.
      </div>
    </footer>
  );
}
