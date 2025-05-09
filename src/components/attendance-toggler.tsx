
"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import type { Match, Training, User as PlayerUser } from "@/types"; // Renamed User to PlayerUser to avoid conflict
import { updateMatchAttendance } from "@/services/matchService";
import { updateTrainingAttendance } from "@/services/trainingService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";


type AttendanceStatus = "present" | "absent" | "excused" | "unknown";

interface AttendanceTogglerProps {
  item: Match | Training; // This item should have the most up-to-date attendance map from EventCardBase
  player: PlayerUser; 
  eventType: "match" | "training";
  onAttendanceChange: (playerId: string, status: AttendanceStatus) => void; 
  // setForceUpdate is optional, can be used if Toggler needs to trigger a re-render of itself or its direct parent if state is complex
  setForceUpdate?: Dispatch<SetStateAction<number>>; 
}

export function AttendanceToggler({ item, player, eventType, onAttendanceChange, setForceUpdate }: AttendanceTogglerProps) {
  const { user: currentUser } = useAuth(); // For teamId and potentially role checks
  const { toast } = useToast();
  
  // Ensure player.uid is used, as 'id' might be Firestore doc ID from User type, but attendance keys are Firebase UIDs.
  const playerIdForAttendance = player.uid; 
  const currentStatus = item.attendance[playerIdForAttendance] || "unknown";

  const handleAttendance = async (newStatus: AttendanceStatus) => {
    if (!item.id || !playerIdForAttendance) {
        toast({title: "Error", description: "Missing event or player ID for attendance update.", variant: "destructive"});
        return;
    }
    if (!currentUser?.teamId) {
        toast({title: "Error", description: "Team information not found. Cannot update attendance.", variant: "destructive"});
        return;
    }

    // Optimistically call onAttendanceChange to update UI in EventCardBase immediately
    onAttendanceChange(playerIdForAttendance, newStatus);
    if(setForceUpdate) setForceUpdate(val => val + 1); // If Toggler itself needs a re-render

    try {
      if (eventType === "match") {
        await updateMatchAttendance(currentUser.teamId, item.id, playerIdForAttendance, newStatus);
      } else {
        await updateTrainingAttendance(currentUser.teamId, item.id, playerIdForAttendance, newStatus);
      }
      // Toast success (optional, can be too noisy if updating many players)
      // toast({title: "Attendance Updated", description: `${player.name}'s status set to ${newStatus}.`});
    } catch (error: any) {
      console.error("Error updating attendance in Firestore:", error);
      toast({title: "Update Failed", description: error.message || "Could not save attendance change.", variant: "destructive"});
      // Revert optimistic update if Firestore fails
      onAttendanceChange(playerIdForAttendance, currentStatus); // Revert to original status
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={currentStatus === "present" ? "default" : "outline"}
        size="sm"
        onClick={() => handleAttendance("present")}
        className={cn(
          "p-1 h-7 w-7", 
          currentStatus === "present" && "bg-green-500 hover:bg-green-600 text-white border-green-600"
        )}
        aria-label="Mark as Present"
        disabled={!currentUser || currentUser.role !== 'admin'} // Only admin can change
      >
        <Icons.CheckCircle2 className="h-4 w-4" />
      </Button>
      <Button
        variant={currentStatus === "absent" ? "default" : "outline"}
        size="sm"
        onClick={() => handleAttendance("absent")}
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
        onClick={() => handleAttendance("excused")}
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
