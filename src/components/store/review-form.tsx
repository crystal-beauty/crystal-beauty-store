"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { useT } from "@/components/store/locale-provider";
import { cn } from "@/lib/utils";

export default function ReviewForm({ token }: { token: string }) {
  const t = useT();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, text }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("reviewInvalid"));
        setSubmitting(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/"), 2500);
    } catch {
      setError(t("errorGeneric"));
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-[var(--primary)] mx-auto mb-3" />
        <p className="font-medium text-[var(--primary)]">{t("reviewThanks")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div>
        <p className="block text-sm font-medium text-[var(--primary)] mb-2">1–5 ★</p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} className="p-0.5">
              <Star className={cn("h-8 w-8 transition-colors", n <= rating ? "fill-[var(--brand)] text-[var(--brand)]" : "text-muted-foreground/30 hover:text-[var(--brand)]/50")} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--primary)] mb-1.5" htmlFor="rv-text">
          {t("reviewText")}
        </label>
        <textarea
          id="rv-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-white border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]"
          maxLength={1000}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 bg-[var(--brand)] text-white font-semibold py-3.5 rounded-full hover:bg-[#16305c] transition-colors disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("reviewSubmit")}
      </button>
    </form>
  );
}
