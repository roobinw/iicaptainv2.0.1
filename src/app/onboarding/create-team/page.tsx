
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
        // Not logged in, redirect to login
        router.replace("/login");
      } else if (user && user.teamId) {
        // Logged in AND has a team, redirect to dashboard
        router.replace("/dashboard");
      }
      // Otherwise, user is logged in but has no teamId, so stay on this page.
    }
  }, [user, firebaseUser, authIsLoading, router]);

  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      teamName: "",
    },
  });

  async function onSubmit(data: CreateTeamFormValues) {
    if (!firebaseUser || !user) { // Check for both firebaseUser and the user profile from context
      toast({ title: "Error", description: "You must be logged in to create a team.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Create the team
      const newTeamId = await createTeam(data.teamName, firebaseUser.uid);
      
      // 2. Update the existing user's profile with the new teamId and set role to admin
      //    (assuming they were a user without a team, now they become admin of this new team)
      await updateUserProfile(firebaseUser.uid, { teamId: newTeamId, role: "admin" as UserRole });
      
      toast({
        title: "Team Created!",
        description: `Your team "${data.teamName}" has been successfully created. Redirecting...`,
      });
      // The AuthProvider's onAuthStateChanged listener should pick up the change in user.teamId
      // and redirect to dashboard. Forcing a reload or router.push can also trigger it.
      // Using router.push and expecting AuthProvider to handle the redirect fully.
      router.push("/dashboard"); 
      // To be absolutely sure AuthContext re-evaluates, you might consider a mechanism
      // to signal AuthContext to re-fetch user data, or simply reload.
      // window.location.href = "/dashboard"; // A harder refresh
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast({ title: "Team Creation Failed", description: error.message || "Could not create team.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading if auth is processing, or if user data indicates they should be redirected
  if (authIsLoading || (user && user.teamId)) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.Dashboard className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading...</p>
      </div>
    );
  }
  
  // If not authIsLoading, but firebaseUser is null, useEffect should have redirected to /login
  if (!firebaseUser && !authIsLoading) {
    return (
         <div className="flex h-screen items-center justify-center bg-background">
            <Icons.Dashboard className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-foreground">Redirecting...</p>
        </div>
    );
  }

  // At this point, user is authenticated but user.teamId is missing.
  return (
    <AuthLayout>
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set Up Your Team
        </h1>
        <p className="text-sm text-muted-foreground">
          You're almost ready! Just give your team a name to get started. You'll be the admin.
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
                  <Input placeholder="The All-Stars" {...field} />
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
       <div className="mt-6 text-center">
        <Button variant="link" onClick={logout} className="text-muted-foreground">
          Log out
        </Button>
      </div>
    </AuthLayout>
  );
}
