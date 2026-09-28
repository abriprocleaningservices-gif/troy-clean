import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";
import type { BookingStatus } from "@/types/database";

interface BookingRow {
  id: string;
  booking_number: string;
  status: BookingStatus;
  scheduled_date: string;
  scheduled_start_time: string;
  total_price: number;
  payment_status: string;
  customers: { first_name: string; last_name: string } | null;
  services: { name: string } | null;
}

const STATUS_OPTIONS: BookingStatus[] = [
  "requested",
  "pending_payment",
  "confirmed",
  "assigned",
  "cleaner_en_route",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

export function BookingsTable() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_number, status, scheduled_date, scheduled_start_time, total_price, payment_status, customers(first_name, last_name), services(name)")
      .order("scheduled_date", { ascending: false })
      .limit(100);
    setBookings((data as unknown as BookingRow[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(bookingId: string, status: BookingStatus) {
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
    setBookings((rows) => rows.map((r) => (r.id === bookingId ? { ...r, status } : r)));
  }

  const filtered = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-pine-950">Bookings</h1>
        <div className="w-48">
          <Select label="" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-ink/50">Loading bookings...</p>
      ) : (
        <Card className="mt-6 overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-pine-100 text-left text-xs uppercase tracking-wide text-ink/50">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-pine-50 last:border-0">
                  <td className="px-4 py-3 text-ink/70">{b.booking_number}</td>
                  <td className="px-4 py-3">{b.customers ? `${b.customers.first_name} ${b.customers.last_name}` : "—"}</td>
                  <td className="px-4 py-3">{b.services?.name ?? "—"}</td>
                  <td className="px-4 py-3">{b.scheduled_date} {b.scheduled_start_time.slice(0, 5)}</td>
                  <td className="px-4 py-3">${Number(b.total_price).toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">{b.payment_status}</td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => updateStatus(b.id, e.target.value as BookingStatus)}
                      className="rounded-sm border border-pine-200 bg-white px-2 py-1 text-xs capitalize"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink/50">No bookings match this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
