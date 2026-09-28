import { type ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", end: true },
  { to: "/admin/dashboard/calendar", label: "Calendar" },
  { to: "/admin/dashboard/bookings", label: "Bookings" },
  { to: "/admin/dashboard/customers", label: "Customers" },
  { to: "/admin/dashboard/cleaners", label: "Cleaners" },
  { to: "/admin/dashboard/services", label: "Services" },
  { to: "/admin/dashboard/pricing", label: "Pricing" },
  { to: "/admin/dashboard/payments", label: "Payments" },
  { to: "/admin/dashboard/messages", label: "Messages" },
  { to: "/admin/dashboard/reviews", label: "Reviews" },
  { to: "/admin/dashboard/reports", label: "Reports" },
  { to: "/admin/dashboard/settings", label: "Settings" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !["owner", "admin"].includes(user.role)) {
      navigate("/admin");
      return;
    }
    setChecked(true);
  }, [loading, user, navigate]);

  if (!checked) {
    return <div className="container-site py-20 text-center text-sm text-ink/50">Loading admin dashboard...</div>;
  }

  return (
    <div className="container-site grid gap-8 py-8 md:grid-cols-[200px_1fr]">
      <aside>
        <p className="mb-4 font-display text-lg text-pine-950">Admin</p>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-sm px-3 py-2 text-sm ${isActive ? "bg-pine-800 text-white" : "text-ink/70 hover:bg-pine-50"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={async () => {
              await signOut();
              navigate("/admin");
            }}
            className="mt-4 rounded-sm px-3 py-2 text-left text-sm text-clay-600 hover:bg-clay-50"
          >
            Sign out
          </button>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export { supabase };
