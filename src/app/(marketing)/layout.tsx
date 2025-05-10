
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster"; // Keep toaster for potential messages
import { AuthProvider } from "@/lib/auth"; // AuthProvider is needed for the redirect logic on landing page

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider> {/* AuthProvider is needed for useAuth hook on the landing page itself */}
      {children}
      <Toaster />
    </AuthProvider>
  );
}
