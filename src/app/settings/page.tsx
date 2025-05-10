
"use client";

import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, type ChangeEvent } from "react"; // Added ChangeEvent
import { updateUserProfile } from "@/services/userService"; 
import { Skeleton } from "@/components/ui/skeleton";
import { updateTeamName } from "@/services/teamService"; 
import { uploadAvatar } from "@/services/storageService"; // Added
import { Icons } from "@/components/icons"; // Added

export default function SettingsPage() {
  const { user, firebaseUser, currentTeam, isLoading: authIsLoading, refreshTeamData, refreshAuthUser } = useAuth(); // Added refreshAuthUser
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); 
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(""); // Renamed for clarity
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null); // For selected file
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // For image preview
  
  const [currentTeamNameInput, setCurrentTeamNameInput] = useState(""); 
  
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);


  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || ""); 
      setCurrentAvatarUrl(user.avatarUrl || `https://picsum.photos/seed/${user.email}/80/80`);
      setAvatarPreview(user.avatarUrl || `https://picsum.photos/seed/${user.email}/80/80`);
    }
    if (currentTeam) {
      setCurrentTeamNameInput(currentTeam.name || "");
    }
  }, [user, currentTeam]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation (e.g., file type, size)
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please select an image file (jpeg, png, gif).", variant: "destructive"});
        e.target.value = ""; // Reset file input
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "File Too Large", description: "Maximum avatar size is 2MB.", variant: "destructive"});
        e.target.value = ""; // Reset file input
        return;
      }
      setNewAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!newAvatarFile || !firebaseUser) return;
    setIsUploadingAvatar(true);
    try {
      const downloadURL = await uploadAvatar(firebaseUser.uid, newAvatarFile);
      await updateUserProfile(firebaseUser.uid, { avatarUrl: downloadURL });
      setCurrentAvatarUrl(downloadURL); // Update current avatar URL state
      setNewAvatarFile(null); // Clear the selected file
      if (refreshAuthUser) await refreshAuthUser(); // Refresh user data in AuthContext
      toast({
        title: "Avatar Updated",
        description: "Your new avatar has been saved.",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({ title: "Avatar Upload Failed", description: error.message || "Could not upload your avatar.", variant: "destructive" });
      // Revert preview if upload fails
      setAvatarPreview(currentAvatarUrl); 
      setNewAvatarFile(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  
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
    if (!firebaseUser) return;
    setIsSubmittingProfile(true);
    try {
      await updateUserProfile(firebaseUser.uid, { name }); 
      if (refreshAuthUser) await refreshAuthUser(); // Refresh user data
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
                    <AvatarImage src={avatarPreview || currentAvatarUrl} alt={name} data-ai-hint="profile avatar"/>
                    <AvatarFallback className="text-3xl">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                    <Label htmlFor="avatarFile">Update Avatar (Max 2MB)</Label>
                    <Input 
                        id="avatarFile" 
                        type="file" 
                        className="mt-1" 
                        onChange={handleAvatarChange}
                        accept="image/png, image/jpeg, image/gif" // Specify accepted file types
                        disabled={isUploadingAvatar}
                    />
                </div>
                {newAvatarFile && (
                  <Button onClick={handleAvatarUpload} disabled={isUploadingAvatar || !newAvatarFile} className="mt-2">
                    {isUploadingAvatar ? <Icons.Dashboard className="animate-spin mr-2" /> : null}
                    {isUploadingAvatar ? "Uploading..." : "Save New Avatar"}
                  </Button>
                )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmittingProfile || isUploadingAvatar}/>
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
            <Button type="submit" disabled={isSubmittingProfile || isUploadingAvatar || (name === user.name && !newAvatarFile)}>
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
                <Label htmlFor="teamName">Team Name</Label>
                <Input 
                  id="teamName" 
                  value={currentTeamNameInput} 
                  onChange={(e) => setCurrentTeamNameInput(e.target.value)} 
                  disabled={isSubmittingTeam}
                />
              </div>
              <Button type="submit" disabled={isSubmittingTeam || !currentTeamNameInput.trim() || currentTeamNameInput.trim() === currentTeam.name}>
                 {isSubmittingTeam ? "Saving Team..." : "Save Team Name"}
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
            <p className="text-muted-foreground">Password changes are handled via Firebase's built-in mechanisms (e.g., password reset emails), not directly in this app section for now.</p>
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
