import ReviewsManager from "@/components/admin/reviews-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Avis clients" };

export default function AdminReviewsPage() {
  return <ReviewsManager />;
}
