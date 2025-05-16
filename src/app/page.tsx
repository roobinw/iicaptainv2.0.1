
"use client";

import { useEffect, useState } // Keep useState for potential minimal client-side logic if needed later
from "react";
// import { useRouter, usePathname } from "next/navigation"; // Temporarily removed
import Link from "next/link";
// import { useAuth } from "@/lib/auth"; // Temporarily removed
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { motion } from 'framer-motion'; // Temporarily removed

// Metadata is now handled by src/app/layout.tsx

export default function LandingPage() {
  // const { user, isLoading } = useAuth(); // Temporarily removed
  // const router = useRouter(); // Temporarily removed
  // const pathname = usePathname(); // Temporarily removed
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Original useEffect logic temporarily removed
    // if (!isLoading) {
    //   if (user && user.teamId) {
    //     router.replace("/dashboard");
    //   } else if (user && !user.teamId) {
    //     if (pathname !== "/onboarding/create-team" && pathname !== "/login" && pathname !== "/signup") {
    //          router.replace("/onboarding/create-team");
    //     }
    //   }
    // }
  }, []); // Removed dependencies for now

  // const sectionVariants = { // Temporarily removed
  //   hidden: { opacity: 0, y: 50 },
  //   visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
  // };

  // const featureCardVariants = { // Temporarily removed
  //   hidden: { opacity: 0, scale: 0.9 },
  //   visible: (i: number) => ({
  //     opacity: 1,
  //     scale: 1,
  //     transition: {
  //       delay: i * 0.15,
  //       duration: 0.5,
  //       ease: "easeOut",
  //     },
  //   }),
  // };

  // const softwareApplicationSchema = { // Temporarily removed
  //   "@context": "https://schema.org",
  //   "@type": "SoftwareApplication",
  //   "name": "iiCaptain",
  //   "applicationCategory": "SportsTeamManagementApplication",
  //   "operatingSystem": "Web",
  //   "description": "iiCaptain is the ultimate platform to manage your sports team effortlessly. Schedule matches, track training, manage players, and conquer the league with our team organization software.",
  //   "offers": {
  //     "@type": "Offer",
  //     "price": "0",
  //     "priceCurrency": "USD"
  //   },
  //    "keywords": "sports team management, team organization app, coaching software, player scheduling, attendance tracker",
  //   "aggregateRating": {
  //     "@type": "AggregateRating",
  //     "ratingValue": "4.9",
  //     "reviewCount": "210"
  //   }
  // };

  // if (isLoading || (!isLoading && user && user.teamId)) { // Temporarily removed
  //   return (
  //     <div className="flex h-screen items-center justify-center bg-background">
  //       <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
  //       <p className="ml-4 text-lg text-foreground">Loading iiCaptain...</p>
  //     </div>
  //   );
  // }

  if (!isClient) {
    // Render a basic loading state or null during SSR/pre-hydration if needed
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-foreground">Loading Page...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* <script // Temporarily removed
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      /> */}
      <header // Kept header structure for basic layout test
        // initial={{ opacity: 0, y: -50 }}
        // animate={{ opacity: 1, y: 0 }}
        // transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 py-4 px-6 shadow-md bg-background/80 backdrop-blur-md"
      >
        <div className="container mx-auto flex items-center justify-between">
           <div
            // whileHover={{ scale: 1.05 }}
            // transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
                <Icons.TeamLogo className="h-8 w-8 text-primary" />
                <span className="text-foreground">iiCaptain</span>
            </Link>
          </div>
          <nav
            className="space-x-2 sm:space-x-4"
            // initial={{ opacity: 0 }}
            // animate={{ opacity: 1 }}
            // transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div  className="inline-block" /*whileHover={{ scale: 1.05, y: -2 }} transition={{ type: "spring", stiffness: 300 }}*/>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
            </div>
            <div  className="inline-block" /*whileHover={{ scale: 1.05, y: -2 }} transition={{ type: "spring", stiffness: 300 }}*/>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-12">
        <h1>Minimal Client Landing Page Test</h1>
        <p>If you see this, the basic client component rendering at the root is working.</p>
        <p>The AuthProvider is still in the root layout.</p>
        {/* All other sections temporarily removed for testing */}
      </main>

      <footer // Kept footer structure for basic layout test
        // variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="py-12 bg-background border-t border-border/20"
      >
        <div className="container mx-auto text-center text-muted-foreground">
             <div className="flex justify-center items-center gap-2 mb-4">
                <Icons.TeamLogo className="h-7 w-7 text-primary" />
                <span className="text-xl font-semibold text-foreground">iiCaptain</span>
            </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} iiCaptain. All rights reserved. Your trusted partner for sports team management.</p>
           <p className="text-xs mt-1">
            Built with passion for teams everywhere. Optimize your coaching and team operations.
          </p>
          <div className="mt-6 space-x-6">
            <Link href="/privacy-policy" className="text-xs hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-xs hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
