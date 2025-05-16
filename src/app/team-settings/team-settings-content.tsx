
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
  Dialog as OpponentDialog, 
  DialogContent as OpponentDialogContent, 
  DialogHeader as OpponentDialogHeader, 
  DialogTitle as OpponentDialogTitle, 
  DialogDescription as OpponentDialogDescription, 
  DialogTrigger as OpponentDialogTrigger 
} from "@/components/ui/dialog";
import { 
  Dialog as EquipmentDialog, 
  DialogContent as EquipmentDialogContent, 
  DialogHeader as EquipmentDialogHeader, 
  DialogTitle as EquipmentDialogTitle, 
  DialogDescription as EquipmentDialogDescription, 
  DialogTrigger as EquipmentDialogTrigger 
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
import { updateTeamName } from "@/services/teamService";
import type { User, Opponent, Equipment, EquipmentCondition, UserRole } from "@/types";
import { getAllUsersByTeam, updateUserProfile, deleteUserProfile } from "@/services/userService";
import { addOpponent, getOpponentsByTeamId, updateOpponent, deleteOpponent } from "@/services/opponentService";
import { addEquipment, getEquipmentByTeamId, updateEquipment, deleteEquipment } from "@/services/equipmentService";

import { PlayerCard } from "@/components/player-card";
import { AddPlayerForm, type PlayerFormValuesExtended } from "@/components/add-player-form";

import { OpponentCard } from "@/components/opponent-card";
import { AddEditOpponentForm, type OpponentFormValues } from "@/components/add-edit-opponent-form";
import { OpponentList } from "@/components/opponent-list";

import { EquipmentCard } from "@/components/equipment-card";
import { AddEditEquipmentForm, type EquipmentFormValues } from "@/components/add-edit-equipment-form";
import { EquipmentList } from "@/components/equipment-list";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamSettingsContent() {
  const { user: currentUser, currentTeam, refreshTeamData, refreshAuthUser } = useAuth();
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

  // Opponent Management State
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [isLoadingOpponents, setIsLoadingOpponents] = useState(true);
  const [isOpponentFormOpen, setIsOpponentFormOpen] = useState(false);
  const [editingOpponent, setEditingOpponent] = useState<Opponent | null>(null);
  const [isSubmittingOpponentForm, setIsSubmittingOpponentForm] = useState(false);

  // Equipment Management State
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);
  const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isSubmittingEquipmentForm, setIsSubmittingEquipmentForm] = useState(false);
  
  const [activeTab, setActiveTab] = useState("general");

  // Effect for General Settings
  useEffect(() => {
    if (currentTeam) {
      setCurrentTeamNameInput(currentTeam.name || "");
      setTeamInviteCode(currentTeam.teamId || ""); // Use teamId as the shareable code
    }
  }, [currentTeam]);

  // Effect for Players, Locations, Opponents, Equipment (based on activeTab)
  useEffect(() => {
    if (!currentUser?.teamId || !currentTeam) {
      setIsLoadingMembers(false);
      setIsLoadingOpponents(false);
      setIsLoadingEquipment(false);
      return;
    }

    if (activeTab === "members") {
      fetchMembers(currentUser.teamId);
    } else if (activeTab === "opponents") {
      fetchOpponents(currentUser.teamId);
    } else if (activeTab === "equipment") {
      fetchTeamEquipment(currentUser.teamId);
    }
  }, [activeTab, currentUser, currentTeam, forcePlayerUpdateCounter]);


  // General Settings Handlers
  const handleTeamNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam || !currentUser || currentUser.role !== 'admin' || !currentTeamNameInput.trim()) return;
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

  const handleCopyInviteCode = () => {
    if (!currentTeam?.teamId) return;
    navigator.clipboard.writeText(currentTeam.teamId)
      .then(() => {
        toast({ title: "Copied!", description: "Team Code copied to clipboard." });
      })
      .catch(err => {
        toast({ title: "Error", description: "Could not copy code.", variant: "destructive" });
      });
  };

  // Member Management Handlers
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
    setIsSubmittingOpponentForm(true); // Should be specific for member form
    try {
      const updatePayload: Partial<Omit<User, 'id' | 'uid' | 'email' | 'createdAt' | 'avatarUrl' | 'dateOfBirth'> & { avatarUrl?: string | null, dateOfBirth?: string | null }> = {
        name: data.name,
        role: data.role,
        jerseyNumber: data.jerseyNumber ? parseInt(data.jerseyNumber.toString(), 10) : undefined,
        position: data.position || undefined,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth instanceof Date ? data.dateOfBirth.toISOString().split('T')[0] : data.dateOfBirth : undefined,
        emergencyContactName: data.emergencyContactName || undefined,
        emergencyContactPhone: data.emergencyContactPhone || undefined,
        medicalNotes: data.medicalNotes || undefined,
      };
      
      await updateUserProfile(editingMember.uid, updatePayload);
      toast({ title: "Member Updated", description: `${data.name}'s details have been updated.` });
      setForcePlayerUpdateCounter(prev => prev + 1);
      setIsAddPlayerDialogOpen(false);
      setEditingMember(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update member.", variant: "destructive" });
    } finally {
      setIsSubmittingOpponentForm(false); // Should be specific for member form
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
    if (!window.confirm(`Are you sure you want to remove ${memberToDelete.name}'s profile from this team? This action only removes their profile data from this team. Their login account (if created via signup) must be deleted manually from Firebase Console.`)) return;

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

  // Opponent Management Handlers
  const fetchOpponents = async (teamId: string) => {
    setIsLoadingOpponents(true);
    try {
      const fetchedOpponents = await getOpponentsByTeamId(teamId);
      setOpponents(fetchedOpponents);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch opponents.", variant: "destructive" });
    } finally {
      setIsLoadingOpponents(false);
    }
  };
  
  const handleOpenAddOpponentDialog = () => {
    setEditingOpponent(null);
    setIsOpponentFormOpen(true);
  };

  const handleEditOpponent = (opponent: Opponent) => {
    setEditingOpponent(opponent);
    setIsOpponentFormOpen(true);
  };

  const handleOpponentFormSubmit = async (data: OpponentFormValues) => {
    if (!currentUser?.teamId) {
      toast({ title: "Error", description: "Team information is missing.", variant: "destructive" });
      return;
    }
    setIsSubmittingOpponentForm(true);
    try {
      if (editingOpponent) {
        await updateOpponent(currentUser.teamId, editingOpponent.id, data);
        toast({ title: "Opponent Updated", description: `"${data.name}" has been updated.` });
      } else {
        await addOpponent(currentUser.teamId, data);
        toast({ title: "Opponent Added", description: `"${data.name}" has been added.` });
      }
      fetchOpponents(currentUser.teamId);
      setIsOpponentFormOpen(false);
      setEditingOpponent(null);
    } catch (error: any) {
      toast({
        title: editingOpponent ? "Error updating opponent" : "Error adding opponent",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOpponentForm(false);
    }
  };

  const handleDeleteOpponent = async (opponentId: string) => {
    if (!currentUser?.teamId) {
      toast({ title: "Error", description: "Team information is missing.", variant: "destructive" });
      return;
    }
    try {
      await deleteOpponent(currentUser.teamId, opponentId);
      toast({ title: "Opponent Deleted", description: "The opponent has been removed.", variant: "destructive" });
      fetchOpponents(currentUser.teamId);
    } catch (error: any) {
      toast({ title: "Error deleting opponent", description: error.message || "Could not delete opponent.", variant: "destructive" });
    }
  };

  // Equipment Management Handlers
  const fetchTeamEquipment = async (teamId: string) => {
    setIsLoadingEquipment(true);
    try {
      const fetchedEquipment = await getEquipmentByTeamId(teamId);
      setEquipment(fetchedEquipment);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch equipment.", variant: "destructive" });
    } finally {
      setIsLoadingEquipment(false);
    }
  };

  const handleOpenAddEquipmentDialog = () => {
    setEditingEquipment(null);
    setIsEquipmentFormOpen(true);
  };

  const handleEditEquipment = (item: Equipment) => {
    setEditingEquipment(item);
    setIsEquipmentFormOpen(true);
  };

  const handleEquipmentFormSubmit = async (data: EquipmentFormValues) => {
    if (!currentUser?.teamId) {
      toast({ title: "Error", description: "Team information is missing.", variant: "destructive" });
      return;
    }
    setIsSubmittingEquipmentForm(true);
    try {
      if (editingEquipment) {
        await updateEquipment(currentUser.teamId, editingEquipment.id, data);
        toast({ title: "Equipment Updated", description: `"${data.name}" has been updated.` });
      } else {
        await addEquipment(currentUser.teamId, data);
        toast({ title: "Equipment Added", description: `"${data.name}" has been added.` });
      }
      fetchTeamEquipment(currentUser.teamId);
      setIsEquipmentFormOpen(false);
      setEditingEquipment(null);
    } catch (error: any) {
      toast({
        title: editingEquipment ? "Error Updating Equipment" : "Error Adding Equipment",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingEquipmentForm(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!currentUser?.teamId) {
      toast({ title: "Error", description: "Team information is missing.", variant: "destructive" });
      return;
    }
    try {
      await deleteEquipment(currentUser.teamId, equipmentId);
      toast({ title: "Equipment Deleted", description: "The equipment item has been removed.", variant: "destructive" });
      fetchTeamEquipment(currentUser.teamId);
    } catch (error: any) {
      toast({ title: "Error Deleting Equipment", description: error.message || "Could not delete equipment.", variant: "destructive" });
    }
  };

  if (!currentUser || !currentTeam) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading team settings...</p>
      </div>
    );
  }

  const isAdmin = currentUser.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Settings</h1>
          <p className="text-muted-foreground">
            Manage general settings, members, and more for {currentTeam.name}.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="opponents">Opponents</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
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
                <Input id="teamInviteCode" value={teamInviteCode} readOnly className="flex-grow" />
                <Button variant="outline" size="icon" onClick={handleCopyInviteCode} aria-label="Copy invite code">
                  <Icons.ClipboardList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-semibold">Manage Team Members</h2>
                {/* Add Member button removed - members join via signup */}
            </div>
            <Input
              type="search"
              placeholder="Search members by name or email..."
              className="w-full sm:max-w-md"
              value={playerSearchTerm}
              onChange={(e) => setPlayerSearchTerm(e.target.value)}
            />
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
          <PlayerDialog open={isAddPlayerDialogOpen} onOpenChange={(isOpen) => {
            setIsAddPlayerDialogOpen(isOpen);
            if (!isOpen) setEditingMember(null);
          }}>
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
                        onSubmit={handleUpdateMember} // Only update from here
                        initialDataProp={editingMember}
                        onClose={() => {
                            setIsAddPlayerDialogOpen(false);
                            setEditingMember(null);
                        }}
                        />
                    </div>
                </ScrollArea>
            </PlayerDialogContent>
          </PlayerDialog>
        </TabsContent>
        
        <TabsContent value="opponents" className="mt-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-semibold">Manage Opponents</h2>
              {isAdmin && (
                <OpponentDialog open={isOpponentFormOpen} onOpenChange={(isOpen) => {
                  setIsOpponentFormOpen(isOpen);
                  if (!isOpen) setEditingOpponent(null);
                }}>
                  <OpponentDialogTrigger asChild>
                    <Button onClick={handleOpenAddOpponentDialog}>
                      <Icons.Add className="mr-2 h-4 w-4" /> Add Opponent
                    </Button>
                  </OpponentDialogTrigger>
                  <OpponentDialogContent className="grid grid-rows-[auto_minmax(0,1fr)] max-h-[85vh] w-[95vw] max-w-[450px] sm:max-w-md">
                    <OpponentDialogHeader>
                      <OpponentDialogTitle>{editingOpponent ? "Edit Opponent" : "Add New Opponent"}</OpponentDialogTitle>
                      <OpponentDialogDescription>
                        {editingOpponent ? `Update details for ${editingOpponent.name}.` : "Fill in the details for the new opponent."}
                      </OpponentDialogDescription>
                    </OpponentDialogHeader>
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="p-1 pr-5">
                        <AddEditOpponentForm
                          onSubmit={handleOpponentFormSubmit}
                          initialData={editingOpponent}
                          onClose={() => { setIsOpponentFormOpen(false); setEditingOpponent(null); }}
                          isSubmitting={isSubmittingOpponentForm}
                        />
                      </div>
                    </ScrollArea>
                  </OpponentDialogContent>
                </OpponentDialog>
              )}
            </div>
            <OpponentList
              opponents={opponents}
              isLoading={isLoadingOpponents}
              onEditOpponent={isAdmin ? handleEditOpponent : () => {}}
              onDeleteOpponent={isAdmin ? handleDeleteOpponent : () => {}}
              onAddOpponent={isAdmin ? handleOpenAddOpponentDialog : () => {}}
              isAdmin={isAdmin}
            />
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
           <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-semibold">Manage Team Equipment</h2>
              {isAdmin && (
                <EquipmentDialog open={isEquipmentFormOpen} onOpenChange={(isOpen) => {
                  setIsEquipmentFormOpen(isOpen);
                  if (!isOpen) setEditingEquipment(null);
                }}>
                  <EquipmentDialogTrigger asChild>
                    <Button onClick={handleOpenAddEquipmentDialog}>
                      <Icons.Add className="mr-2 h-4 w-4" /> Add Equipment
                    </Button>
                  </EquipmentDialogTrigger>
                  <EquipmentDialogContent className="grid grid-rows-[auto_minmax(0,1fr)] max-h-[85vh] w-[95vw] max-w-[450px] sm:max-w-md">
                    <EquipmentDialogHeader>
                      <EquipmentDialogTitle>{editingEquipment ? "Edit Equipment Item" : "Add New Equipment Item"}</EquipmentDialogTitle>
                      <EquipmentDialogDescription>
                        {editingEquipment ? `Update details for ${editingEquipment.name}.` : "Provide details for the new equipment item."}
                      </EquipmentDialogDescription>
                    </EquipmentDialogHeader>
                     <ScrollArea className="flex-1 min-h-0">
                        <div className="p-1 pr-5">
                            <AddEditEquipmentForm
                            onSubmit={handleEquipmentFormSubmit}
                            initialData={editingEquipment}
                            onClose={() => { setIsEquipmentFormOpen(false); setEditingEquipment(null); }}
                            isSubmitting={isSubmittingEquipmentForm}
                            />
                        </div>
                    </ScrollArea>
                  </EquipmentDialogContent>
                </EquipmentDialog>
              )}
            </div>
            <EquipmentList
              equipment={equipment}
              isLoading={isLoadingEquipment}
              onEditEquipment={isAdmin ? handleEditEquipment : () => {}}
              onDeleteEquipment={isAdmin ? handleDeleteEquipment : () => {}}
              onAddEquipment={isAdmin ? handleOpenAddEquipmentDialog : () => {}}
              isAdmin={isAdmin}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

