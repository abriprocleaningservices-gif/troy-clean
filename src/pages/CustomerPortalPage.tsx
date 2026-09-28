import { useEffect, useState, type FormEvent } from "react";
import { format, parse } from "date-fns";
import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { getAvailableSlots, formatSlotTime, type AvailabilitySlot } from "@/lib/availability";

interface PortalBooking {
  id: string;
  booking_number: string;
  status: string;
  scheduled_date: string;
  scheduled_start_time: string;
  estimated_duration_minutes: number;
  total_price: number;
  payment_status: string;
  service_id: string;
  property_id: string;
  services: { name: string; slug: string } | null;
}

interface PortalProperty {
  id: string;
  address_line1: string;
  city: string;
  zip: string;
  access_instructions: string | null;
}

interface PortalInvoice {
  id: string;
  invoice_number: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  booking_id: string;
}

const NON_EDITABLE_STATUSES = new Set(["completed", "cancelled", "no_show", "in_progress"]);

export function CustomerPortalPage() {
  const { session, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [linking, setLinking] = useState(false);

  const [bookings, setBookings] = useState<PortalBooking[]>([]);
  const [properties, setProperties] = useState<PortalProperty[]>([]);
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [rescheduleTarget, setRescheduleTarget] = useState<PortalBooking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PortalBooking | null>(null);
  const [editPropertyId, setEditPropertyId] = useState<string | null>(null);

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    setSent(true);
  }

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function linkAndLoad() {
      setLinking(true);
      try {
        await fetch("/.netlify/functions/link-customer-account", {
          method: "POST",
          headers: { Authorization: `Bearer ${session!.access_token}`, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Account linking failed", err);
      }
      if (!cancelled) {
        setLinking(false);
        loadPortalData();
      }
    }
    linkAndLoad();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function loadPortalData() {
    setDataLoading(true);
    const [bookingsRes, propertiesRes] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, booking_number, status, scheduled_date, scheduled_start_time, estimated_duration_minutes, total_price, payment_status, service_id, property_id, services(name, slug)"
        )
        .order("scheduled_date", { ascending: false }),
      supabase.from("properties").select("id, address_line1, city, zip, access_instructions"),
    ]);

    const bookingRows = (bookingsRes.data as unknown as PortalBooking[]) ?? [];
    setBookings(bookingRows);
    setProperties((propertiesRes.data as PortalProperty[]) ?? []);

    if (bookingRows.length) {
      const { data: invoiceRows } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount_due, amount_paid, status, booking_id")
        .in("booking_id", bookingRows.map((b) => b.id));
      setInvoices((invoiceRows as PortalInvoice[]) ?? []);
    }
    setDataLoading(false);
  }

  async function handleCancelConfirm(reason: string) {
    if (!cancelTarget) return;
    await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: reason || null })
      .eq("id", cancelTarget.id);
    setCancelTarget(null);
    loadPortalData();
  }

  async function handleSaveProperty(propertyId: string, patch: Partial<PortalProperty>) {
    await supabase.from("properties").update(patch).eq("id", propertyId);
    setEditPropertyId(null);
    loadPortalData();
  }

  return (
    <>
      <SEO title="Customer Portal | Troy Premier Green Cleaning Co." description="View and manage your cleaning bookings." path="/portal" />
      <div className="container-site max-w-3xl py-14">
        <h1 className="font-display text-4xl text-pine-950">Customer portal</h1>

        {loading ? (
          <p className="mt-6 text-sm text-ink/50">Loading...</p>
        ) : !session ? (
          <Card className="mt-8 max-w-sm">
            {sent ? (
              <p className="text-sm text-ink/70">Check your email for a secure sign-in link.</p>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button type="submit" className="w-full">Email me a sign-in link</Button>
              </form>
            )}
          </Card>
        ) : (
          <div className="mt-8">
            <p className="text-sm text-ink/60">Signed in as {user?.email ?? session.user.email}</p>

            {linking || dataLoading ? (
              <p className="mt-6 text-sm text-ink/50">Loading your account...</p>
            ) : bookings.length === 0 ? (
              <div className="mt-6">
                <p className="text-sm text-ink/60">No bookings yet.</p>
                <Link to="/book" className="mt-4 inline-block">
                  <Button>Book a cleaning</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-3">
                  {bookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      invoice={invoices.find((i) => i.booking_id === b.id)}
                      onReschedule={() => setRescheduleTarget(b)}
                      onCancel={() => setCancelTarget(b)}
                    />
                  ))}
                </div>

                {properties.length > 0 && (
                  <div className="mt-10">
                    <h2 className="font-display text-2xl text-pine-950">Your properties</h2>
                    <div className="mt-4 space-y-3">
                      {properties.map((p) => (
                        <PropertyCard
                          key={p.id}
                          property={p}
                          isEditing={editPropertyId === p.id}
                          onEdit={() => setEditPropertyId(p.id)}
                          onCancelEdit={() => setEditPropertyId(null)}
                          onSave={(patch) => handleSaveProperty(p.id, patch)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {rescheduleTarget && (
        <RescheduleModal
          booking={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onDone={() => {
            setRescheduleTarget(null);
            loadPortalData();
          }}
        />
      )}

      {cancelTarget && (
        <CancelModal booking={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancelConfirm} />
      )}
    </>
  );
}

function BookingCard({
  booking,
  invoice,
  onReschedule,
  onCancel,
}: {
  booking: PortalBooking;
  invoice?: PortalInvoice;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const canModify = !NON_EDITABLE_STATUSES.has(booking.status);
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-medium text-pine-950">{booking.services?.name ?? "Cleaning"}</p>
        <p className="text-sm text-ink/60">
          {booking.scheduled_date} at {booking.scheduled_start_time.slice(0, 5)} · #{booking.booking_number}
        </p>
        {invoice && (
          <p className="mt-1 text-xs text-ink/50">
            Invoice {invoice.invoice_number}: ${Number(invoice.amount_paid).toFixed(2)} of ${Number(invoice.amount_due).toFixed(2)} paid
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-medium capitalize text-pine-800">{booking.status.replace(/_/g, " ")}</p>
        <p className="text-sm text-ink/60">${Number(booking.total_price).toFixed(2)} · {booking.payment_status}</p>
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          {canModify && (
            <>
              <Button size="sm" variant="outline" onClick={onReschedule}>Reschedule</Button>
              <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
            </>
          )}
          {booking.services?.slug && (
            <Link to={`/book?service=${booking.services.slug}`}>
              <Button size="sm" variant="ghost">Book again</Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

function PropertyCard({
  property,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
}: {
  property: PortalProperty;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (patch: Partial<PortalProperty>) => void;
}) {
  const [address, setAddress] = useState(property.address_line1);
  const [city, setCity] = useState(property.city);
  const [zip, setZip] = useState(property.zip);
  const [instructions, setInstructions] = useState(property.access_instructions ?? "");

  if (!isEditing) {
    return (
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink/80">{property.address_line1}, {property.city} {property.zip}</p>
          {property.access_instructions && <p className="mt-1 text-xs text-ink/50">{property.access_instructions}</p>}
        </div>
        <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} />
        <div className="sm:col-span-2">
          <Textarea label="Access instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave({ address_line1: address, city, zip, access_instructions: instructions || null })}
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
      </div>
    </Card>
  );
}

function RescheduleModal({
  booking,
  onClose,
  onDone,
}: {
  booking: PortalBooking;
  onClose: () => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState(booking.scheduled_date);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingSlots(true);
    setSelectedTime(null);
    getAvailableSlots(date, booking.estimated_duration_minutes, booking.id)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [date, booking.estimated_duration_minutes, booking.id]);

  async function handleSave() {
    if (!selectedTime) return;
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ scheduled_date: date, scheduled_start_time: selectedTime, status: "confirmed" })
      .eq("id", booking.id);
    setSaving(false);
    if (updateError) {
      setError(
        updateError.message.includes("duplicate")
          ? "That slot was just taken. Please pick another."
          : "Could not reschedule. Please try again."
      );
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <h3 className="font-display text-xl text-pine-950">Reschedule {booking.booking_number}</h3>
        <div className="mt-4">
          <Input label="New date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="mt-4">
          {loadingSlots ? (
            <p className="text-sm text-ink/50">Checking availability...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-ink/50">No availability this day.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const isFull = slot.booked >= slot.capacity;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`rounded-sm border px-2 py-2 text-sm ${
                      selectedTime === slot.time ? "border-pine-700 bg-pine-700 text-white" : "border-pine-100 text-ink/80"
                    } disabled:cursor-not-allowed disabled:opacity-30`}
                  >
                    {formatSlotTime(slot.time)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-clay-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selectedTime || saving}>
            {saving ? "Saving..." : "Confirm new time"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function CancelModal({
  booking,
  onClose,
  onConfirm,
}: {
  booking: PortalBooking;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <h3 className="font-display text-xl text-pine-950">Cancel {booking.booking_number}?</h3>
        <p className="mt-2 text-sm text-ink/60">
          Scheduled for {format(parse(booking.scheduled_date, "yyyy-MM-dd", new Date()), "MMMM d, yyyy")}. This can't
          be undone.
        </p>
        <div className="mt-4">
          <Textarea label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Keep booking</Button>
          <Button
            variant="secondary"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              await onConfirm(reason);
              setSubmitting(false);
            }}
          >
            {submitting ? "Cancelling..." : "Cancel booking"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
