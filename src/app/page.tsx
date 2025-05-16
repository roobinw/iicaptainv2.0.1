
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
// import Image from "next/image";
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { motion } from 'framer-motion';
// import type { Metadata } from 'next'; // Metadata will be handled by root layout

// export const metadata: Metadata = { // Moved to src/app/layout.tsx
//   title: "iiCaptain | Sports Team Management Software for Easy Organization",
//   description: "Organize your sports team effortlessly with iiCaptain. Manage match schedules, training, player rosters, and attendance. Sign up free!",
//   keywords: "sports team management, team organization app, iiCaptain, schedule management, player roster, attendance tracking, sports app, team manager, coaching tool",
// };

export default function LandingPage() {
  const { user, isLoading, login } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading Landing Page...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground p-4">
      <Icons.TeamLogo className="h-16 w-16 text-primary mb-4" />
      <h1 className="text-4xl font-bold mb-2 text-center">Welcome to iiCaptain!</h1>
      <p className="text-lg text-muted-foreground mb-6 text-center">Simplified Landing Page Test</p>
      
      {user ? (
        <div>
          <p className="text-center text-xl">Welcome back, {user.name}!</p>
          <Link href="/dashboard" passHref>
            <Button className="mt-4">Go to Dashboard</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login" passHref>
            <Button>Login</Button>
          </Link>
          <Link href="/signup" passHref>
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      )}

      <footer className="absolute bottom-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} iiCaptain. Minimal Test View.
      </footer>
    </div>
  );
}
