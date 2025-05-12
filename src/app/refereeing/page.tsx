
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Added Tabs
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
  archiveRefereeingAssignment,
  unarchiveRefereeingAssignment,
  type EventArchiveFilter 
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
  const [assignmentFilter, setAssignmentFilter] = useState<EventArchiveFilter>("active");


  const fetchAssignments = useCallback(async (teamId: string, filter: EventArchiveFilter) => {
    setIsLoadingData(true);
    try {
      const fetchedAssignments = await getRefereeingAssignments(teamId, filter); 
      setAssignments(fetchedAssignments);
    } catch (error) {
      console.error("Error fetching refereeing assignments:", error);
      toast({ title: "Error", description: "Could not fetch refereeing assignments.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (!authLoading && user && user.teamId && currentTeam) {
        fetchAssignments(user.teamId, assignmentFilter);
    } else if (!authLoading && (!user || !user.teamId || !currentTeam)) {
      setAssignments([]);
      setIsLoadingData(false);
    }
  }, [authLoading, user, currentTeam, assignmentFilter, fetchAssignments]);


  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === "#add" && user?.role === "admin") {
      setIsAddAssignmentDialogOpen(true);
      setEditingAssignment(null); 
      window.location.hash = ""; 
    }
  }, [user?.role]);


  const handleAddAssignment = async (data: Omit<RefereeingAssignment, "id" | "assignedPlayerUids" | "isArchived">) => {
    if (!user?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    try {
      await addRefereeingAssignment(user.teamId, data); 
      toast({ title: "Assignment Added", description: `Refereeing assignment on ${format(parseISO(data.date), "MMM dd, yyyy")} scheduled.` });
      setAssignmentFilter("active");
      if(assignmentFilter === "active") fetchAssignments(user.teamId, "active");
      setIsAddAssignmentDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error adding assignment", description: error.message || "Could not add assignment.", variant: "destructive" });
    }
  };

  const handleEditAssignment = (assignment: RefereeingAssignment) => {
    setEditingAssignment(assignment);
    setIsAddAssignmentDialogOpen(true);
  };

  const handleUpdateAssignment = async (data: Omit<RefereeingAssignment, "id" | "assignedPlayerUids" | "isArchived">) => {
    if (!editingAssignment || !editingAssignment.id || !user?.teamId) {
        toast({ title: "Error", description: "Cannot update assignment. Missing information.", variant: "destructive"});
        return;
    }
    try {
      const updatePayload: Partial<Omit<RefereeingAssignment, 'id' | 'assignedPlayerUids'>> = {
        date: data.date,
        time: data.time,
        homeTeam: data.homeTeam,
        notes: data.notes,
      };
      await updateRefereeingAssignment(user.teamId, editingAssignment.id, updatePayload);
      toast({ title: "Assignment Updated", description: `Assignment on ${format(parseISO(data.date), "MMM dd, yyyy")} has been updated.` });
      fetchAssignments(user.teamId, assignmentFilter);
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
    if (!window.confirm("Are you sure you want to delete this refereeing assignment? This action cannot be undone.")) return;
    try {
      await deleteRefereeingAssignment(user.teamId, assignmentId);
      toast({ title: "Assignment Deleted", description: "The assignment has been removed.", variant: "destructive" });
      setAssignments(prev => prev.filter(a => a.id !== assignmentId)); // Optimistic UI update
    } catch (error: any) {
      toast({ title: "Error deleting assignment", description: error.message || "Could not delete assignment.", variant: "destructive" });
    }
  };

  const handleArchiveToggle = async (assignment: RefereeingAssignment) => {
    if (!user?.teamId) return;
    try {
      if (assignment.isArchived) {
        await unarchiveRefereeingAssignment(user.teamId, assignment.id);
        toast({ title: "Assignment Unarchived" });
      } else {
        await archiveRefereeingAssignment(user.teamId, assignment.id);
        toast({ title: "Assignment Archived" });
      }
      fetchAssignments(user.teamId, assignmentFilter);
    } catch (error: any) {
      toast({ title: "Error", description: `Could not ${assignment.isArchived ? 'unarchive' : 'archive'} assignment.`, variant: "destructive"});
    }
  };
  
  const isAdmin = user?.role === "admin";

  if (authLoading || isLoadingData && assignments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-1/2" />
            {isAdmin && <Skeleton className="h-10 w-44" />}
        </div>
        <Skeleton className="h-5 w-3/4" />
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

      <Tabs value={assignmentFilter} onValueChange={(value) => setAssignmentFilter(value as EventArchiveFilter)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={assignmentFilter} className="mt-4">
          {isLoadingData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <Skeleton key={i} className="h-60 w-full rounded-lg" />)}
            </div>
          ) : assignments.length === 0 ? (
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>No Assignments Found</CardTitle>
                    <CardDescription>
                    There are no {assignmentFilter !== "all" ? assignmentFilter : ""} assignments for your team. 
                    {isAdmin && assignmentFilter === "active" && " Click 'Add Assignment' to get started."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Icons.Refereeing className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">It looks a bit empty here.</p>
                        {isAdmin && assignmentFilter === "active" && (
                            <Button className="mt-4" onClick={() => { setEditingAssignment(null); setIsAddAssignmentDialogOpen(true);}}>
                                <Icons.Add className="mr-2 h-4 w-4" /> Add First Assignment
                            </Button>
                        )}
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
                  onAssignPlayersSuccess={() => fetchAssignments(user.teamId, assignmentFilter)}
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
