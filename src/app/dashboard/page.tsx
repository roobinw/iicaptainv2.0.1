
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format, parseISO, isAfter, isEqual } from "date-fns";
import { useEffect, useState } from "react";
import type { Match, Training, User, RefereeingAssignment } from "@/types";
import { getMatches } from "@/services/matchService";
import { getTrainings } from "@/services/trainingService";
import { getRefereeingAssignments } from "@/services/refereeingService";
import { getAllUsersByTeam } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardPage() {
  const { user, currentTeam, isLoading: authIsLoading } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<Training[]>([]);
  const [upcomingRefereeingAssignments, setUpcomingRefereeingAssignments] = useState<RefereeingAssignment[]>([]);
  const [totalTeamMembers, setTotalTeamMembers] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [totalUpcomingMatchesCount, setTotalUpcomingMatchesCount] = useState(0);
  const [totalUpcomingTrainingsCount, setTotalUpcomingTrainingsCount] = useState(0);
  const [totalUpcomingRefereeingAssignmentsCount, setTotalUpcomingRefereeingAssignmentsCount] = useState(0);


  useEffect(() => {
    if (authIsLoading || !user || !user.teamId || !currentTeam) {
      if (!authIsLoading && (!user || !user.teamId || !currentTeam )) {
        setIsLoadingData(false); 
      } else {
        setIsLoadingData(true);
      }
      return;
    }
    
    const teamId = user.teamId;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const allMatches = await getMatches(teamId);
        const allFutureMatches = allMatches
          .filter(match => {
            const matchDate = parseISO(match.date);
            return isAfter(matchDate, today) || isEqual(matchDate, today);
          });
        setTotalUpcomingMatchesCount(allFutureMatches.length);
        // Display only the next match on the dashboard card
        setUpcomingMatches(allFutureMatches.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || parseISO(a.date).getTime() - parseISO(b.date).getTime()).slice(0, 1));

        const allTrainings = await getTrainings(teamId);
        const allFutureTrainings = allTrainings
          .filter(training => {
            const trainingDate = parseISO(training.date);
            return isAfter(trainingDate, today) || isEqual(trainingDate, today);
          });
        setTotalUpcomingTrainingsCount(allFutureTrainings.length);
        // Display ALL upcoming trainings on the dashboard card (up to a reasonable limit for UI, e.g. 5, then scroll)
        setUpcomingTrainings(allFutureTrainings.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || parseISO(a.date).getTime() - parseISO(b.date).getTime()));

        const allRefereeingAssignments = await getRefereeingAssignments(teamId);
        const allFutureRefereeingAssignments = allRefereeingAssignments
          .filter(assignment => {
            const assignmentDate = parseISO(assignment.date);
            return isAfter(assignmentDate, today) || isEqual(assignmentDate, today);
          });
        setTotalUpcomingRefereeingAssignmentsCount(allFutureRefereeingAssignments.length);
        // Display only the next 2 refereeing assignments on the dashboard card
        setUpcomingRefereeingAssignments(allFutureRefereeingAssignments.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || parseISO(a.date).getTime() - parseISO(b.date).getTime()).slice(0, 2));
        
        const teamMembers = await getAllUsersByTeam(teamId);
        setTotalTeamMembers(teamMembers.length);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user, currentTeam, authIsLoading]);

  if (authIsLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
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
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      </div>
    );
  }
    
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Matches</CardTitle>
            <Icons.Matches className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUpcomingMatchesCount}</div>
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
            <div className="text-2xl font-bold">{totalUpcomingTrainingsCount}</div>
            <p className="text-xs text-muted-foreground">
               Next: {upcomingTrainings.length > 0 ? `${format(parseISO(upcomingTrainings[0].date), "MMM dd")} at ${upcomingTrainings[0].location}` : "None scheduled"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Refereeing</CardTitle>
            <Icons.Refereeing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUpcomingRefereeingAssignmentsCount}</div>
            <p className="text-xs text-muted-foreground">
              Next: {upcomingRefereeingAssignments.length > 0 ? `${format(parseISO(upcomingRefereeingAssignments[0].date), "MMM dd")} at ${upcomingRefereeingAssignments[0].time}` : "None scheduled"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="shadow-md flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Icons.Matches className="h-5 w-5 text-primary" /> Next Match</CardTitle>
            <CardDescription>Quick view of your team&apos;s next game.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            {upcomingMatches.length > 0 ? (
              <div className="p-3 bg-secondary/50 rounded-lg">
                <h3 className="font-semibold">vs {upcomingMatches[0].opponent}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(upcomingMatches[0].date), "EEEE, MMMM dd, yyyy")} at {upcomingMatches[0].time}
                </p>
                {upcomingMatches[0].location && <p className="text-sm text-muted-foreground">Location: {upcomingMatches[0].location}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming matches scheduled.</p>
            )}
          </CardContent>
          <CardFooter className="mt-auto border-t pt-4">
            <Link href="/matches" className="w-full">
              <Button variant="outline" className="w-full">View All Matches</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-md flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Icons.Trainings className="h-5 w-5 text-primary" /> Next Trainings</CardTitle>
            <CardDescription>Upcoming training sessions for the team.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ScrollArea className="h-[200px] pr-3"> {/* Adjust height as needed */}
              <div className="space-y-4">
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
              </div>
            </ScrollArea>
          </CardContent>
           <CardFooter className="mt-auto border-t pt-4">
            <Link href="/trainings" className="w-full">
              <Button variant="outline" className="w-full">View All Trainings</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-md flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Icons.Refereeing className="h-5 w-5 text-primary" /> Next Refereeing</CardTitle>
            <CardDescription>Upcoming refereeing duties for the team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            {upcomingRefereeingAssignments.length > 0 ? (
              upcomingRefereeingAssignments.map((assignment) => (
                <div key={assignment.id} className="p-3 bg-secondary/50 rounded-lg">
                  <h3 className="font-semibold">Assignment</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(assignment.date), "EEEE, MMMM dd, yyyy")} at {assignment.time}
                  </p>
                  {assignment.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {assignment.notes}</p>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No upcoming refereeing assignments.</p>
            )}
          </CardContent>
          <CardFooter className="mt-auto border-t pt-4">
            <Link href="/refereeing" className="w-full">
              <Button variant="outline" className="w-full">View All Assignments</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


    
