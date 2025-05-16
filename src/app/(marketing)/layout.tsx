
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
// AuthProvider is removed from here as it's provided by the root layout (src/app/layout.tsx)
import type { Metadata } from 'next';

// This metadata will apply to pages within the (marketing) group,
// but the root landing page metadata is handled by src/app/layout.tsx.
export const metadata: Metadata = {
  title: "iiCaptain: Premier Sports Team Management & Organization Tool",
  description: "Discover iiCaptain - the leading sports team management software. Streamline scheduling, player rosters, attendance, and communication. Try for free!",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <> {/* AuthProvider removed from here, root layout handles it */}
      {children}
      {/* Toaster is already in root layout, can be removed here if not specifically needed for /marketing subpages */}
      {/* <Toaster /> */}
    </>
  );
}
