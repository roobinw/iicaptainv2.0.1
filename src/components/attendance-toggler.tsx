
"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import type { Match, Training, User } from "@/types";
import { updatePlayerAttendance } from "@/lib/mock-data"; // Assuming this exists

type AttendanceStatus = "present" | "absent" | "excused" | "unknown";

interface AttendanceTogglerProps {
  item: Match | Training;
  player: User;
  eventType: "match" | "training";
  // This would typically be a mutation function or state updater from a hook
  onAttendanceChange: (playerId: string, status: AttendanceStatus) => void; 
  // Force a re-render if needed (simplified state management)
  setForceUpdate?: Dispatch<SetStateAction<number>>; 
}

export function AttendanceToggler({ item, player, eventType, onAttendanceChange, setForceUpdate }: AttendanceTogglerProps) {
  const currentStatus = item.attendance[player.id] || "unknown";

  const handleAttendance = (status: AttendanceStatus) => {
    // In a real app, this would be an API call
    updatePlayerAttendance(item.id, eventType, player.id, status);
    onAttendanceChange(player.id, status);
    if(setForceUpdate) setForceUpdate(val => val + 1); // Trigger re-render for mock
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

// Helper function to get status color - can be used for text or backgrounds
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
// Helper function to get status display text
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

import { cn } from "@/lib/utils";
