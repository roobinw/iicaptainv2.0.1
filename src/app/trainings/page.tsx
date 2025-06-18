
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { TrainingCard } from "@/components/training-card";
import { AddTrainingForm } from "@/components/add-training-form";
import { BulkAddTrainingForm, type SingleTrainingFormInput } from "@/components/bulk-add-training-form";
import type { Training } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Added Tabs
import { addTraining, getTrainings, updateTraining, deleteTraining, bulkAddTrainings, archiveTraining, unarchiveTraining } from "@/services/trainingService";
import type { EventArchiveFilter } from "@/services/matchService"; // Corrected import path
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

export default function TrainingsPage() {
  const { user, isLoading: authLoading, currentTeam } = useAuth();
  const { toast } = useToast();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddTrainingDialogOpen, setIsAddTrainingDialogOpen] = useState(false);
  const [isBulkAddTrainingDialogOpen, setIsBulkAddTrainingDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [trainingFilter, setTrainingFilter] = useState<EventArchiveFilter>("active");


  const fetchTrainings = useCallback(async (teamId: string, filter: EventArchiveFilter) => {
    setIsLoadingData(true);
    try {
      const fetchedTrainings = await getTrainings(teamId, filter);
      setTrainings(fetchedTrainings);
    } catch (error: any) {
      console.error("Error fetching trainings:", error);
      let description = "Could not fetch trainings.";
      if (error.code === 'failed-precondition') {
        description = "Query requires an index. Please ensure the necessary Firestore index is created and active. Check FIRESTORE_SETUP_AND_STRUCTURE.md for details.";
      } else if (error.code === 'permission-denied') {
        description = "Permission denied. Check Firestore security rules and console for details.";
      } else if (error.message) {
        description = `An unexpected error occurred: ${error.message}. Check console for details.`; 
      }
      toast({ title: "Error Fetching Trainings", description, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user && user.teamId && currentTeam) {
        fetchTrainings(user.teamId, trainingFilter);
    } else if (!authLoading && (!user || !user.teamId || !currentTeam)) {
      setTrainings([]);
      setIsLoadingData(false);
    }
  }, [authLoading, user, currentTeam, trainingFilter, fetchTrainings]); 

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.role === "admin") {
        if (window.location.hash === "#add") {
            setIsAddTrainingDialogOpen(true);
            setEditingTraining(null);
            window.location.hash = "";
        } else if (window.location.hash === "#bulk-add") {
            setIsBulkAddTrainingDialogOpen(true);
            window.location.hash = "";
        }
    }
  }, [user?.role]);

  const handleAddTraining = async (data: Omit<Training, "id" | "attendance" | "isArchived">) => {
     if (!user?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    try {
      await addTraining(user.teamId, data);
      toast({ title: "Training Added", description: `Training at ${data.location} scheduled.` });
      setTrainingFilter("active"); // Switch to active to see the new training
      if (trainingFilter === "active") fetchTrainings(user.teamId, "active");
      setIsAddTrainingDialogOpen(false);
    } catch (error: any) {
      console.error("Detailed error adding training:", error);
      toast({ title: "Error adding training", description: error.message || "Could not add training. Check console for details.", variant: "destructive" });
    }
  };

  const handleBulkAddTrainings = async (data: SingleTrainingFormInput[]) => {
    if (!user?.teamId) {
      toast({ title: "Error", description: "Team information is missing.", variant: "destructive" });
      return;
    }
    if (data.length === 0) {
      toast({ title: "No Trainings", description: "Please add at least one training session to submit.", variant: "destructive" });
      return;
    }
    try {
      await bulkAddTrainings(user.teamId, data);
      toast({ title: "Trainings Scheduled", description: `${data.length} training session(s) have been scheduled.` });
      setTrainingFilter("active");
      if (trainingFilter === "active") fetchTrainings(user.teamId, "active");
      setIsBulkAddTrainingDialogOpen(false);
    } catch (error: any) {
      console.error("Detailed error bulk adding trainings:", error);
      toast({ title: "Error Scheduling Trainings", description: error.message || "Could not schedule training sessions. Check console for details.", variant: "destructive" });
    }
  };


  const handleEditTraining = (training: Training) => {
    setEditingTraining(training);
    setIsAddTrainingDialogOpen(true);
  };

  const handleUpdateTraining = async (data: Omit<Training, "id" | "attendance" | "isArchived">) => {
    if (!editingTraining || !editingTraining.id || !user?.teamId) {
      toast({ title: "Error", description: "Cannot update training. Missing information.", variant: "destructive"});
      return;
    }
    try {
      await updateTraining(user.teamId, editingTraining.id, data as Partial<Omit<Training, 'id'>>);
      toast({ title: "Training Updated", description: `Training at ${data.location} updated.` });
      fetchTrainings(user.teamId, trainingFilter);
      setIsAddTrainingDialogOpen(false);
      setEditingTraining(null);
    } catch (error: any) {
      console.error("Detailed error updating training:", error);
      toast({ title: "Error updating training", description: error.message || "Could not update training. Check console for details.", variant: "destructive" });
    }
  };

  const handleDeleteTraining = async (trainingId: string) => {
    if (!user?.teamId) {
       toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
       return;
    }
    if (!window.confirm("Are you sure you want to delete this training session? This action cannot be undone.")) return;
    try {
      await deleteTraining(user.teamId, trainingId);
      toast({ title: "Training Deleted", description: "The training session has been removed.", variant: "destructive" });
      setTrainings(prev => prev.filter(t => t.id !== trainingId)); // Optimistic UI update
    } catch (error: any) {
      console.error("Detailed error deleting training:", error);
      toast({ title: "Error deleting training", description: `Could not delete training: ${error.message || 'Unknown error'}. Check browser console for more details.`, variant: "destructive" });
    }
  };

  const handleArchiveToggle = async (training: Training) => {
    if (!user?.teamId) return;
    try {
      if (training.isArchived) {
        await unarchiveTraining(user.teamId, training.id);
        toast({ title: "Training Unarchived" });
      } else {
        await archiveTraining(user.teamId, training.id);
        toast({ title: "Training Archived" });
      }
      fetchTrainings(user.teamId, trainingFilter);
    } catch (error: any) {
      toast({ title: "Error", description: `Could not ${training.isArchived ? 'unarchive' : 'archive'} training.`, variant: "destructive"});
    }
  };

  const isAdmin = user?.role === "admin";
  
  if (authLoading || isLoadingData && trainings.length === 0) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <Skeleton className="h-9 w-60 mb-1" />
                    <Skeleton className="h-5 w-80" />
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-36" />
                        <Skeleton className="h-10 w-44" />
                    </div>
                )}
            </div>
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
          <h1 className="text-3xl font-bold tracking-tight">Training Schedule</h1>
          <p className="text-muted-foreground">
            Plan and view trainings for {currentTeam.name}. Trainings are sorted by date and time.
          </p>
        </div>
        {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Dialog open={isAddTrainingDialogOpen} onOpenChange={(isOpen) => {
                    setIsAddTrainingDialogOpen(isOpen);
                    if (!isOpen) setEditingTraining(null);
                }}>
                    <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                        <Icons.Add className="mr-2 h-4 w-4" /> Add Training
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingTraining ? "Edit Training" : "Add New Training"}</DialogTitle>
                        <DialogDescription>
                        {editingTraining 
                            ? `Update details for training at ${editingTraining.location} on ${format(parseISO(editingTraining.date), "MMM dd, yyyy")}.`
                            : "Fill in the details for the new training session."
                        }
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

                <Dialog open={isBulkAddTrainingDialogOpen} onOpenChange={setIsBulkAddTrainingDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Icons.Attendance className="mr-2 h-4 w-4" /> Schedule Recurring
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-xl"> 
                        <DialogHeader>
                            <DialogTitle>Schedule Recurring Training</DialogTitle>
                            <DialogDescription>
                                Define a base training session and how many additional weeks it should repeat.
                            </DialogDescription>
                        </DialogHeader>
                        <BulkAddTrainingForm
                            onSubmit={handleBulkAddTrainings}
                            onClose={() => setIsBulkAddTrainingDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
          </div>
        )}
      </div>

      <Tabs value={trainingFilter} onValueChange={(value) => setTrainingFilter(value as EventArchiveFilter)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={trainingFilter} className="mt-4">
          {isLoadingData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <Skeleton key={i} className="h-60 w-full rounded-lg" />)}
            </div>
          ) : trainings.length === 0 ? (
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>No Trainings Found</CardTitle>
                    <CardDescription>
                    There are no {trainingFilter !== "all" ? trainingFilter : ""} trainings for your team. 
                    {isAdmin && trainingFilter === "active" && " Click 'Add Training' or 'Schedule Recurring' to get started."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Icons.Trainings className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            Time to hit the pitch! But first, schedule a training.
                        </p>
                        {isAdmin && trainingFilter === "active" && (
                            <Button className="mt-4" onClick={() => {setEditingTraining(null); setIsAddTrainingDialogOpen(true);}}>
                                <Icons.Add className="mr-2 h-4 w-4" /> Add First Training
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainings.map((training) => (
                <TrainingCard 
                  key={training.id}
                  training={training} 
                  onEdit={isAdmin ? handleEditTraining : undefined} 
                  onDelete={isAdmin ? handleDeleteTraining : undefined}
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

