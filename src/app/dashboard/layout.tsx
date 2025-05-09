
import { AppLayout } from "@/components/layouts/AppLayout";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
