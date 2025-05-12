
"use client";

import type { Message } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { deleteMessage, archiveMessage, unarchiveMessage } from "@/services/messageService";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface MessageCardProps {
  message: Message;
  onMessageDeleted: (messageId: string) => void;
  onMessageArchived?: (messageId: string, isArchived: boolean) => void;
}

export function MessageCard({ message, onMessageDeleted, onMessageArchived }: MessageCardProps) {
  const { user, currentTeam } = useAuth();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!user || !currentTeam || user.role !== "admin") {
      toast({ title: "Error", description: "You do not have permission to delete this message.", variant: "destructive" });
      return;
    }
    try {
      await deleteMessage(currentTeam.id, message.id);
      toast({ title: "Message Deleted", description: "The message has been removed." });
      onMessageDeleted(message.id);
    } catch (error: any) {
      toast({ title: "Error Deleting Message", description: error.message || "Could not delete message.", variant: "destructive" });
    }
  };

  const handleToggleArchive = async () => {
    if (!user || !currentTeam || user.role !== "admin") {
      toast({ title: "Error", description: "You do not have permission to modify this message.", variant: "destructive" });
      return;
    }
    try {
      if (message.isArchived) {
        await unarchiveMessage(currentTeam.id, message.id);
        toast({ title: "Message Unarchived" });
        if (onMessageArchived) onMessageArchived(message.id, false);
      } else {
        await archiveMessage(currentTeam.id, message.id);
        toast({ title: "Message Archived" });
        if (onMessageArchived) onMessageArchived(message.id, true);
      }
    } catch (error: any) {
      toast({ title: "Error Updating Message", description: error.message || "Could not update message status.", variant: "destructive" });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  const formattedDate = message.createdAt 
    ? `${formatDistanceToNow(parseISO(message.createdAt), { addSuffix: true })}`
    : 'Just now';

  return (
    <Card className={cn(
      "shadow-lg hover:shadow-primary/10 transition-shadow duration-300", // Aligned with EventCardBase
      message.isArchived ? "opacity-60 bg-muted/30" : "bg-card" // Aligned with EventCardBase
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src={`https://picsum.photos/seed/${message.authorUid}/40/40`} alt={message.authorName} data-ai-hint="author avatar"/>
                <AvatarFallback>{getInitials(message.authorName)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-base font-medium">{message.authorName}</CardTitle>
                <CardDescription className="text-xs">
                    {formattedDate} {message.isArchived && <span className="italic">(Archived)</span>}
                </CardDescription>
            </div>
            </div>
            {user?.role === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Icons.MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Message options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleArchive} className="cursor-pointer">
                  {message.isArchived ? (
                    <><Icons.ArchiveX className="mr-2 h-4 w-4" /> Unarchive</> // Changed icon for consistency
                  ) : (
                    <><Icons.Archive className="mr-2 h-4 w-4" /> Archive</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive cursor-pointer">
                            <Icons.Delete className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the message.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
            )}
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </CardContent>
    </Card>
  );
}

