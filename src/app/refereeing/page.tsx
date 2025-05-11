
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { RefereeingAssignmentCard } from "@/components/refereeing-assignment-card"; 
import { AddRefereeingAssignmentForm } from "@/components/add-refereeing-assignment-form";
import type { RefereeingAssignment } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/sortable-item';
import { 
  addRefereeingAssignment, 
  getRefereeingAssignments, 
  updateRefereeingAssignment, 
  deleteRefereeingAssignment, 
  updateRefereeingAssignmentsOrder 
} from "@/services/refereeingService";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

export default function RefereeingPage() {
  const { user, isLoading: authLoading, currentTeam } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<RefereeingAssignment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddAssignmentDialogOpen, setIsAddAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<RefereeingAssignment | null>(null);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchAssignments = async (teamId: string) => {
    setIsLoadingData(true);
    try {
      const fetchedAssignments = await getRefereeingAssignments(teamId);
      setAssignments(fetchedAssignments);
    } catch (error) {
      console.error("Error fetching refereeing assignments:", error);
      toast({ title: "Error", description: "Could not fetch refereeing assignments.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };
  
  useEffect(() => {
    if (!authLoading && user && user.teamId && currentTeam) {
        fetchAssignments(user.teamId);
    } else if (!authLoading && (!user || !user.teamId || !currentTeam)) {
      setAssignments([]);
      setIsLoadingData(false);
    }
  }, [authLoading, user, currentTeam, forceUpdateCounter]);


  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === "#add" && user?.role === "admin") {
      setIsAddAssignmentDialogOpen(true);
      setEditingAssignment(null); 
      window.location.hash = ""; 
    }
  }, [user?.role]);


  const handleAddAssignment = async (data: Omit<RefereeingAssignment, "id" | "order">) => {
    if (!user?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    try {
      await addRefereeingAssignment(user.teamId, data);
      toast({ title: "Assignment Added", description: `Refereeing assignment for ${data.homeTeam} vs ${data.awayTeam} scheduled.` });
      setForceUpdateCounter(prev => prev + 1); 
      setIsAddAssignmentDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error adding assignment", description: error.message || "Could not add assignment.", variant: "destructive" });
    }
  };

  const handleEditAssignment = (assignment: RefereeingAssignment) => {
    setEditingAssignment(assignment);
    setIsAddAssignmentDialogOpen(true);
  };

  const handleUpdateAssignment = async (data: Omit<RefereeingAssignment, "id" | "order">) => {
    if (!editingAssignment || !editingAssignment.id || !user?.teamId) {
        toast({ title: "Error", description: "Cannot update assignment. Missing information.", variant: "destructive"});
        return;
    }
    try {
      await updateRefereeingAssignment(user.teamId, editingAssignment.id, data as Partial<Omit<RefereeingAssignment, 'id'>>);
      toast({ title: "Assignment Updated", description: `Assignment for ${data.homeTeam} vs ${data.awayTeam} updated.` });
      setForceUpdateCounter(prev => prev + 1);
      setIsAddAssignmentDialogOpen(false);
      setEditingAssignment(null);
    } catch (error: any) {
      toast({ title: "Error updating assignment", description: error.message || "Could not update assignment.", variant: "destructive" });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!user?.teamId) {
         toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    if (!window.confirm("Are you sure you want to delete this refereeing assignment?")) return;
    try {
      await deleteRefereeingAssignment(user.teamId, assignmentId);
      toast({ title: "Assignment Deleted", description: "The assignment has been removed.", variant: "destructive" });
      setForceUpdateCounter(prev => prev + 1);
    } catch (error: any) {
      toast({ title: "Error deleting assignment", description: error.message || "Could not delete assignment.", variant: "destructive" });
    }
  };

  async function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id && user?.teamId) {
      const oldIndex = assignments.findIndex(item => item.id === active.id);
      const newIndex = assignments.findIndex(item => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrderedAssignments = arrayMove(assignments, oldIndex, newIndex);
      setAssignments(newOrderedAssignments); 

      try {
        const orderUpdates = newOrderedAssignments.map((assignment, index) => ({ id: assignment.id, order: index }));
        await updateRefereeingAssignmentsOrder(user.teamId, orderUpdates);
        toast({ title: "Order Updated", description: "Assignment order saved." });
      } catch (error) {
        console.error("Error updating assignment order:", error);
        toast({ title: "Error", description: "Could not save assignment order.", variant: "destructive" });
        if (user?.teamId) fetchAssignments(user.teamId); 
      }
    }
  }
  
  const isAdmin = user?.role === "admin";

  if (authLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-1/2" />
            {isAdmin && <Skeleton className="h-10 w-44" />}
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-60 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!user || !user.teamId || !currentTeam) {
    return <div className="flex h-full items-center justify-center"><p>Loading team data or redirecting...</p></div>;
  }
  
  if (!isAdmin) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                <h1 className="text-3xl font-bold tracking-tight">Refereeing Assignments</h1>
                <p className="text-muted-foreground">
                    View refereeing assignments for {currentTeam.name}.
                </p>
                </div>
            </div>
             {assignments.length === 0 ? (
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>No Assignments Yet</CardTitle>
                        <CardDescription>There are no refereeing assignments scheduled for your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Icons.Refereeing className="w-16 h-16 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">It looks a bit empty here.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {assignments.map((assignment) => (
                    <RefereeingAssignmentCard 
                        key={assignment.id} 
                        assignment={assignment} 
                    />
                ))}
                </div>
            )}
        </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refereeing Assignments</h1>
          <p className="text-muted-foreground">
            Manage refereeing assignments for {currentTeam.name}. Drag to reorder.
          </p>
        </div>
        <Dialog open={isAddAssignmentDialogOpen} onOpenChange={(isOpen) => {
          setIsAddAssignmentDialogOpen(isOpen);
          if (!isOpen) setEditingAssignment(null); 
        }}>
          <DialogTrigger asChild>
            <Button>
              <Icons.Add className="mr-2 h-4 w-4" /> Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[450px] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? "Edit Assignment" : "Add New Assignment"}</DialogTitle>
              <DialogDescription>
                {editingAssignment 
                  ? `Update details for assignment: ${editingAssignment.homeTeam} vs ${editingAssignment.awayTeam} on ${format(parseISO(editingAssignment.date), "MMM dd, yyyy")}.`
                  : "Fill in the details for the new refereeing assignment."
                }
              </DialogDescription>
            </DialogHeader>
            <AddRefereeingAssignmentForm 
              onSubmit={editingAssignment ? handleUpdateAssignment : handleAddAssignment} 
              initialData={editingAssignment} 
              onClose={() => {
                setIsAddAssignmentDialogOpen(false);
                setEditingAssignment(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 ? (
         <Card className="col-span-full">
            <CardHeader>
                <CardTitle>No Assignments Yet</CardTitle>
                <CardDescription>
                There are no refereeing assignments scheduled for your team. Click 'Add Assignment' to get started.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icons.Refereeing className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        It looks a bit empty here.
                    </p>
                    <Button className="mt-4" onClick={() => { setEditingAssignment(null); setIsAddAssignmentDialogOpen(true);}}>
                        <Icons.Add className="mr-2 h-4 w-4" /> Add First Assignment
                    </Button>
                </div>
            </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} >
          <SortableContext items={assignments.map(a => a.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => (
                <SortableItem key={assignment.id} id={assignment.id} disabled={!isAdmin}>
                  <RefereeingAssignmentCard 
                    assignment={assignment} 
                    onEdit={isAdmin ? handleEditAssignment : undefined} 
                    onDelete={isAdmin ? handleDeleteAssignment : undefined}
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
