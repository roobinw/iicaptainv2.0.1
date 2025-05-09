
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
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTeam } from "@/services/teamService";
import { updateUserProfile } from "@/services/userService";
import type { UserRole } from "@/types";
import { Icons } from "@/components/icons";

const createTeamSchema = z.object({
  teamName: z.string().min(3, { message: "Team name must be at least 3 characters." }),
});

type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

export default function CreateTeamPage() {
  const { user, firebaseUser, isLoading: authIsLoading, logout } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authIsLoading) {
      if (!firebaseUser) {
        // If not logged in at all, go to login
        router.replace("/login");
      } else if (user && user.teamId) {
        // If logged in and already has a team, go to dashboard
        router.replace("/dashboard");
      }
      // Otherwise, stay on this page to create a team
    }
  }, [user, firebaseUser, authIsLoading, router]);

  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      teamName: "",
    },
  });

  async function onSubmit(data: CreateTeamFormValues) {
    if (!firebaseUser) {
      toast({ title: "Error", description: "You must be logged in to create a team.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const newTeamId = await createTeam(data.teamName, firebaseUser.uid);
      await updateUserProfile(firebaseUser.uid, { teamId: newTeamId, role: "admin" as UserRole });
      
      toast({
        title: "Team Created!",
        description: `Your team "${data.teamName}" has been successfully created. Redirecting...`,
      });
      // The AuthProvider's onAuthStateChanged listener should pick up the change
      // and redirect to dashboard. Forcing a reload might also trigger it.
      router.push("/dashboard"); // Or window.location.reload(); to ensure AuthProvider re-evaluates
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast({ title: "Team Creation Failed", description: error.message || "Could not create team.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authIsLoading || (user && user.teamId)) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.Dashboard className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading...</p>
      </div>
    );
  }
  
  if (!firebaseUser && !authIsLoading) {
    // This case should be handled by useEffect redirecting to /login
    return <p>Redirecting...</p>;
  }


  return (
    <AuthLayout>
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Your Team
        </h1>
        <p className="text-sm text-muted-foreground">
          Almost there! Just give your team a name to get started.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="teamName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Name</FormLabel>
                <FormControl>
                  <Input placeholder="The Champions" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting || authIsLoading}>
            {isSubmitting ? "Creating Team..." : "Create Team"}
          </Button>
        </form>
      </Form>
      <Button variant="link" onClick={logout} className="mt-4 w-full">
        Log out
      </Button>
    </AuthLayout>
  );
}
