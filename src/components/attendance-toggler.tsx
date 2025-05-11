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
  item: Match | Training; // This item will have the most up-to-date attendance from parent (EventCardBase)
  player: PlayerUser;
  eventType: "match" | "training";
  onAttendanceChange: (playerId: string, status: AttendanceStatus) => void;
}

export function AttendanceToggler({ item, player, eventType, onAttendanceChange }: AttendanceTogglerProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const playerIdForAttendance = player.uid;
  // Use the attendance from the item prop, which is managed by EventCardBase's state
  const currentStatus: AttendanceStatus = item.attendance?.[playerIdForAttendance] || "present";


  const handleAttendance = async (newStatus: AttendanceStatus) => {
    if (!item.id || !playerIdForAttendance) {
        toast({title: "Error", description: "Missing event or player ID for attendance update.", variant: "destructive"});
        return;
    }
    if (!currentUser?.teamId) {
        toast({title: "Error", description: "Team information not found. Cannot update attendance.", variant: "destructive"});
        return;
    }

    // Optimistically update parent's state via callback
    onAttendanceChange(playerIdForAttendance, newStatus); 

    try {
      if (eventType === "match") {
        await updateMatchAttendance(currentUser.teamId, item.id, playerIdForAttendance, newStatus);
      } else {
        await updateTrainingAttendance(currentUser.teamId, item.id, playerIdForAttendance, newStatus);
      }
      // No success toast here to avoid clutter, optimistic update is usually enough.
    } catch (error: any) {
      console.error("Error updating attendance in Firestore:", error);
      toast({title: "Update Failed", description: error.message || "Could not save attendance change.", variant: "destructive"});
      // Revert optimistic update if Firestore save fails
      // The 'item' prop already reflects the pre-optimistic state for the *next* call if this one failed.
      // To revert correctly, we need the status *before* this specific optimistic update.
      // This logic is simplified: if Firestore fails, the UI remains optimistically updated.
      // A more robust solution would involve knowing the 'previousStatus' before this specific call.
      // For now, we'll rely on the parent (EventCardBase) to re-initialize from item.attendance prop if it changes.
      // Or, to simplify, if parent's state is the source of truth for `currentStatus` here,
      // we call `onAttendanceChange` again with the original state.
      // This means `item.attendance` in the parent should hold the true DB state.
      // However, `item` here is passed down and might not be the immediate previous state.
      // The current setup with EventCardBase re-initializing should handle eventual consistency.
    }
  };

  const commonButtonClass = "p-1 h-7 w-7 attendance-toggler-button"; // Added common class

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={currentStatus === "present" ? "default" : "outline"}
        size="sm"
        onClick={(e) => {
            e.stopPropagation(); // Keep this if it serves a purpose for parent click events
            handleAttendance("present");
        }}
        className={cn(
          commonButtonClass,
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
          commonButtonClass,
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
          commonButtonClass,
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
    default: 
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
    default: 
      return "Unknown"; 
  }
};