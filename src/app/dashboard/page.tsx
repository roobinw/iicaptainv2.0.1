
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
import { getAllUsersByTeam } from "@/services/userService"; // Changed from getPlayersByTeam
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, currentTeam, isLoading: authIsLoading } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<Training[]>([]);
  const [totalTeamMembers, setTotalTeamMembers] = useState(0); // Renamed for clarity
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // Wait for auth context to resolve and ensure user & teamId are present
    if (authIsLoading || !user || !user.teamId || !currentTeam) {
      if (!authIsLoading && (!user || !user.teamId || !currentTeam )) {
        // If auth is done but essential info is missing, services can't be called.
        // AuthProvider should handle redirection in such cases.
        setIsLoadingData(false); 
      } else {
        setIsLoadingData(true); // Still waiting for auth or team context
      }
      return;
    }
    
    const teamId = user.teamId;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const today = new Date();
        
        const allMatches = await getMatches(teamId);
        const futureMatches = allMatches
          .filter(match => {
            const matchDate = parseISO(match.date);
            return isAfter(matchDate, today) || isEqual(matchDate, today);
          })
          // Sort by order first, then date if order is same or undefined
          .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || parseISO(a.date).getTime() - parseISO(b.date).getTime())
          .slice(0, 2);
        setUpcomingMatches(futureMatches);

        const allTrainings = await getTrainings(teamId);
        const futureTrainings = allTrainings
          .filter(training => {
            const trainingDate = parseISO(training.date);
            return isAfter(trainingDate, today) || isEqual(trainingDate, today);
          })
          .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || parseISO(a.date).getTime() - parseISO(b.date).getTime())
          .slice(0, 2);
        setUpcomingTrainings(futureTrainings);
        
        const teamMembers = await getAllUsersByTeam(teamId); // Changed to getAllUsersByTeam
        setTotalTeamMembers(teamMembers.length); // Updated state setter

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Optionally, show a toast to the user
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user, currentTeam, authIsLoading]); // Depend on user, currentTeam, and authIsLoading

  if (authIsLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          {/* Skeleton for admin buttons if role check is needed during loading */}
          <div className="flex gap-2">
              {/* <Skeleton className="h-10 w-32" /> */}
              {/* <Skeleton className="h-10 w-36" /> */}
          </div>
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
    
  // AuthProvider handles redirect if user, user.teamId, or currentTeam is missing after loading
  if (!user || !user.teamId || !currentTeam) {
    return (
         <div className="flex h-full items-center justify-center">
            <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Loading team data or redirecting...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}!</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with {currentTeam?.name || "your team"}.
          </p>
        </div>
        { user.role === 'admin' && (
            <div className="flex gap-2">
                {/* Add Training Button Removed */}
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
            <CardTitle className="text-sm font-medium">Total Members</CardTitle> 
            <Icons.Players className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active members in {currentTeam?.name || "the team"}.
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
                  {match.location && <p className="text-sm text-muted-foreground">Location: {match.location}</p>}
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

