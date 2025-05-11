
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 py-4 px-6 shadow-md bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Icons.TeamLogo className="h-8 w-8" />
            <span>iiCaptain</span>
          </Link>
          <nav className="space-x-2 sm:space-x-4">
            <Link href="/login" passHref>
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup" passHref>
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center bg-gradient-to-br from-background via-card to-background">
          <div className="container mx-auto px-6">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
              <span className="block">Effortless Team</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Management Starts Here</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Organize your sports team like a pro. Manage match schedules, track training sessions, oversee player rosters, and keep everyone in sync with iiCaptain.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-6">
              <Link href="/signup" passHref>
                <Button size="xl" className="px-10 py-4 text-lg w-full sm:w-auto shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">
                  Get Started Free
                </Button>
              </Link>
              <Link href="#features" passHref>
                <Button variant="outline" size="xl" className="px-10 py-4 text-lg w-full sm:w-auto hover:bg-accent/10 transition-colors duration-300">
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="mt-16 sm:mt-24 max-w-4xl mx-auto">
              <Image
                src="https://picsum.photos/seed/team-huddle/1200/600"
                alt="Sports team huddle"
                width={1200}
                height={600}
                className="rounded-xl shadow-2xl border-2 border-border/20"
                data-ai-hint="team sport"
                priority
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-card/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Everything Your Team Needs
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                iiCaptain provides a comprehensive suite of tools to streamline your team's operations and boost performance.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Icons.Matches, title: "Match Scheduling", description: "Plan and share upcoming matches with ease. Keep track of dates, times, opponents, and locations." },
                { icon: Icons.Trainings, title: "Training Coordination", description: "Organize training sessions, specify drills, and monitor team preparation effectively." },
                { icon: Icons.Players, title: "Player Roster Management", description: "Maintain a detailed list of all team members, including roles and contact information." },
                { icon: Icons.Attendance, title: "Attendance Tracking", description: "Effortlessly mark and view attendance for both matches and training sessions." },
              ].map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={feature.title} className="bg-background shadow-xl hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
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
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-6 text-center">
            <Icons.TeamLogo className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 tracking-tight">
              Trusted by Teams Like Yours
            </h2>
            <blockquote className="max-w-3xl mx-auto">
              <p className="text-xl md:text-2xl italic text-foreground leading-relaxed">
                "iiCaptain has transformed how we manage our club. Scheduling is now a breeze, communication is seamless, and our players are more engaged than ever. It's a game-changer!"
              </p>
              <footer className="mt-6">
                <p className="font-semibold text-lg text-primary">- Alex Ferguson, Coach at 'The Invincibles'</p>
                <p className="text-sm text-muted-foreground">Local League Champions 2023</p>
              </footer>
            </blockquote>
          </div>
        </section>

        {/* Secondary CTA Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-card to-background">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
              Ready to Elevate Your Team?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join hundreds of teams already experiencing the benefits of streamlined management with iiCaptain.
            </p>
            <Link href="/signup" passHref>
              <Button size="xl" className="px-12 py-5 text-xl shadow-xl hover:shadow-primary/60 transition-all duration-300 transform hover:scale-105">
                Sign Up & Conquer Today
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border/20">
        <div className="container mx-auto text-center text-muted-foreground">
          <div className="flex justify-center items-center gap-2 mb-4">
             <Icons.TeamLogo className="h-7 w-7 text-primary" />
             <span className="text-xl font-semibold text-foreground">iiCaptain</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} iiCaptain. All rights reserved.</p>
          <p className="text-xs mt-1">Built for the love of the game.</p>
          <div className="mt-4 space-x-4">
            {/* TODO: Link to actual privacy and terms pages */}
            <Link href="/privacy-policy" className="text-xs hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-xs hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
