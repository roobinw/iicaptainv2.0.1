"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import type { Match, Training, User as PlayerUser } from "@/types";
import { updateMatchAttendance } from "@/services/matchService";
import { updateTrainingAttendance } from "@/services/trainingService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";


export type AttendanceStatus = "present" | "absent" | "excused" | "unknown";

interface AttendanceTogglerProps {
  item: Match | Training;
  player: PlayerUser;
  eventType: "match" | "training";
  onAttendanceChange: (playerId: string, status: AttendanceStatus) => void;
  setForceUpdate?: Dispatch<SetStateAction<number>>;
}

export function AttendanceToggler({ item, player, eventType, onAttendanceChange, setForceUpdate }: AttendanceTogglerProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const playerIdForAttendance = player.uid;
  const currentStatus: AttendanceStatus = item.attendance[playerIdForAttendance] || "present"; // Default to "present"

  const handleAttendance = async (newStatus: AttendanceStatus) => {
    if (!item.id || !playerIdForAttendance) {
        toast({title: "Error", description: "Missing event or player ID for attendance update.", variant: "destructive"});
        return;
    }
    if (!currentUser?.teamId) {
        toast({title: "Error", description: "Team information not found. Cannot update attendance.", variant: "destructive"});
        return;
    }

    onAttendanceChange(playerIdForAttendance, newStatus); // Optimistic update in parent (EventCardBase)
    // The setForceUpdate here triggers a page-level re-fetch, which might be too disruptive.
    // However, it's kept for now as it was part of the existing logic to refresh lists.
    if(setForceUpdate) setForceUpdate(val => val + 1);

    try {
      if (eventType === "match") {
        await updateMatchAttendance(currentUser.teamId, item.id, playerIdForAttendance, newStatus);
      } else {
        await updateTrainingAttendance(currentUser.teamId, item.id, playerIdForAttendance, newStatus);
      }
    } catch (error: any) {
      console.error("Error updating attendance in Firestore:", error);
      toast({title: "Update Failed", description: error.message || "Could not save attendance change.", variant: "destructive"});
      // Revert optimistic update if Firestore save fails
      onAttendanceChange(playerIdForAttendance, currentStatus);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={currentStatus === "present" ? "default" : "outline"}
        size="sm"
        onClick={(e) => {
            e.stopPropagation();
            handleAttendance("present");
        }}
        className={cn(
          "p-1 h-7 w-7",
          currentStatus === "present" && "bg-green-500 hover:bg-green-600 text-white border-green-600"
        )}
        aria-label="Mark as Present"
        disabled={!currentUser || currentUser.role !== 'admin'}
      >
        <Icons.CheckCircle2 className="h-4 w-4" />
      </Button>
      <Button
        variant={currentStatus === "absent" ? "default" : "outline"}
        size="sm"
        onClick={(e) => {
            e.stopPropagation();
            handleAttendance("absent");
        }}
        className={cn(
          "p-1 h-7 w-7",
          currentStatus === "absent" && "bg-red-500 hover:bg-red-600 text-white border-red-600"
        )}
        aria-label="Mark as Absent"
        disabled={!currentUser || currentUser.role !== 'admin'}
      >
        <Icons.XCircle className="h-4 w-4" />
      </Button>
      <Button
        variant={currentStatus === "excused" ? "default" : "outline"}
        size="sm"
        onClick={(e) => {
            e.stopPropagation();
            handleAttendance("excused");
        }}
        className={cn(
          "p-1 h-7 w-7",
          currentStatus === "excused" && "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-600"
        )}
        aria-label="Mark as Excused"
        disabled={!currentUser || currentUser.role !== 'admin'}
      >
        <Icons.AlertCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}

export const getAttendanceStatusColor = (status: AttendanceStatus): string => {
  switch (status) {
    case "present":
      return "text-green-600 dark:text-green-400";
    case "absent":
      return "text-red-600 dark:text-red-400";
    case "excused":
      return "text-yellow-600 dark:text-yellow-400";
    default: // This includes "unknown" or any other case, will default to present if not specified
      return "text-muted-foreground";
  }
};

export const getAttendanceStatusText = (status: AttendanceStatus): string => {
  switch (status) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "excused":
      return "Excused";
    default: // This includes "unknown" or any other case
      return "Unknown"; // Keep "Unknown" as a possible display text if status explicitly becomes "unknown"
  }
};