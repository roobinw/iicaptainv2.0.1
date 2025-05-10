
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
  const { user: currentUser, currentTeam } = useAuth(); 
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [memberList, setMemberList] = useState<User[]>([]); 
  const [isLoadingMembers, setIsLoadingMembers] = useState(true); 
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, AttendanceStatus>>(item.attendance || {});


  useEffect(() => {
    if (currentUser?.teamId) {
      setIsLoadingMembers(true);
      getAllUsersByTeam(currentUser.teamId)
        .then(fetchedMembers => {
          setMemberList(fetchedMembers);
          const initialAttendanceFromItem = item.attendance || {};
          const newInitializedAttendance: Record<string, AttendanceStatus> = {};

          fetchedMembers.forEach(member => {
            newInitializedAttendance[member.uid] = initialAttendanceFromItem[member.uid] || 'present';
          });
          setCurrentAttendance(newInitializedAttendance);
        })
        .catch(err => {
          console.error(`Failed to fetch team members for ${eventType} card:`, err);
          setMemberList([]);
          const initialAttendanceFromItem = item.attendance || {};
          const fallbackAttendance: Record<string, AttendanceStatus> = {};
           // memberList could be stale here if getAllUsersByTeam failed, so initialize with empty array or last known state
           // For safety, let's assume it might be empty if fetch failed.
           // If there's a desire to use previous memberList if fetch fails:
           // const membersToIterate = memberList.length > 0 ? memberList : [];
           // membersToIterate.forEach(member => { ... })
           // However, it's safer to clear or rely on fetchedMembers even if it's an empty array from catch
          setCurrentAttendance(initialAttendanceFromItem); // Fallback to item's attendance or empty {}
        })
        .finally(() => setIsLoadingMembers(false));
    } else {
      setMemberList([]);
      setCurrentAttendance(item.attendance || {}); 
      setIsLoadingMembers(false);
    }
  // Rerun if item.id changes (new item selected) or if user/team context changes
  }, [currentUser?.teamId, item.id, eventType]); 

  useEffect(() => {
    // This effect ensures that if item.attendance prop changes externally
    // (e.g. parent list re-fetches and passes updated item),
    // the internal currentAttendance state is updated accordingly,
    // especially initializing new members to 'present'.
    const initialAttendanceFromItem = item.attendance || {};
    const updatedAttendanceState: Record<string, AttendanceStatus> = {};

    memberList.forEach(member => {
        updatedAttendanceState[member.uid] = initialAttendanceFromItem[member.uid] || 'present';
    });
    setCurrentAttendance(updatedAttendanceState);
    
  }, [item.attendance, memberList]);


  const isAdmin = currentUser?.role === "admin";

  const handleAttendanceChange = (memberId: string, status: AttendanceStatus) => {
    setCurrentAttendance(prev => ({ ...prev, [memberId]: status }));
  };
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const presentCount = Object.values(currentAttendance).filter(status => status === 'present').length;
  
  const eventName = eventType === "match" ? (item as Match).opponent : (item as Training).location;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
               {eventType === "match" ? (
                <>
                  {currentTeam?.name || "Your Team"} {titlePrefix} {eventName}
                </>
              ) : (
                <>
                  {icon} {eventName}
                </>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{renderDetails(item)}</CardDescription>
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
            Attendance: {isLoadingMembers && memberList.length === 0 ? ( 
                <span className="inline-block"><Skeleton className="h-4 w-20" /></span>
            ) : (
                <span className="font-semibold text-primary">{presentCount} / {memberList.length}</span>
            )} members present.
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
                Update attendance for {eventName} on {format(parseISO(item.date), "MMM dd, yyyy")}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] md:h-[400px] pr-4">
              {isLoadingMembers && memberList.length === 0 ? ( 
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
                           item={{...item, attendance: currentAttendance}} 
                           player={member} 
                           eventType={eventType} 
                           onAttendanceChange={handleAttendanceChange} 
                           setForceUpdate={setForceUpdateList} 
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
