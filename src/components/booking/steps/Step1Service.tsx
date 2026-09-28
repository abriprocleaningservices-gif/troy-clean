import { useEffect, useState } from "react";
import { useBooking } from "../BookingContext";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import type { ServiceCategory } from "@/types/database";

const CATEGORY_TABS: { value: ServiceCategory; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "apartment", label: "Apartment" },
];

export function Step1Service({ initialServiceSlug }: { initialServiceSlug?: string }) {
  const { services, state, selectService, next, loading } = useBooking();
  const [category, setCategory] = useState<ServiceCategory>("residential");
  const [appliedInitial, setAppliedInitial] = useState(false);

  useEffect(() => {
    if (!appliedInitial && initialServiceSlug && services.length) {
      const match = services.find((s) => s.slug === initialServiceSlug);
      if (match) {
        setCategory(match.category);
        selectService(match);
      }
      setAppliedInitial(true);
    }
  }, [appliedInitial, initialServiceSlug, services, selectService]);

  const filtered = services.filter((s) => s.category === category);

  function handleSelect(service: (typeof services)[number]) {
    selectService(service);
    track("service_selected", { service: service.slug });
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-pine-950">What do you need cleaned?</h2>
      <p className="mt-1 text-sm text-ink/60">Pick a category, then the specific service.</p>

      <div className="mt-5 flex gap-2 border-b border-pine-100">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCategory(tab.value)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              category === tab.value ? "border-pine-800 text-pine-900" : "border-transparent text-ink/50 hover:text-ink/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-ink/50">Loading services...</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {filtered.map((service) => {
            const isSelected = state.service?.id === service.id;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => handleSelect(service)}
                className={`rounded-sm border p-4 text-left transition-colors ${
                  isSelected ? "border-pine-700 bg-pine-50" : "border-pine-100 hover:border-pine-300"
                }`}
              >
                <p className="font-medium text-pine-950">{service.name}</p>
                {service.description && <p className="mt-1 text-xs text-ink/60">{service.description}</p>}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button onClick={next} disabled={!state.service}>
          Continue
        </Button>
      </div>
    </div>
  );
}
