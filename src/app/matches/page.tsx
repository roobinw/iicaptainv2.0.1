
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
import { addMatch, getMatches, updateMatch, deleteMatch } from "@/services/matchService";
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

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const fetchedMatches = await getMatches();
      // Ensure matches are sorted by date on client-side after fetch if not guaranteed by service
      fetchedMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMatches(fetchedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast({ title: "Error", description: "Could not fetch matches.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(!authLoading) {
        fetchMatches();
    }
  }, [authLoading, forceUpdateList]);


  useEffect(() => {
    if (window.location.hash === "#add" && user?.role === "admin") {
      setIsAddMatchDialogOpen(true);
      setEditingMatch(null); 
      window.location.hash = ""; 
    }
  }, [user?.role]);


  const handleAddMatch = async (data: Omit<Match, "id" | "attendance">) => {
    try {
      await addMatch(data);
      toast({ title: "Match Added", description: `Match against ${data.opponent} scheduled.` });
      setForceUpdateList(prev => prev + 1); // Trigger refetch
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
    if (!editingMatch) return;
    try {
      // Ensure date is a string for Firestore update, forms handle Date object
      const updateData = { ...data, date: typeof data.date === 'string' ? data.date : (data.date as Date).toISOString().split('T')[0] };
      await updateMatch(editingMatch.id, updateData as Partial<Omit<Match, 'id'>>);
      toast({ title: "Match Updated", description: `Match against data.opponent updated.` });
      setForceUpdateList(prev => prev + 1); // Trigger refetch
      setIsAddMatchDialogOpen(false);
      setEditingMatch(null);
    } catch (error: any) {
      toast({ title: "Error updating match", description: error.message || "Could not update match.", variant: "destructive" });
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    try {
      await deleteMatch(matchId);
      toast({ title: "Match Deleted", description: "The match has been removed.", variant: "destructive" });
      setForceUpdateList(prev => prev + 1); // Trigger refetch
    } catch (error: any) {
      toast({ title: "Error deleting match", description: error.message || "Could not delete match.", variant: "destructive" });
    }
  };

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setMatches((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Note: Persisting DND order to Firestore requires an 'order' field and batch updates.
        // For now, this only reorders locally.
        // updateMatchesOrder(newOrder.map((match, index) => ({ id: match.id, order: index }))); // Example for Firestore persistence
        return newOrder;
      });
    }
  }
  
  const isAdmin = user?.role === "admin";

  if (isLoading || authLoading) {
    return <div className="flex h-full items-center justify-center"><p>Loading matches...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Match Schedule</h1>
          <p className="text-muted-foreground">
            View and manage upcoming and past matches. {isAdmin && "Drag to reorder (local view only)."}
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
                There are no matches scheduled. {isAdmin && "Click 'Add Match' to get started."}
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
                    setForceUpdateList={setForceUpdateList} // To re-render card if attendance changes
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
