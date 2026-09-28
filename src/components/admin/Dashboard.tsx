import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";

interface Metrics {
  todaysRevenue: number;
  upcomingJobs: number;
  completedJobs: number;
  openJobs: number;
  cancelledJobs: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  averageBookingValue: number;
  recurringCustomers: number;
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

    const [
      todaysBookingsRes,
      upcomingRes,
      completedRes,
      openRes,
      cancelledRes,
      customersRes,
      newCustomersRes,
      allBookingsRes,
      recurringRes,
    ] = await Promise.all([
      supabase.from("bookings").select("total_price, payment_status").eq("scheduled_date", today),
      supabase.from("bookings").select("id", { count: "exact", head: true }).gt("scheduled_date", today).not("status", "in", "(cancelled,no_show,completed)"),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("bookings").select("id", { count: "exact", head: true }).in("status", ["requested", "pending_payment", "confirmed", "assigned", "cleaner_en_route", "in_progress"]),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
      supabase.from("bookings").select("total_price"),
      supabase.from("customers").select("id", { count: "exact", head: true }).eq("is_recurring", true),
    ]);

    const todaysRevenue = (todaysBookingsRes.data ?? [])
      .filter((b) => b.payment_status === "paid" || b.payment_status === "partially_paid")
      .reduce((sum, b) => sum + Number(b.total_price), 0);

    const allTotals = (allBookingsRes.data ?? []).map((b) => Number(b.total_price));
    const averageBookingValue = allTotals.length ? allTotals.reduce((a, b) => a + b, 0) / allTotals.length : 0;

    setMetrics({
      todaysRevenue,
      upcomingJobs: upcomingRes.count ?? 0,
      completedJobs: completedRes.count ?? 0,
      openJobs: openRes.count ?? 0,
      cancelledJobs: cancelledRes.count ?? 0,
      activeCustomers: customersRes.count ?? 0,
      newCustomersThisMonth: newCustomersRes.count ?? 0,
      averageBookingValue,
      recurringCustomers: recurringRes.count ?? 0,
    });
    setLoading(false);
  }

  if (loading || !metrics) {
    return <p className="text-sm text-ink/50">Loading dashboard...</p>;
  }

  const cards: { label: string; value: string }[] = [
    { label: "Today's revenue", value: `$${metrics.todaysRevenue.toFixed(2)}` },
    { label: "Upcoming jobs", value: String(metrics.upcomingJobs) },
    { label: "Completed jobs", value: String(metrics.completedJobs) },
    { label: "Open jobs", value: String(metrics.openJobs) },
    { label: "Cancelled jobs", value: String(metrics.cancelledJobs) },
    { label: "Active customers", value: String(metrics.activeCustomers) },
    { label: "New customers (this month)", value: String(metrics.newCustomersThisMonth) },
    { label: "Average booking value", value: `$${metrics.averageBookingValue.toFixed(2)}` },
    { label: "Recurring customers", value: String(metrics.recurringCustomers) },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-pine-950">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/60">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <p className="text-xs uppercase tracking-wide text-ink/50">{c.label}</p>
            <p className="mt-2 font-display text-2xl text-pine-950">{c.value}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs text-ink/40">
        Cleaner utilization (booked hours vs. available hours) requires per-cleaner availability totals — add once
        cleaner schedules are populated in the availability table.
      </p>
    </div>
  );
}
