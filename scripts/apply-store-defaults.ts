import { db } from "../src/lib/db";
import { saveSettings } from "../src/lib/settings";

const DELIVERY_FR = `### Expédition & Livraison en Algérie
Chez **Crystal Beauty**, nous assurons la livraison vers l'ensemble des **58 wilayas** d'Algérie en partenariat avec des transporteurs express spécialisés (World Express).

#### 1. Délais d'expédition et de livraison
- **Alger et environs :** 24 à 48 heures ouvrables.
- **Grandes villes du Nord (Oran, Constantine, Blida, Sétif, Annaba...) :** 48 à 72 heures.
- **Hauts Plateaux et Sud :** 3 à 5 jours ouvrables.
- Toutes les commandes passées avant 14h00 sont préparées et expédiées le jour même (sauf vendredi).

#### 2. Options de livraison & Tarifs
- **Livraison à domicile :** Le livreur vous contacte préalablement par téléphone pour convenir de l'heure exacte de livraison.
- **Livraison en point relais (Stop-Desk) :** Récupérez votre colis directement dans l'agence de livraison de votre choix avec un tarif préférentiel.
- Les frais de livraison sont calculés de manière transparente lors de la commande selon votre wilaya de résidence.

#### 3. Paiement à la livraison (Cash on Delivery)
Le paiement s'effectue en espèces (DZD) à la remise de votre commande. Vous pouvez vérifier l'état extérieur de votre colis avant paiement.`;

const DELIVERY_AR = `### الشحن والتوصيل في الجزائر
في **كريستال بيوتي (Crystal Beauty)**، نضمن لكم توصيل جميع طلبياتكم إلى كامل **58 ولاية** بالتعاون مع شركات توصيل سريعة وموثوقة (World Express).

#### 1. مواعيد وآجال التوصيل
- **الجزائر العاصمة وضواحيها:** من 24 إلى 48 ساعة عمل.
- **الولايات الشمالية الكبرى (وهران، قسنطينة، البليدة، سطيف، عنابة...):** من 48 إلى 72 ساعة.
- **ولايات الهضاب العليا والجنوب:** من 3 إلى 5 أيام عمل.
- يتم تجهيز وشحن كافة الطلبيات المؤكدة قبل الساعة 14:00 في نفس اليوم (ما عدا يوم الجمعة).

#### 2. خيارات التوصيل والأسعار
- **التوصيل إلى باب المنزل:** يتصل بكم عون التوصيل هاتفيًا لتحديد الوقت المناسب للتسليم.
- **التوصيل إلى المكتب (Stop-Desk):** استلام الطرد من أقرب مكتب شحن في بلديتكم بسعر مخفض.
- يتم احتساب تكلفة التوصيل بدقة وشفافية أثناء تأكيد الطلب حسب الولاية والبلدية.

#### 3. الدفع عند الاستلام (COD)
الدفع نقدًا بالدينار الجزائري مباشرة عند استلام الطلبية والتأكد منها.`;

const RETURNS_FR = `### Politique de Retour & Échange
Votre satisfaction est au cœur des engagements de **Crystal Beauty**.

#### 1. Conditions d'échange
- Vous disposez d'un délai de **48 heures** après réception de votre commande pour signaler un article endommagé, défectueux ou non conforme.
- L'article doit être dans son état d'origine, neuf, non utilisé et dans son emballage complet avec tous ses accessoires.

#### 2. Procédure simple et rapide
- Contactez notre service client via WhatsApp ou téléphone avec votre numéro de commande et une photo de l'article concerné.
- Notre équipe validera votre demande dans les plus brefs délais et organisera le retour ou l'échange.

#### 3. Frais de retour
- En cas de produit défectueux ou d'erreur de préparation de notre part, les frais de réexpédition sont **100% pris en charge** par Crystal Beauty.`;

const RETURNS_AR = `### سياسة الاستبدال والاسترجاع
رضاكم التام وثقتكم هي أولويتنا في **كريستال بيوتي (Crystal Beauty)**.

#### 1. شروط الاستبدال والاسترجاع
- يحق لكم طلب استبدال أو استرجاع المنتج خلال **48 ساعة** من تاريخ استلام الطلبية في حال وجود أي عيب مصنعي أو ضرر أثناء الشحن أو عدم تطابق.
- يجب أن يكون المنتج جديدًا بحالته الأصلية، غير مستعمل، وفي علبته وتغليفه الأصلي مع كامل الملحقات.

#### 2. طريقة تقديم الطلب
- تواصلوا مباشرة مع خدمة الزبائن عبر الواتساب أو الهاتف مع إرسال رقم الطلب وصورة واضحة للمنتج.
- يقوم فريقنا بتأكيد الطلب وتنظيم عملية التبديل في أسرع وقت.

#### 3. تكاليف الاستبدال
- في حال وجود عيب مصنعي أو خطأ في إرسال المنتج، تتكفل **Crystal Beauty** بكافة تكاليف الشحن مجانًا 100%.`;

const PRIVACY_FR = `### Protection de la Vie Privée & Confidentialité
La confidentialité et la sécurité de vos données personnelles sont primordiales pour **Crystal Beauty**.

#### 1. Données collectées
Nous collectons uniquement les informations indispensables à la gestion et à l'acheminement de vos commandes :
- Nom et prénom
- Numéro de téléphone mobile
- Wilaya, commune et adresse de livraison

#### 2. Usage de vos données
- Vos données sont exclusivement utilisées pour la confirmation téléphonique de votre commande et la livraison par le transporteur.
- Aucune donnée n'est cédée, louée ou vendue à des tiers. Vos informations restent strictement protégées et confidentielles.`;

const PRIVACY_AR = `### سياسة الخصوصية وحماية البيانات
نحن في **كريستال بيوتي (Crystal Beauty)** نلتزم بحماية خصوصية بياناتكم وأمانها التام.

#### 1. البيانات التي نجمعها
نجمع فقط المعلومات الضرورية لمعالجة وتوصيل طلبياتكم بنجاح:
- الاسم واللقب
- رقم الهاتف المحمول
- الولاية والبلدية وعنوان التسليم

#### 2. استخدام البيانات
- تُستخدم بياناتكم حصرًا لتأكيد الطلبيات عبر الهاتف أو الواتساب ولتمكين عون التوصيل من تسليمكم الطرد.
- لا نقوم بمشاركة أو بيع أو تأجير أي من بياناتكم الشخصية لأي طرف ثالث. معلوماتكم محمية وسرية تمامًا.`;

async function main() {
  console.log("Applying professional store settings to Crystal Beauty...");

  const patch = {
    storeName: "Crystal Beauty",
    tagline: "Boutique Beauté & Soins en Algérie",
    logoUrl: "/crystal-beauty-logo.jpg",
    primaryColor: "#0A1F44",
    accentColor: "#0A1F44",
    whatsappNumber: "0550123456",
    contactPhone: "0550 12 34 56",
    contactEmail: "contact@crystalbeauty.dz",
    contactAddress: "Alger Centre, Alger, Algérie",
    contactHours: "Samedi - Jeudi : 09h00 - 18h00",
    facebookUrl: "https://facebook.com/crystalbeauty.algerie",
    instagramUrl: "https://instagram.com/crystalbeautydz",
    tiktokUrl: "https://tiktok.com/@crystalbeautydz",
    announcementEnabled: true,
    announcementText: "Livraison express disponible sur 58 Wilayas · Paiement à la livraison (COD)",
    announcementTextAr: "توصيل سريع متوفر عبر 58 ولاية · الدفع عند الاستلام",
    announcementLink: "/products",
    canOpenParcel: true,
    policyDelivery: DELIVERY_FR,
    policyDeliveryAr: DELIVERY_AR,
    policyReturns: RETURNS_FR,
    policyReturnsAr: RETURNS_AR,
    policyPrivacy: PRIVACY_FR,
    policyPrivacyAr: PRIVACY_AR,
  };

  const updated = await saveSettings(patch);
  console.log("Successfully updated settings!");
  console.log("WhatsApp Number:", updated.whatsappNumber);
  console.log("Contact Phone:", updated.contactPhone);
  console.log("Policies configured: Delivery, Returns, Privacy (FR & AR)");
}

main()
  .catch((err) => {
    console.error("Error updating settings:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
