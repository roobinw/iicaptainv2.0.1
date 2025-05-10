
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons"; 
import Image from "next/image";

export default function LandingPage() {
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
      {/* Header */}
      <header className="py-4 px-6 shadow-md sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Icons.TeamLogo className="h-8 w-8" />
            <span>iiCaptain</span>
          </Link>
          <nav className="space-x-2 sm:space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="py-20 md:py-32 text-center bg-gradient-to-br from-card via-background to-background">
          <div className="container mx-auto px-6">
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Welcome to iiCaptain
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              The ultimate platform to manage your sports team effortlessly. Schedule matches, track training, manage players, and conquer the league!
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/signup">
                <Button size="lg" className="px-8 py-3 text-lg w-full sm:w-auto shadow-lg hover:shadow-primary/50 transition-shadow">Get Started Free</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="px-8 py-3 text-lg w-full sm:w-auto">
                  I already have an account
                </Button>
              </Link>
            </div>
             <div className="mt-16 max-w-4xl mx-auto">
                <Image 
                    src="https://picsum.photos/seed/appdashboard/1200/600" 
                    alt="iiCaptain Dashboard Mockup" 
                    width={1200} 
                    height={600}
                    className="rounded-lg shadow-2xl border border-border"
                    data-ai-hint="app dashboard"
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Why Choose <span className="text-primary">iiCaptain</span>?</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-8 bg-card rounded-xl shadow-xl hover:shadow-2xl transition-shadow transform hover:-translate-y-1">
                <Icons.Matches className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Schedule Management</h3>
                <p className="text-muted-foreground">
                  Easily create and manage match and training schedules. Keep everyone informed with automated reminders and clear views.
                </p>
              </div>
              <div className="p-8 bg-card rounded-xl shadow-xl hover:shadow-2xl transition-shadow transform hover:-translate-y-1">
                <Icons.Players className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Player Roster</h3>
                <p className="text-muted-foreground">
                  Maintain a comprehensive list of your team members with roles, contact details, and performance notes.
                </p>
              </div>
              <div className="p-8 bg-card rounded-xl shadow-xl hover:shadow-2xl transition-shadow transform hover:-translate-y-1">
                <Icons.Attendance className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Attendance Tracking</h3>
                <p className="text-muted-foreground">
                  Mark attendance for matches and training sessions. Know who's available and track commitment effortlessly.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonial / Social Proof (Placeholder) */}
        <section className="py-16 bg-card">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-12">Loved by Teams Worldwide</h2>
                <div className="max-w-3xl mx-auto">
                    <blockquote className="p-6 bg-background rounded-xl shadow-lg">
                        <p className="text-lg italic text-muted-foreground mb-4">
                            "iiCaptain has revolutionized how we manage our team. Scheduling is a breeze, and communication has never been better!"
                        </p>
                        <footer className="font-semibold text-primary">- Coach Alex, The Roaring Lions</footer>
                    </blockquote>
                </div>
            </div>
        </section>

         {/* Call to Action Section */}
        <section className="py-20 md:py-32 text-center bg-background">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Elevate Your Team?</h2>
                <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
                    Join iiCaptain today and experience seamless team management. Spend less time organizing and more time winning.
                </p>
                <Link href="/signup">
                    <Button size="lg" className="px-10 py-4 text-xl shadow-lg hover:shadow-primary/50 transition-shadow">
                        Sign Up Now &amp; Conquer
                    </Button>
                </Link>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto text-center">
            <Link href="/" className="flex items-center justify-center gap-2 text-xl font-bold text-primary mb-4">
                <Icons.TeamLogo className="h-7 w-7" />
                <span>iiCaptain</span>
            </Link>
          <p className="text-muted-foreground">&copy; {new Date().getFullYear()} iiCaptain. All rights reserved.</p>
           <p className="text-sm text-muted-foreground/80 mt-2">
            Built with passion for teams everywhere.
          </p>
          <div className="mt-4 space-x-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
