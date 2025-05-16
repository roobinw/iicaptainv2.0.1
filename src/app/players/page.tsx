
"use client";

// This page is deprecated. Player/Member management is now part of /team-settings.
// This file can be safely deleted if no longer directly linked.
// For now, it will render null or a simple message to avoid build errors.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Icons } from "@/components/icons"; // Keep for loading icon if needed

export default function DeprecatedPlayersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/team-settings"); // Redirect to the new members management location
      } else {
        router.replace("/login"); // Or landing page
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading...</p>
      </div>
    );
  }

  // Should ideally not reach here due to redirect
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Player Management Has Moved</h1>
      <p>Player and member management is now part of Team Settings.</p>
      <p>You will be redirected shortly...</p>
    </div>
  );
}
