
"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import type { Match, Training, User, RefereeingAssignment } from "@/types";
import { useAuth } from "@/lib/auth";
import { getAllUsersByTeam } from "@/services/userService";
import { AttendanceToggler, getAttendanceStatusColor, getAttendanceStatusText, type AttendanceStatus } from "./attendance-toggler";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { AssignPlayersForm } from "@/components/assign-players-form";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";


interface EventCardBaseProps {
  item: Match | Training | RefereeingAssignment;
  eventType: "match" | "training" | "refereeing";
  icon: ReactNode;
  titlePrefix?: string;
  renderDetails: (item: Match | Training | RefereeingAssignment) => ReactNode;
  onEdit?: (item: Match | Training | RefereeingAssignment) => void;
  onDelete?: (itemId: string) => void;
  onAssignPlayersSuccess?: () => void;
  onArchiveToggle?: (item: Match | Training | RefereeingAssignment) => void;
}

export function EventCardBase({
  item,
  eventType,
  icon,
  titlePrefix = "",
  renderDetails,
  onEdit,
  onDelete,
  onAssignPlayersSuccess,
  onArchiveToggle,
}: EventCardBaseProps) {
  const { user: currentUser } = useAuth(); 
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isAssignPlayersDialogOpen, setIsAssignPlayersDialogOpen] = useState(false);
  const [allTeamMembers, setAllTeamMembers] = useState<User[]>([]); // Store all members
  const [attendanceEligibleMembers, setAttendanceEligibleMembers] = useState<User[]>([]); // Filtered list for attendance
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  const initialAttendanceSource = (eventType === "match" || eventType === "training")
    ? (item as Match | Training).attendance
    : {};
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, AttendanceStatus>>(initialAttendanceSource || {});

  const initializeAttendance = useCallback((members: User[], eventAttendance: Record<string, AttendanceStatus> | undefined) => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    const safeEventAttendance = eventAttendance || {};
    members.forEach(member => {
      newAttendance[member.uid] = safeEventAttendance[member.uid] || 'present';
    });
    for (const uid in safeEventAttendance) {
        if (!newAttendance[uid]) {
            newAttendance[uid] = safeEventAttendance[uid];
        }
    }
    setCurrentAttendance(newAttendance);
  }, []);

  useEffect(() => {
    if (currentUser?.teamId) {
      setIsLoadingMembers(true);
      getAllUsersByTeam(currentUser.teamId)
        .then(fetchedMembers => {
          setAllTeamMembers(fetchedMembers); // Set all members first

          // Filter for attendance eligibility
          let eligibleMembers: User[] = [];
          if (eventType === "match") {
            eligibleMembers = fetchedMembers.filter(m => m.isMatchMember);
          } else if (eventType === "training") {
            eligibleMembers = fetchedMembers.filter(m => m.isTrainingMember);
          } else {
            eligibleMembers = fetchedMembers; // For refereeing or other types, use all
          }
          setAttendanceEligibleMembers(eligibleMembers);
          
          if (eventType === "match" || eventType === "training") {
            initializeAttendance(eligibleMembers, (item as Match | Training).attendance);
          }
        })
        .catch(err => {
          console.error(`Failed to fetch team members for ${eventType} card:`, err);
          setAllTeamMembers([]);
          setAttendanceEligibleMembers([]);
          if (eventType === "match" || eventType === "training") {
            initializeAttendance([], (item as Match | Training).attendance);
          }
        })
        .finally(() => setIsLoadingMembers(false));
    } else {
      setAllTeamMembers([]);
      setAttendanceEligibleMembers([]);
      if (eventType === "match" || eventType === "training") {
        initializeAttendance([], (item as Match | Training).attendance);
      }
      setIsLoadingMembers(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.teamId, item.id, eventType, (eventType === "match" || eventType === "training") ? (item as Match | Training).attendance : null]);


  useEffect(() => {
    if (eventType === "match" || eventType === "training") {
      // Re-initialize attendance if item.attendance changes or eligible members list changes
      initializeAttendance(attendanceEligibleMembers, (item as Match | Training).attendance);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(eventType === "match" || eventType === "training") ? (item as Match | Training).attendance : null, attendanceEligibleMembers, eventType]);


  const isAdmin = currentUser?.role === "admin";

  const handleAttendanceChange = useCallback((memberId: string, status: AttendanceStatus) => {
    setCurrentAttendance(prev => ({ ...prev, [memberId]: status }));
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  // Use attendanceEligibleMembers for attendance count
  const presentCount = Object.values(currentAttendance).filter(status => status === 'present').length;
  const totalMembersForAttendanceCount = attendanceEligibleMembers.length;


  let eventNameForDialog: string;
  let eventDateForDialog: string = "";

  if (eventType === "match" && 'opponent' in item && 'date' in item) {
    eventNameForDialog = (item as Match).opponent;
    eventDateForDialog = (item as Match).date;
  } else if (eventType === "training" && 'location' in item && 'date' in item) {
    eventNameForDialog = (item as Training).location;
    eventDateForDialog = (item as Training).date;
  } else if (eventType === "refereeing" && 'date' in item) {
    eventNameForDialog = `Assignment`;
    eventDateForDialog = (item as RefereeingAssignment).date;
  } else {
    eventNameForDialog = "Event";
    eventDateForDialog = item.date;
  }

  const cardTitle =
    eventType === "match" && 'opponent' in item
      ? `${titlePrefix || ""} ${item.opponent}` 
      : eventType === "training" && 'location' in item
      ? `${item.location}`
      : eventType === "refereeing" && 'date' in item && 'homeTeam' in item
      ? `Assignment - ${item.homeTeam || 'TBD'}`
      : eventType === "refereeing" && 'date' in item
      ? `Assignment - ${format(parseISO(item.date), "MMM dd")}`
      : `Event`;


  return (
    <Card className={cn(
      "shadow-lg hover:shadow-primary/10 transition-shadow duration-300 flex flex-col h-full w-full",
      item.isArchived && "opacity-60 bg-muted/30"
      )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
             <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              {icon}
              <span className="truncate min-w-0">
                 {cardTitle}
              </span>
              {item.isArchived && <Badge variant="outline" className="ml-auto text-xs shrink-0">Archived</Badge>}
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
                {renderDetails(item)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-2 pb-3">
         {(eventType === "match" || eventType === "training") && (
            <div className="text-sm text-muted-foreground">
                Attendance: {isLoadingMembers && attendanceEligibleMembers.length === 0 ? (
                    <span className="inline-block"><Skeleton className="h-4 w-20" /></span>
                ) : (
                    <span className="font-semibold text-primary">{presentCount} / {totalMembersForAttendanceCount}</span>
                )} {eventType === "match" ? "match" : "training"} members present.
            </div>
         )}
         {eventType === "refereeing" && 'assignedPlayerUids' in item && (item as RefereeingAssignment).assignedPlayerUids && (item as RefereeingAssignment).assignedPlayerUids!.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">{(item as RefereeingAssignment).assignedPlayerUids!.length}</span> member(s) assigned.
            </div>
         )}
      </CardContent>
      <CardFooter className="border-t pt-3 flex items-center justify-start gap-2 flex-wrap">
        {(eventType === "match" || eventType === "training") && (
            <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground whitespace-nowrap">
                <Icons.Attendance className="mr-2 h-4 w-4" /> Manage Attendance
                </Button>
            </DialogTrigger>
            <DialogContent
                className="w-[95vw] max-w-[400px] sm:max-w-md md:max-w-lg"
                onInteractOutside={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('.attendance-toggler-button') || target.closest('[role="menuitemradio"]')) {
                    e.preventDefault();
                }
                }}
            >
                <DialogHeader>
                <DialogTitle>Manage Attendance</DialogTitle>
                <DialogDescription>
                    Update attendance for {eventNameForDialog} on {format(parseISO(eventDateForDialog), "MMM dd, yyyy")}.
                    Showing {eventType === "match" ? "match-participating" : "training-participating"} members.
                </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] md:h-[400px] pr-4">
                {isLoadingMembers && attendanceEligibleMembers.length === 0 ? (
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
                ) : attendanceEligibleMembers.length > 0 ? (
                    <div className="space-y-3 py-1">
                    {attendanceEligibleMembers.map((member) => (
                        <div key={member.uid} className="flex items-center justify-between p-2 border rounded-md bg-card hover:bg-secondary/30">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} data-ai-hint="team member face"/>
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
                            item={{...(item as Match | Training), attendance: currentAttendance}}
                            player={member}
                            eventType={eventType as "match" | "training"}
                            onAttendanceChange={handleAttendanceChange}
                        />
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">
                        No members eligible for {eventType} attendance found. Check member responsibilities.
                    </p>
                )}
                </ScrollArea>
            </DialogContent>
            </Dialog>
        )}
        {eventType === "refereeing" && isAdmin && (
          <Dialog open={isAssignPlayersDialogOpen} onOpenChange={setIsAssignPlayersDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground whitespace-nowrap">
                <Icons.Users className="mr-2 h-4 w-4" /> Manage Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-md md:max-w-lg">
              <DialogHeader>
                <DialogTitle>Assign Members</DialogTitle>
                <DialogDescription>
                  Assign members to refereeing duty for {eventNameForDialog} on {format(parseISO(eventDateForDialog), "MMM dd, yyyy")}.
                </DialogDescription>
              </DialogHeader>
              <AssignPlayersForm
                assignment={item as RefereeingAssignment}
                teamMembers={allTeamMembers} 
                isLoadingMembers={isLoadingMembers}
                onClose={() => setIsAssignPlayersDialogOpen(false)}
                onAssignSuccess={() => {
                  setIsAssignPlayersDialogOpen(false);
                  if(onAssignPlayersSuccess) onAssignPlayersSuccess();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
        {isAdmin && (onEdit || onDelete || onArchiveToggle) && (
            <div className="ml-auto flex-shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/50">
                            <Icons.MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card text-card-foreground border-border shadow-xl">
                        {onEdit && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item);}} className="hover:bg-accent/50 cursor-pointer">
                                <Icons.Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                        )}
                        {onArchiveToggle && (
                           <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (onArchiveToggle) onArchiveToggle(item); }} className="hover:bg-accent/50 cursor-pointer">
                                {item.isArchived ? (
                                    <><Icons.ArchiveX className="mr-2 h-4 w-4" /> Unarchive</>
                                ) : (
                                    <><Icons.Archive className="mr-2 h-4 w-4" /> Archive</>
                                )}
                            </DropdownMenuItem>
                        )}
                        {onDelete && (
                            <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(item.id);}} className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                <Icons.Delete className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}
