
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
// import { updateTeamName } from "@/services/teamService"; // Future: if team name is editable

export default function SettingsPage() {
  const { user, firebaseUser, currentTeam, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [teamName, setTeamName] = useState(""); // For team name display/edit
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  // const [isSubmittingTeam, setIsSubmittingTeam] = useState(false); // Future

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatarUrl(user.avatarUrl || `https://picsum.photos/seed/${user.email}/80/80`);
    }
    if (currentTeam) {
      setTeamName(currentTeam.name || "");
    }
  }, [user, currentTeam]);

  if (authIsLoading || !user || !firebaseUser) {
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
             <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-32 mb-1" />
                    <Skeleton className="h-5 w-64" />
                </CardHeader>
                <CardContent className="space-y-4 max-w-md">
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const getInitials = (nameStr: string) => {
    if (!nameStr) return "?";
    return nameStr.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setIsSubmittingProfile(true);
    try {
      await updateUserProfile(firebaseUser.uid, { name }); 
      toast({
        title: "Profile Updated",
        description: "Your profile details have been saved.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Future: const handleTeamNameUpdate = async (e: React.FormEvent) => { ... };


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
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={name} data-ai-hint="profile picture"/>
                <AvatarFallback className="text-2xl">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatarFile">Update Avatar</Label>
                <Input id="avatarFile" type="file" className="mt-1" disabled />
                <p className="text-xs text-muted-foreground mt-1">Avatar updates are not supported in this demo.</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} disabled />
               <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">My Role (in Team)</Label>
              <Input id="role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled />
            </div>
            <Button type="submit" disabled={isSubmittingProfile}>
              {isSubmittingProfile ? "Saving Profile..." : "Save Profile Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {currentTeam && user.role === 'admin' && ( // Only team admins can see/edit team settings
        <Card>
          <CardHeader>
            <CardTitle>Team Settings: {currentTeam.name}</CardTitle>
            <CardDescription>Manage your team&apos;s information.</CardDescription>
          </CardHeader>
          <CardContent className="max-w-md">
            <form className="space-y-4"> {/* onSubmit={handleTeamNameUpdate} Future */}
              <div className="space-y-1">
                <Label htmlFor="teamName">Team Name</Label>
                <Input 
                  id="teamName" 
                  value={teamName} 
                  onChange={(e) => setTeamName(e.target.value)} 
                  disabled // Enable when updateTeamName service is implemented
                />
              </div>
              <Button type="submit" disabled>  {/* disabled={isSubmittingTeam} Future */}
                 {/* {isSubmittingTeam ? "Saving Team..." : "Save Team Name"} Future */}
                 Save Team Name (Not Implemented)
              </Button>
            </form>
          </CardContent>
        </Card>
      )}


      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-md">
            <p className="text-muted-foreground">Password changes can be initiated via Firebase password reset flows (not implemented here).</p>
            <Button className="mt-4" disabled>Change Password (Not Implemented)</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground">Theme customization is not yet available.</p>
        </CardContent>
      </Card>
    </div>
  );
}
