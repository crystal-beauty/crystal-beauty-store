import { Suspense } from "react";
import StoreHeader from "@/components/store/header";
import StoreFooter from "@/components/store/footer";
import PixelPageView from "@/components/store/pixel-page-view";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Suspense fallback={null}>
        <PixelPageView />
      </Suspense>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
