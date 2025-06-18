
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { MemberCard } from "@/components/member-card";
import { AddMemberForm, type MemberFormValuesExtended } from "@/components/add-member-form";
import type { User } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllUsersByTeam, addMemberProfileToTeam, updateUserProfile, deleteUserProfile } from "@/services/userService"; 
import { Skeleton } from "@/components/ui/skeleton";

export default function MembersPage() {
  const { user: currentUser, isLoading: authLoading, currentTeam } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);


  const fetchMembers = async (teamId: string) => {
    setIsLoadingData(true);
    try {
      const fetchedMembers = await getAllUsersByTeam(teamId); 
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({ title: "Error", description: "Could not fetch members for your team.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser && currentUser.teamId && currentTeam) {
        fetchMembers(currentUser.teamId);
    } else if (!authLoading && (!currentUser || !currentUser.teamId || !currentTeam)) {
        setMembers([]);
        setIsLoadingData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentUser, currentTeam, forceUpdateCounter]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === "#add" && currentUser?.role === "admin") {
      setIsAddMemberDialogOpen(true);
      setEditingMember(null);
      window.location.hash = "";
    }
  }, [currentUser?.role]);

  const handleAddMember = async (data: MemberFormValuesExtended) => {
    if (!currentUser?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    if (!data.password) {
      toast({ title: "Error", description: "Password is required to create a new member account.", variant: "destructive"});
      return;
    }
    try {
      await addMemberProfileToTeam({
        email: data.email,
        password: data.password, 
        name: data.name,
        role: data.role,
        isTrainingMember: data.isTrainingMember,
        isMatchMember: data.isMatchMember,
        isTeamManager: data.isTeamManager,
        isTrainer: data.isTrainer,
        isCoach: data.isCoach,
      }, currentUser.teamId);
      toast({ title: "Member Account Created", description: `${data.name} has been added and their account created.` });
      setForceUpdateCounter(prev => prev + 1);
      setIsAddMemberDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding member and creating account:", error);
      toast({ title: "Error", description: error.message || "Could not add member or create account.", variant: "destructive" });
    }
  };

  const handleEditMember = (member: User) => {
    setEditingMember(member);
    setIsAddMemberDialogOpen(true);
  };

  const handleUpdateMember = async (data: MemberFormValuesExtended) => {
    if (!editingMember || !editingMember.uid || !currentUser?.teamId) {
        toast({ title: "Error", description: "Member or team information missing for update.", variant: "destructive"});
        return;
    }
    try {
      // Construct the payload for updateUserProfile
      // avatarUrl from data is already string | null due to AddMemberForm logic
      const payloadForService: Partial<User> = {
        name: data.name,
        role: data.role,
        avatarUrl: data.avatarUrl, 
        isTrainingMember: data.isTrainingMember,
        isMatchMember: data.isMatchMember,
        isTeamManager: data.isTeamManager,
        isTrainer: data.isTrainer,
        isCoach: data.isCoach,
      };
      
      await updateUserProfile(editingMember.uid, payloadForService);
      
      toast({ title: "Member Updated", description: `${data.name}'s details have been updated.` });
      setForceUpdateCounter(prev => prev + 1); // Force re-fetch
      setIsAddMemberDialogOpen(false); // Close dialog on success
      setEditingMember(null); // Clear editing state
    } catch (error: any) {
      console.error("Error updating member in MembersPage:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update member profile.", variant: "destructive" });
    }
  };

  const handleDeleteMember = async (memberToDelete: User) => {
    if (!memberToDelete.uid || !currentUser?.teamId) {
        toast({ title: "Error", description: "Member UID or Team info not found.", variant: "destructive"});
        return;
    }
    if (memberToDelete.uid === currentUser?.uid) {
      toast({ title: "Action Denied", description: "You cannot delete your own profile.", variant: "destructive"});
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${memberToDelete.name}'s profile from this team? This does NOT delete their login account if one exists.`)) return;
    
    try {
      await deleteUserProfile(memberToDelete.uid);
      toast({ title: "Member Profile Removed", description: `${memberToDelete.name}'s profile has been removed.`, variant: "destructive" });
      setForceUpdateCounter(prev => prev + 1);
    } catch (error: any) {
      console.error("Error deleting member profile:", error);
      toast({ title: "Error", description: error.message || "Could not remove member profile.", variant: "destructive" });
    }
  };

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const isAdmin = currentUser?.role === "admin";

  if (authLoading || isLoadingData) {
     return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Skeleton className="h-9 w-48 mb-1" />
                    <Skeleton className="h-5 w-64" />
                </div>
                {isAdmin && <Skeleton className="h-10 w-44" />}
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-72 w-full rounded-lg" />)}
            </div>
        </div>
    );
  }
  if (!currentUser || !currentUser.teamId || !currentTeam) {
    return <div className="flex h-full items-center justify-center"><p>Loading team data or redirecting...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            Manage the roster for {currentTeam.name}.
          </p>
        </div>
        {isAdmin && (
           <Dialog open={isAddMemberDialogOpen} onOpenChange={(isOpen) => {
            setIsAddMemberDialogOpen(isOpen);
            if (!isOpen) setEditingMember(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Icons.Add className="mr-2 h-4 w-4" /> Add Member & Create Account 
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingMember ? "Edit Member Profile" : "Add New Member & Create Account"}</DialogTitle>
                <DialogDescription>
                  {editingMember ? "Update member profile details." : "Enter the new member's information. An account will be created for them."}
                </DialogDescription>
              </DialogHeader>
              <AddMemberForm 
                onSubmit={editingMember ? handleUpdateMember : handleAddMember}
                initialDataProp={editingMember}
                onClose={() => {
                  setIsAddMemberDialogOpen(false);
                  setEditingMember(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

       <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search members by name or email..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      {filteredMembers.length === 0 ? (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>No Members Found</CardTitle>
                <CardDescription>
                {searchTerm ? "No members match your search criteria." : "There are no members in your team yet."}
                {isAdmin && !searchTerm && " Click 'Add Member & Create Account' to add members."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icons.Users className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        It looks a bit lonely here.
                    </p>
                    {isAdmin && !searchTerm && (
                        <Button className="mt-4" onClick={() => {setEditingMember(null); setIsAddMemberDialogOpen(true);}}>
                            <Icons.Add className="mr-2 h-4 w-4" /> Add First Member
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => (
            <MemberCard 
              key={member.uid} 
              member={member}
              onEdit={isAdmin && member.uid !== currentUser.uid ? handleEditMember : undefined} 
              onDelete={isAdmin && member.uid !== currentUser.uid ? () => handleDeleteMember(member) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

    

    
