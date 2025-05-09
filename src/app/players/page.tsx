
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { PlayerCard } from "@/components/player-card";
import { AddPlayerForm } from "@/components/add-player-form";
import type { User } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllUsersByTeam, addPlayerProfileToTeam, updateUserProfile, deleteUserProfile } from "@/services/userService"; 

export default function PlayersPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPlayers = async (teamId: string) => {
    setIsLoading(true);
    try {
      // Fetches all users for the current team, admin can then see/manage roles
      const fetchedPlayers = await getAllUsersByTeam(teamId); 
      setPlayers(fetchedPlayers);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({ title: "Error", description: "Could not fetch players for your team.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser && currentUser.teamId) {
        fetchPlayers(currentUser.teamId);
    } else if (!authLoading && !currentUser) {
        setPlayers([]);
        setIsLoading(false);
    }
  }, [authLoading, currentUser]);

  useEffect(() => {
    if (window.location.hash === "#add" && currentUser?.role === "admin") {
      setIsAddPlayerDialogOpen(true);
      setEditingPlayer(null);
      window.location.hash = "";
    }
  }, [currentUser?.role]);

  const handleAddPlayer = async (data: Omit<User, "id" | "avatarUrl" | "createdAt" | "uid" | "teamId" | "role"> & { avatarUrl?: string }) => {
    if (!currentUser?.teamId) {
        toast({ title: "Error", description: "Team information is missing.", variant: "destructive"});
        return;
    }
    const newPlayerData = { ...data }; // role will be 'player' by default in service

    try {
      await addPlayerProfileToTeam(newPlayerData, currentUser.teamId);
      toast({ title: "Player Profile Added", description: `${data.name} has been added to your team.` });
      if (currentUser.teamId) fetchPlayers(currentUser.teamId); 
      setIsAddPlayerDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding player:", error);
      toast({ title: "Error", description: error.message || "Could not add player.", variant: "destructive" });
    }
  };

  const handleEditPlayer = (player: User) => {
    setEditingPlayer(player);
    setIsAddPlayerDialogOpen(true);
  };

  const handleUpdatePlayer = async (data: Omit<User, "id" | "avatarUrl" | "createdAt" | "uid" | "teamId"> & { avatarUrl?: string }) => {
    if (!editingPlayer || !editingPlayer.uid || !currentUser?.teamId) return;
    try {
      // Ensure role is part of the data passed to updateUserProfile if it's editable in the form
      await updateUserProfile(editingPlayer.uid, data); 
      toast({ title: "Player Updated", description: `${data.name}'s details have been updated.` });
      if (currentUser.teamId) fetchPlayers(currentUser.teamId);
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
    if (!window.confirm(`Are you sure you want to remove ${playerToDelete.name}'s profile? This does not delete their authentication account if they have one.`)) return;
    
    try {
      await deleteUserProfile(playerToDelete.uid); // Deletes from 'users' collection
      toast({ title: "Player Profile Removed", description: "The player's profile has been removed.", variant: "destructive" });
      if (currentUser.teamId) fetchPlayers(currentUser.teamId);
    } catch (error: any) {
      console.error("Error deleting player:", error);
      toast({ title: "Error", description: error.message || "Could not remove player profile.", variant: "destructive" });
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const isAdmin = currentUser?.role === "admin";

  if (isLoading || authLoading) {
    return <div className="flex h-full items-center justify-center"><p>Loading players...</p></div>;
  }
  if (!currentUser || !currentUser.teamId) {
    return <div className="flex h-full items-center justify-center"><p>Please log in and ensure you are part of a team to view players.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your team roster.
          </p>
        </div>
        {isAdmin && (
           <Dialog open={isAddPlayerDialogOpen} onOpenChange={(isOpen) => {
            setIsAddPlayerDialogOpen(isOpen);
            if (!isOpen) setEditingPlayer(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Icons.Add className="mr-2 h-4 w-4" /> Add Player Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingPlayer ? "Edit Player Profile" : "Add New Player Profile"}</DialogTitle>
                <DialogDescription>
                  {editingPlayer ? "Update player profile details." : "Enter the new player's information. This creates a profile in your team."}
                </DialogDescription>
              </DialogHeader>
              <AddPlayerForm 
                onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer}
                initialData={editingPlayer}
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

      {filteredPlayers.length === 0 && !isLoading ? (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>No Players Found</CardTitle>
                <CardDescription>
                {searchTerm ? "No players match your search criteria." : "There are no players in your team yet."}
                {isAdmin && !searchTerm && " Click 'Add Player Profile' to add members."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icons.Players className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        It looks a bit lonely here.
                    </p>
                    {isAdmin && !searchTerm && (
                        <Button className="mt-4" onClick={() => setIsAddPlayerDialogOpen(true)}>
                            <Icons.Add className="mr-2 h-4 w-4" /> Add First Player Profile
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
              onEdit={isAdmin ? handleEditPlayer : undefined} // Only pass onEdit if admin
              onDelete={isAdmin ? () => handleDeletePlayer(player) : undefined} // Only pass onDelete if admin
            />
          ))}
        </div>
      )}
    </div>
  );
}
