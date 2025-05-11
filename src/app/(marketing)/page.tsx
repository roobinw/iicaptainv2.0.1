
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons"; 
import Image from "next/image";
// Assuming the image is named 'landing-image.png' and placed in the src/app/(marketing) directory.
// If the name is different, please update the import path.
// For Next.js to correctly serve local images via the <Image> component,
// they are typically placed in the `public` directory and referenced like `/landing-image.png`.
// If the image MUST stay in `src/app/(marketing)`, it needs to be imported.
// Let's assume you've moved it to public/ for best practice or we'll import it.
// For this example, I will assume it's in public/landing-image.png
// If it's truly in src/app/(marketing), you would do:
// import landingImage from './landing-image.png'; // Update 'landing-image.png' to your actual image file name

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
      <header className="py-4 px-6 shadow-md sticky top-0 z-50 bg-background/90 backdrop-blur-lg">
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
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent leading-tight">
              Welcome to iiCaptain
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              The ultimate platform to manage your sports team effortlessly. Schedule matches, track training, manage players, and conquer the league!
            </p>
            <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
              <Link href="/signup" passHref>
                <Button size="xl" className="px-10 py-4 text-xl w-full sm:w-auto shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">Get Started Free</Button>
              </Link>
              <Link href="/login" passHref>
                <Button variant="outline" size="xl" className="px-10 py-4 text-xl w-full sm:w-auto hover:bg-primary/10 transition-colors duration-300">
                  I already have an account
                </Button>
              </Link>
            </div>
             <div className="mt-20 max-w-5xl mx-auto">
                {/* 
                  Assuming your image is named 'landing-hero.png' and you've placed it in the `public` directory.
                  Update '/landing-hero.png' if your image has a different name or path within `public`.
                  If your image is in `src/app/(marketing)/your-image.png`, you'd import it:
                  import localLandingImage from './your-image.png'; 
                  and use src={localLandingImage}
                */}
                <Image 
                    src="/landing-image.png" // IMPORTANT: Update this to your actual image file name in the public folder
                    alt="Team management illustration or sports team photo" 
                    width={1200} 
                    height={600}
                    className="rounded-xl shadow-2xl border-2 border-border/50"
                    priority
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28 bg-secondary/20">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-20">Why Choose <span className="text-primary">iiCaptain</span>?</h2>
            <div className="grid md:grid-cols-3 gap-10">
              <div className="p-8 bg-card rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="mb-6 flex justify-center">
                   <div className="p-4 bg-primary/10 rounded-full">
                      <Icons.Matches className="h-12 w-12 text-primary" />
                   </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-center">Schedule Management</h3>
                <p className="text-muted-foreground leading-relaxed text-center">
                  Easily create and manage match and training schedules. Keep everyone informed with automated reminders and clear views.
                </p>
              </div>
              <div className="p-8 bg-card rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="mb-6 flex justify-center">
                   <div className="p-4 bg-primary/10 rounded-full">
                     <Icons.Players className="h-12 w-12 text-primary" />
                   </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-center">Player Roster</h3>
                <p className="text-muted-foreground leading-relaxed text-center">
                  Maintain a comprehensive list of your team members with roles, contact details, and performance notes.
                </p>
              </div>
              <div className="p-8 bg-card rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                 <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Icons.Attendance className="h-12 w-12 text-primary" />
                    </div>
                 </div>
                <h3 className="text-2xl font-semibold mb-4 text-center">Attendance Tracking</h3>
                <p className="text-muted-foreground leading-relaxed text-center">
                  Mark attendance for matches and training sessions. Know who's available and track commitment effortlessly.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonial / Social Proof (Placeholder) */}
        <section className="py-20 md:py-28 bg-background">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-4xl sm:text-5xl font-bold mb-16">Loved by Teams Worldwide</h2>
                <div className="max-w-3xl mx-auto">
                    <div className="p-8 bg-card rounded-2xl shadow-2xl relative">
                        <Icons.TeamLogo className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 text-primary bg-card p-3 rounded-full border-4 border-background shadow-lg" />
                        <p className="text-xl italic text-foreground mt-8 mb-6 leading-relaxed">
                            "iiCaptain has revolutionized how we manage our team. Scheduling is a breeze, and communication has never been better!"
                        </p>
                        <footer className="font-semibold text-lg text-primary">- Coach Alex, The Roaring Lions</footer>
                    </div>
                </div>
            </div>
        </section>

         {/* Call to Action Section */}
        <section className="py-24 md:py-36 text-center bg-gradient-to-b from-background to-card">
            <div className="container mx-auto px-6">
                <h2 className="text-4xl sm:text-5xl font-bold mb-8 tracking-tight">Ready to Elevate Your Team?</h2>
                <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                    Join iiCaptain today and experience seamless team management. Spend less time organizing and more time winning.
                </p>
                <Link href="/signup" passHref>
                    <Button size="xl" className="px-12 py-5 text-xl shadow-xl hover:shadow-primary/60 transition-all duration-300 transform hover:scale-105">
                        Sign Up Now &amp; Conquer
                    </Button>
                </Link>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 bg-card border-t border-border/50">
        <div className="container mx-auto text-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2 text-2xl font-bold text-primary mb-6">
                <Icons.TeamLogo className="h-8 w-8" />
                <span>iiCaptain</span>
            </Link>
          <p className="text-muted-foreground mb-4">&copy; {new Date().getFullYear()} iiCaptain. All rights reserved.</p>
           <p className="text-sm text-muted-foreground/80 mt-1">
            Built with passion for teams everywhere.
          </p>
          <div className="mt-6 space-x-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


    