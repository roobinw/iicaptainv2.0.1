
"use client";

import { format, parseISO } from "date-fns";
import { Icons } from "@/components/icons";
import type { Match } from "@/types"; 
import { EventCardBase } from "./event-card-base";
import { useAuth } from "@/lib/auth";


interface MatchCardProps {
  match: Match;
  onEdit?: (match: Match) => void;
  onDelete?: (matchId: string) => void;
  // dndListeners?: any; // Removed
}

export function MatchCard({ match, onEdit, onDelete }: MatchCardProps) { // dndListeners removed from props
  const { currentTeam } = useAuth();
  return (
    <EventCardBase
      item={match}
      eventType="match" 
      icon={<Icons.Matches className="h-5 w-5 text-primary" />}
      titlePrefix={currentTeam?.name ? `${currentTeam.name} vs` : "vs"}
      renderDetails={(itemDetails) => { 
        const currentMatch = itemDetails as Match;
        return (
          <div className="text-xs sm:text-sm space-y-0.5 mt-1"> 
            <div className="truncate"> 
              {format(parseISO(currentMatch.date), "EEEE, MMM dd, yyyy")}
              {' at '}
              {currentMatch.time}
            </div>
            {currentMatch.location && (
              <div className="truncate">
                Location: {currentMatch.location}
              </div>
            )}
          </div>
        );
      }}
      onEdit={onEdit ? (item) => onEdit(item as Match) : undefined}
      onDelete={onDelete}
      // dndListeners={dndListeners} // Removed
    />
  );
}
