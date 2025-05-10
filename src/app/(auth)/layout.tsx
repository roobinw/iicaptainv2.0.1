
import { AuthProvider } from "@/lib/auth";
import type { ReactNode } from "react";

export default function AuthPagesLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
