
"use client";

import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function SettingsPage() {
  const { user, login, isLoading } = useAuth(); // Use login to update user details
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || ""); // Email might not be editable easily

  if (isLoading || !user) {
    return <div className="flex h-full items-center justify-center"><p>Loading settings...</p></div>;
  }
  
  const getInitials = (nameStr: string) => {
    return nameStr.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Simulate update: re-login with new details
    // In a real app, this would be an API call to update user profile
    login(user.email, name, user.role); // Assuming email is key and role doesn't change here
    
    toast({
      title: "Profile Updated",
      description: "Your profile details have been saved.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile picture"/>
                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
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
               <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed in this demo.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-md">
            <div className="space-y-1">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" disabled />
            </div>
            <div className="space-y-1 mt-4">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" disabled />
            </div>
            <div className="space-y-1 mt-4">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input id="confirmNewPassword" type="password" disabled />
            </div>
            <Button className="mt-4" disabled>Change Password</Button>
            <p className="text-xs text-muted-foreground mt-2">Password changes are not supported in this demo.</p>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground">Theme customization is not yet available.</p>
           {/* Placeholder for theme toggle (light/dark) 
           <div className="flex items-center space-x-2">
             <Button variant="outline" disabled><Icons.Sun className="mr-2 h-4 w-4" /> Light</Button>
             <Button variant="outline" disabled><Icons.Moon className="mr-2 h-4 w-4" /> Dark</Button>
           </div>
           */}
        </CardContent>
      </Card>
    </div>
  );
}
