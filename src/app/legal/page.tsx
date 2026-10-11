"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Scale,
  Lock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

/**
 * Cadre Juridique, Conditions Générales de Vente (CGV) & Protection des Données
 * الشروط العامة للبيع، سياسة الخصوصية وحماية المعطيات الشخصية في الجزائر
 *
 * Conforme à :
 * - Loi n° 18-05 du 10 mai 2018 relative au commerce électronique (Algérie)
 * - Loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques
 *   dans le traitement des données à caractère personnel (ANPDP)
 * - Loi n° 09-03 relative à la protection du consommateur et à la répression des fraudes
 */

export default function LegalPage() {
  const [lang, setLang] = useState<"fr" | "ar">(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("crystal_lang");
        if (stored === "ar") return "ar";
      } catch {
        /* fallback */
      }
    }
    return "fr";
  });

  const isAr = lang === "ar";

  return (
    <main className="min-h-screen bg-[#FBF9F5] text-[#1A1A1A]" dir={isAr ? "rtl" : "ltr"}>
      {/* ── TOP NAVIGATION ── */}
      <nav className="sticky top-0 z-30 border-b border-[#0A1F44]/10 bg-white/85 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-display text-base font-semibold shadow-sm">
              CB
            </div>
            <div>
              <span className="font-display text-xl tracking-tight block leading-tight text-[var(--primary)]">
                {isAr ? "كريستال بيوتي" : "Crystal Beauty"}
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground block">
                {isAr ? "العناية الفاخرة بالجزائر" : "Haute Beauté · Algérie"}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center bg-[#EFECE6] rounded-full p-1 border border-[#E2DDD5]">
              <button
                type="button"
                onClick={() => setLang("fr")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  lang === "fr"
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Français
              </button>
              <button
                type="button"
                onClick={() => setLang("ar")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  lang === "ar"
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                العربية
              </button>
            </div>

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs tracking-wider uppercase font-medium text-[var(--primary)] hover:text-[#16305c] transition"
            >
              {isAr ? (
                <>
                  <span>العودة إلى المتجر</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour à la boutique</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <header className="border-b border-[#0A1F44]/10 bg-gradient-to-b from-white to-[#FBF9F5] py-12 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-semibold tracking-wider uppercase">
            <Scale className="w-3.5 h-3.5" />
            <span>
              {isAr
                ? "الجمهورية الجزائرية الديمقراطية الشعبية — التجارة الإلكترونية"
                : "Conformité Légale — Commerce Électronique en Algérie"}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl text-[var(--primary)] tracking-tight font-semibold">
            {isAr
              ? "الشروط العامة للبيع، الخصوصية وحماية المستهلك"
              : "Conditions Générales & Protection des Données"}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "متجر كريستال بيوتي مؤطر وفقاً للقوانين الجزائرية المنظمة للتجارة الإلكترونية (القانون 18-05)، حماية المعطيات الشخصية (القانون 18-07 ANPDP) وحماية المستهلك (القانون 09-03)."
              : "Ce document définit les droits et obligations réciproques conformément aux lois algériennes n° 18-05 (Commerce électronique), n° 18-07 (Protection des données personnelles - ANPDP) et n° 09-03 (Protection du consommateur)."}
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs text-foreground/80">
            <span className="inline-flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-border shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand)]" />
              {isAr ? "حماية المستهلك (قانون 09-03)" : "Protection du consommateur (09-03)"}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-border shadow-2xs">
              <Truck className="w-3.5 h-3.5 text-[var(--brand)]" />
              {isAr ? "شريك التوصيل: وورلد إكسبرس (58 ولاية)" : "Transporteur officiel : World Express"}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-border shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-[var(--brand)]" />
              {isAr ? "الدفع الآمن عند الاستلام (COD)" : "Paiement à la livraison garanti"}
            </span>
          </div>
        </div>
      </header>

      {/* ── QUICK ANCHORS ── */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-medium">
          <a
            href="#vendeur"
            className="p-3 bg-white hover:bg-[#F3EFEA] rounded-2xl border border-border text-center transition text-[var(--primary)] hover:border-[var(--brand)]"
          >
            {isAr ? "1. التعريف بالمتجر" : "1. Identification Vendeur"}
          </a>
          <a
            href="#cgv"
            className="p-3 bg-white hover:bg-[#F3EFEA] rounded-2xl border border-border text-center transition text-[var(--primary)] hover:border-[var(--brand)]"
          >
            {isAr ? "2. العقد والالتزام بالدفع" : "2. Contrat & Paiement COD"}
          </a>
          <a
            href="#cosmetics"
            className="p-3 bg-white hover:bg-[#F3EFEA] rounded-2xl border border-border text-center transition text-[var(--primary)] hover:border-[var(--brand)]"
          >
            {isAr ? "3. معايير صحة التجميل" : "3. Hygiène Cosmétique"}
          </a>
          <a
            href="#privacy"
            className="p-3 bg-white hover:bg-[#F3EFEA] rounded-2xl border border-border text-center transition text-[var(--primary)] hover:border-[var(--brand)]"
          >
            {isAr ? "4. حماية المعطيات (ANPDP)" : "4. Protection Données"}
          </a>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* SECTION 1: Identification */}
        <section id="vendeur" className="bg-white rounded-3xl border border-border p-6 sm:p-9 shadow-luxe scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2F8] text-[var(--primary)] flex items-center justify-center font-display text-lg font-bold">
              01
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)]">
                {isAr ? "التعريف بالمتجر والموقع (القانون 18-05)" : "Identification du Vendeur (Loi 18-05)"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {isAr ? "وفقاً للمادتين 10 و 11 من قانون التجارة الإلكترونية" : "Articles 10 et 11 de la loi 18-05 sur le commerce électronique"}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-foreground/80">
            <p>
              <strong className="text-[var(--primary)]">{isAr ? "المتجر الإلكتروني:" : "Dénomination :"}</strong>{" "}
              {isAr
                ? "متجر كريستال بيوتي (Crystal Beauty Algérie)، منصة تجارية متخصصة في بيع مستحضرات العناية بالبشرة، والزيوت العطرية، والعطور الفاخرة وصناديق الهدايا الراقية في الجزائر."
                : "Crystal Beauty, boutique en ligne spécialisée dans la distribution de soins d'exception, sérums précieux, parfums fins et coffrets cadeaux de luxe en Algérie."}
            </p>
            <p>
              <strong className="text-[var(--primary)]">{isAr ? "نطاق التغطية والتوصيل:" : "Territoire de couverture :"}</strong>{" "}
              {isAr
                ? "كافة التراب الوطني الجزائري عبر 58 ولاية، مع التوصيل إلى باب المنزل أو الاستلام من مكاتب الشحن (Stop Desk)."
                : "L’ensemble des 58 wilayas d’Algérie, avec livraison à domicile ou retrait en bureau express (Stop Desk)."}
            </p>
            <p>
              <strong className="text-[var(--primary)]">{isAr ? "الأمان والتشفير:" : "Sécurité & Hébergement :"}</strong>{" "}
              {isAr
                ? "منصة مستضافة سحابياً ومحمية بالكامل عبر بروتوكولات التشفير الدولية TLS/HTTPS بما يضمن حماية تامة لبيانات التصفح وسرية الطلبات."
                : "Hébergement haute disponibilité avec chiffrement complet de bout en bout (SSL/TLS HTTPS) garantissant la confidentialité des échanges."}
            </p>
          </div>
        </section>

        {/* SECTION 2: Electronic Contract & COD Obligation */}
        <section id="cgv" className="bg-white rounded-3xl border border-border p-6 sm:p-9 shadow-luxe scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2F8] text-[var(--primary)] flex items-center justify-center font-display text-lg font-bold">
              02
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)]">
                {isAr ? "انعقاد العقد الإلكتروني والالتزام بالطلب (المادة 12)" : "Formation du Contrat & Engagement Ferme (Art. 12)"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {isAr ? "القانون 18-05 المتعلق بالتجارة الإلكترونية" : "Loi 18-05 relative au commerce électronique en Algérie"}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-foreground/80">
            <p>
              {isAr
                ? "وفقاً لأحكام المادة 12 من القانون رقم 18-05، فإن تأكيد الطلب بالنقر على « تأكيد الطلب » يُعد قبولاً صريحاً ومتبادلاً للإيجاب الإلكتروني وينشئ عقداً ملزماً بين المشتري والمتجر."
                : "Conformément à l’article 12 de la loi n° 18-05, la validation de la commande en cliquant sur « Confirmer la commande » constitue une acceptation ferme et irrévocable de l’offre contractuelle, créant une obligation juridique réciproque."}
            </p>

            <div className="p-4 rounded-2xl bg-[#FFF8EB] border border-[#F0DDB8] text-xs text-[#8A571A] space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-[#C97B1A]" />
                <span>{isAr ? "الالتزام بالدفع عند الاستلام (COD)" : "Obligation de Paiement à la Livraison"}</span>
              </div>
              <p>
                {isAr
                  ? "يتحمل المشتري التزاماً قانونياً باستلام الطرد ودفع المبلغ المستحق نقداً (بالدينار الجزائري) لعون التوصيل. يُرجى عدم تأكيد أي طلب إلا بعد التأكد التام من الرغبة في الشراء والقدرة على الاستلام لتجنب الإضرار بتكاليف الشحن."
                  : "Le client s’engage formellement à réceptionner le colis et à s'acquitter du montant total en espèces auprès du livreur. La confirmation d'une commande sans intention réelle de réceptionner constitue un préjudice commercial répréhensible."}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: Delivery & World Express Partner */}
        <section id="delivery" className="bg-white rounded-3xl border border-border p-6 sm:p-9 shadow-luxe scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2F8] text-[var(--primary)] flex items-center justify-center font-display text-lg font-bold">
              03
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)]">
                {isAr ? "الشحن، التسليم والشريك اللوجستي" : "Livraison & Partenaire Transporteur (World Express)"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {isAr ? "توصيل سريع وآمن عبر 58 ولاية" : "Service de livraison express 58 Wilayas"}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-foreground/80">
            <p>
              {isAr
                ? "يتم شحن جميع الطلبيات عبر شريكنا المعتمد (World Express / EcoTrack). يتصل عون التوصيل بالزبون عبر الهاتف لتنسيق موعد ومكان التسليم."
                : "Toutes les expéditions sont opérées en partenariat avec World Express (EcoTrack). Le livreur contacte le destinataire préalablement par téléphone pour convenir de la remise du colis."}
            </p>
            <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-foreground/80">
              <li>
                <strong>{isAr ? "الجزائر العاصمة والوسط:" : "Alger et environs :"}</strong> {isAr ? "24 إلى 48 ساعة عمل." : "24 à 48 heures ouvrables."}
              </li>
              <li>
                <strong>{isAr ? "الولايات الشمالية الكبرى:" : "Grandes villes du Nord :"}</strong> {isAr ? "48 إلى 72 ساعة." : "48 à 72 heures."}
              </li>
              <li>
                <strong>{isAr ? "ولايات الهضاب العليا والجنوب:" : "Hauts Plateaux & Sud :"}</strong> {isAr ? "3 إلى 5 أيام عمل." : "3 à 5 jours ouvrables."}
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 4: Cosmetics Hygiene & Consumer Protection (Loi 09-03) */}
        <section id="cosmetics" className="bg-white rounded-3xl border border-border p-6 sm:p-9 shadow-luxe scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2F8] text-[var(--primary)] flex items-center justify-center font-display text-lg font-bold">
              04
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)]">
                {isAr ? "صحة مستحضرات التجميل وحماية المستهلك (القانون 09-03)" : "Hygiène Cosmétique & Protection Consommateur (09-03)"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {isAr ? "معايير النظافة الصارمة ومكافحة الغش" : "Normes sanitaires strictes & répression des fraudes"}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-foreground/80">
            <p>
              {isAr
                ? "نظراً لطبيعة المنتجات التجميلية والعطور وحرصاً على الصحة العامة للمستهلكات، لا يمكن استرجاع أو استبدال أي منتج تم فتح غلافه الخارجي أو تجربته أو استعماله."
                : "Compte tenu de la nature des soins cosmétiques et par mesure stricte d'hygiène et de santé publique, aucun produit cosmétique décacheté, ouvert ou testé ne peut faire l'objet d'un retour ou d'un remboursement."}
            </p>
            <div className="p-4 rounded-2xl bg-[#F0F8F3] border border-[#C8E8D4] text-xs text-[#1E6838] space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#2E9B54]" />
                <span>{isAr ? "ضمان الاستبدال خلال 48 ساعة في حال وجود عيب" : "Garantie d'échange 48h en cas de non-conformité"}</span>
              </div>
              <p>
                {isAr
                  ? "في حال استلام منتج تالف بسبب الشحن أو غير مطابق للطلب، يحق للزبونة طلب استبدال فوري خلال 48 ساعة عبر الواتساب مع تكفل المتجر بكامل تكاليف الشحن (100%)."
                  : "En cas de défaut avéré ou d'erreur de préparation, vous bénéficiez d'un échange gratuit sous 48h avec prise en charge intégrale des frais de réexpédition (100%)."}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: Data Privacy (Loi 18-07 ANPDP) */}
        <section id="privacy" className="bg-white rounded-3xl border border-border p-6 sm:p-9 shadow-luxe scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2F8] text-[var(--primary)] flex items-center justify-center font-display text-lg font-bold">
              05
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)]">
                {isAr ? "حماية المعطيات ذات الطابع الشخصي (القانون 18-07 ANPDP)" : "Protection des Données Personnelles — Loi 18-07 (ANPDP)"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {isAr ? "السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي" : "Conformité à l'Autorité Nationale de Protection des Données Personnelles"}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-foreground/80">
            <p>
              {isAr
                ? "يلتزم متجر كريستال بيوتي بالمعالجة الآمنة والشفافة لبيانات الزبائن (الاسم، رقم الهاتف، العنوان). تُنقل هذه البيانات حصرياً لشركة التوصيل (World Express) لغرض تنفيذ عقد التوصيل والتسليم فقط."
                : "Crystal Beauty traite vos données personnelles (nom, téléphones, adresse) avec la plus stricte rigueur. Ces données sont transmises exclusivement à notre transporteur (World Express) dans le cadre strict de l'exécution de la livraison."}
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-foreground/80">
              <li>{isAr ? "لا يتم بيع أو تأجير أي بيانات شخصية لأطراف ثالثة." : "Aucune revente ni cession de vos coordonnées à des tiers commerciaux."}</li>
              <li>{isAr ? "يحق للزبونة طلب تعديل أو حذف بياناتها عبر التواصل المباشر مع خدمة الزبائن." : "Droit d'accès, de rectification et d'effacement garanti sur simple demande."}</li>
            </ul>
          </div>
        </section>

        {/* SECTION 6: Anti-Fraud Warning */}
        <section className="bg-white rounded-3xl border border-border p-6 sm:p-9 shadow-luxe">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF0EE] text-[#C0392B] flex items-center justify-center font-display text-lg font-bold">
              06
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)]">
                {isAr ? "مكافحة الطلبات الوهمية والتلاعب التجاري" : "Lutte contre les Commandes Fictives & Abus"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {isAr ? "حماية النشاط التجاري وملاحقة الاحتيال" : "Sécurisation des transactions et prévention de la fraude"}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-foreground/80">
            <p>
              {isAr
                ? "يحتفظ المتجر بسجلات رقمية (IP والعناوين وأرقام الهواتف) لمكافحة الهجمات البرمجية والطلبات الوهمية. يُدرج أي رقم هاتف يقوم بالطلب المتكرر دون استلام في القائمة السوداء الوطنية ويُحرم من الشراء مستقبلاً."
                : "Le système enregistre les adresses IP et coordonnées pour prévenir le spam et les commandes malveillantes. Tout numéro enregistrant des commandes fantaisistes ou des refus délibérés sera définitivement blacklisté sur nos plateformes."}
            </p>
          </div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#0A1F44]/10 bg-white py-8 px-6 text-center text-xs text-muted-foreground">
        <p>
          {isAr
            ? "© 2026 كريستال بيوتي الجزائر. جميع الحقوق محفوظة — مؤطر بموجب القوانين 18-05 و 18-07 و 09-03."
            : "© 2026 Crystal Beauty Algérie. Tous droits réservés — Conforme aux Lois algériennes 18-05, 18-07 (ANPDP) et 09-03."}
        </p>
      </footer>
    </main>
  );
}
