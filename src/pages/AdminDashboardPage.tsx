import { Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Dashboard } from "@/components/admin/Dashboard";
import { CalendarView } from "@/components/admin/CalendarView";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { PricingEditor } from "@/components/admin/PricingEditor";
import { Customers } from "@/components/admin/sections/Customers";
import { Cleaners } from "@/components/admin/sections/Cleaners";
import { ServicesAdmin } from "@/components/admin/sections/Services";
import { Payments } from "@/components/admin/sections/Payments";
import { Messages } from "@/components/admin/sections/Messages";
import { Reviews } from "@/components/admin/sections/Reviews";
import { Reports } from "@/components/admin/sections/Reports";
import { Settings } from "@/components/admin/sections/Settings";

export function AdminDashboardPage() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="bookings" element={<BookingsTable />} />
        <Route path="customers" element={<Customers />} />
        <Route path="cleaners" element={<Cleaners />} />
        <Route path="services" element={<ServicesAdmin />} />
        <Route path="pricing" element={<PricingEditor />} />
        <Route path="payments" element={<Payments />} />
        <Route path="messages" element={<Messages />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </AdminLayout>
  );
}
