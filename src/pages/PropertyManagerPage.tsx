import { useState, type FormEvent } from "react";
import { SEO } from "@/components/seo/SEO";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

type RequestType = "apartment_turnover" | "move_out" | "move_in" | "common_area" | "leasing_office" | "recurring_janitorial";

interface PMFormState {
  honeypot: string;
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  requestType: RequestType;
  propertyName: string;
  unitNumber: string;
  squareFootage: string;
  bedrooms: string;
  bathrooms: string;
  moveOutDate: string;
  desiredCompletionDate: string;
  specialInstructions: string;
}

const EMPTY: PMFormState = {
  honeypot: "",
  companyName: "",
  contactFirstName: "",
  contactLastName: "",
  email: "",
  phone: "",
  requestType: "apartment_turnover",
  propertyName: "",
  unitNumber: "",
  squareFootage: "",
  bedrooms: "",
  bathrooms: "",
  moveOutDate: "",
  desiredCompletionDate: "",
  specialInstructions: "",
};

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  apartment_turnover: "Apartment turnover",
  move_out: "Move-out cleaning",
  move_in: "Move-in cleaning",
  common_area: "Common area cleaning",
  leasing_office: "Leasing office cleaning",
  recurring_janitorial: "Recurring janitorial service",
};

/**
 * Property-manager workflow is intentionally separate from the consumer
 * booking wizard. This creates a property_manager (if new) and a
 * property_manager_request row for staff to schedule — photos can be
 * attached from the confirmation screen (wired to Supabase Storage).
 */
export function PropertyManagerPage() {
  const [form, setForm] = useState<PMFormState>(EMPTY);
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");

  function update<K extends keyof PMFormState>(key: K, value: PMFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (form.honeypot) {
      setStatus("submitted");
      return;
    }

    setStatus("submitting");

    const { data: pm, error: pmError } = await supabase
      .from("property_managers")
      .upsert(
        {
          company_name: form.companyName,
          contact_first_name: form.contactFirstName,
          contact_last_name: form.contactLastName,
          email: form.email,
          phone: form.phone,
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (pmError || !pm) {
      setStatus("error");
      return;
    }

    const { error: reqError } = await supabase.from("property_manager_requests").insert({
      property_manager_id: pm.id,
      request_type: form.requestType,
      property_name: form.propertyName,
      unit_number: form.unitNumber || null,
      square_footage: form.squareFootage ? Number(form.squareFootage) : null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      move_out_date: form.moveOutDate || null,
      desired_completion_date: form.desiredCompletionDate || null,
      special_instructions: form.specialInstructions || null,
    });

    if (reqError) {
      setStatus("error");
      return;
    }

    setStatus("submitted");
  }

  if (status === "submitted") {
    return (
      <div className="container-site max-w-xl py-24 text-center">
        <h1 className="font-display text-3xl text-pine-950">Request submitted</h1>
        <p className="mt-3 text-ink/70">Our team will confirm scheduling for this unit and follow up by email.</p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Property Manager Cleaning Requests | Troy Premier Green Cleaning Co."
        description="Submit apartment turnover, move-out, move-in, or recurring janitorial requests for your properties in Troy, MI."
        path="/property-managers"
      />
      <div className="container-site max-w-2xl py-14">
        <h1 className="font-display text-4xl text-pine-950">Property manager requests</h1>
        <p className="mt-3 text-ink/70">
          For leasing offices and property managers — submit a turnover, move-out, move-in, or recurring
          janitorial request for any unit or common area.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-5 sm:grid-cols-2">
          <input
            type="text"
            name="company_website"
            value={form.honeypot}
            onChange={(e) => update("honeypot", e.target.value)}
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
          />
          <Input label="Company" required value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
          <Select
            label="Request type"
            required
            value={form.requestType}
            onChange={(e) => update("requestType", e.target.value as RequestType)}
          >
            {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Input label="Contact first name" required value={form.contactFirstName} onChange={(e) => update("contactFirstName", e.target.value)} />
          <Input label="Contact last name" required value={form.contactLastName} onChange={(e) => update("contactLastName", e.target.value)} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          <Input label="Phone" type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <Input label="Property / community name" required value={form.propertyName} onChange={(e) => update("propertyName", e.target.value)} />
          <Input label="Unit number" value={form.unitNumber} onChange={(e) => update("unitNumber", e.target.value)} />
          <Input label="Square footage" type="number" min="0" value={form.squareFootage} onChange={(e) => update("squareFootage", e.target.value)} />
          <Input label="Bedrooms" type="number" min="0" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
          <Input label="Bathrooms" type="number" min="0" step="0.5" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
          <Input label="Move-out date" type="date" value={form.moveOutDate} onChange={(e) => update("moveOutDate", e.target.value)} />
          <Input label="Desired completion date" type="date" value={form.desiredCompletionDate} onChange={(e) => update("desiredCompletionDate", e.target.value)} />
          <div className="sm:col-span-2">
            <Textarea label="Special instructions" value={form.specialInstructions} onChange={(e) => update("specialInstructions", e.target.value)} />
          </div>

          {status === "error" && (
            <p className="sm:col-span-2 text-sm text-clay-600">Something went wrong submitting your request. Please try again or call us directly.</p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={status === "submitting"} className="w-full sm:w-auto">
              {status === "submitting" ? "Submitting..." : "Submit request"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
