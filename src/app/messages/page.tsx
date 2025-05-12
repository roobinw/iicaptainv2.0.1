"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { Message } from "@/types";
import { getMessages } from "@/services/messageService";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInputForm } from "@/components/message-input-form";
import { MessageCard } from "@/components/message-card";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MessagesPage() {
  const { user, currentTeam, isLoading: authIsLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const fetchTeamMessages = useCallback(async (teamId: string) => {
    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await getMessages(teamId); // Sorted by createdAt desc
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Error fetching team messages:", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (authIsLoading || !user || !user.teamId || !currentTeam) {
      if (!authIsLoading && (!user || !user.teamId || !currentTeam)) {
        setIsLoadingMessages(false);
      } else {
        setIsLoadingMessages(true);
      }
      return;
    }
    fetchTeamMessages(user.teamId);
  }, [user, currentTeam, authIsLoading, fetchTeamMessages]);

  const handleMessagePosted = useCallback(() => {
    if (user?.teamId) {
      fetchTeamMessages(user.teamId);
    }
  }, [user?.teamId, fetchTeamMessages]);

  const handleMessageDeleted = useCallback((messageId: string) => {
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
  }, []);

  if (authIsLoading || (!user && !currentTeam)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-56 mb-2" />
            <Skeleton className="h-5 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === 'admin' && <Skeleton className="h-24 w-full" />}
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !user.teamId || !currentTeam) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading team data or redirecting...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Messages</h1>
          <p className="text-muted-foreground">
            View all messages posted by your team admin.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.MessagesSquare className="h-6 w-6 text-primary" /> Message History
          </CardTitle>
          <CardDescription>
            {user?.role === 'admin' ? 'Post new messages or review past communications.' : 'Review messages from your team admin.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.role === 'admin' && (
            <MessageInputForm onMessagePosted={handleMessagePosted} />
          )}
           <div className="pt-4"> {/* Add some spacing above the message list */}
            {isLoadingMessages ? (
                <div className="space-y-3 py-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start space-x-3 p-3 border rounded-md bg-card/50">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    </div>
                ))}
                </div>
            ) : messages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                    No messages have been posted yet.
                    {user?.role === 'admin' && " Why not post the first one?"}
                </p>
            ) : (
                <ScrollArea className="max-h-[60vh] pr-3"> {/* Changed to max-h for collapsible behavior */}
                <div className="space-y-4">
                    {messages.map((msg) => (
                    <MessageCard key={msg.id} message={msg} onMessageDeleted={handleMessageDeleted} />
                    ))}
                </div>
                </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
