
import type { ReactNode } from "react";

// This layout can be very simple, perhaps just ensuring AuthProvider wraps it if not at root.
// For now, it's minimal.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
