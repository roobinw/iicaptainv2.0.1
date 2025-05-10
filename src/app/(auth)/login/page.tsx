
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

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, login, loginWithGoogle, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (!authIsLoading && user && user.teamId) { // Added user.teamId check
      router.replace("/dashboard");
    } else if (!authIsLoading && user && !user.teamId) { // User exists but no team
      router.replace("/onboarding/create-team");
    }
  }, [user, authIsLoading, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      // AuthProvider's onAuthStateChanged handles redirect
    } catch (error: any) {
      // Error toast is handled by the login function in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      // AuthProvider's onAuthStateChanged handles redirect
    } catch (error: any) {
      // Error toast is handled by the loginWithGoogle function in AuthContext
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
          Sign In to iiCaptain
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials or sign in with Google.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <Button type="submit" className="w-full" disabled={isSubmitting || authIsLoading || isGoogleSubmitting}>
            {isSubmitting ? <Icons.Dashboard className="animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleSubmitting || authIsLoading || isSubmitting}>
        {isGoogleSubmitting ? <Icons.Dashboard className="animate-spin mr-2" /> : <Icons.Google className="mr-2 h-5 w-5" />}
        Sign in with Google
      </Button>

      <p className="mt-6 px-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}
