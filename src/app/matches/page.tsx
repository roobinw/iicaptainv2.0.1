
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Added Tabs
import { Icons } from "@/components/icons";
import { MatchCard } from "@/components/match-card";
import { AddMatchForm } from "@/components/add-match-form";
import type { Match } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { addMatch, getMatches, updateMatch, deleteMatch, archiveMatch, unarchiveMatch, type EventArchiveFilter } from "@/services/matchService";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

export default function MatchesPage() {
  const { user, isLoading: authLoading, currentTeam } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchFilter, setMatchFilter] = useState<EventArchiveFilter>("active");

  const fetchMatches = useCallback(async (teamId: string, filter: EventArchiveFilter) => {
    setIsLoadingData(true);
    try {
      const fetchedMatches = await getMatches(teamId, filter);
      setMatches(fetchedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast({ title: "Error", description: "Could not fetch matches.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (!authLoading && user && user.teamId && currentTeam) {
        fetchMatches(user.teamId, matchFilter);
    } else if (!authLoading && (!user || !user.teamId || !currentTeam)) {
      setMatches([]);
      setIsLoadingData(false);
    }
  }, [authLoading, user, currentTeam, matchFilter, fetchMatches]);


  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === "#add" && user?.role === "admin") {
      setIsAddMatchDialogOpen(true);
      setEditingMatch(null); 
      window.location.hash = ""; 
    }
  }, [user?.role]);


  const handleAddMatch = async (data: Omit<Match, "id" | "attendance" | "isArchived">) => {
    if (!user?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    try {
      await addMatch(user.teamId, data);
      toast({ title: "Match Added", description: `Match against ${data.opponent} scheduled.` });
      setMatchFilter("active"); // Switch to active to see the new match
      if (matchFilter === "active") fetchMatches(user.teamId, "active"); // Refetch if already on active
      setIsAddMatchDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error adding match", description: error.message || "Could not add match.", variant: "destructive" });
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsAddMatchDialogOpen(true);
  };

  const handleUpdateMatch = async (data: Omit<Match, "id" | "attendance" | "isArchived">) => {
    if (!editingMatch || !editingMatch.id || !user?.teamId) {
        toast({ title: "Error", description: "Cannot update match. Missing information.", variant: "destructive"});
        return;
    }
    try {
      await updateMatch(user.teamId, editingMatch.id, data as Partial<Omit<Match, 'id'>>);
      toast({ title: "Match Updated", description: `Match against ${data.opponent} updated.` });
      fetchMatches(user.teamId, matchFilter); // Refetch current filter
      setIsAddMatchDialogOpen(false);
      setEditingMatch(null);
    } catch (error: any) {
      toast({ title: "Error updating match", description: error.message || "Could not update match.", variant: "destructive" });
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!user?.teamId) {
         toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    if (!window.confirm("Are you sure you want to delete this match? This action cannot be undone.")) return;
    try {
      await deleteMatch(user.teamId, matchId);
      toast({ title: "Match Deleted", description: "The match has been removed.", variant: "destructive" });
      setMatches(prev => prev.filter(m => m.id !== matchId)); // Optimistic UI update
    } catch (error: any) {
      toast({ title: "Error deleting match", description: error.message || "Could not delete match.", variant: "destructive" });
    }
  };

  const handleArchiveToggle = async (match: Match) => {
    if (!user?.teamId) return;
    try {
      if (match.isArchived) {
        await unarchiveMatch(user.teamId, match.id);
        toast({ title: "Match Unarchived" });
      } else {
        await archiveMatch(user.teamId, match.id);
        toast({ title: "Match Archived" });
      }
      fetchMatches(user.teamId, matchFilter); // Refetch current filter
    } catch (error: any) {
      toast({ title: "Error", description: `Could not ${match.isArchived ? 'unarchive' : 'archive'} match.`, variant: "destructive"});
    }
  };
  
  const isAdmin = user?.role === "admin";

  if (authLoading || isLoadingData && matches.length === 0) { // Show skeleton only if data is loading and no matches are present yet
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-1/2" />
            {isAdmin && <Skeleton className="h-10 w-32" />}
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-10 w-full mb-4" /> {/* Skeleton for Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-60 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!user || !user.teamId || !currentTeam) {
    return <div className="flex h-full items-center justify-center"><p>Loading team data or redirecting...</p></div>;
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Match Schedule</h1>
          <p className="text-muted-foreground">
            View and manage matches for {currentTeam.name}. Matches are sorted by date and time.
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={isAddMatchDialogOpen} onOpenChange={(isOpen) => {
              setIsAddMatchDialogOpen(isOpen);
              if (!isOpen) setEditingMatch(null); 
            }}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Icons.Add className="mr-2 h-4 w-4" /> Add Match
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingMatch ? "Edit Match" : "Add New Match"}</DialogTitle>
                  <DialogDescription>
                    {editingMatch 
                      ? `Update details for match vs ${editingMatch.opponent} on ${format(parseISO(editingMatch.date), "MMM dd, yyyy")}.`
                      : "Fill in the details for the new match."
                    }
                  </DialogDescription>
                </DialogHeader>
                <AddMatchForm 
                  onSubmit={editingMatch ? handleUpdateMatch : handleAddMatch} 
                  initialData={editingMatch} 
                  onClose={() => {
                    setIsAddMatchDialogOpen(false);
                    setEditingMatch(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Tabs value={matchFilter} onValueChange={(value) => setMatchFilter(value as EventArchiveFilter)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={matchFilter} className="mt-4">
          {isLoadingData ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <Skeleton key={i} className="h-60 w-full rounded-lg" />)}
            </div>
          ) : matches.length === 0 ? (
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>No Matches Found</CardTitle>
                    <CardDescription>
                    There are no {matchFilter !== "all" ? matchFilter : ""} matches for your team. 
                    {isAdmin && matchFilter === "active" && " Click 'Add Match' to get started."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Icons.Matches className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            It looks a bit empty here.
                        </p>
                        {isAdmin && matchFilter === "active" && (
                            <Button className="mt-4" onClick={() => { setEditingMatch(null); setIsAddMatchDialogOpen(true);}}>
                                <Icons.Add className="mr-2 h-4 w-4" /> Add First Match
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <MatchCard 
                  key={match.id}
                  match={match} 
                  onEdit={isAdmin ? handleEditMatch : undefined} 
                  onDelete={isAdmin ? handleDeleteMatch : undefined}
                  onArchiveToggle={isAdmin ? handleArchiveToggle : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
