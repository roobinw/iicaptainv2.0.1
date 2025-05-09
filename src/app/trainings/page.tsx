
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
import { addTraining, getTrainings, updateTraining, deleteTraining } from "@/services/trainingService";
import { parseISO } from "date-fns";

export default function TrainingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTrainingDialogOpen, setIsAddTrainingDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [forceUpdateList, setForceUpdateList] = useState(0); 

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTrainings = async () => {
    setIsLoading(true);
    try {
      const fetchedTrainings = await getTrainings();
      fetchedTrainings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setTrainings(fetchedTrainings);
    } catch (error) {
      console.error("Error fetching trainings:", error);
      toast({ title: "Error", description: "Could not fetch trainings.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(!authLoading) {
        fetchTrainings();
    }
  }, [authLoading, forceUpdateList]);

  useEffect(() => {
    if (window.location.hash === "#add" && user?.role === "admin") {
      setIsAddTrainingDialogOpen(true);
      setEditingTraining(null);
      window.location.hash = "";
    }
  }, [user?.role]);

  const handleAddTraining = async (data: Omit<Training, "id" | "attendance">) => {
    try {
      await addTraining(data);
      toast({ title: "Training Added", description: `Training at ${data.location} scheduled.` });
      setForceUpdateList(prev => prev + 1);
      setIsAddTrainingDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error adding training", description: error.message || "Could not add training.", variant: "destructive" });
    }
  };

  const handleEditTraining = (training: Training) => {
    setEditingTraining(training);
    setIsAddTrainingDialogOpen(true);
  };

  const handleUpdateTraining = async (data: Omit<Training, "id" | "attendance">) => {
    if (!editingTraining) return;
    try {
      const updateData = { ...data, date: typeof data.date === 'string' ? data.date : (data.date as Date).toISOString().split('T')[0] };
      await updateTraining(editingTraining.id, updateData as Partial<Omit<Training, 'id'>>);
      toast({ title: "Training Updated", description: `Training at data.location updated.` });
      setForceUpdateList(prev => prev + 1);
      setIsAddTrainingDialogOpen(false);
      setEditingTraining(null);
    } catch (error: any) {
      toast({ title: "Error updating training", description: error.message || "Could not update training.", variant: "destructive" });
    }
  };

  const handleDeleteTraining = async (trainingId: string) => {
    if (!window.confirm("Are you sure you want to delete this training session?")) return;
    try {
      await deleteTraining(trainingId);
      toast({ title: "Training Deleted", description: "The training session has been removed.", variant: "destructive" });
      setForceUpdateList(prev => prev + 1);
    } catch (error: any) {
      toast({ title: "Error deleting training", description: error.message || "Could not delete training.", variant: "destructive" });
    }
  };

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setTrainings((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Persisting DND order to Firestore is a further step
        // updateTrainingsOrder(newOrder.map((training, index) => ({ id: training.id, order: index })));
        return newOrder;
      });
    }
  }

  const isAdmin = user?.role === "admin";
  
  if (isLoading || authLoading) {
    return <div className="flex h-full items-center justify-center"><p>Loading trainings...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Schedule</h1>
          <p className="text-muted-foreground">
            Plan and view upcoming training sessions. {isAdmin && "Drag to reorder (local view only)."}
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

      {trainings.length === 0 && !isLoading ? (
         <Card className="col-span-full">
            <CardHeader>
                <CardTitle>No Trainings Yet</CardTitle>
                <CardDescription>
                There are no training sessions scheduled. {isAdmin && "Click 'Add Training' to get started."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icons.Trainings className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        Time to hit the pitch! But first, schedule a training.
                    </p>
                    {isAdmin && (
                        <Button className="mt-4" onClick={() => setIsAddTrainingDialogOpen(true)}>
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
                    onEdit={handleEditTraining} 
                    onDelete={handleDeleteTraining} 
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
