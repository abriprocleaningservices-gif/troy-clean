import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

const BUSINESS_PHONE = (import.meta.env.VITE_BUSINESS_PHONE as string) || "(248) 555-0100";

/** Mobile-only sticky bar so Book Now / Call are always one tap away. */
export function StickyBookNow() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-pine-100 bg-white/95 p-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] backdrop-blur md:hidden">
      <a href={`tel:${BUSINESS_PHONE.replace(/[^\d+]/g, "")}`} className="flex-1">
        <Button variant="outline" className="w-full">Call Us</Button>
      </a>
      <Link to="/book" className="flex-1">
        <Button className="w-full">Book Now</Button>
      </Link>
    </div>
  );
}
