import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";

interface CustomerRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_recurring: boolean;
  created_at: string;
}

export function Customers() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("customers")
      .select("id, first_name, last_name, email, phone, is_recurring, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-pine-950">Customers</h1>
      {loading ? (
        <p className="mt-6 text-sm text-ink/50">Loading...</p>
      ) : (
        <Card className="mt-6 overflow-x-auto p-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-pine-100 text-left text-xs uppercase tracking-wide text-ink/50">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Recurring</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-pine-50 last:border-0">
                  <td className="px-4 py-3">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.is_recurring ? "Yes" : "No"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-ink/50">No customers yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
