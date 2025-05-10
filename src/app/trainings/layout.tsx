
import { AppLayout } from "@/components/layouts/AppLayout";
import { AuthProvider } from "@/lib/auth";
import type { ReactNode } from "react";

export default function TrainingsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  );
}
