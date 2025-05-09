"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { PlayerCard } from "@/components/player-card";
import { AddPlayerForm, type PlayerFormValuesExtended } from "@/components/add-player-form";
import type { User } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllUsersByTeam, addPlayerProfileToTeam, updateUserProfile, deleteUserProfile } from "@/services/userService"; 
import { Skeleton } from "@/components/ui/skeleton";

export default function PlayersPage() {
  const { user: currentUser, isLoading: authLoading, currentTeam } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);


  const fetchPlayers = async (teamId: string) => {
    setIsLoadingData(true);
    try {
      const fetchedPlayers = await getAllUsersByTeam(teamId); 
      setPlayers(fetchedPlayers);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({ title: "Error", description: "Could not fetch players for your team.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser && currentUser.teamId && currentTeam) {
        fetchPlayers(currentUser.teamId);
    } else if (!authLoading && (!currentUser || !currentUser.teamId || !currentTeam)) {
        setPlayers([]);
        setIsLoadingData(false);
    }
  }, [authLoading, currentUser, currentTeam, forceUpdateCounter, toast]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === "#add" && currentUser?.role === "admin") {
      setIsAddPlayerDialogOpen(true);
      setEditingPlayer(null);
      window.location.hash = "";
    }
  }, [currentUser?.role]);

  const handleAddPlayer = async (data: PlayerFormValuesExtended) => {
    if (!currentUser?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    if (!data.password) {
      toast({ title: "Error", description: "Password is required to create a new player account.", variant: "destructive"});
      return;
    }
    try {
      // addPlayerProfileToTeam now expects email, password, name, role.
      await addPlayerProfileToTeam({
        email: data.email,
        password: data.password, // Pass the password
        name: data.name,
        role: data.role,
      }, currentUser.teamId);
      toast({ title: "Player Account Created", description: `${data.name} has been added and their account created.` });
      setForceUpdateCounter(prev => prev + 1);
      setIsAddPlayerDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding player and creating account:", error);
      toast({ title: "Error", description: error.message || "Could not add player or create account.", variant: "destructive" });
    }
  };

  const handleEditPlayer = (player: User) => {
    setEditingPlayer(player);
    setIsAddPlayerDialogOpen(true);
  };

  const handleUpdatePlayer = async (data: PlayerFormValuesExtended) => { // Now uses PlayerFormValuesExtended
    if (!editingPlayer || !editingPlayer.uid || !currentUser?.teamId) {
        toast({ title: "Error", description: "Player or team information missing for update.", variant: "destructive"});
        return;
    }
    try {
      // Password changes are not handled in this function for editing.
      // Email is disabled for editing in the form.
      const updatePayload: Partial<Omit<User, 'id' | 'uid' | 'email' | 'createdAt'>> = {
        name: data.name,
        role: data.role,
        // avatarUrl: data.avatarUrl, // If avatarUrl is part of the form and updatable
      };
      await updateUserProfile(editingPlayer.uid, updatePayload); 
      toast({ title: "Player Updated", description: `${data.name}'s details have been updated.` });
      setForceUpdateCounter(prev => prev + 1);
      setIsAddPlayerDialogOpen(false);
      setEditingPlayer(null);
    } catch (error: any) {
      console.error("Error updating player:", error);
      toast({ title: "Error", description: error.message || "Could not update player.", variant: "destructive" });
    }
  };

  const handleDeletePlayer = async (playerToDelete: User) => {
    if (!playerToDelete.uid || !currentUser?.teamId) {
        toast({ title: "Error", description: "Player UID or Team info not found.", variant: "destructive"});
        return;
    }
    if (playerToDelete.uid === currentUser?.uid) {
      toast({ title: "Action Denied", description: "You cannot delete your own profile.", variant: "destructive"});
      return;
    }
    // Consider adding a check: if the user has a Firebase Auth account, this only deletes the Firestore profile.
    // True deletion of auth account would require Firebase Admin SDK on backend or re-authentication.
    if (!window.confirm(`Are you sure you want to remove ${playerToDelete.name}'s profile from this team? This does NOT delete their login account if one exists.`)) return;
    
    try {
      await deleteUserProfile(playerToDelete.uid);
      toast({ title: "Player Profile Removed", description: `${playerToDelete.name}'s profile has been removed.`, variant: "destructive" });
      setForceUpdateCounter(prev => prev + 1);
    } catch (error: any) {
      console.error("Error deleting player profile:", error);
      toast({ title: "Error", description: error.message || "Could not remove player profile.", variant: "destructive" });
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email.toLowerCase().includes(searchTerm.toLowerCase())
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
           <Dialog open={isAddPlayerDialogOpen} onOpenChange={(isOpen) => {
            setIsAddPlayerDialogOpen(isOpen);
            if (!isOpen) setEditingPlayer(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Icons.Add className="mr-2 h-4 w-4" /> Add Player & Create Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingPlayer ? "Edit Player Profile" : "Add New Player & Create Account"}</DialogTitle>
                <DialogDescription>
                  {editingPlayer ? "Update player profile details." : "Enter the new player's information. An account will be created for them."}
                </DialogDescription>
              </DialogHeader>
              <AddPlayerForm 
                onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer}
                initialDataProp={editingPlayer} // Pass editingPlayer here
                onClose={() => {
                  setIsAddPlayerDialogOpen(false);
                  setEditingPlayer(null);
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
            placeholder="Search players by name or email..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      {filteredPlayers.length === 0 ? (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>No Players Found</CardTitle>
                <CardDescription>
                {searchTerm ? "No players match your search criteria." : "There are no players in your team yet."}
                {isAdmin && !searchTerm && " Click 'Add Player & Create Account' to add members."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icons.Players className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        It looks a bit lonely here.
                    </p>
                    {isAdmin && !searchTerm && (
                        <Button className="mt-4" onClick={() => {setEditingPlayer(null); setIsAddPlayerDialogOpen(true);}}>
                            <Icons.Add className="mr-2 h-4 w-4" /> Add First Player
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPlayers.map((player) => (
            <PlayerCard 
              key={player.uid} 
              player={player} 
              onEdit={isAdmin && player.uid !== currentUser.uid ? handleEditPlayer : undefined} 
              onDelete={isAdmin && player.uid !== currentUser.uid ? () => handleDeletePlayer(player) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}