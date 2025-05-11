"use client";

import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import type { RefereeingAssignment, User } from "@/types";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { getAllUsersByTeam } from "@/services/userService"; // To fetch player names
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

interface RefereeingAssignmentCardProps {
  assignment: RefereeingAssignment;
  onEdit?: (assignment: RefereeingAssignment) => void;
  onDelete?: (assignmentId: string) => void;
  dndListeners?: any; 
}

export function RefereeingAssignmentCard({ assignment, onEdit, onDelete, dndListeners }: RefereeingAssignmentCardProps) {
  const { user: currentUser, currentTeam } = useAuth();
  const [assignedPlayersDetails, setAssignedPlayersDetails] = useState<User[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  useEffect(() => {
    if (currentUser?.teamId && assignment.assignedPlayerUids.length > 0) {
      setIsLoadingPlayers(true);
      getAllUsersByTeam(currentUser.teamId)
        .then(allTeamMembers => {
          const details = allTeamMembers.filter(member => assignment.assignedPlayerUids.includes(member.uid));
          setAssignedPlayersDetails(details);
        })
        .catch(console.error)
        .finally(() => setIsLoadingPlayers(false));
    } else {
      setAssignedPlayersDetails([]);
      setIsLoadingPlayers(false);
    }
  }, [currentUser?.teamId, assignment.assignedPlayerUids]);

  const isAdmin = currentUser?.role === "admin";

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <Card className="shadow-lg hover:shadow-primary/10 transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl truncate">
              <Icons.Refereeing className="h-5 w-5 text-primary" />
              Refereeing Duty
            </CardTitle>
            <CardDescription className="mt-1 overflow-hidden"> {/* Added overflow-hidden for consistency */}
              {format(parseISO(assignment.date), "EEEE, MMMM dd, yyyy")} at {assignment.time}
            </CardDescription>
          </div>
          {isAdmin && (onEdit || onDelete || dndListeners) && (
            <div className="flex items-center gap-0.5 ml-2 shrink-0">
              {dndListeners && ( 
                <Button variant="ghost" size="icon" {...dndListeners} aria-label="Reorder" className="h-8 w-8 cursor-grab active:cursor-grabbing hover:bg-sidebar-accent">
                  <Icons.GripVertical className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(assignment);}} aria-label="Edit assignment" className="h-8 w-8 hover:bg-sidebar-accent">
                  <Icons.Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(assignment.id);}} aria-label="Delete assignment" className="h-8 w-8 hover:bg-sidebar-accent">
                  <Icons.Delete className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">Assigned Referee(s):</h4>
          {isLoadingPlayers ? (
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="animate-pulse">Loading...</Badge>
            </div>
          ) : assignedPlayersDetails.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assignedPlayersDetails.map(player => (
                <Badge key={player.uid} variant="secondary" className="flex items-center gap-1.5 pr-2.5">
                   <Avatar className="h-4 w-4 -ml-1">
                        <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint="player avatar"/>
                        <AvatarFallback className="text-xs">{getInitials(player.name)}</AvatarFallback>
                    </Avatar>
                  {player.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No players assigned.</p>
          )}
        </div>
        {assignment.notes && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Notes:</h4>
            <p className="text-sm text-foreground bg-secondary/30 p-2 rounded-md break-words">{assignment.notes}</p> {/* Added break-words */}
          </div>
        )}
      </CardContent>
      {/* Footer can be added if other actions are needed, e.g., view details in a dialog */}
      {/* <CardFooter className="border-t pt-4">
         Footer content if needed
      </CardFooter> */}
    </Card>
  );
}
