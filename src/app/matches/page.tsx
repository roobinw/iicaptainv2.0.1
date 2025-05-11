
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { MatchCard } from "@/components/match-card";
import { AddMatchForm } from "@/components/add-match-form";
import type { Match } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
// DND related imports removed
// import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
// import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
// import { SortableItem } from '@/components/sortable-item';
import { addMatch, getMatches, updateMatch, deleteMatch } from "@/services/matchService"; // updateMatchesOrder removed
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

export default function MatchesPage() {
  const { user, isLoading: authLoading, currentTeam } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);

  // DND sensors removed
  // const sensors = useSensors(...);

  const fetchMatches = async (teamId: string) => {
    setIsLoadingData(true);
    try {
      const fetchedMatches = await getMatches(teamId); // Will be sorted by date/time from service
      setMatches(fetchedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast({ title: "Error", description: "Could not fetch matches.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };
  
  useEffect(() => {
    if (!authLoading && user && user.teamId && currentTeam) {
        fetchMatches(user.teamId);
    } else if (!authLoading && (!user || !user.teamId || !currentTeam)) {
      setMatches([]);
      setIsLoadingData(false);
    }
  }, [authLoading, user, currentTeam, forceUpdateCounter]);


  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === "#add" && user?.role === "admin") {
      setIsAddMatchDialogOpen(true);
      setEditingMatch(null); 
      window.location.hash = ""; 
    }
  }, [user?.role]);


  const handleAddMatch = async (data: Omit<Match, "id" | "attendance">) => {
    if (!user?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    try {
      await addMatch(user.teamId, data);
      toast({ title: "Match Added", description: `Match against ${data.opponent} scheduled.` });
      setForceUpdateCounter(prev => prev + 1); 
      setIsAddMatchDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error adding match", description: error.message || "Could not add match.", variant: "destructive" });
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsAddMatchDialogOpen(true);
  };

  const handleUpdateMatch = async (data: Omit<Match, "id" | "attendance">) => {
    if (!editingMatch || !editingMatch.id || !user?.teamId) {
        toast({ title: "Error", description: "Cannot update match. Missing information.", variant: "destructive"});
        return;
    }
    try {
      await updateMatch(user.teamId, editingMatch.id, data as Partial<Omit<Match, 'id'>>);
      toast({ title: "Match Updated", description: `Match against ${data.opponent} updated.` });
      setForceUpdateCounter(prev => prev + 1);
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
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    try {
      await deleteMatch(user.teamId, matchId);
      toast({ title: "Match Deleted", description: "The match has been removed.", variant: "destructive" });
      setForceUpdateCounter(prev => prev + 1);
    } catch (error: any) {
      toast({ title: "Error deleting match", description: error.message || "Could not delete match.", variant: "destructive" });
    }
  };

  // handleDragEnd function removed
  // async function handleDragEnd(event: DragEndEvent) { ... }
  
  const isAdmin = user?.role === "admin";

  if (authLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-1/2" />
            {isAdmin && <Skeleton className="h-10 w-32" />}
        </div>
        <Skeleton className="h-5 w-3/4" />
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

      {matches.length === 0 ? (
         <Card className="col-span-full">
            <CardHeader>
                <CardTitle>No Matches Yet</CardTitle>
                <CardDescription>
                There are no matches scheduled for your team. {isAdmin && "Click 'Add Match' to get started."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icons.Matches className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        It looks a bit empty here.
                    </p>
                    {isAdmin && (
                        <Button className="mt-4" onClick={() => { setEditingMatch(null); setIsAddMatchDialogOpen(true);}}>
                            <Icons.Add className="mr-2 h-4 w-4" /> Add First Match
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
      ) : (
        // DndContext and SortableContext removed
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            // SortableItem removed, directly rendering MatchCard
            <MatchCard 
              key={match.id}
              match={match} 
              onEdit={isAdmin ? handleEditMatch : undefined} 
              onDelete={isAdmin ? handleDeleteMatch : undefined}
              // dndListeners removed
            />
          ))}
        </div>
      )}
    </div>
  );
}
