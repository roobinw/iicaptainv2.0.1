
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format, parseISO, isAfter, isEqual } from "date-fns";
import { useEffect, useState, useCallback } from "react";
import type { Match, Training, User, RefereeingAssignment, Message } from "@/types";
import { getMatches } from "@/services/matchService";
import { getTrainings } from "@/services/trainingService";
import { getRefereeingAssignments } from "@/services/refereeingService";
// import { getAllUsersByTeam } from "@/services/userService"; // No longer directly needed here for player count
import { getMessages } from "@/services/messageService";
import { Skeleton } from "@/components/ui/skeleton";
// MessageInputForm removed
import { MessageCard } from "@/components/message-card";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, currentTeam, isLoading: authIsLoading } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<Training[]>([]);
  const [upcomingRefereeingAssignments, setUpcomingRefereeingAssignments] = useState<RefereeingAssignment[]>([]);
  
  const [latestMessage, setLatestMessage] = useState<Message | null>(null); 
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [totalUpcomingMatchesCount, setTotalUpcomingMatchesCount] = useState(0);
  const [totalUpcomingTrainingsCount, setTotalUpcomingTrainingsCount] = useState(0);
  const [totalUpcomingRefereeingAssignmentsCount, setTotalUpcomingRefereeingAssignmentsCount] = useState(0);


  const fetchDashboardData = useCallback(async (teamId: string) => {
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
      setUpcomingMatches(allFutureMatches.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime() || a.time.localeCompare(b.time)).slice(0, 1));

      const allTrainings = await getTrainings(teamId);
      const allFutureTrainings = allTrainings
        .filter(training => {
          const trainingDate = parseISO(training.date);
          return isAfter(trainingDate, today) || isEqual(trainingDate, today);
        });
      setTotalUpcomingTrainingsCount(allFutureTrainings.length);
      setUpcomingTrainings(allFutureTrainings.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime() || a.time.localeCompare(b.time)).slice(0, 1));

      const allRefereeingAssignments = await getRefereeingAssignments(teamId);
      const allFutureRefereeingAssignments = allRefereeingAssignments
        .filter(assignment => {
          const assignmentDate = parseISO(assignment.date);
          return isAfter(assignmentDate, today) || isEqual(assignmentDate, today);
        });
      setTotalUpcomingRefereeingAssignmentsCount(allFutureRefereeingAssignments.length);
      setUpcomingRefereeingAssignments(allFutureRefereeingAssignments.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime() || a.time.localeCompare(b.time)).slice(0, 1));
      
    } catch (error) {
      console.error("Error fetching dashboard event data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const fetchTeamMessages = useCallback(async (teamId: string) => {
    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await getMessages(teamId); // Already sorted by createdAt desc
      setLatestMessage(fetchedMessages.length > 0 ? fetchedMessages[0] : null);
    } catch (error) {
      console.error("Error fetching team messages:", error);
      setLatestMessage(null);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (authIsLoading || !user || !user.teamId || !currentTeam) {
      if (!authIsLoading && (!user || !user.teamId || !currentTeam )) {
        setIsLoadingData(false); 
        setIsLoadingMessages(false);
      } else {
        setIsLoadingData(true);
        setIsLoadingMessages(true);
      }
      return;
    }
    
    const teamId = user.teamId;
    fetchDashboardData(teamId);
    fetchTeamMessages(teamId);

  }, [user, currentTeam, authIsLoading, fetchDashboardData, fetchTeamMessages]);

  // handleMessagePosted is no longer needed on dashboard
  // const handleMessagePosted = useCallback(() => { ... });

  const handleMessageDeleted = useCallback(() => { // Refetches if the deleted message was the one displayed
    if (user?.teamId && latestMessage) {
      // Check if the deleted message ID matches the current latestMessage ID
      // This logic might need to be more robust if deletion happens elsewhere
      // For now, assume if a delete happens and this component is aware, it should refetch
      fetchTeamMessages(user.teamId);
    }
  }, [user?.teamId, fetchTeamMessages, latestMessage]);


  if (authIsLoading || isLoadingData || (!user && !currentTeam)) { 
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Skeleton for MessageInputForm removed */}
            <Skeleton className="h-16 w-full" /> {/* Skeleton for single message */}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icons.MessageSquare className="h-6 w-6 text-primary" /> Latest Team Message</CardTitle>
          <CardDescription>
            View the latest message from your team admin. New messages can be posted on the Messages page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* MessageInputForm removed from here */}
          {isLoadingMessages ? (
            <div className="space-y-3 py-2">
                <div className="flex items-start space-x-3 p-3 border rounded-md bg-card/50">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
            </div>
          ) : latestMessage ? (
            <MessageCard message={latestMessage} onMessageDeleted={handleMessageDeleted} />
          ) : (
            <p className="text-muted-foreground text-center py-4">No messages yet. {user?.role === 'admin' && 'Visit the Messages page to post the first message!'} </p>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
            <Link href="/messages" className="w-full">
              <Button variant="outline" className="w-full">
                <Icons.Archive className="mr-2 h-4 w-4" /> View All Messages
              </Button>
            </Link>
        </CardFooter>
      </Card>

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
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Icons.Matches className="h-5 w-5 text-primary" />
                <span className="truncate min-w-0">Next Match</span>
            </CardTitle>
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
             <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Icons.Trainings className="h-5 w-5 text-primary" />
                <span className="truncate min-w-0">Next Training</span>
            </CardTitle>
            <CardDescription>Your team&apos;s next training session.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <div className="space-y-4">
                {upcomingTrainings.length > 0 ? (
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <h3 className="font-semibold">{upcomingTrainings[0].location}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(upcomingTrainings[0].date), "EEEE, MMMM dd, yyyy")} at {upcomingTrainings[0].time}
                      </p>
                      {upcomingTrainings[0].description && <p className="text-xs text-muted-foreground mt-1">{upcomingTrainings[0].description}</p>}
                    </div>
                ) : (
                  <p className="text-muted-foreground">No upcoming trainings scheduled.</p>
                )}
              </div>
          </CardContent>
           <CardFooter className="mt-auto border-t pt-4">
            <Link href="/trainings" className="w-full">
              <Button variant="outline" className="w-full">View All Trainings</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-md flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Icons.Refereeing className="h-5 w-5 text-primary" />
                <span className="truncate min-w-0">Next Refereeing</span>
            </CardTitle>
            <CardDescription>Upcoming refereeing duties for the team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            {upcomingRefereeingAssignments.length > 0 ? (
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <h3 className="font-semibold">Assignment vs {upcomingRefereeingAssignments[0].homeTeam || 'TBD'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(upcomingRefereeingAssignments[0].date), "EEEE, MMMM dd, yyyy")} at {upcomingRefereeingAssignments[0].time}
                  </p>
                  {upcomingRefereeingAssignments[0].notes && <p className="text-xs text-muted-foreground mt-1">Notes: {upcomingRefereeingAssignments[0].notes}</p>}
                </div>
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

