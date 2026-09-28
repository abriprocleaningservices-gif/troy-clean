import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";

interface SiteSettings {
  guarantee_messaging_enabled: boolean;
  guarantee_messaging_text: string | null;
  deposit_percentage: number;
  tax_rate_percentage: number;
  booking_lead_time_hours: number;
}

export function Settings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .single()
      .then(({ data }) => setSettings(data));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    await supabase.from("site_settings").update(settings).eq("id", true);
    setSaving(false);
  }

  if (!settings) return <p className="text-sm text-ink/50">Loading settings...</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-pine-950">Settings</h1>
      <Card className="mt-6 max-w-lg space-y-4">
        <Input
          label="Tax rate (%)"
          type="number"
          step="0.01"
          value={settings.tax_rate_percentage}
          onChange={(e) => setSettings({ ...settings, tax_rate_percentage: Number(e.target.value) })}
        />
        <Input
          label="Deposit percentage (%)"
          type="number"
          step="1"
          value={settings.deposit_percentage}
          onChange={(e) => setSettings({ ...settings, deposit_percentage: Number(e.target.value) })}
        />
        <Input
          label="Minimum booking lead time (hours)"
          type="number"
          step="1"
          value={settings.booking_lead_time_hours}
          onChange={(e) => setSettings({ ...settings, booking_lead_time_hours: Number(e.target.value) })}
        />
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={settings.guarantee_messaging_enabled}
            onChange={(e) => setSettings({ ...settings, guarantee_messaging_enabled: e.target.checked })}
          />
          Show guarantee messaging on the site
        </label>
        {settings.guarantee_messaging_enabled && (
          <Textarea
            label="Guarantee messaging text"
            value={settings.guarantee_messaging_text ?? ""}
            onChange={(e) => setSettings({ ...settings, guarantee_messaging_text: e.target.value })}
          />
        )}
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>
      </Card>
    </div>
  );
}
