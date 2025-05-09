
import { AppLayout } from "@/components/layouts/AppLayout";
import type { ReactNode } from "react";

export default function TrainingsLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
