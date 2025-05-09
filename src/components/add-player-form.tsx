
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User, UserRole } from "@/types";

// Schema for adding/editing a player profile.
// UID, teamId are handled by service/parent. Role is included if admin can change it.
const playerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  // Role might be editable by admin for existing users within their team.
  role: z.enum(["admin", "player"], { required_error: "Role is required." }), 
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface AddPlayerFormProps {
  // onSubmit data type matches the form values. UID and teamId are handled by parent or service.
  onSubmit: (data: PlayerFormValues & { avatarUrl?: string }) => void; 
  initialData?: User | null;
  onClose: () => void;
}

export function AddPlayerForm({ onSubmit, initialData, onClose }: AddPlayerFormProps) {
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      email: initialData.email,
      role: initialData.role,
    } : {
      name: "",
      email: "",
      role: "player", // Default to 'player' for new profiles added by admin
    },
  });

  const handleSubmit = (data: PlayerFormValues) => {
    // Pass avatarUrl if it's part of initialData, otherwise service might generate one.
    onSubmit({ ...data, avatarUrl: initialData?.avatarUrl }); 
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                {/* For adding new manual profiles, email should be editable.
                    For editing existing auth users, email is usually not changed here.
                    If initialData and initialData.uid suggests an auth user, disable.
                    Currently, addPlayerProfileToTeam creates a 'manual' UID.
                */}
                <Input type="email" placeholder="player@example.com" {...field} disabled={!!initialData && !!initialData.uid && !initialData.uid.startsWith('manual-')} />
              </FormControl>
              {initialData && !!initialData.uid && !initialData.uid.startsWith('manual-') && <p className="text-xs text-muted-foreground">Email cannot be changed for existing authenticated users here.</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role (within this team)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initialData ? "Save Changes" : "Add Player Profile"}</Button>
        </div>
      </form>
    </Form>
  );
}
