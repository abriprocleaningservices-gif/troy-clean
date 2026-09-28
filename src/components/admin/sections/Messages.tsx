import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

interface Template {
  id: string;
  channel: "sms" | "email";
  template_key: string;
  name: string;
  subject: string | null;
  body: string;
}

export function Messages() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("message_templates")
      .select("*")
      .order("channel")
      .then(({ data }) => {
        setTemplates((data as Template[]) ?? []);
        setLoading(false);
      });
  }, []);

  async function save(template: Template) {
    const body = drafts[template.id] ?? template.body;
    setSavingId(template.id);
    await supabase.from("message_templates").update({ body }).eq("id", template.id);
    setTemplates((ts) => ts.map((t) => (t.id === template.id ? { ...t, body } : t)));
    setSavingId(null);
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-pine-950">Message templates</h1>
      <p className="mt-1 max-w-xl text-sm text-ink/60">
        SMS and email templates, editable here and referenced by template_key from the Netlify Functions that
        actually send them. Supports placeholders like {"{{first_name}}"}.
      </p>
      {loading ? (
        <p className="mt-6 text-sm text-ink/50">Loading...</p>
      ) : (
        <div className="mt-6 space-y-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-pine-950">{t.name}</p>
                <span className="rounded-full bg-pine-100 px-2 py-0.5 text-xs uppercase text-pine-700">{t.channel}</span>
              </div>
              <div className="mt-3">
                <Textarea
                  label="Body"
                  defaultValue={t.body}
                  onChange={(e) => setDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                />
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => save(t)} disabled={savingId === t.id}>
                {savingId === t.id ? "Saving..." : "Save"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
