
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { TrainingCard } from "@/components/training-card";
import { AddTrainingForm } from "@/components/add-training-form";
import { mockTrainings, addMockTraining } from "@/lib/mock-data";
import type { Training } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/sortable-item';


export default function TrainingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trainings, setTrainings] = useState<Training[]>(mockTrainings);
  const [isAddTrainingDialogOpen, setIsAddTrainingDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [forceUpdateList, setForceUpdateList] = useState(0); 

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (window.location.hash === "#add" && user?.role === "admin") {
      setIsAddTrainingDialogOpen(true);
      setEditingTraining(null);
      window.location.hash = "";
    }
  }, [user?.role]);

  const handleAddTraining = (data: Omit<Training, "id" | "attendance">) => {
    const newTraining = addMockTraining(data);
    setTrainings(prev => [...prev, newTraining].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    toast({ title: "Training Added", description: `Training at ${data.location} scheduled.` });
    setIsAddTrainingDialogOpen(false);
  };

  const handleEditTraining = (training: Training) => {
    setEditingTraining(training);
    setIsAddTrainingDialogOpen(true);
  };

  const handleUpdateTraining = (data: Omit<Training, "id" | "attendance">) => {
    if (!editingTraining) return;
    const updatedTrainings = trainings.map(t =>
      t.id === editingTraining.id ? { ...editingTraining, ...data, date: data.date.toString() } : t
    );
    setTrainings(updatedTrainings.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    mockTrainings.splice(0, mockTrainings.length, ...updatedTrainings);
    toast({ title: "Training Updated", description: `Training at ${data.location} updated.` });
    setIsAddTrainingDialogOpen(false);
    setEditingTraining(null);
  };

  const handleDeleteTraining = (trainingId: string) => {
    if (!window.confirm("Are you sure you want to delete this training session?")) return;
    const updatedTrainings = trainings.filter(t => t.id !== trainingId);
    setTrainings(updatedTrainings);
    mockTrainings.splice(0, mockTrainings.length, ...updatedTrainings);
    toast({ title: "Training Deleted", description: "The training session has been removed.", variant: "destructive" });
  };

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setTrainings((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        mockTrainings.splice(0, mockTrainings.length, ...newOrder);
        return newOrder;
      });
    }
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Schedule</h1>
          <p className="text-muted-foreground">
            Plan and view upcoming training sessions. {isAdmin && "Drag to reorder."}
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
