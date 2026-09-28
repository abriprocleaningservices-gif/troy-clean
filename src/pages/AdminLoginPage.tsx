import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setError(error?.message ?? "Sign-in failed");
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", data.session.user.id).single();
    setSubmitting(false);

    if (!profile || !["owner", "admin"].includes(profile.role)) {
      setError("This account does not have admin access.");
      await supabase.auth.signOut();
      return;
    }

    navigate("/admin/dashboard");
  }

  return (
    <>
      <SEO title="Admin Login | Troy Premier Green Cleaning Co." description="Staff sign-in." path="/admin" />
      <div className="container-site flex max-w-sm flex-col py-20">
        <h1 className="font-display text-3xl text-pine-950">Admin sign-in</h1>
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
