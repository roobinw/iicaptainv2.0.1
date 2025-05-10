
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { addTicket, type NewTicketData } from "@/services/ticketService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";

const ticketSchema = z.object({
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }).max(100, { message: "Subject must be 100 characters or less."}),
  message: z.string().min(20, { message: "Message must be at least 20 characters." }).max(2000, { message: "Message must be 2000 characters or less."}),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function SupportPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  async function onSubmit(data: TicketFormValues) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit a ticket.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const ticketData: NewTicketData = {
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        teamId: user.teamId,
        subject: data.subject,
        message: data.message,
      };
      await addTicket(ticketData);
      toast({
        title: "Ticket Submitted!",
        description: "Our support team will get back to you soon.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Error submitting ticket:", error);
      toast({ title: "Submission Failed", description: error.message || "Could not submit your ticket.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authIsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icons.Support className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Support...</p>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex h-full items-center justify-center">
        <p className="text-lg text-muted-foreground">Please log in to access support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground">
            Need help? Fill out the form below and we'll get back to you.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icons.Support className="h-6 w-6 text-primary" /> Submit a New Ticket</CardTitle>
          <CardDescription>
            Describe your issue in detail. Current user: {user.name} ({user.email})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Issue with login, Feature request" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide as much detail as possible about the issue you are experiencing or the feature you are requesting..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || authIsLoading}>
                {isSubmitting ? <Icons.Dashboard className="animate-spin" /> : <Icons.Support className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
