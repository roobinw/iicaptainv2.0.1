
"use client";

import { format, parseISO } from "date-fns";
import { Icons } from "@/components/icons";
import type { Match, Training } from "@/types";
import { EventCardBase } from "./event-card-base";
import type { Dispatch, SetStateAction } from "react";

interface MatchCardProps {
  match: Match;
  onEdit: (match: Match) => void;
  onDelete: (matchId: string) => void;
  setForceUpdateList?: Dispatch<SetStateAction<number>>;
}

export function MatchCard({ match, onEdit, onDelete, setForceUpdateList }: MatchCardProps) {
  return (
    <EventCardBase
      item={match}
      eventType="match"
      icon={<Icons.Matches className="h-5 w-5 text-primary" />}
      titlePrefix="vs"
      renderDetails={(item) => {
        const currentMatch = item as Match;
        return (
          <>
            {format(parseISO(currentMatch.date), "EEEE, MMMM dd, yyyy")} at {currentMatch.time}
            <br />
            Location: {currentMatch.location || "N/A"}
          </>
        );
      }}
      onEdit={() => onEdit(match)}
      onDelete={() => onDelete(match.id)}
      setForceUpdateList={setForceUpdateList}
    />
  );
}
