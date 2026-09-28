import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import type { PricingRule, Service, ServiceAddon } from "@/types/database";

export function PricingEditor() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [rulesRes, servicesRes, addonsRes] = await Promise.all([
      supabase.from("pricing_rules").select("*").order("service_id"),
      supabase.from("services").select("*").order("sort_order"),
      supabase.from("service_addons").select("*").order("sort_order"),
    ]);
    setRules((rulesRes.data as PricingRule[]) ?? []);
    setServices((servicesRes.data as Service[]) ?? []);
    setAddons((addonsRes.data as ServiceAddon[]) ?? []);
    setLoading(false);
  }

  function serviceName(id: string | null) {
    return services.find((s) => s.id === id)?.name ?? "—";
  }
  function addonName(id: string | null) {
    return addons.find((a) => a.id === id)?.name ?? "—";
  }

  async function saveValue(rule: PricingRule) {
    const raw = draftValues[rule.id];
    if (raw === undefined) return;
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    setSavingId(rule.id);
    await supabase.from("pricing_rules").update({ value }).eq("id", rule.id);
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, value } : r)));
    setSavingId(null);
  }

  async function toggleActive(rule: PricingRule) {
    await supabase.from("pricing_rules").update({ is_active: !rule.is_active }).eq("id", rule.id);
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)));
  }

  if (loading) return <p className="text-sm text-ink/50">Loading pricing rules...</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-pine-950">Pricing</h1>
      <p className="mt-1 max-w-xl text-sm text-ink/60">
        Every dollar amount in the booking wizard comes from this table — nothing is hard-coded in the
        application. Edit a value and click Save; the booking wizard reads these live.
      </p>

      <Card className="mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-pine-100 text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Rule type</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b border-pine-50 last:border-0">
                <td className="px-4 py-3 text-ink/70">
                  {rule.rule_type === "addon_flat" ? addonName(rule.addon_id) : serviceName(rule.service_id)}
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs text-pine-700">{rule.rule_type}</code>
                </td>
                <td className="px-4 py-3">{rule.label}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={rule.value}
                    onChange={(e) => setDraftValues((d) => ({ ...d, [rule.id]: e.target.value }))}
                    className="w-24 rounded-sm border border-pine-200 px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={rule.is_active} onChange={() => toggleActive(rule)} />
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => saveValue(rule)} disabled={savingId === rule.id}>
                    {savingId === rule.id ? "Saving..." : "Save"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
