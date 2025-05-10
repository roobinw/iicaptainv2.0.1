
import type { ReactNode } from "react";
import { Icons } from "@/components/icons";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center">
        <Icons.TeamLogo />
        <h1 className="mt-4 text-3xl font-bold text-primary">iiCaptain</h1>
        <p className="text-muted-foreground">Your team, organized.</p>
      </div>
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg sm:p-8">
        {children}
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} iiCaptain. All rights reserved.
      </footer>
    </div>
  );
}
