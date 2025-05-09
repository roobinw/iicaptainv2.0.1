
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { MatchCard } from "@/components/match-card";
import { AddMatchForm } from "@/components/add-match-form";
import { mockMatches, addMockMatch } from "@/lib/mock-data";
import type { Match } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/sortable-item';

export default function MatchesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  // Used to force re-render of the list when attendance changes in a card
  const [forceUpdateList, setForceUpdateList] = useState(0); 

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Check for #add in URL to open dialog
    if (window.location.hash === "#add" && user?.role === "admin") {
      setIsAddMatchDialogOpen(true);
      setEditingMatch(null); // Ensure it's for adding new
      window.location.hash = ""; // Clear hash
    }
  }, [user?.role]);


  const handleAddMatch = (data: Omit<Match, "id" | "attendance">) => {
    const newMatch = addMockMatch(data); // This now updates the mockMatches array directly
    setMatches(prev => [...prev, newMatch].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    toast({ title: "Match Added", description: `Match against ${data.opponent} scheduled.` });
    setIsAddMatchDialogOpen(false);
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsAddMatchDialogOpen(true);
  };

  const handleUpdateMatch = (data: Omit<Match, "id" | "attendance">) => {
    if (!editingMatch) return;
    const updatedMatches = matches.map(m => 
      m.id === editingMatch.id ? { ...editingMatch, ...data, date: data.date.toString() } : m // Ensure date is string
    );
    setMatches(updatedMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    mockMatches.splice(0, mockMatches.length, ...updatedMatches); // Update the global mock data
    toast({ title: "Match Updated", description: `Match against ${data.opponent} updated.` });
    setIsAddMatchDialogOpen(false);
    setEditingMatch(null);
  };

  const handleDeleteMatch = (matchId: string) => {
    // Confirm before deleting
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    
    const updatedMatches = matches.filter(m => m.id !== matchId);
    setMatches(updatedMatches);
    mockMatches.splice(0, mockMatches.length, ...updatedMatches); // Update the global mock data
    toast({ title: "Match Deleted", description: "The match has been removed.", variant: "destructive" });
  };

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setMatches((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        mockMatches.splice(0, mockMatches.length, ...newOrder); // Update mock data order
        return newOrder;
      });
    }
  }
  
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Match Schedule</h1>
          <p className="text-muted-foreground">
            View and manage upcoming and past matches. {isAdmin && "Drag to reorder."}
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

      {matches.length === 0 ? (
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
