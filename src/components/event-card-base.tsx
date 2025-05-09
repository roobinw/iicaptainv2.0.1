
"use client";

import type { ReactNode, Dispatch, SetStateAction } from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import type { Match, Training, User } from "@/types";
import { useAuth } from "@/lib/auth";
import { getPlayersByTeam } from "@/services/userService";
import { AttendanceToggler, getAttendanceStatusColor, getAttendanceStatusText } from "./attendance-toggler";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";


interface EventCardBaseProps {
  item: Match | Training;
  eventType: "match" | "training";
  icon: ReactNode;
  titlePrefix?: string;
  renderDetails: (item: Match | Training) => ReactNode;
  onEdit?: (item: Match | Training) => void; // Admin only
  onDelete?: (itemId: string) => void; // Admin only
  setForceUpdateList?: Dispatch<SetStateAction<number>>; // To trigger parent list refresh
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
  const { user: currentUser } = useAuth(); 
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [playerList, setPlayerList] = useState<User[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  // Local state for the item's attendance to provide immediate feedback
  const [currentAttendance, setCurrentAttendance] = useState(item.attendance || {});


  useEffect(() => {
    // Update local attendance state if the item prop changes from parent
    setCurrentAttendance(item.attendance || {});
  }, [item.attendance]);


  useEffect(() => {
    if (isAttendanceDialogOpen && currentUser?.teamId) {
      setIsLoadingPlayers(true);
      getPlayersByTeam(currentUser.teamId) 
        .then(fetchedPlayers => {
            setPlayerList(fetchedPlayers);
            // Initialize attendance for any new players not yet in the item's attendance map
            const updatedAttendance = {...currentAttendance};
            fetchedPlayers.forEach(player => {
                if (!(player.uid in updatedAttendance)) {
                    updatedAttendance[player.uid] = 'unknown';
                }
            });
            setCurrentAttendance(updatedAttendance);
        })
        .catch(err => console.error("Failed to fetch players for attendance:", err))
        .finally(() => setIsLoadingPlayers(false));
    }
  }, [isAttendanceDialogOpen, currentUser?.teamId]);

  const isAdmin = currentUser?.role === "admin";

  const handleAttendanceChange = (playerId: string, status: "present" | "absent" | "excused" | "unknown") => {
    // Optimistically update local attendance state for immediate UI feedback
    setCurrentAttendance(prev => ({ ...prev, [playerId]: status }));
    
    // The actual Firestore update is handled by AttendanceToggler.
    // If parent list needs a full refresh (e.g., for summary counts that depend on re-fetch), use setForceUpdateList.
    if (setForceUpdateList) {
      setForceUpdateList(val => val + 1); 
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const presentCount = Object.values(currentAttendance).filter(status => status === 'present').length;
  // Use playerList.length for total if available, otherwise count known UIDs in attendance map
  const totalPlayersToCount = playerList.length > 0 ? playerList.length : Object.keys(currentAttendance).filter(uid => uid !== 'undefined' && uid !== null).length;


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
            Attendance: <span className="font-semibold text-primary">{presentCount} / {isLoadingPlayers && playerList.length === 0 ? '...' : totalPlayersToCount}</span> players present.
        </p>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Icons.Attendance className="mr-2 h-4 w-4" /> Manage Attendance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manage Attendance</DialogTitle>
              <DialogDescription>
                Update attendance for {eventType === "match" ? (item as Match).opponent : (item as Training).location} on {item.date}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] md:h-[400px] pr-4">
              {isLoadingPlayers && playerList.length === 0 ? (
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
                  {playerList.map((player) => ( 
                    <div key={player.uid} className="flex items-center justify-between p-2 border rounded-md bg-card hover:bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint="player face"/>
                          <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className={cn("text-xs", getAttendanceStatusColor(currentAttendance[player.uid] || 'unknown'))}>
                              Status: {getAttendanceStatusText(currentAttendance[player.uid] || 'unknown')}
                          </p>
                        </div>
                      </div>
                      {/* Pass the item with potentially updated currentAttendance to AttendanceToggler if it reads from item.attendance */}
                      {/* Or ensure AttendanceToggler itself uses currentAttendance passed to it */}
                       <AttendanceToggler 
                           item={{...item, attendance: currentAttendance}} // Pass item with current local attendance
                           player={player} 
                           eventType={eventType} 
                           onAttendanceChange={handleAttendanceChange}
                           // setForceUpdate is for the toggler to signal back if needed, not for the parent list.
                           // setForceUpdateList is for this component to signal parent list.
                       />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No players found in your team.</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
