import type { Lang } from "./i18n";

export interface LocalizedProductInfo {
  name: { fr: string; ar: string };
  shortDescription?: { fr: string; ar: string };
  description: { fr: string; ar: string };
}

export interface LocalizedCategoryInfo {
  name: { fr: string; ar: string };
  description?: { fr: string; ar: string };
}

export const CATEGORY_I18N: Record<string, LocalizedCategoryInfo> = {
  "lampes-decoration": {
    name: { fr: "Lampes & Décoration Féerique", ar: "مصابيح وديكور مضيء" },
    description: {
      fr: "Lampes miroirs nuage, coquillages lumineux et veilleuses féeriques pour une ambiance chaleureuse.",
      ar: "مرايا الغيمة اللانهائية، صدفات التوليب المشعة وإضاءات ساحرة تضفي دفئًا ورقة لمنزلك.",
    },
  },
  "boules-cristal": {
    name: { fr: "Boules de Cristal & Neige", ar: "كرات بلورية وثلجية" },
    description: {
      fr: "Boules lumineuses féeriques Hello Kitty et Kuromi aux reflets scintillants et flocons magiques.",
      ar: "كرات ثلجية وبلورات مضيئة لشخصيات هيلو كيتي وكورومي ببريق ساحر وأضواء هادئة.",
    },
  },
  "horloges-retro": {
    name: { fr: "Horloges & Objets Rétro", ar: "ساعات وتحف كلاسيكية" },
    description: {
      fr: "Horloges de table vintage raffinées et pièces décoratives intemporelles pour sublimer votre intérieur.",
      ar: "ساعات مكتب كلاسيكية أنيقة بلمسات كلاسيكية فاخرة تناسب أرقى المساحات.",
    },
  },
};

export const PRODUCT_I18N: Record<string, LocalizedProductInfo> = {
  "snow-globe-9tbhd": {
    name: {
      fr: "Boule à Neige Féerique Kuromi",
      ar: "كرة الثلج كيرومي المضيئة الحجم الكبير",
    },
    shortDescription: {
      fr: "Éclairage féerique doux, flocons scintillants et socle pastel.",
      ar: "إضاءة كريستالية هادئة مع تساقط ثلجي وبريق ساحر.",
    },
    description: {
      fr: "✨ Boule à Neige Féerique Kuromi 🔮💜\nApportez une touche de pure magie à votre espace avec cette boule à neige Kuromi ! Éclairage doux et chaleureux, délicats flocons scintillants en suspension et socle pastel raffiné 🌸❄️\n🎀 Le cadeau idéal et plein d'émotion pour vous ou vos proches.\n🚚 Paiement à la livraison disponible sur l'ensemble des 58 Wilayas 📦💫",
      ar: "✨ كرة كورومي الثلجية المضيئة 🔮💜\nأضيفي لمسة ساحرة لغرفتك مع كورومي الأيقونية! إضاءة كريستالية هادئة مع تساقط ثلجي وبريق خاطف للأنظار ❄️✨\n🎀 هدية فخمة ومثالية لمن تحبين تعكس الذوق الرفيع.\n🚚 التوصيل متوفر لجميع 58 ولاية · الدفع عند الاستلام 📦💫",
    },
  },
  "hello-kitty-moyenne-0xgxx": {
    name: {
      fr: "Boule de Cristal Hello Kitty Lumineuse",
      ar: "كرة بلورية ثلجية هيلو كيتي المضيئة",
    },
    shortDescription: {
      fr: "Lueur magique chaleureuse, gourmandise pastel et neige scintillante.",
      ar: "كب كيك لطيف مع إضاءة دافئة وتساقط ثلجي ساحر.",
    },
    description: {
      fr: "✨ Boule de Cristal Hello Kitty Lumineuse 🔮🍓\nAjoutez une douce touche d'émerveillement à votre intérieur avec cette boule de cristal Hello Kitty ! Dotée d'une lueur magique chaleureuse, de petits détails fruités et d'un tourbillon de neige féerique 🧁❄️\n🎀 Le cadeau parfait et adorable pour tous les amoureux de Hello Kitty.\n🚚 Livraison rapide sur 58 Wilayas · Paiement à la livraison 📦💫",
      ar: "✨ كرة هيلو كيتي الثلجية المضيئة 🔮🍓\nأضيفي جرعة من اللطف والبهجة لغرفتك مع هيلو كيتي المحبوبة! كب كيك لطيف مع إضاءة دافئة وتساقط ثلجي ساحر يبعث على الراحة 🧁❄️\n🎀 هدية مثالية وغاية في الرقة لكل عشاق كيتي.\n🚚 التوصيل متوفر لجميع 58 ولاية · الدفع عند الاستلام 📦💫",
    },
  },
  "hello-kitty-large-9wec5": {
    name: {
      fr: "Boule de Cristal Hello Kitty Grand Modèle",
      ar: "كرة بلورية هيلو كيتي الحجم الكبير",
    },
    shortDescription: {
      fr: "Grand dôme de cristal d'exception avec éclairage féerique scintillant.",
      ar: "تحفة بلورية فاخرة بحجم كبير وتأثيرات ضوئية متلألئة.",
    },
    description: {
      fr: "✨ Boule de Cristal Hello Kitty Grand Modèle 🔮🍓\nUne création d'exception pour illuminer votre intérieur : grand dôme de cristal abritant Hello Kitty dans un décor enchanté, sublimé par des jeux de lumière chaleureux et une féerie de neige scintillante 🧁❄️\n🎀 La pièce maîtresse idéale à offrir ou à exposer fièrement.\n🚚 Expédition soignée sur les 58 Wilayas avec paiement à la réception 📦💫",
      ar: "✨ كرة هيلو كيتي الكريستالية الحجم الكبير 🔮🍓\nتحفة فنية ساحرة بحجم كبير يبرز أدق التفاصيل مع أضواء متلألئة وعاصفة ثلجية براقة تأسر القلوب 🧁❄️\n🎀 الهدية الفاخرة المثالية لتزيين الغرف وإدخال البهجة لمن تحب.\n🚚 التوصيل متوفر لكافة 58 ولاية والدفع عند الاستلام 📦💫",
    },
  },
  "cloud-tulip-infinity-mirror-lamp-0rema": {
    name: {
      fr: "Lampe Miroir Infini Nuage Tulipes",
      ar: "مرآة الغيمة اللانهائية بتوليب مضيء",
    },
    shortDescription: {
      fr: "Miroir élégant le jour, champ infini de tulipes lumineuses la nuit.",
      ar: "مرآة غيمة ناعمة تتحول بلمسة زر إلى حقل أزهار لانهائي متوهج.",
    },
    description: {
      fr: "✨ Lampe Miroir Infini Nuage ☁️🌷\nMiroir design le jour, il se transforme d'un simple clic en un jardin infini de tulipes lumineuses grâce à son illusion d'optique captivante 🌷💫\n🎀 L'accessoire de décoration le plus poétique et viral pour créer une atmosphère apaisante.\n🚚 Expédition rapide sur toute l'Algérie (58 wilayas) · Paiement à la livraison 📦✨",
      ar: "✨ مرآة الغيمة اللانهائية المضيئة ☁️🌷\nمرآة أنيقة بشكل غيمة ناعمة تتحول بلمسة زر إلى حقل أزهار متوهج بتأثير انعكاس لانهائي ساحر ومبهر للأنظار 🌷💫\n🎀 قطعة الديكور الأكثر روعة وتميزًا لإضاءة دافئة ورومانسية.\n🚚 متوفر التوصيل السريع لـ 58 ولاية مع الدفع عند الاستلام 📦✨",
    },
  },
  "vintage-pedestal-desk-clock-vumvn": {
    name: {
      fr: "Horloge de Table Rétro Chic",
      ar: "ساعة المكتب الكلاسيكية الأنيقة",
    },
    shortDescription: {
      fr: "Design rétro chic avec cadran soigné et piètement vintage.",
      ar: "ساعة طاولة راقية بقاعدة أنيقة وتصميم كلاسيكي جذاب.",
    },
    description: {
      fr: "✨ Horloge de Table Rétro Chic 🕰️🤍\nApportez une note d'élégance vintage et intemporelle à votre bureau ou table de nuit. Cadran précis, lignes épurées et finition soignée 💫\n🎀 Le cadeau raffiné et durable pour sublimer tout espace de vie ou de travail.\n🚚 Livraison express sur les 58 Wilayas · Paiement à la livraison 📦",
      ar: "✨ ساعة المكتب الكلاسيكية الأنيقة 🕰️🤍\nتصميم فينتاج راقٍ بألوان ناعمة وقاعدة دائرية أنيقة تمنح مكتبك أو طاولة السرير لمسة من الأصالة والهدوء 💫\n🎀 الهدية المثالية لأصحاب الذوق الكلاسيكي الرفيع.\n🚚 توصيل متوفر لجميع 58 ولاية والدفع بعد استلام الطلب 📦",
    },
  },
  "glowing-tulip-seashell-lamp-cigin": {
    name: {
      fr: "Lampe Coquillage Tulipes Lumineuses",
      ar: "مصباح صدفة التوليب المشعة",
    },
    shortDescription: {
      fr: "Coquillage nacré s'ouvrant sur un bouquet de tulipes lumineuses.",
      ar: "صدفة لؤلؤية فاخرة تحتضن أزهار توليب مشعة بإنارة دافئة.",
    },
    description: {
      fr: "✨ Lampe Coquillage Tulipes Lumineuses 🐚💛\nUn coquillage nacré aux reflets scintillants qui révèle en son cœur un bouquet de tulipes lumineuses à la lueur douce et relaxante 🌷✨\n🎀 Une pièce d'art décorative féerique pour sublimer votre coiffeuse ou table de chevet.\n🚚 Livraison disponible sur les 58 Wilayas · Paiement à la livraison 📦💫",
      ar: "✨ مصباح صدفة التوليب المضيئة 🐚💛\nصدفة لؤلؤية ساحرة بلمعان متدرج تخبئ بداخلها أزهار توليب مشعة بإنارة ذهبية دافئة وناعمة 🌷✨\n🎀 قطعة ديكور استثنائية وأنيقة تضيف لمسة من الرقة والسكينة لمساحتك.\n🚚 التوصيل متوفر لجميع 58 ولاية · الدفع عند الاستلام 📦💫",
    },
  },
};

export function getLocalizedProductName(slug: string, fallbackName: string, lang: Lang): string {
  const item = PRODUCT_I18N[slug];
  if (!item) return fallbackName;
  return lang === "ar" ? item.name.ar : item.name.fr;
}

export function getLocalizedProductDesc(slug: string, fallbackDesc: string | null, lang: Lang): string | null {
  const item = PRODUCT_I18N[slug];
  if (!item) return fallbackDesc;
  return lang === "ar" ? item.description.ar : item.description.fr;
}

export function getLocalizedProductShortDesc(slug: string, fallbackShort: string | null, lang: Lang): string | null {
  const item = PRODUCT_I18N[slug];
  if (!item || !item.shortDescription) return fallbackShort;
  return lang === "ar" ? item.shortDescription.ar : item.shortDescription.fr;
}

export function getLocalizedCategoryName(slug: string, fallbackName: string, lang: Lang): string {
  const item = CATEGORY_I18N[slug];
  if (!item) return fallbackName;
  return lang === "ar" ? item.name.ar : item.name.fr;
}

export function getLocalizedCategoryDesc(slug: string, fallbackDesc: string | null, lang: Lang): string | null {
  const item = CATEGORY_I18N[slug];
  if (!item || !item.description) return fallbackDesc;
  return lang === "ar" ? item.description.ar : item.description.fr;
}

export const VARIANT_I18N: Record<string, { fr: string; ar: string }> = {
  "Présentation & Lumière": { fr: "Présentation & Lumière", ar: "طريقة العرض والإضاءة" },
  "Écrin & Présentation": { fr: "Écrin & Présentation", ar: "طريقة العرض" },
  "Allumé (Ambiance Chaleureuse)": { fr: "Allumé (Ambiance Chaleureuse)", ar: "مضيء (إضاءة دافئة)" },
  "Lumière du Jour (Éteint)": { fr: "Lumière du Jour (Éteint)", ar: "ضوء النهار (مطفأ)" },
  "Coffret Cadeau Signature": { fr: "Coffret Cadeau Signature", ar: "علبة الهدايا الفاخرة" },
  "Création originale": { fr: "Création originale", ar: "القطعة الأصلية" },
  "Dans son écrin luxe": { fr: "Dans son écrin luxe", ar: "داخل علبة الهدايا الفاخرة" },
};

export function getLocalizedVariantName(name: string, lang: Lang): string {
  const item = VARIANT_I18N[name];
  if (!item) return name;
  return lang === "ar" ? item.ar : item.fr;
}

export function getLocalizedVariantOptionLabel(label: string, lang: Lang): string {
  const item = VARIANT_I18N[label];
  if (!item) return label;
  return lang === "ar" ? item.ar : item.fr;
}
