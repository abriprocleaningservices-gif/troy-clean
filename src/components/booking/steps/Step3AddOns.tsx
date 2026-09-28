import { useBooking } from "../BookingContext";
import { Button } from "@/components/ui/Button";

export function Step3AddOns() {
  const { addons, rules, state, toggleAddon, next, back } = useBooking();

  function priceFor(addonId: string): number | null {
    const rule = rules.find((r) => r.addon_id === addonId && r.rule_type === "addon_flat");
    return rule ? rule.value : null;
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-pine-950">Add any extras?</h2>
      <p className="mt-1 text-sm text-ink/60">Optional — skip if you don't need anything extra today.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {addons.map((addon) => {
          const isSelected = state.selectedAddonIds.includes(addon.id);
          const price = priceFor(addon.id);
          return (
            <button
              key={addon.id}
              type="button"
              onClick={() => toggleAddon(addon.id)}
              className={`flex items-start justify-between gap-3 rounded-sm border p-4 text-left ${
                isSelected ? "border-pine-700 bg-pine-50" : "border-pine-100 hover:border-pine-300"
              }`}
            >
              <span>
                <span className="block font-medium text-pine-950">{addon.name}</span>
                {addon.description && <span className="mt-0.5 block text-xs text-ink/60">{addon.description}</span>}
              </span>
              <span className="shrink-0 text-sm font-medium text-pine-800">
                {price !== null ? `+$${price.toFixed(0)}` : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={back}>Back</Button>
        <Button onClick={next}>Continue</Button>
      </div>
    </div>
  );
}
