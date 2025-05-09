
"use client";

import type { ReactNode, Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import type { Match, Training, User } from "@/types";
import { useAuth } from "@/lib/auth";
import { mockUsers } from "@/lib/mock-data";
import { AttendanceToggler, getAttendanceStatusColor, getAttendanceStatusText } from "./attendance-toggler";

interface EventCardBaseProps {
  item: Match | Training;
  eventType: "match" | "training";
  icon: ReactNode;
  titlePrefix?: string;
  renderDetails: (item: Match | Training) => ReactNode;
  onEdit?: (item: Match | Training) => void;
  onDelete?: (itemId: string) => void;
  // Force re-render for mock data changes
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
  const { user } = useAuth();
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  // Local state to trigger re-render of this card's attendance list
  const [forceUpdateCard, setForceUpdateCard] = useState(0);

  const isAdmin = user?.role === "admin";

  const handleAttendanceChange = (playerId: string, status: "present" | "absent" | "excused" | "unknown") => {
    // This function body is mostly for demonstrating the connection
    // Actual update logic is within AttendanceToggler using mock-data functions
    console.log(`Attendance for ${playerId} in ${eventType} ${item.id} changed to ${status}`);
    setForceUpdateCard(val => val + 1); // Re-render this card's attendance list
    if (setForceUpdateList) setForceUpdateList(val => val + 1); // Re-render the parent list if needed
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const presentCount = Object.values(item.attendance).filter(status => status === 'present').length;
  const totalPlayers = mockUsers.filter(u => u.role === 'player').length;

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
        {/* Additional content specific to match/training can go here if needed */}
        <p className="text-sm text-muted-foreground">
            Attendance: <span className="font-semibold text-primary">{presentCount} / {totalPlayers}</span> players present.
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
              <div className="space-y-3 py-1">
                {mockUsers.filter(u => u.role === 'player').map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 border rounded-md bg-card hover:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint="player avatar"/>
                        <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className={cn("text-xs", getAttendanceStatusColor(item.attendance[player.id] || 'unknown'))}>
                            Status: {getAttendanceStatusText(item.attendance[player.id] || 'unknown')}
                        </p>
                      </div>
                    </div>
                    {isAdmin ? (
                       <AttendanceToggler 
                         item={item} 
                         player={player} 
                         eventType={eventType} 
                         onAttendanceChange={handleAttendanceChange} 
                         setForceUpdate={setForceUpdateCard}
                       />
                    ) : (
                       <span className={cn("text-sm font-semibold", getAttendanceStatusColor(item.attendance[player.id] || 'unknown'))}>
                           {getAttendanceStatusText(item.attendance[player.id] || 'unknown')}
                       </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            {/* <DialogFooter className="mt-4">
              <Button onClick={() => setIsAttendanceDialogOpen(false)}>Done</Button>
            </DialogFooter> */}
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
