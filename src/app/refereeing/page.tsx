
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
import { 
  addRefereeingAssignment, 
  getRefereeingAssignments, 
  updateRefereeingAssignment, 
  deleteRefereeingAssignment, 
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


  const handleAddAssignment = async (data: Omit<RefereeingAssignment, "id" | "assignedPlayerUids">) => {
    if (!user?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    try {
      // assignedPlayerUids will be initialized to [] by the service if not provided
      await addRefereeingAssignment(user.teamId, data); 
      toast({ title: "Assignment Added", description: `Refereeing assignment on ${format(parseISO(data.date), "MMM dd, yyyy")} scheduled.` });
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

  const handleUpdateAssignment = async (data: Omit<RefereeingAssignment, "id" | "assignedPlayerUids">) => {
    if (!editingAssignment || !editingAssignment.id || !user?.teamId) {
        toast({ title: "Error", description: "Cannot update assignment. Missing information.", variant: "destructive"});
        return;
    }
    try {
      // Pass only the fields that can be updated from this form. 
      // assignedPlayerUids is managed separately via AssignPlayersForm.
      const updatePayload: Partial<Omit<RefereeingAssignment, 'id' | 'assignedPlayerUids'>> = {
        date: data.date,
        time: data.time,
        notes: data.notes,
      };
      await updateRefereeingAssignment(user.teamId, editingAssignment.id, updatePayload);
      toast({ title: "Assignment Updated", description: `Assignment on ${format(parseISO(data.date), "MMM dd, yyyy")} has been updated.` });
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
  
  const isAdmin = user?.role === "admin";

  if (authLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-1/2" />
            {isAdmin && <Skeleton className="h-10 w-44" />}
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
  
  if (!isAdmin) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                <h1 className="text-3xl font-bold tracking-tight">Refereeing Assignments</h1>
                <p className="text-muted-foreground">
                    View refereeing assignments for {currentTeam.name}. Assignments are sorted by date and time.
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refereeing Assignments</h1>
          <p className="text-muted-foreground">
            Manage refereeing assignments for {currentTeam.name}. Assignments are sorted by date and time.
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={isAddAssignmentDialogOpen} onOpenChange={(isOpen) => {
              setIsAddAssignmentDialogOpen(isOpen);
              if (!isOpen) setEditingAssignment(null); 
            }}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Icons.Add className="mr-2 h-4 w-4" /> Add Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[450px] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingAssignment ? "Edit Assignment" : "Add New Assignment"}</DialogTitle>
                  <DialogDescription>
                    {editingAssignment 
                      ? `Update details for assignment on ${format(parseISO(editingAssignment.date), "MMM dd, yyyy")}.`
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
        )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <RefereeingAssignmentCard 
              key={assignment.id}
              assignment={assignment} 
              onEdit={isAdmin ? handleEditAssignment : undefined} 
              onDelete={isAdmin ? handleDeleteAssignment : undefined}
              onAssignPlayersSuccess={() => setForceUpdateCounter(prev => prev + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

