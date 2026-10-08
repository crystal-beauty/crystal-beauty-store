import { Suspense } from "react";
import TrackView from "@/components/store/track-view";

export const metadata = { title: "Track Your Order" };

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackView />
    </Suspense>
  );
}
