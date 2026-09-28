import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";

export function Reports() {
  const [revenueByService, setRevenueByService] = useState<{ name: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("bookings")
      .select("total_price, services(name)")
      .eq("status", "completed")
      .then(({ data }) => {
        const totals = new Map<string, number>();
        for (const row of (data as unknown as { total_price: number; services: { name: string } | null }[]) ?? []) {
          const name = row.services?.name ?? "Other";
          totals.set(name, (totals.get(name) ?? 0) + Number(row.total_price));
        }
        setRevenueByService(Array.from(totals.entries()).map(([name, total]) => ({ name, total })));
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-pine-950">Reports</h1>
      <p className="mt-1 text-sm text-ink/60">Revenue by service, from completed bookings.</p>
      {loading ? (
        <p className="mt-6 text-sm text-ink/50">Loading...</p>
      ) : (
        <Card className="mt-6">
          {revenueByService.length === 0 ? (
            <p className="text-sm text-ink/50">No completed bookings yet.</p>
          ) : (
            <ul className="space-y-2">
              {revenueByService.map((r) => (
                <li key={r.name} className="flex items-center justify-between text-sm">
                  <span className="text-ink/80">{r.name}</span>
                  <span className="font-medium text-pine-900">${r.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      <p className="mt-4 text-xs text-ink/40">
        Extend with date-range filters, cleaner performance, and cohort/retention views as the business needs them
        — every figure here is a straightforward aggregate over `bookings`.
      </p>
    </div>
  );
}
