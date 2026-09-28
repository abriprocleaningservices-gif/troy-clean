import { useEffect, useMemo, useState } from "react";
import { addDays, addMonths, endOfMonth, format, startOfMonth, startOfWeek } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

type ViewMode = "day" | "week" | "month";

interface CalendarBooking {
  id: string;
  booking_number: string;
  scheduled_date: string;
  scheduled_start_time: string;
  status: string;
  services: { name: string } | null;
  customers: { first_name: string; last_name: string } | null;
}

export function CalendarView() {
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    if (view === "day") return { start: anchor, end: anchor };
    if (view === "week") {
      const start = startOfWeek(anchor);
      return { start, end: addDays(start, 6) };
    }
    return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
  }, [view, anchor]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start, range.end]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_number, scheduled_date, scheduled_start_time, status, services(name), customers(first_name, last_name)")
      .gte("scheduled_date", format(range.start, "yyyy-MM-dd"))
      .lte("scheduled_date", format(range.end, "yyyy-MM-dd"))
      .order("scheduled_start_time");
    setBookings((data as unknown as CalendarBooking[]) ?? []);
    setLoading(false);
  }

  const days: Date[] = [];
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) days.push(d);

  function step(direction: 1 | -1) {
    if (view === "day") setAnchor((a) => addDays(a, direction));
    else if (view === "week") setAnchor((a) => addDays(a, 7 * direction));
    else setAnchor((a) => addMonths(a, direction));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-pine-950">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => step(-1)}>◀</Button>
          <span className="text-sm text-ink/70">{format(range.start, "MMM d")} – {format(range.end, "MMM d, yyyy")}</span>
          <Button size="sm" variant="ghost" onClick={() => step(1)}>▶</Button>
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <Button key={v} size="sm" variant={view === v ? "primary" : "outline"} onClick={() => setView(v)}>
              {v}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-ink/50">Loading calendar...</p>
      ) : (
        <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(days.length, 7)}, minmax(0, 1fr))` }}>
          {days.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            const dayBookings = bookings.filter((b) => b.scheduled_date === iso);
            return (
              <Card key={iso} className="min-h-[120px] p-3">
                <p className="text-xs font-medium text-ink/50">{format(day, "EEE d")}</p>
                <div className="mt-2 space-y-1.5">
                  {dayBookings.map((b) => (
                    <div key={b.id} className="rounded-sm bg-pine-100 px-2 py-1 text-[11px] text-pine-900">
                      {b.scheduled_start_time.slice(0, 5)} · {b.services?.name} · {b.customers?.first_name}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs text-ink/40">
        Cleaner-colored assignment blocks and drag-to-reschedule are natural next steps once job_assignments are
        regularly populated — this view already prevents double-booking at the data layer via the bookings table's
        unique constraint.
      </p>
    </div>
  );
}
