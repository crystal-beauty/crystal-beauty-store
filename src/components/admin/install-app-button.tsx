"use client";

import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [isIos] = useState(() => {
    if (typeof window === "undefined") return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  });
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration error:", err);
      });
    }

    // Capture standard install prompt (Chrome / Edge / Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone) {
    return null; // Already running as an installed PWA
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      setShowIosGuide(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15",
          className
        )}
        title="Installer l'application d'administration"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Installer l&apos;App</span>
      </button>

      {/* iOS Safari / Manual Installation Modal Guide */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src="/crystal-beauty-logo.jpg"
                alt="Crystal Beauty"
                className="h-10 w-10 rounded-xl object-contain border border-slate-200"
              />
              <div>
                <h3 className="font-semibold text-slate-900">Installer Crystal Admin</h3>
                <p className="text-xs text-slate-500">Ajouter à l&apos;écran d&apos;accueil</p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-slate-600 mb-6">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                  1
                </span>
                <span>
                  Appuyez sur le bouton de <strong>Partage</strong>{" "}
                  <Share className="inline h-3.5 w-3.5 text-blue-600 align-baseline" /> dans Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                  2
                </span>
                <span>
                  Faites défiler vers le bas et sélectionnez{" "}
                  <strong>Sur l&apos;écran d&apos;accueil</strong>{" "}
                  <PlusSquare className="inline h-3.5 w-3.5 text-slate-800 align-baseline" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                  3
                </span>
                <span>
                  Touchez <strong>Ajouter</strong> en haut à droite pour finaliser l&apos;installation.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary)]/95 transition-colors"
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
