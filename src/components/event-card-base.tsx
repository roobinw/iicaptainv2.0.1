
"use client";

import type { ReactNode, Dispatch, SetStateAction } from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // DialogTrigger is used inside
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import type { Match, Training, User } from "@/types";
import { useAuth } from "@/lib/auth";
import { getPlayers } from "@/services/userService"; // To fetch actual players
import { AttendanceToggler, getAttendanceStatusColor, getAttendanceStatusText } from "./attendance-toggler";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";


interface EventCardBaseProps {
  item: Match | Training;
  eventType: "match" | "training";
  icon: ReactNode;
  titlePrefix?: string;
  renderDetails: (item: Match | Training) => ReactNode;
  onEdit?: (item: Match | Training) => void;
  onDelete?: (itemId: string) => void;
  setForceUpdateList?: Dispatch<SetStateAction<number>>;
}

export function EventCardBase({
  item,
  eventType,
  icon,
  titlePrefix = "",
  renderDetails,
  onEdit,
  onDelete,
  setForceUpdateList
}: EventCardBaseProps) {
  const { user: currentUser } = useAuth(); // Renamed to avoid conflict with player in map
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [forceUpdateCard, setForceUpdateCard] = useState(0);
  const [playerList, setPlayerList] = useState<User[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  useEffect(() => {
    if (isAttendanceDialogOpen && playerList.length === 0) {
      setIsLoadingPlayers(true);
      getPlayers()
        .then(setPlayerList)
        .catch(err => console.error("Failed to fetch players for attendance:", err))
        .finally(() => setIsLoadingPlayers(false));
    }
  }, [isAttendanceDialogOpen, playerList.length]);

  const isAdmin = currentUser?.role === "admin";

  const handleAttendanceChange = (playerId: string, status: "present" | "absent" | "excused" | "unknown") => {
    // The actual update logic is now within AttendanceToggler calling Firestore services
    // This function will update the local item's attendance state to reflect change immediately
    const updatedItem = { ...item };
    updatedItem.attendance = { ...updatedItem.attendance, [playerId]: status };
    // If parent component (MatchesPage/TrainingsPage) needs to re-render its list due to this change
    // (e.g., to update summary counts without a full refetch), this can be propagated.
    // However, setForceUpdateList is usually for CRUD ops, not individual attendance toggles.
    // Direct re-render of the card is handled by forceUpdateCard.
    setForceUpdateCard(val => val + 1); 
    if (setForceUpdateList) setForceUpdateList(val => val + 1); // This forces list refetch, which includes attendance
  };
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const presentCount = Object.values(item.attendance).filter(status => status === 'present').length;
  const totalPlayersToCount = playerList.length > 0 ? playerList.length : Object.keys(item.attendance).length; // Fallback if playerList not loaded

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {titlePrefix} {eventType === "match" ? (item as Match).opponent : (item as Training).location}
            </CardTitle>
            <CardDescription>{renderDetails(item)}</CardDescription>
          </div>
          {isAdmin && (onEdit || onDelete) && (
            <div className="flex gap-1">
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)} aria-label={`Edit ${eventType}`}>
                  <Icons.Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} aria-label={`Delete ${eventType}`}>
                  <Icons.Delete className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
            Attendance: <span className="font-semibold text-primary">{presentCount} / {totalPlayersToCount || "?"}</span> players present.
        </p>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
          <Dialog.Trigger asChild>
            <Button variant="outline" className="w-full">
              <Icons.Attendance className="mr-2 h-4 w-4" /> Manage Attendance
            </Button>
          </Dialog.Trigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manage Attendance</DialogTitle>
              <DialogDescription>
                Update attendance for {eventType === "match" ? (item as Match).opponent : (item as Training).location} on {item.date}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] md:h-[400px] pr-4">
              {isLoadingPlayers ? (
                <div className="space-y-3 py-1">
                  {[1,2,3].map(i => (
                     <div key={i} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-7 w-24" />
                     </div>
                  ))}
                </div>
              ) : playerList.length > 0 ? (
                <div className="space-y-3 py-1">
                  {playerList.map((player) => ( // player here is from the fetched playerList
                    <div key={player.uid} className="flex items-center justify-between p-2 border rounded-md bg-card hover:bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint="player avatar"/>
                          <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className={cn("text-xs", getAttendanceStatusColor(item.attendance[player.uid] || 'unknown'))}>
                              Status: {getAttendanceStatusText(item.attendance[player.uid] || 'unknown')}
                          </p>
                        </div>
                      </div>
                      {isAdmin ? (
                         <AttendanceToggler 
                           item={item} 
                           player={player} // Pass the full player object from playerList
                           eventType={eventType} 
                           onAttendanceChange={handleAttendanceChange} 
                           setForceUpdate={setForceUpdateCard} // This updates the card itself
                         />
                      ) : (
                         <span className={cn("text-sm font-semibold", getAttendanceStatusColor(item.attendance[player.uid] || 'unknown'))}>
                             {getAttendanceStatusText(item.attendance[player.uid] || 'unknown')}
                         </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No players found or an error occurred.</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
