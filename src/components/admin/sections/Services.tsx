import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";
import type { Service } from "@/types/database";

export function ServicesAdmin() {
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    setRows((data as Service[]) ?? []);
    setLoading(false);
  }

  async function toggleActive(row: Service) {
    await supabase.from("services").update({ is_active: !row.is_active }).eq("id", row.id);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-pine-950">Services</h1>
      {loading ? (
        <p className="mt-6 text-sm text-ink/50">Loading...</p>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((s) => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-pine-950">{s.name}</p>
                <p className="text-xs uppercase tracking-wide text-ink/40">{s.category}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink/70">
                <input type="checkbox" checked={s.is_active} onChange={() => toggleActive(s)} />
                Active
              </label>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
