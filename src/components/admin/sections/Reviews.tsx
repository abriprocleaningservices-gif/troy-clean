import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  customers: { first_name: string; last_name: string } | null;
}

export function Reviews() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, comment, is_published, customers(first_name, last_name)")
      .order("id", { ascending: false });
    setRows((data as unknown as ReviewRow[]) ?? []);
    setLoading(false);
  }

  async function togglePublish(row: ReviewRow) {
    await supabase.from("reviews").update({ is_published: !row.is_published }).eq("id", row.id);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-pine-950">Reviews</h1>
      {loading ? (
        <p className="mt-6 text-sm text-ink/50">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-ink/50">No reviews yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-clay-600">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                {r.comment && <p className="mt-1 text-sm text-ink/80">{r.comment}</p>}
                <p className="mt-1 text-xs text-ink/50">
                  {r.customers ? `${r.customers.first_name} ${r.customers.last_name}` : "Anonymous"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => togglePublish(r)}>
                {r.is_published ? "Unpublish" : "Publish"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
