"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { t as translate, type DictKey, type Lang } from "@/lib/i18n";

const LocaleContext = createContext<{ lang: Lang } | null>(null);

export function LocaleProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const router = useRouter();

  const setLang = useCallback(
    (next: Lang) => {
      document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      router.refresh();
    },
    [router]
  );

  return (
    <LocaleContext.Provider value={{ lang }}>
      <LangActionsContext.Provider value={{ setLang }}>{children}</LangActionsContext.Provider>
    </LocaleContext.Provider>
  );
}

const LangActionsContext = createContext<{ setLang: (l: Lang) => void }>({ setLang: () => {} });

export function useLang(): Lang {
  const ctx = useContext(LocaleContext);
  return ctx?.lang ?? "fr";
}

export function useSetLang() {
  return useContext(LangActionsContext).setLang;
}

/** Translation hook: const t = useT(); t("checkoutTitle") */
export function useT() {
  const lang = useLang();
  return useCallback((key: DictKey) => translate(key, lang), [lang]);
}
