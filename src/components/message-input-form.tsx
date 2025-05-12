
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { addMessage } from "@/services/messageService";
import { useState } from "react";
import { Icons } from "./icons";

const messageSchema = z.object({
  content: z.string().min(1, { message: "Message cannot be empty." }).max(1000, {message: "Message cannot exceed 1000 characters."}),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface MessageInputFormProps {
  onMessagePosted: () => void; // Callback to refresh messages list
}

export function MessageInputForm({ onMessagePosted }: MessageInputFormProps) {
  const { user, currentTeam } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  async function onSubmit(data: MessageFormValues) {
    if (!user || !currentTeam) {
      toast({ title: "Error", description: "User or team information is missing.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await addMessage(currentTeam.id, data.content, user.uid, user.name);
      toast({ title: "Message Posted", description: "Your message has been posted to the team." });
      form.reset();
      onMessagePosted(); // Trigger refresh
    } catch (error: any) {
      toast({ title: "Error Posting Message", description: error.message || "Could not post message.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user?.role !== "admin") {
    return null; // Only admins can see this form
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">New Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Type your message to the team here..."
                  className="min-h-[80px] resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? <Icons.Dashboard className="animate-spin" /> : <Icons.Send className="mr-2 h-4 w-4" /> }
          {isSubmitting ? "Posting..." : "Post Message"}
        </Button>
      </form>
    </Form>
  );
}
