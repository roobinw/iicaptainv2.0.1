
"use client";

import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { updateUserProfile } from "@/services/userService"; 
import { Skeleton } from "@/components/ui/skeleton";
import { updateTeamName } from "@/services/teamService"; 
import { Icons } from "@/components/icons";
import type { User } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ["confirmNewPassword"],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export default function SettingsPage() {
  const { user, firebaseUser, currentTeam, isLoading: authIsLoading, refreshTeamData, refreshAuthUser, changePassword } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); 
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  
  const [currentTeamNameInput, setCurrentTeamNameInput] = useState(""); 
  
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || ""); 
      setAvatarUrlInput(user.avatarUrl || "");
    }
    if (currentTeam) {
      setCurrentTeamNameInput(currentTeam.name || "");
    }
  }, [user, currentTeam]);
  
  if (authIsLoading || !user || !firebaseUser || (user?.role === 'admin' && !currentTeam) ) {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-9 w-48 mb-1" />
                <Skeleton className="h-5 w-72" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-32 mb-1" />
                    <Skeleton className="h-5 w-64" />
                </CardHeader>
                <CardContent className="space-y-4 max-w-md">
                    <div className="flex items-center gap-4 mb-6">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
            { user?.role === 'admin' && (
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-40 mb-1" />
                        <Skeleton className="h-5 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-4 max-w-md">
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-36" />
                    </CardContent>
                </Card>
            )}
             <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-32 mb-1" />
                    <Skeleton className="h-5 w-64" />
                </CardHeader>
                <CardContent className="space-y-4 max-w-md">
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-40" />
                </CardContent>
            </Card>
        </div>
    );
  }
  
  if (!user || !firebaseUser) {
      return <p>Loading user data or redirecting...</p>;
  }
   if (user.role === 'admin' && !currentTeam) {
      return <p>Loading team data for admin or redirecting...</p>;
  }


  const getInitials = (nameStr: string) => {
    if (!nameStr) return "?";
    return nameStr.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !user) return; 
    setIsSubmittingProfile(true);
    try {
      const updatePayload: { name?: string; avatarUrl?: string | null } = {};
      
      if (name !== user.name) {
        updatePayload.name = name;
      }

      const trimmedAvatarInput = avatarUrlInput.trim();
      const currentEffectiveAvatarUrl = user.avatarUrl || ""; 

      if (trimmedAvatarInput !== currentEffectiveAvatarUrl) {
          updatePayload.avatarUrl = trimmedAvatarInput === "" ? null : trimmedAvatarInput;
      }
      
      if (Object.keys(updatePayload).length > 0) {
        await updateUserProfile(firebaseUser.uid, updatePayload); 
        if (refreshAuthUser) await refreshAuthUser();
        toast({
          title: "Profile Updated",
          description: "Your profile details have been saved.",
        });
      } else {
        toast({
            title: "No Changes Detected",
            description: "Your profile information is already up-to-date."
        });
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleTeamNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam || !user || user.role !== 'admin' || !currentTeamNameInput.trim()) return;
    setIsSubmittingTeam(true);
    try {
      await updateTeamName(currentTeam.id, currentTeamNameInput.trim());
      toast({
        title: "Team Name Updated",
        description: `Your team is now called "${currentTeamNameInput.trim()}".`,
      });
      if(refreshTeamData) refreshTeamData(); 
    } catch (error: any) {
      console.error("Error updating team name:", error);
      toast({ title: "Team Update Failed", description: error.message || "Could not update team name.", variant: "destructive" });
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handlePasswordChangeSubmit = async (data: PasswordChangeFormValues) => {
    setIsSubmittingPassword(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      passwordForm.reset();
    } catch (error: any) {
      // Toast is handled in changePassword function in AuthContext
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const effectiveAvatarForDisplay = user.avatarUrl || `https://picsum.photos/seed/${user.email}/80/80`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account, team, and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
            <div className="flex flex-col items-start gap-4 mb-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={effectiveAvatarForDisplay} alt={name} data-ai-hint="profile avatar"/>
                    <AvatarFallback className="text-3xl">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="w-full space-y-1">
                    <Label htmlFor="avatarUrlInput">Avatar Image URL</Label>
                    <Input 
                        id="avatarUrlInput" 
                        type="url" 
                        placeholder="https://example.com/avatar.png"
                        value={avatarUrlInput}
                        onChange={(e) => setAvatarUrlInput(e.target.value)}
                        className="mt-1" 
                        disabled={isSubmittingProfile}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Enter a web link to an image (e.g., .png, .jpg).</p>
                </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmittingProfile}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} disabled />
               <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed here.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">My Role (in Team)</Label>
              <Input id="role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled />
            </div>
            <Button 
              type="submit" 
              disabled={isSubmittingProfile || (name === user.name && avatarUrlInput.trim() === (user.avatarUrl || ''))}
            >
              {isSubmittingProfile ? <Icons.Dashboard className="animate-spin mr-2" /> : null}
              {isSubmittingProfile ? "Saving Profile..." : "Save Profile Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {currentTeam && user.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Team Settings: {currentTeam.name}</CardTitle>
            <CardDescription>Manage your team&apos;s information. Only admins can change these settings.</CardDescription>
          </CardHeader>
          <CardContent className="max-w-md">
            <form onSubmit={handleTeamNameUpdate} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="teamNameInput">Team Name</Label> {/* Changed id to avoid conflict */}
                <Input 
                  id="teamNameInput" 
                  value={currentTeamNameInput} 
                  onChange={(e) => setCurrentTeamNameInput(e.target.value)} 
                  disabled={isSubmittingTeam}
                />
              </div>
              <Button type="submit" disabled={isSubmittingTeam || !currentTeamNameInput.trim() || currentTeamNameInput.trim() === currentTeam.name}>
                 {isSubmittingTeam ? <Icons.Dashboard className="animate-spin mr-2" /> : null}
                 {isSubmittingTeam ? "Saving Team..." : "Save Team Name"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-md">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChangeSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmittingPassword} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmittingPassword} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmittingPassword} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmittingPassword}>
                {isSubmittingPassword ? <Icons.Dashboard className="animate-spin mr-2" /> : <Icons.KeyRound className="mr-2 h-4 w-4" /> }
                {isSubmittingPassword ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
