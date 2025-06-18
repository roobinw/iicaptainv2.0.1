
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { MemberCard } from "@/components/member-card"; // Updated import
import { AddMemberForm, type MemberFormValuesExtended } from "@/components/add-member-form"; // Updated import
import type { User } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllUsersByTeam, addMemberProfileToTeam, updateUserProfile, deleteUserProfile } from "@/services/userService"; 
import { Skeleton } from "@/components/ui/skeleton";

export default function MembersPage() { // Renamed function
  const { user: currentUser, isLoading: authLoading, currentTeam } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<User[]>([]); // Renamed state
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false); // Renamed state
  const [editingMember, setEditingMember] = useState<User | null>(null); // Renamed state
  const [searchTerm, setSearchTerm] = useState("");
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);


  const fetchMembers = async (teamId: string) => { // Renamed function
    setIsLoadingData(true);
    try {
      const fetchedMembers = await getAllUsersByTeam(teamId); 
      setMembers(fetchedMembers); // Updated state setter
    } catch (error) {
      console.error("Error fetching members:", error); // Updated log message
      toast({ title: "Error", description: "Could not fetch members for your team.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser && currentUser.teamId && currentTeam) {
        fetchMembers(currentUser.teamId); // Call renamed function
    } else if (!authLoading && (!currentUser || !currentUser.teamId || !currentTeam)) {
        setMembers([]); // Updated state setter
        setIsLoadingData(false);
    }
  }, [authLoading, currentUser, currentTeam, forceUpdateCounter, toast]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === "#add" && currentUser?.role === "admin") {
      setIsAddMemberDialogOpen(true); // Updated state setter
      setEditingMember(null); // Updated state setter
      window.location.hash = "";
    }
  }, [currentUser?.role]);

  const handleAddMember = async (data: MemberFormValuesExtended) => { // Renamed function and type
    if (!currentUser?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    if (!data.password) {
      toast({ title: "Error", description: "Password is required to create a new member account.", variant: "destructive"});
      return;
    }
    try {
      // addMemberProfileToTeam now expects email, password, name, role.
      await addMemberProfileToTeam({ // Call renamed service function
        email: data.email,
        password: data.password, 
        name: data.name,
        role: data.role,
      }, currentUser.teamId);
      toast({ title: "Member Account Created", description: `${data.name} has been added and their account created.` }); // Updated toast message
      setForceUpdateCounter(prev => prev + 1);
      setIsAddMemberDialogOpen(false); // Updated state setter
    } catch (error: any) {
      console.error("Error adding member and creating account:", error); // Updated log message
      toast({ title: "Error", description: error.message || "Could not add member or create account.", variant: "destructive" }); // Updated toast message
    }
  };

  const handleEditMember = (member: User) => { // Renamed function and parameter
    setEditingMember(member); // Updated state setter
    setIsAddMemberDialogOpen(true); // Updated state setter
  };

  const handleUpdateMember = async (data: MemberFormValuesExtended) => { // Renamed function and type
    if (!editingMember || !editingMember.uid || !currentUser?.teamId) { // Updated state variable
        toast({ title: "Error", description: "Member or team information missing for update.", variant: "destructive"}); // Updated toast message
        return;
    }
    try {
      const updatePayload: Partial<Omit<User, 'id' | 'uid' | 'email' | 'createdAt'>> = {
        name: data.name,
        role: data.role,
      };
      await updateUserProfile(editingMember.uid, updatePayload); 
      toast({ title: "Member Updated", description: `${data.name}'s details have been updated.` }); // Updated toast message
      setForceUpdateCounter(prev => prev + 1);
      setIsAddMemberDialogOpen(false); // Updated state setter
      setEditingMember(null); // Updated state setter
    } catch (error: any) {
      console.error("Error updating member:", error); // Updated log message
      toast({ title: "Error", description: error.message || "Could not update member.", variant: "destructive" }); // Updated toast message
    }
  };

  const handleDeleteMember = async (memberToDelete: User) => { // Renamed parameter
    if (!memberToDelete.uid || !currentUser?.teamId) {
        toast({ title: "Error", description: "Member UID or Team info not found.", variant: "destructive"}); // Updated toast message
        return;
    }
    if (memberToDelete.uid === currentUser?.uid) {
      toast({ title: "Action Denied", description: "You cannot delete your own profile.", variant: "destructive"});
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${memberToDelete.name}'s profile from this team? This does NOT delete their login account if one exists.`)) return;
    
    try {
      await deleteUserProfile(memberToDelete.uid);
      toast({ title: "Member Profile Removed", description: `${memberToDelete.name}'s profile has been removed.`, variant: "destructive" }); // Updated toast message
      setForceUpdateCounter(prev => prev + 1);
    } catch (error: any) {
      console.error("Error deleting member profile:", error); // Updated log message
      toast({ title: "Error", description: error.message || "Could not remove member profile.", variant: "destructive" }); // Updated toast message
    }
  };

  const filteredMembers = members.filter(member => // Renamed variable
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
           <Dialog open={isAddMemberDialogOpen} onOpenChange={(isOpen) => { // Updated state variable
            setIsAddMemberDialogOpen(isOpen); // Updated state setter
            if (!isOpen) setEditingMember(null); // Updated state setter
          }}>
            <DialogTrigger asChild>
              <Button>
                <Icons.Add className="mr-2 h-4 w-4" /> Add Member & Create Account 
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingMember ? "Edit Member Profile" : "Add New Member & Create Account"}</DialogTitle> {/* Updated text */}
                <DialogDescription>
                  {editingMember ? "Update member profile details." : "Enter the new member's information. An account will be created for them."} {/* Updated text */}
                </DialogDescription>
              </DialogHeader>
              <AddMemberForm  // Updated component name
                onSubmit={editingMember ? handleUpdateMember : handleAddMember} // Updated state variable
                initialDataProp={editingMember} // Updated state variable
                onClose={() => {
                  setIsAddMemberDialogOpen(false); // Updated state setter
                  setEditingMember(null); // Updated state setter
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
            placeholder="Search members by name or email..." // Updated placeholder
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      {filteredMembers.length === 0 ? ( // Updated variable
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>No Members Found</CardTitle> {/* Updated text */}
                <CardDescription>
                {searchTerm ? "No members match your search criteria." : "There are no members in your team yet."} {/* Updated text */}
                {isAdmin && !searchTerm && " Click 'Add Member & Create Account' to add members."} {/* Updated text */}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icons.Users className="w-16 h-16 text-muted-foreground mb-4" /> {/* Changed Icon */}
                    <p className="text-muted-foreground">
                        It looks a bit lonely here.
                    </p>
                    {isAdmin && !searchTerm && (
                        <Button className="mt-4" onClick={() => {setEditingMember(null); setIsAddMemberDialogOpen(true);}}> {/* Updated state setters */}
                            <Icons.Add className="mr-2 h-4 w-4" /> Add First Member {/* Updated text */}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => ( // Updated variable
            <MemberCard  // Updated component name
              key={member.uid} 
              member={member} // Updated prop name
              onEdit={isAdmin && member.uid !== currentUser.uid ? handleEditMember : undefined} 
              onDelete={isAdmin && member.uid !== currentUser.uid ? () => handleDeleteMember(member) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
