
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons"; 
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
// import type { Metadata } from 'next'; // Metadata type import removed

// Metadata export removed as this is a client component.
// Metadata for this page is now defined in src/app/(marketing)/layout.tsx

export default function MarketingLandingPage() { // Renamed component for clarity if it's distinct
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user && user.teamId) {
        router.replace("/dashboard");
      } else if (user && !user.teamId) {
        router.replace("/onboarding/create-team");
      }
    }
  }, [user, isLoading, router]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
  };

  const featureCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };
  
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "iiCaptain",
    "applicationCategory": "SportsTeamManagementApplication",
    "operatingSystem": "Web",
    "description": "iiCaptain is the ultimate platform to manage your sports team effortlessly. Schedule matches, track training, manage players, and conquer the league with our team organization software.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
     "keywords": "sports team management, team organization app, coaching software, player scheduling, attendance tracker",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9", 
      "reviewCount": "210" 
    }
  };


  if (isLoading || (!isLoading && user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading iiCaptain...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 py-4 px-6 shadow-md bg-background/80 backdrop-blur-md"
      >
        <div className="container mx-auto flex items-center justify-between">
           <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
                <Icons.TeamLogo className="h-8 w-8" />
                <span>iiCaptain</span>
            </Link>
          </motion.div>
          <motion.nav 
            className="space-x-2 sm:space-x-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.div  className="inline-block" whileHover={{ scale: 1.05, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
            </motion.div>
            <motion.div  className="inline-block" whileHover={{ scale: 1.05, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </motion.div>
          </motion.nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="flex-grow">
        <motion.section 
            variants={sectionVariants} initial="hidden" animate="visible" transition={{delay: 0.2}}
            className="py-20 md:py-32 text-center bg-gradient-to-br from-background via-card to-background"
        >
          <div className="container mx-auto px-6">
            
            <motion.h1 
              initial={{ opacity: 0, y:20 }} animate={{ opacity: 1, y:0 }} transition={{ delay: 0.4, duration: 0.5 }}
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent leading-tight"
            >
              Ultimate Sports Team Management Platform
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y:20 }} animate={{ opacity: 1, y:0 }} transition={{ delay: 0.6, duration: 0.5 }}
              className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto"
            >
              iiCaptain streamlines your sports team organization. Manage schedules, player rosters, track attendance, and enhance communication, all in one place.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y:20 }} animate={{ opacity: 1, y:0 }} transition={{ delay: 0.8, duration: 0.5 }}
              className="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-6"
            >
              <Link href="/signup" passHref>
                <Button size="xl" className="px-10 py-4 text-lg w-full sm:w-auto shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">Get Started Free</Button>
              </Link>
              <Link href="#features" passHref>
                <Button variant="outline" size="xl" className="px-10 py-4 text-lg w-full sm:w-auto hover:bg-accent/10 transition-colors duration-300">
                  Discover Features
                </Button>
              </Link>
            </motion.div>
             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, duration: 0.6 }}
                className="mt-16 sm:mt-24 max-w-4xl mx-auto"
             >
                <Image 
                    src="/screenshotwebappiicaptain.png" 
                    alt="iiCaptain app screenshot - showing sports team schedule and player management dashboard" 
                    width={1200} 
                    height={600} 
                    className="rounded-xl shadow-2xl border-2 border-border/20"
                    priority 
                    onError={(e) => (e.currentTarget.src = 'https://picsum.photos/1200/600?grayscale&blur=2')}
                    data-ai-hint="app dashboard screenshot"
                />
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section 
            id="features"
            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{delay: 0.3}}
            className="py-20 md:py-28 bg-card/50"
        >
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-bold text-center tracking-tight">Why Choose <span className="text-primary">iiCaptain</span> for Team Organization?</h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Our platform offers a complete suite of tools designed for efficient sports team management, helping you save time and focus on winning.
                </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Icons.Matches, title: "Match Scheduling", description: "Easily create and manage match schedules. Keep everyone informed with automated reminders and clear views of upcoming games." },
                { icon: Icons.Trainings, title: "Training Coordination", description: "Organize training sessions, specify drills, and monitor team preparation. Track attendance for optimal team readiness." },
                { icon: Icons.Players, title: "Player Roster Management", description: "Maintain a comprehensive list of your team members with roles, contact details, and performance notes. All in one secure place." },
                { icon: Icons.Attendance, title: "Attendance Tracking", description: "Mark attendance for matches and training sessions. Know who's available and track commitment effortlessly for better planning." },
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                 <motion.div key={feature.title} custom={index} variants={featureCardVariants} initial="hidden" whileInView="visible" viewport={{once: true, amount: 0.5}}>
                    <Card className="bg-background shadow-xl hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                      <CardHeader className="items-center text-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                           <IconComponent className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center text-muted-foreground flex-grow">
                        <p>{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
        
        {/* Testimonial / Social Proof (Placeholder) */}
        <motion.section 
            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{delay: 0.3}}
            className="py-20 md:py-28 bg-background"
        >
            <div className="container mx-auto px-6 text-center">
                 <Icons.TeamLogo className="h-16 w-16 text-primary mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-8 tracking-tight">Loved by Teams & Coaches Worldwide</h2>
                <blockquote className="max-w-3xl mx-auto">
                    <p className="text-xl md:text-2xl italic text-foreground leading-relaxed">
                        "iiCaptain has revolutionized how we manage our sports team. Scheduling is a breeze, communication has never been better, and our player attendance tracking is spot on!"
                    </p>
                    <footer className="mt-6">
                        <p className="font-semibold text-lg text-primary">- Coach Jane, The Roaring Lions FC</p>
                        <p className="text-sm text-muted-foreground">Youth League Champions 2024</p>
                    </footer>
                </blockquote>
            </div>
        </motion.section>

         {/* Call to Action Section */}
        <motion.section 
            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{delay: 0.3}}
            className="py-24 md:py-36 text-center bg-gradient-to-b from-background to-card"
        >
            <div className="container mx-auto px-6">
                <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">Ready to Elevate Your Team Organization?</h2>
                <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                    Join iiCaptain today and experience seamless sports team management. Spend less time organizing and more time focused on winning.
                </p>
                <Link href="/signup" passHref>
                    <Button size="xl" className="px-12 py-5 text-xl shadow-xl hover:shadow-primary/60 transition-all duration-300 transform hover:scale-105">
                        Sign Up Your Team Now
                    </Button>
                </Link>
            </div>
        </motion.section>
      </main>

      {/* Footer */}
      <motion.footer 
        variants={sectionVariants} initial="hidden" animate="visible" transition={{delay: 0.5}}
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
      </motion.footer>
    </div>
  );
}
    

