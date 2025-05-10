
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { Icons } from "@/components/icons";
import { Separator } from "@/components/ui/separator";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).transform(value => value.toLowerCase()),
  teamName: z.string().min(3, { message: "Team name must be at least 3 characters."}),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], 
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { user, isLoading: authIsLoading, signup: authSignup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);


  useEffect(() => {
    if (!authIsLoading && user && user.teamId) { 
      router.replace("/dashboard");
    } else if (!authIsLoading && user && !user.teamId) {
      router.replace("/onboarding/create-team");
    }
  }, [user, authIsLoading, router]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      teamName: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: SignupFormValues) {
    setIsSubmitting(true);
    try {
      await authSignup(data.email, data.name, data.teamName, data.password);
      // onAuthStateChanged in AuthProvider will handle redirect
    } catch (error: any) {
      // Error toast is handled by the signup function in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignup() {
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      // onAuthStateChanged will handle user creation/update and redirect.
      // If it's a new Google user, they'll be taken to /onboarding/create-team
    } catch (error: any) {
      // Error toast is handled by loginWithGoogle
    } finally {
      setIsGoogleSubmitting(false);
    }
  }
  
  if (authIsLoading || (!authIsLoading && user && user.teamId)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.Dashboard className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an Account & Your Team
        </h1>
        <p className="text-sm text-muted-foreground">
          You'll be the admin of your new team.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="teamName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Name</FormLabel>
                <FormControl>
                  <Input placeholder="The Mighty Ducks" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting || authIsLoading || isGoogleSubmitting}>
            {isSubmitting ? <Icons.Dashboard className="animate-spin" /> : "Create Account & Team"}
          </Button>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or sign up with
          </span>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isGoogleSubmitting || authIsLoading || isSubmitting}>
         {isGoogleSubmitting ? <Icons.Dashboard className="animate-spin mr-2" /> : <Icons.Google className="mr-2 h-5 w-5" />}
        Sign up with Google
      </Button>

      <p className="mt-6 px-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
