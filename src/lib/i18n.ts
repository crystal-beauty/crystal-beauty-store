// Lightweight i18n: FR (default) + AR (RTL). UI chrome only — admin-managed
// content (products, hero…) is entered once by the store owner; policy pages
// and announcement/hero have dedicated FR/AR fields in the dashboard.

export type Lang = "fr" | "ar";

export const DICT = {
  // Header / nav
  shopAll: { fr: "Boutique", ar: "المتجر" },
  trackOrder: { fr: "Suivre ma commande", ar: "تتبع طلبي" },
  cart: { fr: "Panier", ar: "السلة" },
  home: { fr: "Accueil", ar: "الرئيسية" },
  contact: { fr: "Contact", ar: "اتصل بنا" },

  // Home
  shopCollection: { fr: "Découvrir la collection", ar: "تصفح المجموعة" },
  browse: { fr: "Parcourir", ar: "تصفح" },
  shopByCollection: { fr: "Nos collections", ar: "تصفح المجموعات" },
  viewAll: { fr: "Voir tout", ar: "عرض الكل" },
  comingSoon: { fr: "Les produits arrivent très bientôt.", ar: "المنتجات قادمة قريبًا." },
  codBadge: { fr: "Paiement à la livraison", ar: "الدفع عند الاستلام" },
  codBadgeText: { fr: "Payez en espèces quand votre commande arrive", ar: "ادفع نقدًا عند وصول طلبك" },
  wilayasBadge: { fr: "Livraison 58 wilayas", ar: "التوصيل إلى 58 ولاية" },
  wilayasBadgeText: { fr: "À domicile ou arrêt bureau, selon la tarification officielle du transporteur", ar: "إلى المنزل أو مكتب التوقف، حسب أسعار شركة التوصيل الرسمية" },
  giftBadge: { fr: "Emballage cadeau sur demande", ar: "تغليف الهدايا عند الطلب" },
  giftBadgeText: { fr: "Vendu à la pièce — ajoutez une boîte cadeau si vous le souhaitez", ar: "يُباع كقطعة واحدة — أضف علبة هدايا إذا رغبت" },
  trackBadge: { fr: "Suivi en temps réel", ar: "تتبع مباشر" },
  trackBadgeText: { fr: "Suivez votre colis avec le numéro de suivi du transporteur", ar: "تابع طردك برقم التتبع من شركة التوصيل" },
  startGifting: { fr: "Commencer mes achats", ar: "ابدأ التسوق" },
  ctaSubtitle: { fr: "Choisissez votre cadeau, payez à la livraison.", ar: "اختر هديتك وادفع عند الاستلام." },
  trackYourOrder: { fr: "Suivre ma commande", ar: "تتبع طلبي" },

  // How it works (all verifiable claims only)
  howEyebrow: { fr: "Simple et sécurisé", ar: "بسيط وآمن" },
  howTitle: { fr: "Comment commander", ar: "كيف تطلب" },
  howStep1Title: { fr: "Choisissez votre cadeau", ar: "اختر هديتك" },
  howStep1Text: {
    fr: "Parcourez la collection et ajoutez vos articles préférés au panier.",
    ar: "تصفح المجموعة وأضف منتجاتك المفضلة إلى السلة.",
  },
  howStep2Title: { fr: "Remplissez votre adresse", ar: "أدخل عنوانك" },
  howStep2Text: {
    fr: "Wilaya, commune et adresse — les frais de livraison officiels s'affichent en direct.",
    ar: "الولاية والبلدية والعنوان — تظهر رسوم التوصيل الرسمية مباشرة.",
  },
  howStep3Title: { fr: "Payez à la livraison", ar: "ادفع عند الاستلام" },
  howStep3Text: {
    fr: "Nous vous appelons pour confirmer, puis vous payez en espèces à la réception du colis.",
    ar: "نتصل بك للتأكيد، ثم تدفع نقدًا عند استلام الطرد.",
  },

  // Empty store (honest — no fabricated products)
  emptyStoreHint: {
    fr: "Notre collection est en préparation. Contactez-nous pour être informé des nouveautés.",
    ar: "مجموعتنا قيد الإعداد. تواصل معنا لمعرفة الجديد.",
  },
  footerDeliveryNote: {
    fr: "Livraison dans les 58 wilayas — paiement à la livraison",
    ar: "التوصيل إلى 58 ولاية — الدفع عند الاستلام",
  },
  notFoundTitle: { fr: "Page introuvable", ar: "الصفحة غير موجودة" },
  notFoundText: { fr: "La page que vous cherchez n'existe pas ou a été déplacée.", ar: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها." },

  // Product card / detail
  soldOut: { fr: "Rupture de stock", ar: "نفدت الكمية" },
  lowStock: { fr: "Plus que", ar: "بقي فقط" },
  inStock: { fr: "En stock — prêt à livrer", ar: "متوفر — جاهز للتوصيل" },
  unitsLeft: { fr: "en stock", ar: "قطعة في المخزون" },
  addToCart: { fr: "Ajouter au panier", ar: "أضف إلى السلة" },
  orderNow: { fr: "Commander maintenant", ar: "اطلب الآن" },
  quantity: { fr: "Quantité", ar: "الكمية" },
  description: { fr: "Description", ar: "الوصف" },
  related: { fr: "Vous aimerez aussi", ar: "قد يعجبك أيضًا" },
  choose: { fr: "Choisir", ar: "اختر" },
  oldPrice: { fr: "Ancien prix", ar: "السعر القديم" },

  // Quick order
  quickOrder: { fr: "Commande rapide", ar: "طلب سريع" },
  quickOrderSubtitle: { fr: "Remplissez le formulaire — nous vous appelons pour confirmer.", ar: "املأ النموذج — سنتصل بك للتأكيد." },
  yourName: { fr: "Nom complet", ar: "الاسم الكامل" },
  yourPhone: { fr: "Téléphone", ar: "رقم الهاتف" },
  yourWilaya: { fr: "Wilaya", ar: "الولاية" },
  yourCommune: { fr: "Commune", ar: "البلدية" },
  yourAddress: { fr: "Adresse de livraison", ar: "عنوان التوصيل" },
  addressHint: { fr: "Max 30 caractères (limite de l'étiquette du transporteur)", ar: "30 حرفًا كحد أقصى (حد ملصق شركة التوصيل)" },
  optionalNote: { fr: "Note (optionnel)", ar: "ملاحظة (اختياري)" },
  emailOptional: { fr: "Email (optionnel)", ar: "البريد الإلكتروني (اختياري)" },
  confirmOrder: { fr: "Confirmer la commande", ar: "تأكيد الطلب" },
  payOnDelivery: { fr: "Payer à la livraison", ar: "الدفع عند الاستلام" },
  confirmOrderBtn: { fr: "Confirmer — payer", ar: "تأكيد — ادفع" },
  onDelivery: { fr: "à la livraison", ar: "عند الاستلام" },

  // Delivery
  deliveryType: { fr: "Type de livraison", ar: "نوع التوصيل" },
  homeDelivery: { fr: "À domicile", ar: "إلى المنزل" },
  stopDesk: { fr: "Arrêt bureau (agence)", ar: "مكتب التوقف (الوكالة)" },
  stopDeskHint: { fr: "Retirez votre colis à l'agence la plus proche", ar: "استلم طردك من أقرب وكالة" },
  selectWilaya: { fr: "Sélectionnez la wilaya…", ar: "اختر الولاية…" },
  selectCommune: { fr: "Sélectionnez la commune…", ar: "اختر البلدية…" },
  deliveryFee: { fr: "Frais de livraison", ar: "رسوم التوصيل" },
  feeCalculating: { fr: "Calcul des frais de livraison…", ar: "جارٍ حساب رسوم التوصيل…" },
  feeError: { fr: "Impossible de calculer la livraison. Réessayez ou contactez-nous sur WhatsApp.", ar: "تعذر حساب التوصيل. أعد المحاولة أو تواصل معنا عبر واتساب." },
  noStopDesk: { fr: "Pas d'arrêt bureau dans cette commune — livraison à domicile uniquement.", ar: "لا يوجد مكتب توقف في هذه البلدية — التوصيل للمنزل فقط." },
  deliveryInfo: { fr: "Frais de livraison officiels du transporteur, calculés en direct.", ar: "رسوم التوصيل الرسمية لشركة التوصيل، تُحسب مباشرة." },
  carrierDownTitle: { fr: "Livraison momentanément indisponible", ar: "التوصيل غير متاح حاليًا" },
  carrierDownText: {
    fr: "Les frais sont calculés en direct auprès de notre transporteur. Le service est momentanément indisponible — réessayez dans un instant ou commandez via WhatsApp.",
    ar: "تُحسب رسوم التوصيل مباشرة من شركة التوصيل. الخدمة غير متاحة مؤقتًا — أعد المحاولة بعد قليل أو اطلب عبر واتساب.",
  },
  retry: { fr: "Réessayer", ar: "إعادة المحاولة" },

  // Cart
  cartTitle: { fr: "Votre panier", ar: "سلتك" },
  cartEmpty: { fr: "Votre panier est vide.", ar: "سلتك فارغة." },
  cartEmptyCta: { fr: "Découvrir nos cadeaux", ar: "تصفح هدايانا" },
  subtotal: { fr: "Sous-total", ar: "المجموع الفرعي" },
  discount: { fr: "Remise", ar: "الخصم" },
  total: { fr: "Total", ar: "المجموع" },
  checkout: { fr: "Passer la commande", ar: "إتمام الطلب" },
  continueShopping: { fr: "Continuer mes achats", ar: "متابعة التسوق" },
  remove: { fr: "Retirer", ar: "حذف" },
  giftBox: { fr: "Boîte cadeau", ar: "علبة هدايا" },
  promoCode: { fr: "Code promo", ar: "كود الخصم" },
  apply: { fr: "Appliquer", ar: "تطبيق" },
  promoApplied: { fr: "Code appliqué", ar: "تم تطبيق الكود" },
  promoInvalid: { fr: "Code invalide ou expiré.", ar: "كود غير صالح أو منتهي." },

  // Checkout
  checkoutTitle: { fr: "Finaliser la commande", ar: "إتمام الطلب" },
  checkoutSubtitle: { fr: "Paiement à la livraison — aucun paiement en ligne.", ar: "الدفع عند الاستلام — بدون دفع إلكتروني." },
  contactInfo: { fr: "Vos coordonnées", ar: "معلومات التواصل" },
  deliveryAddress: { fr: "Adresse de livraison", ar: "عنوان التوصيل" },
  giftDetails: { fr: "Options cadeau (facultatif)", ar: "خيارات الهدايا (اختياري)" },
  giftMessage: { fr: "Message cadeau", ar: "رسالة الهدية" },
  recipientName: { fr: "Nom du destinataire", ar: "اسم المستلم" },
  recipientPhone: { fr: "Téléphone du destinataire", ar: "هاتف المستلم" },
  recipientHint: { fr: "Si le cadeau est pour quelqu'un d'autre", ar: "إذا كانت الهدية لشخص آخر" },
  orderSummary: { fr: "Récapitulatif", ar: "ملخص الطلب" },
  codOnly: { fr: "Paiement à la livraison (espèces)", ar: "الدفع عند الاستلام (نقدًا)" },
  codOnlyHint: { fr: "Vous payez au livreur à la réception du colis.", ar: "تدفع لعامل التوصيل عند استلام الطرد." },
  phoneInvalid: { fr: "Numéro invalide — utilisez un mobile 05 / 06 / 07 (10 chiffres).", ar: "رقم غير صالح — استخدم هاتفًا محمولًا 05 / 06 / 07 (10 أرقام)." },
  blockedPhone: { fr: "Nous ne pouvons pas accepter votre commande. Contactez-nous sur WhatsApp si vous pensez qu'il s'agit d'une erreur.", ar: "لا يمكننا قبول طلبك. تواصل معنا عبر واتساب إذا كنت تعتقد أن هذا خطأ." },
  orderPlacing: { fr: "Envoi en cours…", ar: "جارٍ الإرسال…" },
  selectBoth: { fr: "Choisissez la wilaya et la commune pour voir les frais.", ar: "اختر الولاية والبلدية لعرض الرسوم." },
  agreeCod: { fr: "En confirmant, vous vous engagez à payer le montant total en espèces à la livraison.", ar: "بتأكيد الطلب، تتعهد بدفع المبلغ كاملًا نقدًا عند الاستلام." },

  // Thank you
  thankYouTitle: { fr: "Merci ! Votre commande est reçue.", ar: "شكرًا! تم استلام طلبك." },
  thankYouNumber: { fr: "Numéro de commande", ar: "رقم الطلب" },
  thankYouContact: { fr: "Nous vous appellerons bientôt pour confirmer votre commande.", ar: "سنتصل بك قريبًا لتأكيد طلبك." },
  thankYouWhatsapp: { fr: "Nous écrire sur WhatsApp", ar: "راسلنا على واتساب" },
  thankYouKeep: { fr: "Gardez ce numéro pour suivre votre livraison.", ar: "احفظ هذا الرقم لتتبع طلبك." },
  backHome: { fr: "Retour à la boutique", ar: "العودة للمتجر" },
  trackThisOrder: { fr: "Suivre cette commande", ar: "تتبع هذا الطلب" },

  // Track
  trackTitle: { fr: "Suivi de commande", ar: "تتبع الطلب" },
  trackSubtitle: { fr: "Entrez votre numéro de commande et votre téléphone.", ar: "أدخل رقم طلبك ورقم هاتفك." },
  trackCta: { fr: "Rechercher", ar: "بحث" },
  trackNotFound: { fr: "Commande introuvable — vérifiez le numéro et le téléphone.", ar: "لم يتم العثور على الطلب — تحقق من الرقم والهاتف." },
  carrierStatus: { fr: "Statut transporteur", ar: "حالة شركة التوصيل" },
  itemsInOrder: { fr: "Articles", ar: "المنتجات" },

  // Statuses (customer-facing)
  statusNew: { fr: "Commande reçue", ar: "تم استلام الطلب" },
  statusConfirmed: { fr: "Confirmée", ar: "مؤكد" },
  statusSentToCarrier: { fr: "Expédiée au transporteur", ar: "تم الإرسال لشركة التوصيل" },
  statusInDelivery: { fr: "En cours de livraison", ar: "قيد التوصيل" },
  statusDelivered: { fr: "Livrée", ar: "تم التوصيل" },
  statusRefused: { fr: "Refusée", ar: "مرفوض" },
  statusReturned: { fr: "Retournée", ar: "مرتجع" },
  statusCancelled: { fr: "Annulée", ar: "ملغى" },

  // Footer / policies
  quickLinks: { fr: "Navigation", ar: "روابط" },
  getInTouch: { fr: "Contact", ar: "تواصل معنا" },
  policyDelivery: { fr: "Livraison", ar: "التوصيل" },
  policyReturns: { fr: "Retours", ar: "الإرجاع" },
  policyPrivacy: { fr: "Confidentialité", ar: "الخصوصية" },

  // Reviews
  reviewTitle: { fr: "Votre avis compte", ar: "رأيك يهمنا" },
  reviewSubtitle: { fr: "Comment s'est passée votre commande ?", ar: "كيف كانت تجربة طلبك؟" },
  reviewText: { fr: "Votre avis", ar: "رأيك" },
  reviewSubmit: { fr: "Envoyer mon avis", ar: "أرسل رأيك" },
  reviewThanks: { fr: "Merci pour votre avis ! Il sera publié après validation.", ar: "شكرًا على رأيك! سيتم نشره بعد المراجعة." },
  reviewInvalid: { fr: "Lien d'avis invalide ou déjà utilisé.", ar: "رابط التقييم غير صالح أو مستخدم بالفعل." },
  noReviews: { fr: "Aucun avis pour le moment.", ar: "لا توجد تقييمات حاليًا." },
  reviewsTitle: { fr: "Avis clients vérifiés", ar: "تقييمات عملاء موثقة" },

  // Shop / products listing
  collectionEyebrow: { fr: "Toute la collection", ar: "كل المجموعة" },
  findPerfectGift: { fr: "Trouvez le cadeau parfait", ar: "اختر الهدية المثالية" },
  resultsFor: { fr: "Résultats pour", ar: "نتائج البحث عن" },
  allGifts: { fr: "Tous les cadeaux", ar: "كل الهدايا" },
  searchPlaceholder: { fr: "Rechercher un cadeau…", ar: "ابحث عن هدية…" },
  sortNewest: { fr: "Nouveautés", ar: "الأحدث" },
  sortFeatured: { fr: "Mise en avant", ar: "المميزة" },
  sortPriceAsc: { fr: "Prix croissant", ar: "السعر: تصاعدي" },
  sortPriceDesc: { fr: "Prix décroissant", ar: "السعر: تنازلي" },
  sortProducts: { fr: "Trier les produits", ar: "ترتيب المنتجات" },
  noResults: { fr: "Aucun cadeau trouvé", ar: "لم نجد أي هدية" },
  noResultsHint: { fr: "Essayez une autre collection ou un autre mot-clé.", ar: "جرّب مجموعة أخرى أو كلمة بحث مختلفة." },
  clearFilters: { fr: "Effacer les filtres", ar: "مسح عوامل التصفية" },

  // Misc
  loading: { fr: "Chargement…", ar: "جارٍ التحميل…" },
  errorGeneric: { fr: "Une erreur est survenue. Réessayez.", ar: "حدث خطأ. أعد المحاولة." },
  whatsapp: { fr: "WhatsApp", ar: "واتساب" },
  call: { fr: "Appeler", ar: "اتصال" },
  currency: { fr: "DA", ar: "دج" },
} as const;

export type DictKey = keyof typeof DICT;

export function t(key: DictKey, lang: Lang): string {
  return DICT[key][lang] ?? DICT[key].fr;
}

/** Pick the right field of an FR/AR pair (fr content shown in AR UI if no AR version). */
export function pick(fr: string | null | undefined, ar: string | null | undefined, lang: Lang): string {
  if (lang === "ar") return (ar && ar.trim()) || fr || "";
  return (fr && fr.trim()) || ar || "";
}
