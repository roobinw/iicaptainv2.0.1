
import type { ReactNode } from "react";

// This layout ensures that children (like create-team page) are rendered.
// AuthProvider is already at the root, so no need to wrap it here again.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
