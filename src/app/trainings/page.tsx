
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { TrainingCard } from "@/components/training-card";
import { AddTrainingForm } from "@/components/add-training-form";
import type { Training } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/sortable-item';
import { addTraining, getTrainings, updateTraining, deleteTraining, updateTrainingsOrder } from "@/services/trainingService";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrainingsPage() {
  const { user, isLoading: authLoading, currentTeam } = useAuth();
  const { toast } = useToast();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddTrainingDialogOpen, setIsAddTrainingDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTrainings = async (teamId: string) => {
    setIsLoadingData(true);
    try {
      const fetchedTrainings = await getTrainings(teamId);
      setTrainings(fetchedTrainings);
    } catch (error) {
      console.error("Error fetching trainings:", error);
      toast({ title: "Error", description: "Could not fetch trainings.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.teamId && currentTeam) {
        fetchTrainings(user.teamId);
    } else if (!authLoading && (!user || !user.teamId || !currentTeam)) {
      setTrainings([]);
      setIsLoadingData(false);
    }
  }, [authLoading, user, currentTeam, forceUpdateCounter, toast]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === "#add" && user?.role === "admin") {
      setIsAddTrainingDialogOpen(true);
      setEditingTraining(null);
      window.location.hash = "";
    }
  }, [user?.role]);

  const handleAddTraining = async (data: Omit<Training, "id" | "attendance" | "order">) => {
     if (!user?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    try {
      await addTraining(user.teamId, data);
      toast({ title: "Training Added", description: `Training at ${data.location} scheduled.` });
      setForceUpdateCounter(prev => prev + 1);
      setIsAddTrainingDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error adding training", description: error.message || "Could not add training.", variant: "destructive" });
    }
  };

  const handleEditTraining = (training: Training) => {
    setEditingTraining(training);
    setIsAddTrainingDialogOpen(true);
  };

  const handleUpdateTraining = async (data: Omit<Training, "id" | "attendance" | "order">) => {
    if (!editingTraining || !editingTraining.id || !user?.teamId) {
      toast({ title: "Error", description: "Cannot update training. Missing information.", variant: "destructive"});
      return;
    }
    try {
      const updatePayload = { ...data, date: typeof data.date === 'string' ? data.date : (data.date as Date).toISOString().split('T')[0] };
      await updateTraining(user.teamId, editingTraining.id, updatePayload);
      toast({ title: "Training Updated", description: `Training at ${data.location} updated.` });
      setForceUpdateCounter(prev => prev + 1);
      setIsAddTrainingDialogOpen(false);
      setEditingTraining(null);
    } catch (error: any) {
      toast({ title: "Error updating training", description: error.message || "Could not update training.", variant: "destructive" });
    }
  };

  const handleDeleteTraining = async (trainingId: string) => {
    if (!user?.teamId) {
       toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
       return;
    }
    if (!window.confirm("Are you sure you want to delete this training session?")) return;
    try {
      await deleteTraining(user.teamId, trainingId);
      toast({ title: "Training Deleted", description: "The training session has been removed.", variant: "destructive" });
      setForceUpdateCounter(prev => prev + 1);
    } catch (error: any) {
      toast({ title: "Error deleting training", description: error.message || "Could not delete training.", variant: "destructive" });
    }
  };

  async function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id && user?.teamId) {
      const oldIndex = trainings.findIndex(item => item.id === active.id);
      const newIndex = trainings.findIndex(item => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrderedTrainings = arrayMove(trainings, oldIndex, newIndex);
      setTrainings(newOrderedTrainings);

      try {
        const orderUpdates = newOrderedTrainings.map((training, index) => ({ id: training.id, order: index }));
        await updateTrainingsOrder(user.teamId, orderUpdates);
        toast({ title: "Order Updated", description: "Training order saved." });
      } catch (error) {
        console.error("Error updating training order:", error);
        toast({ title: "Error", description: "Could not save training order.", variant: "destructive" });
        fetchTrainings(user.teamId); 
      }
    }
  }

  const isAdmin = user?.role === "admin";
  
  if (authLoading || isLoadingData) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-9 w-1/2" />
                {isAdmin && <Skeleton className="h-10 w-36" />}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Schedule</h1>
          <p className="text-muted-foreground">
            Plan and view trainings for {currentTeam.name}. {isAdmin && "Drag to reorder."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isAddTrainingDialogOpen} onOpenChange={(isOpen) => {
            setIsAddTrainingDialogOpen(isOpen);
            if (!isOpen) setEditingTraining(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Icons.Add className="mr-2 h-4 w-4" /> Add Training
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingTraining ? "Edit Training" : "Add New Training"}</DialogTitle>
                <DialogDescription>
                  {editingTraining ? "Update the details for this training session." : "Fill in the details for the new training session."}
                </DialogDescription>
              </DialogHeader>
              <AddTrainingForm 
                onSubmit={editingTraining ? handleUpdateTraining : handleAddTraining} 
                initialData={editingTraining}
                onClose={() => {
                  setIsAddTrainingDialogOpen(false);
                  setEditingTraining(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {trainings.length === 0 ? (
         <Card className="col-span-full">
            <CardHeader>
                <CardTitle>No Trainings Yet</CardTitle>
                <CardDescription>
                There are no training sessions scheduled for your team. {isAdmin && "Click 'Add Training' to get started."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icons.Trainings className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        Time to hit the pitch! But first, schedule a training.
                    </p>
                    {isAdmin && (
                        <Button className="mt-4" onClick={() => {setEditingTraining(null); setIsAddTrainingDialogOpen(true);}}>
                            <Icons.Add className="mr-2 h-4 w-4" /> Add First Training
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} disabled={!isAdmin}>
          <SortableContext items={trainings.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trainings.map((training) => (
                <SortableItem key={training.id} id={training.id} disabled={!isAdmin}>
                  <TrainingCard 
                    training={training} 
                    onEdit={isAdmin ? handleEditTraining : undefined} 
                    onDelete={isAdmin ? handleDeleteTraining : undefined}
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
