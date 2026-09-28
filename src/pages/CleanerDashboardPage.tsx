import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { SEO } from "@/components/seo/SEO";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

interface JobRow {
  job_id: string;
  booking_id: string;
  status: string;
  started_at: string | null;
  paused_at: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
  special_requests: string | null;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  access_instructions: string | null;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  is_completed: boolean;
}

const BUSINESS_PHONE = (import.meta.env.VITE_BUSINESS_PHONE as string) || "(248) 555-0100";

export function CleanerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cleanerId, setCleanerId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, ChecklistItem[]>>({});
  const [issueNotes, setIssueNotes] = useState<Record<string, string>>({});

  const loadJobs = useCallback(async (forCleanerId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("job_assignments")
      .select(
        `job_id, jobs!inner(id, status, started_at, paused_at, booking_id,
          bookings!inner(id, scheduled_date, scheduled_start_time, special_requests,
            services(name),
            customers(first_name, last_name, phone),
            properties(address_line1, city, access_instructions)))`
      )
      .eq("cleaner_id", forCleanerId);

    const rows: JobRow[] = (data ?? []).map((row: any) => {
      const job = row.jobs;
      const booking = job.bookings;
      return {
        job_id: job.id,
        booking_id: booking.id,
        status: job.status,
        started_at: job.started_at,
        paused_at: job.paused_at,
        scheduled_date: booking.scheduled_date,
        scheduled_start_time: booking.scheduled_start_time,
        special_requests: booking.special_requests,
        service_name: booking.services?.name ?? "Cleaning",
        customer_name: `${booking.customers?.first_name ?? ""} ${booking.customers?.last_name ?? ""}`.trim(),
        customer_phone: booking.customers?.phone ?? "",
        address: `${booking.properties?.address_line1 ?? ""}, ${booking.properties?.city ?? ""}`,
        access_instructions: booking.properties?.access_instructions,
      };
    });

    rows.sort((a, b) => (a.scheduled_date + a.scheduled_start_time).localeCompare(b.scheduled_date + b.scheduled_start_time));
    setJobs(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/cleaner");
      return;
    }
    supabase
      .from("cleaners")
      .select("id")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setCleanerId(data.id);
          loadJobs(data.id);
        } else {
          setLoading(false);
        }
      });
  }, [authLoading, user, navigate, loadJobs]);

  async function loadChecklist(jobId: string) {
    const { data } = await supabase
      .from("checklists")
      .select("id, item_text, is_completed")
      .eq("job_id", jobId);
    setChecklist((c) => ({ ...c, [jobId]: data ?? [] }));
  }

  function toggleExpand(jobId: string) {
    const next = expandedJobId === jobId ? null : jobId;
    setExpandedJobId(next);
    if (next && !checklist[next]) loadChecklist(next);
  }

  async function logAction(jobId: string, action: string, notes?: string) {
    await supabase.from("job_action_log").insert({ job_id: jobId, cleaner_id: cleanerId, action, notes });
  }

  async function handleStart(job: JobRow) {
    await supabase.from("jobs").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", job.job_id);
    await supabase.from("bookings").update({ status: "in_progress" }).eq("id", job.booking_id);
    await logAction(job.job_id, "start");
    if (cleanerId) loadJobs(cleanerId);
  }

  async function handlePause(job: JobRow) {
    await supabase.from("jobs").update({ paused_at: new Date().toISOString() }).eq("id", job.job_id);
    await logAction(job.job_id, "pause");
    if (cleanerId) loadJobs(cleanerId);
  }

  async function toggleChecklistItem(jobId: string, itemId: string, current: boolean) {
    await supabase
      .from("checklists")
      .update({ is_completed: !current, completed_at: !current ? new Date().toISOString() : null, completed_by: cleanerId })
      .eq("id", itemId);
    loadChecklist(jobId);
  }

  async function handleComplete(job: JobRow) {
    const items = checklist[job.job_id] ?? [];
    const allDone = items.length > 0 && items.every((i) => i.is_completed);
    if (!allDone) {
      alert("Complete every checklist item before marking this job as finished.");
      setExpandedJobId(job.job_id);
      if (!checklist[job.job_id]) loadChecklist(job.job_id);
      return;
    }
    await supabase.from("jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", job.job_id);
    await supabase.from("bookings").update({ status: "completed" }).eq("id", job.booking_id);
    await logAction(job.job_id, "complete");
    if (cleanerId) loadJobs(cleanerId);
  }

  async function handleReportIssue(job: JobRow) {
    const notes = issueNotes[job.job_id];
    if (!notes) return;
    await supabase.from("jobs").update({ issue_reported: true, issue_notes: notes }).eq("id", job.job_id);
    await logAction(job.job_id, "issue", notes);
    setIssueNotes((n) => ({ ...n, [job.job_id]: "" }));
    alert("Issue reported to the office.");
  }

  async function handlePhotoUpload(job: JobRow, type: "before" | "after", file: File) {
    const path = `${job.job_id}/${type}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("job-photos").upload(path, file);
    if (error) {
      alert("Photo upload failed: " + error.message);
      return;
    }
    await supabase.from("before_after_photos").insert({
      job_id: job.job_id,
      photo_type: type,
      storage_path: path,
      uploaded_by: cleanerId,
    });
    alert(`${type === "before" ? "Before" : "After"} photo uploaded.`);
  }

  if (loading) {
    return <div className="container-site py-20 text-center text-sm text-ink/50">Loading your jobs...</div>;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const todaysJobs = jobs.filter((j) => j.scheduled_date === today);
  const upcomingJobs = jobs.filter((j) => j.scheduled_date > today);

  return (
    <>
      <SEO title="Cleaner Dashboard | Troy Premier Green Cleaning Co." description="Today's and upcoming cleaning jobs." path="/cleaner/dashboard" />
      <div className="container-site max-w-3xl py-10">
        <h1 className="font-display text-3xl text-pine-950">Your jobs</h1>

        <Section title="Today" jobs={todaysJobs} render={renderJob} />
        <Section title="Upcoming" jobs={upcomingJobs} render={renderJob} />

        {jobs.length === 0 && <p className="mt-8 text-sm text-ink/60">No jobs assigned yet.</p>}
      </div>
    </>
  );

  function renderJob(job: JobRow) {
    const isExpanded = expandedJobId === job.job_id;
    const items = checklist[job.job_id] ?? [];

    return (
      <Card key={job.job_id} className="mb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-pine-950">{job.service_name}</p>
            <p className="text-sm text-ink/60">
              {job.scheduled_date} at {job.scheduled_start_time.slice(0, 5)} · {job.address}
            </p>
            <p className="text-sm text-ink/60">{job.customer_name} · {job.customer_phone}</p>
            {job.special_requests && <p className="mt-1 text-sm text-clay-700">Note: {job.special_requests}</p>}
          </div>
          <span className="rounded-full bg-pine-100 px-3 py-1 text-xs font-medium capitalize text-pine-800">
            {job.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {job.status !== "in_progress" && job.status !== "completed" && (
            <Button size="sm" onClick={() => handleStart(job)}>Start Job</Button>
          )}
          {job.status === "in_progress" && (
            <Button size="sm" variant="outline" onClick={() => handlePause(job)}>Pause Job</Button>
          )}
          {job.status !== "completed" && (
            <Button size="sm" variant="secondary" onClick={() => handleComplete(job)}>Complete Job</Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => toggleExpand(job.job_id)}>
            {isExpanded ? "Hide checklist" : "View checklist"}
          </Button>
          <a href={`tel:${BUSINESS_PHONE.replace(/[^\d+]/g, "")}`}>
            <Button size="sm" variant="ghost">Contact Office</Button>
          </a>
        </div>

        {isExpanded && (
          <div className="mt-4 border-t border-pine-100 pt-4">
            <p className="text-sm font-medium text-ink/70">Checklist — complete every item before finishing</p>
            <ul className="mt-2 space-y-1.5">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.is_completed}
                    onChange={() => toggleChecklistItem(job.job_id, item.id, item.is_completed)}
                    className="h-4 w-4 rounded border-pine-300 text-pine-700"
                  />
                  <span className={`text-sm ${item.is_completed ? "text-ink/40 line-through" : "text-ink/80"}`}>
                    {item.item_text}
                  </span>
                </li>
              ))}
              {items.length === 0 && <p className="text-sm text-ink/50">No checklist template configured for this service yet.</p>}
            </ul>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-ink/70">
                Upload before photo
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-xs"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(job, "before", e.target.files[0])}
                />
              </label>
              <label className="text-sm text-ink/70">
                Upload after photo
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-xs"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(job, "after", e.target.files[0])}
                />
              </label>
            </div>

            <div className="mt-4">
              <Textarea
                label="Report an issue"
                value={issueNotes[job.job_id] ?? ""}
                onChange={(e) => setIssueNotes((n) => ({ ...n, [job.job_id]: e.target.value }))}
              />
              <Button size="sm" variant="outline" className="mt-2" onClick={() => handleReportIssue(job)}>
                Send to office
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  }
}

function Section({ title, jobs, render }: { title: string; jobs: JobRow[]; render: (j: JobRow) => JSX.Element }) {
  if (jobs.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">{title}</h2>
      {jobs.map(render)}
    </div>
  );
}
