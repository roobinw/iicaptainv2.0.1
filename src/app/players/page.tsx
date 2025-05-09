
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { PlayerCard } from "@/components/player-card";
import { AddPlayerForm } from "@/components/add-player-form";
import { mockUsers, addMockPlayer } from "@/lib/mock-data"; // addMockPlayer will update mockUsers
import type { User, UserRole } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PlayersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<User[]>(mockUsers);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (window.location.hash === "#add" && currentUser?.role === "admin") {
      setIsAddPlayerDialogOpen(true);
      setEditingPlayer(null);
      window.location.hash = "";
    }
  }, [currentUser?.role]);

  const handleAddPlayer = (data: Omit<User, "id" | "avatarUrl"> & { avatarUrl?: string }) => {
    const newPlayer = addMockPlayer(data as Omit<User, "id" | "avatarUrl">); // addMockPlayer updates mockUsers
    setPlayers([...mockUsers]); // Re-fetch from updated mockUsers
    toast({ title: "Player Added", description: `${data.name} has been added to the team.` });
    setIsAddPlayerDialogOpen(false);
  };

  const handleEditPlayer = (player: User) => {
    setEditingPlayer(player);
    setIsAddPlayerDialogOpen(true);
  };

  const handleUpdatePlayer = (data: Omit<User, "id" | "avatarUrl"> & { avatarUrl?: string }) => {
    if (!editingPlayer) return;
    const updatedPlayers = mockUsers.map(p =>
      p.id === editingPlayer.id ? { ...editingPlayer, ...data } : p
    );
    mockUsers.splice(0, mockUsers.length, ...updatedPlayers); // Update global mock data
    setPlayers([...mockUsers]); // Re-fetch
    toast({ title: "Player Updated", description: `${data.name}'s details have been updated.` });
    setIsAddPlayerDialogOpen(false);
    setEditingPlayer(null);
  };

  const handleDeletePlayer = (playerId: string) => {
    if (playerId === currentUser?.id) {
      toast({ title: "Action Denied", description: "You cannot delete your own account.", variant: "destructive"});
      return;
    }
    if (!window.confirm("Are you sure you want to remove this player from the team?")) return;
    
    const updatedPlayers = mockUsers.filter(p => p.id !== playerId);
    mockUsers.splice(0, mockUsers.length, ...updatedPlayers); // Update global mock data
    setPlayers([...mockUsers]); // Re-fetch
    toast({ title: "Player Removed", description: "The player has been removed from the team.", variant: "destructive" });
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const isAdmin = currentUser?.role === "admin";

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
                <Icons.Add className="mr-2 h-4 w-4" /> Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
                <DialogDescription>
                  {editingPlayer ? "Update player details." : "Enter the new player's information."}
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

      {filteredPlayers.length === 0 ? (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>No Players Found</CardTitle>
                <CardDescription>
                {searchTerm ? "No players match your search criteria." : "There are no players in the team yet."}
                {isAdmin && !searchTerm && " Click 'Add Player' to get started."}
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
              key={player.id} 
              player={player} 
              onEdit={handleEditPlayer}
              onDelete={handleDeletePlayer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
