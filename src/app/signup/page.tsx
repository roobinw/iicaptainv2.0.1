
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";
// Removed direct Firebase imports, AuthContext handles it
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// import { auth, db } from "@/lib/firebase";

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
import { useAuth, setSubmitHook, setDataHook } from "@/lib/auth"; // Import setSubmitHook, setDataHook
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
// UserRole removed as it's fixed to 'admin' on team creation for now
// import type { UserRole } from "@/types";
// RadioGroup for role selection removed, creator is admin by default
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  teamName: z.string().min(3, { message: "Team name must be at least 3 characters."}),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  // Role field removed, default to admin on team creation
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], 
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { user, isLoading: authIsLoading, signup: authSignup } = useAuth(); // Use signup from context
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authIsLoading && user && user.teamId) { // Check for teamId too
      router.replace("/dashboard");
    }
  }, [user, authIsLoading, router]);

  // Connect local isSubmitting state with AuthContext hook
  useEffect(() => {
    setSubmitHook(setIsSubmitting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    setDataHook(data.email, data.name); // Pass email and name for AuthContext
    try {
      // Call signup from AuthContext
      await authSignup(data.email, data.name, data.teamName, data.password);
      // onAuthStateChanged in AuthProvider will handle redirect
    } catch (error: any) {
      // Error toast is handled by the signup function in AuthContext
      // console.error("Signup page error:", error);
    } finally {
      setIsSubmitting(false);
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
          Create an Account &amp; Your Team
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign up and set up your team environment.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
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
                <FormLabel>Email</FormLabel>
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
                  <Input placeholder="My Awesome Team" {...field} />
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
          {/* Role selection removed - user becomes admin of new team by default */}
          <Button type="submit" className="w-full" disabled={isSubmitting || authIsLoading}>
            {isSubmitting ? "Creating Account &amp; Team..." : "Create Account &amp; Team"}
          </Button>
        </form>
      </Form>
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
