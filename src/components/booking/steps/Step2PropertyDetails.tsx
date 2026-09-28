import { useBooking } from "../BookingContext";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import type { ConditionKey, FrequencyType } from "@/types/database";

const CONDITION_OPTIONS: { value: ConditionKey; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "Cleaned regularly, generally tidy" },
  { value: "moderate", label: "Moderate", hint: "A few weeks since a deep clean" },
  { value: "heavy", label: "Heavy", hint: "Significant buildup or neglect" },
];

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: "one_time", label: "One-time" },
  { value: "weekly", label: "Weekly (save more)" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

export function Step2PropertyDetails() {
  const { state, updateResidentialDetails, updateCommercialDetails, next, back } = useBooking();
  const isCommercial = state.service?.category === "commercial";

  if (isCommercial) {
    const d = state.commercialDetails;
    return (
      <div>
        <h2 className="font-display text-2xl text-pine-950">Tell us about the space</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Input
            label="Approximate square footage"
            type="number"
            min={0}
            required
            value={d.squareFootage}
            onChange={(e) => updateCommercialDetails({ squareFootage: Number(e.target.value) })}
          />
          <Input
            label="Number of restrooms"
            type="number"
            min={0}
            value={d.restroomCount}
            onChange={(e) => updateCommercialDetails({ restroomCount: Number(e.target.value) })}
          />
          <Select
            label="Desired frequency"
            value={d.frequency}
            onChange={(e) => updateCommercialDetails({ frequency: e.target.value as FrequencyType })}
          >
            {FREQUENCY_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <Textarea
              label="Special requests"
              value={d.specialRequests ?? ""}
              onChange={(e) => updateCommercialDetails({ specialRequests: e.target.value })}
            />
          </div>
        </div>
        <p className="mt-4 text-xs text-ink/50">
          Larger or complex commercial jobs may require a walkthrough before final pricing is confirmed.
        </p>
        <StepNav back={back} next={next} />
      </div>
    );
  }

  const d = state.residentialDetails;
  return (
    <div>
      <h2 className="font-display text-2xl text-pine-950">Tell us about your property</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Input
          label="Bedrooms"
          type="number"
          min={0}
          required
          value={d.bedrooms}
          onChange={(e) => updateResidentialDetails({ bedrooms: Number(e.target.value) })}
        />
        <Input
          label="Bathrooms"
          type="number"
          min={0}
          step={0.5}
          required
          value={d.bathrooms}
          onChange={(e) => updateResidentialDetails({ bathrooms: Number(e.target.value) })}
        />
        <Input
          label="Square footage"
          type="number"
          min={0}
          required
          value={d.squareFootage}
          onChange={(e) => updateResidentialDetails({ squareFootage: Number(e.target.value) })}
        />
        <Select
          label="Frequency"
          value={d.frequency}
          onChange={(e) => updateResidentialDetails({ frequency: e.target.value as FrequencyType })}
        >
          {FREQUENCY_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </Select>

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-medium text-ink">Current condition</p>
          <div className="grid grid-cols-3 gap-2">
            {CONDITION_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => updateResidentialDetails({ currentCondition: c.value })}
                className={`rounded-sm border p-3 text-left text-sm ${
                  d.currentCondition === c.value ? "border-pine-700 bg-pine-50" : "border-pine-100 hover:border-pine-300"
                }`}
              >
                <p className="font-medium text-pine-950">{c.label}</p>
                <p className="mt-0.5 text-xs text-ink/60">{c.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="pets"
            type="checkbox"
            checked={d.pets}
            onChange={(e) => updateResidentialDetails({ pets: e.target.checked })}
            className="h-4 w-4 rounded border-pine-300 text-pine-700 focus:ring-pine-600"
          />
          <label htmlFor="pets" className="text-sm text-ink/80">I have pets in the home</label>
        </div>

        <div className="sm:col-span-2">
          <Textarea
            label="Special requests"
            hint="Anything specific you'd like the crew to focus on"
            value={d.specialRequests ?? ""}
            onChange={(e) => updateResidentialDetails({ specialRequests: e.target.value })}
          />
        </div>
      </div>
      <StepNav back={back} next={next} />
    </div>
  );
}

function StepNav({ back, next }: { back: () => void; next: () => void }) {
  return (
    <div className="mt-8 flex justify-between">
      <Button variant="ghost" onClick={back}>Back</Button>
      <Button onClick={next}>Continue</Button>
    </div>
  );
}
