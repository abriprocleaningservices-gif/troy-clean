import { useState, type FormEvent } from "react";
import { SEO } from "@/components/seo/SEO";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { track } from "@/lib/analytics";
import type { FrequencyType } from "@/types/database";

interface CommercialFormState {
  honeypot: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  propertyAddress: string;
  propertyType: string;
  squareFootage: string;
  frequency: FrequencyType;
  restroomCount: string;
  cleaningRequirements: string;
  preferredWalkthroughDate: string;
}

const EMPTY_FORM: CommercialFormState = {
  honeypot: "",
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  propertyAddress: "",
  propertyType: "",
  squareFootage: "",
  frequency: "weekly",
  restroomCount: "",
  cleaningRequirements: "",
  preferredWalkthroughDate: "",
};

export function CommercialLeadPage() {
  const [form, setForm] = useState<CommercialFormState>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");

  function update<K extends keyof CommercialFormState>(key: K, value: CommercialFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Honeypot: real visitors never see or fill this field (see the input
    // below, visually hidden and skipped by screen readers via aria-hidden +
    // tabIndex=-1). A filled value means a bot filled every field blindly —
    // pretend success without writing to the database.
    if (form.honeypot) {
      setStatus("submitted");
      return;
    }

    setStatus("submitting");

    // Commercial jobs are never auto-quoted here — this only creates a lead
    // for staff to follow up on and schedule a walkthrough, per spec.
    const { error } = await supabase.from("commercial_leads").insert({
      company_name: form.companyName,
      contact_name: form.contactName,
      phone: form.phone,
      email: form.email,
      property_address: form.propertyAddress,
      property_type: form.propertyType || null,
      square_footage: form.squareFootage ? Number(form.squareFootage) : null,
      frequency: form.frequency,
      restroom_count: form.restroomCount ? Number(form.restroomCount) : null,
      cleaning_requirements: form.cleaningRequirements || null,
      preferred_walkthrough_date: form.preferredWalkthroughDate || null,
    });

    if (error) {
      setStatus("error");
      return;
    }

    track("commercial_lead", { company: form.companyName });
    setStatus("submitted");
  }

  if (status === "submitted") {
    return (
      <div className="container-site max-w-xl py-24 text-center">
        <h1 className="font-display text-3xl text-pine-950">Request received</h1>
        <p className="mt-3 text-ink/70">
          Thanks — our team will reach out to schedule a walkthrough and put together a custom quote.
        </p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Commercial Cleaning Quote Request | Troy Premier Green Cleaning Co."
        description="Request a walkthrough and custom quote for office, retail, or commercial cleaning in Troy, MI."
        path="/commercial"
      />
      <div className="container-site max-w-2xl py-14">
        <h1 className="font-display text-4xl text-pine-950">Request a commercial walkthrough</h1>
        <p className="mt-3 text-ink/70">
          Larger and commercial spaces are quoted after a short walkthrough rather than an automatic online
          estimate, so the price reflects your actual facility.
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
          <Input label="Contact name" required value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
          <Input label="Phone" type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Property address" required value={form.propertyAddress} onChange={(e) => update("propertyAddress", e.target.value)} />
          </div>
          <Input label="Property type" placeholder="Office, retail, medical..." value={form.propertyType} onChange={(e) => update("propertyType", e.target.value)} />
          <Input label="Approx. square footage" type="number" min="0" value={form.squareFootage} onChange={(e) => update("squareFootage", e.target.value)} />
          <Select label="Desired frequency" value={form.frequency} onChange={(e) => update("frequency", e.target.value as FrequencyType)}>
            <option value="one_time">One-time</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </Select>
          <Input label="Number of restrooms" type="number" min="0" value={form.restroomCount} onChange={(e) => update("restroomCount", e.target.value)} />
          <div className="sm:col-span-2">
            <Textarea label="Cleaning requirements" value={form.cleaningRequirements} onChange={(e) => update("cleaningRequirements", e.target.value)} />
          </div>
          <Input label="Preferred walkthrough date" type="date" value={form.preferredWalkthroughDate} onChange={(e) => update("preferredWalkthroughDate", e.target.value)} />

          {status === "error" && (
            <p className="sm:col-span-2 text-sm text-clay-600">Something went wrong submitting your request. Please try again or call us directly.</p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={status === "submitting"} className="w-full sm:w-auto">
              {status === "submitting" ? "Submitting..." : "Request walkthrough"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
