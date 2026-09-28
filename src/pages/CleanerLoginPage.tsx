import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

export function CleanerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate("/cleaner/dashboard");
  }

  return (
    <>
      <SEO title="Cleaner Login | Troy Premier Green Cleaning Co." description="Cleaner team sign-in." path="/cleaner" />
      <div className="container-site flex max-w-sm flex-col py-20">
        <h1 className="font-display text-3xl text-pine-950">Cleaner sign-in</h1>
        <Card className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-sm text-clay-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
