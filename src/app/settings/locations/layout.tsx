
import { AppLayout } from "@/components/layouts/AppLayout";
import { AuthProvider } from "@/lib/auth";
import type { ReactNode } from "react";

export default function LocationsSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  );
}
