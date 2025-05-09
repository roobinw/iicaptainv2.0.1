
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import type { User } from "@/types";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

interface PlayerCardProps {
  player: User;
  onEdit: (player: User) => void;
  onDelete: (playerId: string) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="items-center text-center">
        <Avatar className="h-20 w-20 mb-2 border-2 border-primary">
          <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint="player photo"/>
          <AvatarFallback className="text-2xl">{getInitials(player.name)}</AvatarFallback>
        </Avatar>
        <CardTitle>{player.name}</CardTitle>
        <CardDescription>{player.email}</CardDescription>
      </CardHeader>
      <CardContent className="text-center flex-grow">
        <Badge variant={player.role === "admin" ? "default" : "secondary"}>
          {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
        </Badge>
        {/* Add more player details here if needed, e.g., position, jersey number */}
      </CardContent>
      {isAdmin && (
        <CardFooter className="border-t pt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(player)}>
            <Icons.Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(player.id)} disabled={player.id === currentUser?.id}>
            <Icons.Delete className="mr-2 h-4 w-4" /> Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
