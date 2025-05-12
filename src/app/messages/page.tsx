
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { Message } from "@/types";
import { getMessages, type MessageArchiveFilter } from "@/services/messageService";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInputForm } from "@/components/message-input-form";
import { MessageCard } from "@/components/message-card";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function MessagesPage() {
  const { user, currentTeam, isLoading: authIsLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageFilter, setMessageFilter] = useState<MessageArchiveFilter>("active");

  const fetchTeamMessages = useCallback(async (teamId: string, filter: MessageArchiveFilter) => {
    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await getMessages(teamId, filter);
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
    fetchTeamMessages(user.teamId, messageFilter);
  }, [user, currentTeam, authIsLoading, fetchTeamMessages, messageFilter]);

  const handleMessagePosted = useCallback(() => {
    if (user?.teamId) {
      setMessageFilter("active"); 
      if (messageFilter === "active") {
        fetchTeamMessages(user.teamId, "active");
      }
    }
  }, [user?.teamId, fetchTeamMessages, messageFilter]);

  const handleMessageDeleted = useCallback((messageId: string) => {
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
  }, []);

  const handleMessageArchived = useCallback((messageId: string, isArchived: boolean) => {
    if ((messageFilter === 'active' && isArchived) || (messageFilter === 'archived' && !isArchived)) {
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
    } else {
       setMessages(prevMessages => prevMessages.map(msg => 
        msg.id === messageId ? { ...msg, isArchived } : msg
      ));
    }
  }, [messageFilter]);


  if (authIsLoading || (!user && !currentTeam)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        {user?.role === 'admin' && (
            <Card className="shadow-md">
                <CardHeader><Skeleton className="h-7 w-56 mb-2" /></CardHeader>
                <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
        )}
        <Skeleton className="h-10 w-full mb-4" /> {/* Skeleton for TabsList */}
        <div className="space-y-4"> {/* Skeleton for MessageCards */}
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
        </div>
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
            View and manage messages for {currentTeam.name}.
          </p>
        </div>
      </div>

      {user?.role === 'admin' && (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icons.Send className="h-5 w-5 text-primary" /> Post a New Message
                </CardTitle>
                <CardDescription>
                    Compose a new message for your team. It will appear under active messages.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <MessageInputForm onMessagePosted={handleMessagePosted} />
            </CardContent>
        </Card>
      )}

      <Tabs value={messageFilter} onValueChange={(value) => setMessageFilter(value as MessageArchiveFilter)} className="w-full pt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        <TabsContent value={messageFilter} className="mt-4">
            {isLoadingMessages ? (
                <div className="space-y-3 py-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start space-x-3 p-3 border rounded-md bg-card/50 shadow-sm">
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
                <Card className="shadow-sm">
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-center py-8">
                            No {messageFilter !== "all" ? messageFilter : ""} messages found.
                            {user?.role === 'admin' && messageFilter === "active" && " Why not post one?"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                // Max height for scroll area can be adjusted
                <ScrollArea className="max-h-[calc(100vh-300px)] pr-3"> 
                <div className="space-y-4">
                    {messages.map((msg) => (
                    <MessageCard 
                        key={msg.id} 
                        message={msg} 
                        onMessageDeleted={handleMessageDeleted} 
                        onMessageArchived={handleMessageArchived}
                    />
                    ))}
                </div>
                </ScrollArea>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

