
import { AuthProvider } from "@/lib/auth";
import type { ReactNode } from "react";

// This layout ensures that children (like create-team page) are rendered.
// AuthProvider is added here as it's removed from the root layout.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
        {children}
    </AuthProvider>
    );
}
