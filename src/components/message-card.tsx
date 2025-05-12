
"use client";

import type { Message } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { deleteMessage } from "@/services/messageService";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons } from "@/components/icons";
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


interface MessageCardProps {
  message: Message;
  onMessageDeleted: (messageId: string) => void; // Callback to refresh messages list or remove locally
}

export function MessageCard({ message, onMessageDeleted }: MessageCardProps) {
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

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  const formattedDate = message.createdAt 
    ? `${formatDistanceToNow(parseISO(message.createdAt), { addSuffix: true })}`
    : 'Just now';

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 bg-card/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
                {/* Placeholder avatar or logic to fetch author's avatar if available */}
                <AvatarImage src={`https://picsum.photos/seed/${message.authorUid}/40/40`} alt={message.authorName} data-ai-hint="author avatar" />
                <AvatarFallback>{getInitials(message.authorName)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-base font-medium">{message.authorName}</CardTitle>
                <CardDescription className="text-xs">
                    {formattedDate}
                </CardDescription>
            </div>
            </div>
            {user?.role === "admin" && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Icons.Delete className="h-4 w-4" />
                    <span className="sr-only">Delete message</span>
                </Button>
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
            )}
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </CardContent>
    </Card>
  );
}
