"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Icons } from "@/components/icons";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user && user.teamId) { // User is authenticated and has a team
        router.replace("/dashboard");
      } else if (user && !user.teamId) { // User is authenticated but not yet onboarded with a team
        router.replace("/onboarding/create-team");
      } else { // No user (not authenticated)
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]); // user.teamId is part of the user object, so user dependency is sufficient

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Icons.Dashboard className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-foreground">Loading TeamEase...</p>
    </div>
  );
}
