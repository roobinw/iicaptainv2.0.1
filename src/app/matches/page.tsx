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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/sortable-item';
import { addMatch, getMatches, updateMatch, deleteMatch, updateMatchesOrder } from "@/services/matchService";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

export default function MatchesPage() {
  const { user, isLoading: authLoading, currentTeam } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  // forceUpdateList can be removed if optimistic updates are sufficient or if specific state changes trigger re-renders.
  // For now, keeping it to ensure list re-fetches after mutations.
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchMatches = async (teamId: string) => {
    setIsLoadingData(true);
    try {
      const fetchedMatches = await getMatches(teamId);
      // Sorting is now handled by getMatches query by default (order, then date/time)
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
      // User not logged in, or no team context, AuthProvider should redirect. Clear data.
      setMatches([]);
      setIsLoadingData(false);
    }
     // Add forceUpdateCounter to dependencies to refetch when it changes
  }, [authLoading, user, currentTeam, forceUpdateCounter, toast]);


  useEffect(() => {
    // Open dialog if #add is in URL and user is admin
    if (typeof window !== 'undefined' && window.location.hash === "#add" && user?.role === "admin") {
      setIsAddMatchDialogOpen(true);
      setEditingMatch(null); 
      window.location.hash = ""; // Clear hash to prevent re-opening on refresh
    }
  }, [user?.role]); // Re-run when user role might change


  const handleAddMatch = async (data: Omit<Match, "id" | "attendance" | "order">) => {
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

  const handleUpdateMatch = async (data: Omit<Match, "id" | "attendance" | "order">) => {
    if (!editingMatch || !editingMatch.id || !user?.teamId) {
        toast({ title: "Error", description: "Cannot update match. Missing information.", variant: "destructive"});
        return;
    }
    try {
      // Ensure date is string "yyyy-MM-dd", other fields as is from form
      const updatePayload = { ...data, date: typeof data.date === 'string' ? data.date : (data.date as Date).toISOString().split('T')[0] };
      await updateMatch(user.teamId, editingMatch.id, updatePayload);
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

  async function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id && user?.teamId) {
      const oldIndex = matches.findIndex(item => item.id === active.id);
      const newIndex = matches.findIndex(item => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrderedMatches = arrayMove(matches, oldIndex, newIndex);
      setMatches(newOrderedMatches); // Optimistic UI update

      try {
        // Persist the new order to Firestore
        const orderUpdates = newOrderedMatches.map((match, index) => ({ id: match.id, order: index }));
        await updateMatchesOrder(user.teamId, orderUpdates);
        toast({ title: "Order Updated", description: "Match order saved." });
      } catch (error) {
        console.error("Error updating match order:", error);
        toast({ title: "Error", description: "Could not save match order.", variant: "destructive" });
        fetchMatches(user.teamId); // Revert optimistic update by refetching
      }
    }
  }
  
  const isAdmin = user?.role === "admin";

  if (authLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-1/2" />
            {isAdmin && <Skeleton className="h-10 w-32" />}
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-60 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!user || !user.teamId || !currentTeam) {
    // This state should ideally be handled by AuthProvider redirecting
    return <div className="flex h-full items-center justify-center"><p>Loading team data or redirecting...</p></div>;
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Match Schedule</h1>
          <p className="text-muted-foreground">
            View and manage matches for {currentTeam.name}. {isAdmin && "Drag to reorder."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isAddMatchDialogOpen} onOpenChange={(isOpen) => {
            setIsAddMatchDialogOpen(isOpen);
            if (!isOpen) setEditingMatch(null); // Reset editing state when dialog closes
          }}>
            <DialogTrigger asChild>
              <Button>
                <Icons.Add className="mr-2 h-4 w-4" /> Add Match
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
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
                initialData={editingMatch} // Pass null if not editing
                onClose={() => {
                  setIsAddMatchDialogOpen(false);
                  setEditingMatch(null);
                }}
              />
            </DialogContent>
          </Dialog>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} disabled={!isAdmin}>
          <SortableContext items={matches.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <SortableItem key={match.id} id={match.id} disabled={!isAdmin}>
                  <MatchCard 
                    match={match} 
                    onEdit={isAdmin ? handleEditMatch : undefined} 
                    onDelete={isAdmin ? handleDeleteMatch : undefined}
                    setForceUpdateList={setForceUpdateCounter} 
                  />
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
