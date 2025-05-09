
"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import type { Match, Training, User } from "@/types";
import { updateMatchAttendance } from "@/services/matchService";
import { updateTrainingAttendance } from "@/services/trainingService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


type AttendanceStatus = "present" | "absent" | "excused" | "unknown";

interface AttendanceTogglerProps {
  item: Match | Training;
  player: User; // User type now includes uid
  eventType: "match" | "training";
  onAttendanceChange: (playerId: string, status: AttendanceStatus) => void; 
  setForceUpdate?: Dispatch<SetStateAction<number>>; 
}

export function AttendanceToggler({ item, player, eventType, onAttendanceChange, setForceUpdate }: AttendanceTogglerProps) {
  const { toast } = useToast();
  // Player ID for attendance key is Firebase UID
  const playerIdForAttendance = player.uid; 
  const currentStatus = item.attendance[playerIdForAttendance] || "unknown";

  const handleAttendance = async (status: AttendanceStatus) => {
    if (!item.id || !playerIdForAttendance) {
        toast({title: "Error", description: "Missing item or player ID for attendance update.", variant: "destructive"});
        return;
    }
    try {
      if (eventType === "match") {
        await updateMatchAttendance(item.id, playerIdForAttendance, status);
      } else {
        await updateTrainingAttendance(item.id, playerIdForAttendance, status);
      }
      onAttendanceChange(playerIdForAttendance, status); // Update local state in parent
      if(setForceUpdate) setForceUpdate(val => val + 1); 
      // toast({title: "Attendance Updated", description: `${player.name}'s status set to ${status}.`});
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      toast({title: "Update Failed", description: error.message || "Could not update attendance.", variant: "destructive"});
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
          currentStatus === "present" && "bg-green-500 hover:bg-green-600 text-white"
        )}
        aria-label="Mark as Present"
      >
        <Icons.CheckCircle2 className="h-4 w-4" />
      </Button>
      <Button
        variant={currentStatus === "absent" ? "default" : "outline"}
        size="sm"
        onClick={() => handleAttendance("absent")}
        className={cn(
          "p-1 h-7 w-7",
          currentStatus === "absent" && "bg-red-500 hover:bg-red-600 text-white"
        )}
        aria-label="Mark as Absent"
      >
        <Icons.XCircle className="h-4 w-4" />
      </Button>
      <Button
        variant={currentStatus === "excused" ? "default" : "outline"}
        size="sm"
        onClick={() => handleAttendance("excused")}
        className={cn(
          "p-1 h-7 w-7",
          currentStatus === "excused" && "bg-yellow-500 hover:bg-yellow-600 text-black"
        )}
        aria-label="Mark as Excused"
      >
        <Icons.AlertCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}

export const getAttendanceStatusColor = (status: AttendanceStatus): string => {
  switch (status) {
    case "present":
      return "text-green-600";
    case "absent":
      return "text-red-600";
    case "excused":
      return "text-yellow-600";
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
