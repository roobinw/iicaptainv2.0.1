
"use client";

import { format, parseISO } from "date-fns";
import { Icons } from "@/components/icons";
import type { RefereeingAssignment, User, Match, Training } from "@/types"; 
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { getAllUsersByTeam } from "@/services/userService"; 
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { EventCardBase } from "./event-card-base"; 

interface RefereeingAssignmentCardProps {
  assignment: RefereeingAssignment;
  onEdit?: (assignment: RefereeingAssignment) => void;
  onDelete?: (assignmentId: string) => void;
  onAssignPlayersSuccess?: () => void;
  onArchiveToggle?: (assignment: RefereeingAssignment) => void; // New prop
}

export function RefereeingAssignmentCard({ assignment, onEdit, onDelete, onAssignPlayersSuccess, onArchiveToggle }: RefereeingAssignmentCardProps) {
  const { user: currentUser, currentTeam } = useAuth();
  const [assignedMembersDetails, setAssignedMembersDetails] = useState<User[]>([]); // Renamed state
  const [isLoadingMembers, setIsLoadingMembers] = useState(true); // Renamed state

  useEffect(() => {
    if (currentUser?.teamId && assignment.assignedPlayerUids && assignment.assignedPlayerUids.length > 0) {
      setIsLoadingMembers(true); // Updated state setter
      getAllUsersByTeam(currentUser.teamId)
        .then(allTeamMembers => {
          const details = allTeamMembers.filter(member => assignment.assignedPlayerUids!.includes(member.uid));
          setAssignedMembersDetails(details); // Updated state setter
        })
        .catch(console.error)
        .finally(() => setIsLoadingMembers(false)); // Updated state setter
    } else {
      setAssignedMembersDetails([]); // Updated state setter
      setIsLoadingMembers(false); // Updated state setter
    }
  }, [currentUser?.teamId, assignment.assignedPlayerUids]);


  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <EventCardBase
        item={assignment as unknown as Match | Training | RefereeingAssignment} 
        eventType="refereeing"
        icon={<Icons.Refereeing className="h-5 w-5 text-primary" />}
        // titlePrefix is not used for refereeing, title is constructed differently
        renderDetails={() => ( 
            <>
                <div className="text-xs sm:text-sm space-y-0.5 mt-1">
                    <div className="truncate">
                        {format(parseISO(assignment.date), "EEEE, MMM dd, yyyy")} at {assignment.time}
                    </div>
                    {assignment.homeTeam && (
                      <div className="truncate">
                        Home Team: {assignment.homeTeam}
                      </div>
                    )}
                </div>
                <div className="mt-2">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Assigned Referee(s):</h4>
                  {isLoadingMembers ? ( // Updated state variable
                    <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="animate-pulse text-xs">Loading...</Badge>
                    </div>
                  ) : assignedMembersDetails.length > 0 ? ( // Updated state variable
                    <div className="flex flex-wrap gap-1">
                      {assignedMembersDetails.map(member => ( // Updated variable name
                        <Badge key={member.uid} variant="secondary" className="flex items-center gap-1 pr-2 text-xs">
                           <Avatar className="h-3.5 w-3.5 -ml-0.5">
                                <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="member avatar"/> {/* Updated data-ai-hint */}
                                <AvatarFallback className="text-xxs">{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                          {member.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No members assigned.</p> // Updated text
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
        onAssignPlayersSuccess={onAssignPlayersSuccess}
        onArchiveToggle={onArchiveToggle ? () => onArchiveToggle(assignment) : undefined} // Pass to EventCardBase
    />
  );
}

