import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

interface CleanerRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export function Cleaners() {
  const [rows, setRows] = useState<CleanerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("cleaners").select("id, first_name, last_name, email, phone, is_active").order("first_name");
    setRows(data ?? []);
    setLoading(false);
  }

  async function toggleActive(row: CleanerRow) {
    await supabase.from("cleaners").update({ is_active: !row.is_active }).eq("id", row.id);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-pine-950">Cleaners</h1>
      <p className="mt-1 text-sm text-ink/60">
        Create cleaner accounts in Supabase Auth, then add a matching row here (or via SQL) with the cleaner's
        user_id — role-based RLS handles the rest.
      </p>
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
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-pine-50 last:border-0">
                  <td className="px-4 py-3">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                      {c.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/50">No cleaners yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
