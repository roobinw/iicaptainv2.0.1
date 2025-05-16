
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  Dialog as PlayerDialog, 
  DialogContent as PlayerDialogContent, 
  DialogHeader as PlayerDialogHeader, 
  DialogTitle as PlayerDialogTitle, 
  DialogDescription as PlayerDialogDescription, 
  DialogTrigger as PlayerDialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/icons";
import { updateTeamName, resetTeamInviteCode } from "@/services/teamService";
import type { User, UserRole } from "@/types";
import { getAllUsersByTeam, updateUserProfile, deleteUserProfile } from "@/services/userService";

import { PlayerCard } from "@/components/player-card";
import { AddPlayerForm, type PlayerFormValuesExtended } from "@/components/add-player-form";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamSettingsContent() {
  const { user: currentUser, currentTeam, refreshTeamData, refreshAuthUser, firebaseUser } = useAuth();
  const { toast } = useToast();

  // General Settings State
  const [currentTeamNameInput, setCurrentTeamNameInput] = useState("");
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
  const [isResettingCode, setIsResettingCode] = useState(false);
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false);
  const [teamInviteCode, setTeamInviteCode] = useState("");

  // Player Management State
  const [members, setMembers] = useState<User[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [forcePlayerUpdateCounter, setForcePlayerUpdateCounter] = useState(0);
  const [isSubmittingPlayerForm, setIsSubmittingPlayerForm] = useState(false);
  
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (currentTeam) {
      setCurrentTeamNameInput(currentTeam.name || "");
      setTeamInviteCode(currentTeam.inviteCode || "Generating..."); 
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!currentUser?.teamId || !currentTeam) {
      setIsLoadingMembers(false);
      return;
    }

    if (activeTab === "members") {
      fetchMembers(currentUser.teamId);
    }
  }, [activeTab, currentUser, currentTeam, forcePlayerUpdateCounter]);


  const handleTeamNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam || !currentUser || !currentUser.isAdmin || !currentTeamNameInput.trim()) return;
    setIsSubmittingTeam(true);
    try {
      await updateTeamName(currentTeam.id, currentTeamNameInput.trim());
      toast({
        title: "Team Name Updated",
        description: `Your team is now called "${currentTeamNameInput.trim()}".`,
      });
      if (refreshTeamData) refreshTeamData();
    } catch (error: any) {
      toast({ title: "Team Update Failed", description: error.message || "Could not update team name.", variant: "destructive" });
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handleResetInviteCode = async () => {
    if (!currentTeam || !currentUser || !currentUser.isAdmin) return;
    setIsResettingCode(true);
    try {
      const newCode = await resetTeamInviteCode(currentTeam.id);
      setTeamInviteCode(newCode); // Update local state
      if (refreshTeamData) await refreshTeamData(); // Refetch team data to ensure currentTeam object is updated
      toast({ title: "Invite Code Reset", description: `New invite code: ${newCode}` });
    } catch (error: any) {
      toast({ title: "Error Resetting Code", description: error.message || "Could not reset invite code.", variant: "destructive" });
    } finally {
      setIsResettingCode(false);
      setShowResetConfirmDialog(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (!currentTeam?.inviteCode) return;
    navigator.clipboard.writeText(currentTeam.inviteCode)
      .then(() => {
        toast({ title: "Copied!", description: "Team Invite Code copied to clipboard." });
      })
      .catch(err => {
        toast({ title: "Error", description: "Could not copy code.", variant: "destructive" });
      });
  };

  const fetchMembers = async (teamId: string) => {
    setIsLoadingMembers(true);
    try {
      const fetchedMembers = await getAllUsersByTeam(teamId);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({ title: "Error", description: "Could not fetch team members.", variant: "destructive" });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleEditMember = (member: User) => {
    setEditingMember(member);
    setIsAddPlayerDialogOpen(true);
  };

  const handleUpdateMember = async (data: PlayerFormValuesExtended) => {
    if (!editingMember || !editingMember.uid || !currentUser?.teamId) {
      toast({ title: "Error", description: "Member or team information missing for update.", variant: "destructive" });
      return;
    }
    setIsSubmittingPlayerForm(true);
    try {
      const updatePayload: Partial<Omit<User, 'id' | 'uid' | 'email' | 'createdAt' | 'teamId' | 'role'>> = {
        name: data.name,
        isAdmin: data.isAdmin,
        canParticipateInMatches: data.canParticipateInMatches,
        canParticipateInTrainings: data.canParticipateInTrainings,
        canBeAssignedRefereeing: data.canBeAssignedRefereeing,
        isCoach: data.isCoach,
        isTrainer: data.isTrainer,
        jerseyNumber: data.jerseyNumber ? parseInt(data.jerseyNumber.toString(), 10) : undefined,
        position: data.position || undefined,
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth instanceof Date ? data.dateOfBirth.toISOString().split('T')[0] : data.dateOfBirth) : undefined,
        emergencyContactName: data.emergencyContactName || undefined,
        emergencyContactPhone: data.emergencyContactPhone || undefined,
        medicalNotes: data.medicalNotes || undefined,
      };
      
      await updateUserProfile(editingMember.uid, updatePayload);
      toast({ title: "Member Updated", description: `${data.name}'s details have been updated.` });
      setForcePlayerUpdateCounter(prev => prev + 1);
      if (editingMember.uid === firebaseUser?.uid && refreshAuthUser) {
        await refreshAuthUser(); // Refresh auth context if self-editing role
      }
      setIsAddPlayerDialogOpen(false);
      setEditingMember(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update member.", variant: "destructive" });
    } finally {
      setIsSubmittingPlayerForm(false);
    }
  };

  const handleDeleteMember = async (memberToDelete: User) => {
    if (!memberToDelete.uid || !currentUser?.teamId) {
      toast({ title: "Error", description: "Member UID or Team info not found.", variant: "destructive" });
      return;
    }
    if (memberToDelete.uid === currentUser?.uid) {
      toast({ title: "Action Denied", description: "You cannot delete your own profile.", variant: "destructive" });
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${memberToDelete.name}'s profile from this team? Their login account (if created) will NOT be deleted by this action and must be managed in Firebase console.`)) return;

    try {
      await deleteUserProfile(memberToDelete.uid);
      toast({
        title: "Member Profile Removed",
        description: `${memberToDelete.name}'s profile has been removed. Their login account, if it exists, needs separate deletion in Firebase console.`,
        duration: 7000,
      });
      setForcePlayerUpdateCounter(prev => prev + 1);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not remove member profile.", variant: "destructive" });
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(playerSearchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(playerSearchTerm.toLowerCase())
  );

  if (!currentUser || !currentTeam) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading team settings...</p>
      </div>
    );
  }

  const isAdmin = currentUser.isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Settings</h1>
          <p className="text-muted-foreground">
            Manage general settings and members for {currentTeam.name}.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="space-y-6 max-w-2xl">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-1">Team Name</h2>
              <p className="text-sm text-muted-foreground mb-4">Change the name of your team.</p>
              <form onSubmit={handleTeamNameUpdate} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="teamNameInput">New Team Name</Label>
                  <Input
                    id="teamNameInput"
                    value={currentTeamNameInput}
                    onChange={(e) => setCurrentTeamNameInput(e.target.value)}
                    disabled={isSubmittingTeam || !isAdmin}
                  />
                </div>
                <Button type="submit" disabled={isSubmittingTeam || !currentTeamNameInput.trim() || currentTeamNameInput.trim() === currentTeam.name || !isAdmin}>
                  {isSubmittingTeam ? <Icons.Dashboard className="animate-spin mr-2" /> : null}
                  {isSubmittingTeam ? "Saving..." : "Save Team Name"}
                </Button>
              </form>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-1">Team Invite Code</h2>
              <p className="text-sm text-muted-foreground mb-4">Share this code with new members so they can join your team when they sign up.</p>
              <div className="flex items-center gap-2">
                <Input id="teamInviteCodeDisplay" value={teamInviteCode || (currentTeam?.inviteCode || "N/A")} readOnly className="flex-grow bg-muted/50" />
                <Button variant="outline" size="icon" onClick={handleCopyInviteCode} aria-label="Copy invite code">
                  <Icons.ClipboardList className="h-4 w-4" />
                </Button>
              </div>
              {isAdmin && (
                <AlertDialog open={showResetConfirmDialog} onOpenChange={setShowResetConfirmDialog}>
                  <AlertDialogTrigger asChild>
                       <Button variant="outline" disabled={isResettingCode} className="mt-3">
                          {isResettingCode ? <Icons.Dashboard className="animate-spin mr-2" /> : <Icons.KeyRound className="mr-2 h-4 w-4"/>}
                          {isResettingCode ? "Resetting..." : "Reset Invite Code"}
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will generate a new invite code for your team. The old code will no longer work.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetInviteCode}>Confirm Reset</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-semibold">Manage Team Members</h2>
            </div>
            <Input
              type="search"
              placeholder="Search members by name or email..."
              className="w-full sm:max-w-md"
              value={playerSearchTerm}
              onChange={(e) => setPlayerSearchTerm(e.target.value)}
            />
             <PlayerDialog open={isAddPlayerDialogOpen} onOpenChange={(isOpen) => {
                setIsAddPlayerDialogOpen(isOpen);
                if (!isOpen) setEditingMember(null);
            }}>
                {/* Trigger is removed from here as members join via signup. This dialog is only for EDITING. */}
                <PlayerDialogContent className="grid grid-rows-[auto_minmax(0,1fr)] max-h-[85vh] w-[95vw] max-w-[450px] sm:max-w-md">
                    <PlayerDialogHeader>
                        <PlayerDialogTitle>{editingMember ? "Edit Member Profile" : "Add New Member"}</PlayerDialogTitle>
                        <PlayerDialogDescription>
                        {editingMember ? "Update member profile details." : "New members join via signup with an invite code. This form is for editing existing members."}
                        </PlayerDialogDescription>
                    </PlayerDialogHeader>
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-1 pr-5">
                            <AddPlayerForm
                            onSubmit={handleUpdateMember} 
                            initialDataProp={editingMember}
                            onClose={() => {
                                setIsAddPlayerDialogOpen(false);
                                setEditingMember(null);
                            }}
                            isSubmitting={isSubmittingPlayerForm}
                            />
                        </div>
                    </ScrollArea>
                </PlayerDialogContent>
            </PlayerDialog>
            {isLoadingMembers ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72 w-full rounded-lg" />)}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 text-center">
                <Icons.Users className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                <h3 className="text-xl font-semibold">No Members Found</h3>
                <p className="text-muted-foreground">
                  {playerSearchTerm ? "No members match your search." : "Your team doesn't have any members yet. New members can join using the Team Invite Code on the signup page."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredMembers.map((member) => (
                  <PlayerCard
                    key={member.uid}
                    player={member}
                    onEdit={isAdmin ? handleEditMember : undefined}
                    onDelete={isAdmin && member.uid !== currentUser.uid ? () => handleDeleteMember(member) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
