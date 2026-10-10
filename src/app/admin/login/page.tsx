"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Loader2, Lock, Mail } from "lucide-react";
import { useSettings } from "@/components/store/settings-provider";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const settings = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push(params.get("from") || "/admin");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div dir="ltr" lang="fr" className="min-h-screen flex items-center justify-center bg-[var(--primary)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center mx-auto mb-4 overflow-hidden">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.storeName} className="h-12 w-12 object-contain rounded-xl" />
            ) : (
              <Sparkles className="h-8 w-8 text-white" />
            )}
          </div>
          <h1 className="font-display text-3xl font-semibold text-white">{settings.storeName}</h1>
          <p className="text-white/60 text-sm mt-1">Tableau de bord — connectez-vous pour gérer votre boutique</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-3xl shadow-luxe-lg p-8 space-y-5">
          {error && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="ad-email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="ad-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@store.com"
                className="w-full bg-white border border-input rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="ad-pass">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="ad-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-input rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium py-3.5 rounded-xl hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Access is limited to your store team. Roles control what each member can do.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
