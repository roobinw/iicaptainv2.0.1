"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import type { Match, Training, User } from "@/types";
import { useAuth } from "@/lib/auth";
import { getAllUsersByTeam } from "@/services/userService"; 
import { AttendanceToggler, getAttendanceStatusColor, getAttendanceStatusText, type AttendanceStatus } from "./attendance-toggler";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";


interface EventCardBaseProps {
  item: Match | Training;
  eventType: "match" | "training";
  icon: ReactNode;
  titlePrefix?: string;
  renderDetails: (item: Match | Training) => ReactNode;
  onEdit?: (item: Match | Training) => void; 
  onDelete?: (itemId: string) => void; 
  dndListeners?: any; // For drag-and-drop handle, passed from SortableItem
}

export function EventCardBase({
  item,
  eventType,
  icon,
  titlePrefix = "",
  renderDetails,
  onEdit,
  onDelete,
  dndListeners, 
}: EventCardBaseProps) {
  const { user: currentUser, currentTeam } = useAuth(); 
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [memberList, setMemberList] = useState<User[]>([]); 
  const [isLoadingMembers, setIsLoadingMembers] = useState(true); 
  // This state now reflects the attendance including defaults for all members
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, AttendanceStatus>>({});


  const initializeAttendance = useCallback((members: User[], eventAttendance: Record<string, AttendanceStatus>) => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    members.forEach(member => {
      newAttendance[member.uid] = eventAttendance[member.uid] || 'present'; // Default to 'present'
    });
    // Also include any pre-existing attendance for users not in current memberList (e.g. if a user was removed)
    // Though ideally, this shouldn't happen often if memberList is the source of truth for who *can* have attendance.
    for (const uid in eventAttendance) {
        if (!newAttendance[uid]) {
            newAttendance[uid] = eventAttendance[uid];
        }
    }
    setCurrentAttendance(newAttendance);
  }, []);
  
  useEffect(() => {
    if (currentUser?.teamId) {
      setIsLoadingMembers(true);
      getAllUsersByTeam(currentUser.teamId)
        .then(fetchedMembers => {
          setMemberList(fetchedMembers);
          // Initialize attendance after members are fetched
          initializeAttendance(fetchedMembers, item.attendance || {});
        })
        .catch(err => {
          console.error(`Failed to fetch team members for ${eventType} card:`, err);
          setMemberList([]);
          // Initialize with item.attendance even if members fetch fails, to show existing data
          initializeAttendance([], item.attendance || {});
        })
        .finally(() => setIsLoadingMembers(false));
    } else {
      setMemberList([]);
      initializeAttendance([], item.attendance || {}); // Initialize with empty members if no teamId
      setIsLoadingMembers(false);
    }
  }, [currentUser?.teamId, item.id, item.attendance, eventType, initializeAttendance]);


  // This effect ensures that if item.attendance prop changes externally (e.g., after a list refresh),
  // the local currentAttendance state is re-initialized based on the new prop and current memberList.
  useEffect(() => {
    initializeAttendance(memberList, item.attendance || {});
  }, [item.attendance, memberList, initializeAttendance]);


  const isAdmin = currentUser?.role === "admin";

  const handleAttendanceChange = useCallback((memberId: string, status: AttendanceStatus) => {
    setCurrentAttendance(prev => ({ ...prev, [memberId]: status }));
    // The actual Firestore update is handled by AttendanceToggler
  }, []);
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const presentCount = Object.values(currentAttendance).filter(status => status === 'present').length;
  const totalMembersForAttendanceCount = memberList.length > 0 ? memberList.length : Object.keys(currentAttendance).length;
  
  const eventName = eventType === "match" ? (item as Match).opponent : (item as Training).location;

  return (
    <Card className="shadow-lg hover:shadow-primary/10 transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0"> {/* Added flex-1 and min-w-0 for better truncation handling */}
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl truncate">
               {icon} {currentTeam?.name || "Team"} {eventType === "match" ? titlePrefix : ""} {eventName}
            </CardTitle>
            <CardDescription className="mt-1">{renderDetails(item)}</CardDescription>
          </div>

          {isAdmin && (onEdit || onDelete || dndListeners) && (
            <div className="flex items-center gap-0.5 ml-2 shrink-0"> {/* Added shrink-0 */}
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(item);}} aria-label={`Edit ${eventType}`} className="h-8 w-8 hover:bg-sidebar-accent">
                  <Icons.Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(item.id);}} aria-label={`Delete ${eventType}`} className="h-8 w-8 hover:bg-sidebar-accent">
                  <Icons.Delete className="h-4 w-4 text-destructive" />
                </Button>
              )}
              {dndListeners && ( 
                <Button variant="ghost" size="icon" {...dndListeners} aria-label="Reorder" className="h-8 w-8 cursor-grab active:cursor-grabbing hover:bg-sidebar-accent">
                  <Icons.MoreVertical className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
         <div className="text-sm text-muted-foreground">
            Attendance: {isLoadingMembers && memberList.length === 0 && totalMembersForAttendanceCount === 0 ? ( 
                <span className="inline-block"><Skeleton className="h-4 w-20" /></span>
            ) : (
                <span className="font-semibold text-primary">{presentCount} / {totalMembersForAttendanceCount}</span>
            )} members present.
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full hover:bg-accent hover:text-accent-foreground">
              <Icons.Attendance className="mr-2 h-4 w-4" /> Manage Attendance
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="w-[95vw] max-w-[400px] sm:max-w-md md:max-w-lg" // Adjusted responsive widths
            onInteractOutside={(e) => {
              // Allow interaction with attendance toggler buttons without closing dialog
              const target = e.target as HTMLElement;
              if (target.closest('.attendance-toggler-button')) { // Added class to toggler buttons
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Manage Attendance</DialogTitle>
              <DialogDescription>
                Update attendance for {eventName} on {format(parseISO(item.date), "MMM dd, yyyy")}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] md:h-[400px] pr-4">
              {isLoadingMembers && memberList.length === 0 && totalMembersForAttendanceCount === 0 ? ( 
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
              ) : memberList.length > 0 ? (
                <div className="space-y-3 py-1">
                  {memberList.map((member) => (  
                    <div key={member.uid} className="flex items-center justify-between p-2 border rounded-md bg-card hover:bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="team member face"/>
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className={cn("text-xs", getAttendanceStatusColor(currentAttendance[member.uid] || 'present'))}>
                              Status: {getAttendanceStatusText(currentAttendance[member.uid] || 'present')}
                          </p>
                        </div>
                      </div>
                       <AttendanceToggler 
                           item={{...item, attendance: currentAttendance}} // Pass currentAttendance state
                           player={member} 
                           eventType={eventType} 
                           onAttendanceChange={handleAttendanceChange} 
                       />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No members found in your team.</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}