
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
import { addMatch, getMatches, updateMatch, deleteMatch, updateMatchesOrder } from "@/services/matchService"; // Added updateMatchesOrder
import { parseISO } from "date-fns";

export default function MatchesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [forceUpdateList, setForceUpdateList] = useState(0); 

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchMatches = async (teamId: string) => {
    setIsLoading(true);
    try {
      const fetchedMatches = await getMatches(teamId);
      fetchedMatches.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || new Date(a.date).getTime() - new Date(b.date).getTime());
      setMatches(fetchedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast({ title: "Error", description: "Could not fetch matches.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(!authLoading && user && user.teamId) {
        fetchMatches(user.teamId);
    } else if (!authLoading && !user) {
      // User not logged in, AuthProvider should redirect. Clear data or show message.
      setMatches([]);
      setIsLoading(false);
    }
  }, [authLoading, user, forceUpdateList]);


  useEffect(() => {
    if (window.location.hash === "#add" && user?.role === "admin") {
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
      setForceUpdateList(prev => prev + 1); 
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
    if (!editingMatch || !user?.teamId) {
        toast({ title: "Error", description: "Cannot update match. Missing information.", variant: "destructive"});
        return;
    }
    try {
      const updateData = { ...data, date: typeof data.date === 'string' ? data.date : (data.date as Date).toISOString().split('T')[0] };
      await updateMatch(user.teamId, editingMatch.id, updateData as Partial<Omit<Match, 'id'>>);
      toast({ title: "Match Updated", description: `Match against ${data.opponent} updated.` });
      setForceUpdateList(prev => prev + 1); 
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
      setForceUpdateList(prev => prev + 1); 
    } catch (error: any) {
      toast({ title: "Error deleting match", description: error.message || "Could not delete match.", variant: "destructive" });
    }
  };

  async function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id && user?.teamId) {
      const oldIndex = matches.findIndex(item => item.id === active.id);
      const newIndex = matches.findIndex(item => item.id === over.id);
      const newOrder = arrayMove(matches, oldIndex, newIndex);
      setMatches(newOrder); // Update UI immediately

      try {
        // Persist the new order to Firestore
        await updateMatchesOrder(user.teamId, newOrder.map((match, index) => ({ id: match.id, order: index })));
        toast({ title: "Order Updated", description: "Match order saved." });
      } catch (error) {
        console.error("Error updating match order:", error);
        toast({ title: "Error", description: "Could not save match order.", variant: "destructive" });
        // Optionally revert UI change or refetch
        fetchMatches(user.teamId); // Refetch to ensure consistency
      }
    }
  }
  
  const isAdmin = user?.role === "admin";

  if (isLoading || authLoading) {
    return <div className="flex h-full items-center justify-center"><p>Loading matches...</p></div>;
  }
  if (!user || !user.teamId) {
    return <div className="flex h-full items-center justify-center"><p>Please log in and ensure you are part of a team to view matches.</p></div>;
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Match Schedule</h1>
          <p className="text-muted-foreground">
            View and manage upcoming and past matches for your team. {isAdmin && "Drag to reorder."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isAddMatchDialogOpen} onOpenChange={(isOpen) => {
            setIsAddMatchDialogOpen(isOpen);
            if (!isOpen) setEditingMatch(null);
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
                  {editingMatch ? "Update the details for this match." : "Fill in the details for the new match."}
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
        )}
      </div>

      {matches.length === 0 && !isLoading ? (
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
                        <Button className="mt-4" onClick={() => setIsAddMatchDialogOpen(true)}>
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
                    onEdit={handleEditMatch} 
                    onDelete={handleDeleteMatch} 
                    setForceUpdateList={setForceUpdateList}
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
