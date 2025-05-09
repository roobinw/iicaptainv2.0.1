
import { AppLayout } from "@/components/layouts/AppLayout";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
