import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";

interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  status: string;
  paid_at: string | null;
  bookings: { booking_number: string } | null;
}

export function Payments() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("payments")
      .select("id, amount, method, status, paid_at, bookings(booking_number)")
      .order("id", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setRows((data as unknown as PaymentRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-pine-950">Payments</h1>
      {loading ? (
        <p className="mt-6 text-sm text-ink/50">Loading...</p>
      ) : (
        <Card className="mt-6 overflow-x-auto p-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-pine-100 text-left text-xs uppercase tracking-wide text-ink/50">
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Paid at</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-pine-50 last:border-0">
                  <td className="px-4 py-3">{p.bookings?.booking_number ?? "—"}</td>
                  <td className="px-4 py-3">${Number(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">{p.method}</td>
                  <td className="px-4 py-3 capitalize">{p.status}</td>
                  <td className="px-4 py-3">{p.paid_at ? new Date(p.paid_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/50">No payments recorded yet — these are written by the Stripe webhook function once live.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
