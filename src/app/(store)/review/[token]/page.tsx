import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getLang } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import ReviewForm from "@/components/store/review-form";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lang = await getLang();

  const review = await db.review.findUnique({
    where: { token },
    include: { order: { include: { items: true } } },
  });

  // Invalid or already-used link
  if (!review || review.submitted) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
      <div className="rounded-[2rem] border border-border bg-white shadow-luxe p-6 sm:p-10">
        <h1 className="font-display text-3xl font-semibold text-[var(--primary)]">{t("reviewTitle", lang)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("reviewSubtitle", lang)} — <span className="font-medium" dir="ltr">{review.order.orderNumber}</span>
        </p>
        <div className="mt-4 space-y-2">
          {review.order.items.map((i, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
              {i.productImage ? <img src={i.productImage} alt={i.productName} className="h-10 w-10 rounded-lg object-cover" /> : null}
              <span>
                {i.productName} ×{i.quantity}
              </span>
            </div>
          ))}
        </div>
        <ReviewForm token={review.token} />
      </div>
    </div>
  );
}
