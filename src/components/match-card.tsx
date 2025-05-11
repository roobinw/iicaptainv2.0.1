
"use client";

import { format, parseISO } from "date-fns";
import { Icons } from "@/components/icons";
import type { Match, Training } from "@/types"; 
import { EventCardBase } from "./event-card-base";

interface MatchCardProps {
  match: Match;
  onEdit?: (match: Match) => void;
  onDelete?: (matchId: string) => void;
  dndListeners?: any; // For drag-and-drop handle
}

export function MatchCard({ match, onEdit, onDelete, dndListeners }: MatchCardProps) {
  return (
    <EventCardBase
      item={match}
      eventType="match"
      icon={<Icons.Matches className="h-5 w-5 text-primary" />}
      titlePrefix="vs"
      renderDetails={(itemDetails) => { 
        const currentMatch = itemDetails as Match;
        return (
          <div className="text-xs sm:text-sm space-y-0.5"> {/* Stack details and adjust text size */}
            <div> {/* Date and Time line */}
              {format(parseISO(currentMatch.date), "EEE, MMM dd, yyyy")} {/* Shorter date format */}
              {' at '}
              {currentMatch.time}
            </div>
            {currentMatch.location && (
              <div className="truncate"> {/* Truncate location if too long */}
                Location: {currentMatch.location}
              </div>
            )}
          </div>
        );
      }}
      onEdit={onEdit ? (item) => onEdit(item as Match) : undefined} 
      onDelete={onDelete}
      dndListeners={dndListeners} // Pass down dndListeners
    />
  );
}
