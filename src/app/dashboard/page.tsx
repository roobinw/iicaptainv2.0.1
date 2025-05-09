
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format, parseISO, isAfter, isEqual } from "date-fns";
import { useEffect, useState } from "react";
import type { Match, Training, User } from "@/types";
import { getMatches } from "@/services/matchService";
import { getTrainings } from "@/services/trainingService";
import { getPlayers } from "@/services/userService"; // Assuming this fetches users with 'player' role
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<Training[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [teamName, setTeamName] = useState("Your Team"); // Placeholder, can be dynamic if stored
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (authIsLoading || !user) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const today = new Date();
        
        const allMatches = await getMatches();
        const futureMatches = allMatches
          .filter(match => {
            const matchDate = parseISO(match.date);
            return isAfter(matchDate, today) || isEqual(matchDate, today);
          })
          .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
          .slice(0, 2);
        setUpcomingMatches(futureMatches);

        const allTrainings = await getTrainings();
        const futureTrainings = allTrainings
          .filter(training => {
            const trainingDate = parseISO(training.date);
            return isAfter(trainingDate, today) || isEqual(trainingDate, today);
          })
          .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
          .slice(0, 2);
        setUpcomingTrainings(futureTrainings);
        
        const players = await getPlayers();
        setTotalPlayers(players.length);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Optionally set error state and display error message
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user, authIsLoading]);

  if (authIsLoading || isLoadingData) {
    // Skeleton loader for dashboard
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          { user?.role === 'admin' && (
            <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-36" />
            </div>
        )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      </div>
    );
  }
    
  if (!user) {
    return null; // AppLayout handles redirect if not logged in after loading
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}!</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with {teamName}.
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
              Next: {upcomingMatches.length > 0 ? `vs ${upcomingMatches[0].opponent} on ${format(parseISO(upcomingMatches[0].date), "MMM dd")}` : "None scheduled"}
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
               Next: {upcomingTrainings.length > 0 ? `${format(parseISO(upcomingTrainings[0].date), "MMM dd")} at ${upcomingTrainings[0].location}` : "None scheduled"}
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
              Active players in the team.
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
