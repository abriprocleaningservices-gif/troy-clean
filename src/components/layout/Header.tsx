import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics";

const BUSINESS_PHONE = (import.meta.env.VITE_BUSINESS_PHONE as string) || "(248) 555-0100";

const NAV_LINKS = [
  { to: "/services", label: "Services" },
  { to: "/commercial", label: "Commercial" },
  { to: "/property-managers", label: "Property Managers" },
  { to: "/about", label: "About" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-pine-100 bg-paper/95 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight text-pine-900">
          Troy Premier
          <span className="ml-1 font-sans text-xs font-medium uppercase tracking-wide text-clay-600">Green Cleaning</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? "text-pine-800" : "text-ink/70 hover:text-pine-800"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={`tel:${BUSINESS_PHONE.replace(/[^\d+]/g, "")}`}
            onClick={() => track("phone_click", { location: "header" })}
            className="text-sm font-medium text-pine-800 hover:text-pine-900"
          >
            {BUSINESS_PHONE}
          </a>
          <Link to="/book">
            <Button size="sm">Book Now</Button>
          </Link>
        </div>

        <button
          className="p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
        </button>
      </div>

      {open && (
        <div className="border-t border-pine-100 bg-paper md:hidden">
          <div className="container-site flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-sm px-2 py-2.5 text-ink/80 hover:bg-pine-50"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`tel:${BUSINESS_PHONE.replace(/[^\d+]/g, "")}`}
              className="rounded-sm px-2 py-2.5 text-pine-800"
              onClick={() => track("phone_click", { location: "mobile_menu" })}
            >
              Call {BUSINESS_PHONE}
            </a>
            <Link to="/book" onClick={() => setOpen(false)} className="mt-2">
              <Button className="w-full">Book Now</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
