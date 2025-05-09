
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { mockTeam, mockMatches, mockTrainings, mockUsers } from "@/lib/mock-data";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null; // Or a loading spinner, AppLayout handles redirect
  }

  const upcomingMatches = mockMatches
    .filter(match => parseISO(match.date) >= new Date())
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 2);

  const upcomingTrainings = mockTrainings
    .filter(training => parseISO(training.date) >= new Date())
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 2);
    
  const totalPlayers = mockUsers.filter(u => u.role === 'player').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}!</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with {mockTeam.name}.
          </p>
        </div>
        { user.role === 'admin' && (
            <div className="flex gap-2">
                <Link href="/matches#add">
                    <Button variant="default">
                        <Icons.Add className="mr-2 h-4 w-4" /> Add Match
                    </Button>
                </Link>
                <Link href="/trainings#add">
                    <Button variant="default">
                        <Icons.Add className="mr-2 h-4 w-4" /> Add Training
                    </Button>
                </Link>
            </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Matches</CardTitle>
            <Icons.Matches className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Next match: {upcomingMatches.length > 0 ? `vs ${upcomingMatches[0].opponent} on ${format(parseISO(upcomingMatches[0].date), "MMM dd")}` : "None scheduled"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Trainings</CardTitle>
            <Icons.Trainings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTrainings.length}</div>
            <p className="text-xs text-muted-foreground">
               Next training: {upcomingTrainings.length > 0 ? `${format(parseISO(upcomingTrainings[0].date), "MMM dd")} at ${upcomingTrainings[0].location}` : "None scheduled"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Icons.Players className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              Active members in the team.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Icons.Matches className="h-5 w-5 text-primary" /> Next Matches</CardTitle>
            <CardDescription>Quick view of your team&apos;s next couple of games.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => (
                <div key={match.id} className="p-3 bg-secondary/50 rounded-lg">
                  <h3 className="font-semibold">vs {match.opponent}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(match.date), "EEEE, MMMM dd, yyyy")} at {match.time}
                  </p>
                  <p className="text-sm text-muted-foreground">Location: {match.location}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No upcoming matches scheduled.</p>
            )}
            <Link href="/matches">
              <Button variant="outline" className="w-full mt-2">View All Matches</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Icons.Trainings className="h-5 w-5 text-primary" /> Next Trainings</CardTitle>
            <CardDescription>Upcoming training sessions for the team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingTrainings.length > 0 ? (
              upcomingTrainings.map((training) => (
                <div key={training.id} className="p-3 bg-secondary/50 rounded-lg">
                  <h3 className="font-semibold">{training.location}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(training.date), "EEEE, MMMM dd, yyyy")} at {training.time}
                  </p>
                  {training.description && <p className="text-xs text-muted-foreground mt-1">{training.description}</p>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No upcoming trainings scheduled.</p>
            )}
            <Link href="/trainings">
              <Button variant="outline" className="w-full mt-2">View All Trainings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
