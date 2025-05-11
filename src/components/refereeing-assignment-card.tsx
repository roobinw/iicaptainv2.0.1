
"use client";

import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import type { RefereeingAssignment, User, Match, Training } from "@/types"; // Added Match, Training for EventCardBase
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { getAllUsersByTeam } from "@/services/userService"; 
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { EventCardBase } from "./event-card-base"; // Import EventCardBase

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


  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <EventCardBase
        item={assignment as unknown as Match | Training} // Cast to satisfy EventCardBase, eventType="refereeing" handles specifics
        eventType="refereeing"
        icon={<Icons.Refereeing className="h-5 w-5 text-primary" />}
        titlePrefix={currentTeam?.name || "Team"}
        renderDetails={() => ( // Custom renderer for refereeing details
            <>
                <div className="text-xs sm:text-sm space-y-0.5 mt-1">
                    <div>
                        {format(parseISO(assignment.date), "EEEE, MMM dd, yyyy")} at {assignment.time}
                    </div>
                </div>
                <div className="mt-2">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Assigned Referee(s):</h4>
                  {isLoadingPlayers ? (
                    <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="animate-pulse text-xs">Loading...</Badge>
                    </div>
                  ) : assignedPlayersDetails.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {assignedPlayersDetails.map(player => (
                        <Badge key={player.uid} variant="secondary" className="flex items-center gap-1 pr-2 text-xs">
                           <Avatar className="h-3.5 w-3.5 -ml-0.5">
                                <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint="player avatar"/>
                                <AvatarFallback className="text-xxs">{getInitials(player.name)}</AvatarFallback>
                            </Avatar>
                          {player.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No players assigned.</p>
                  )}
                </div>
                {assignment.notes && (
                  <div className="mt-2">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Notes:</h4>
                    <p className="text-xs text-foreground bg-secondary/30 p-1.5 rounded-md break-words">{assignment.notes}</p>
                  </div>
                )}
            </>
        )}
        onEdit={onEdit ? () => onEdit(assignment) : undefined}
        onDelete={onDelete ? () => onDelete(assignment.id) : undefined}
        dndListeners={dndListeners}
    />
  );
}
