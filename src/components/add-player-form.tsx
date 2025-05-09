
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

const playerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).transform(value => value.toLowerCase()),
  role: z.enum(["admin", "player"] as [UserRole, ...UserRole[]], { required_error: "Role is required." }), 
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface AddPlayerFormProps {
  onSubmit: (data: PlayerFormValues) => void; // Changed to match PlayerFormValues
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
      role: "player", 
    },
  });

  const handleSubmit = (data: PlayerFormValues) => {
    // The onSubmit prop now expects PlayerFormValues directly.
    // The service addPlayerProfileToTeam will handle avatarUrl generation.
    onSubmit(data); 
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
                {/* Email for manually added profiles is editable. 
                    If editing an existing auth user profile (not typical here), it would be disabled.
                    This form is for adding/editing profiles within the team context.
                */}
                <Input type="email" placeholder="player@example.com" {...field} 
                       disabled={!!initialData && !!initialData.uid && !initialData.uid.startsWith('manual-')} />
              </FormControl>
              {initialData && !!initialData.uid && !initialData.uid.startsWith('manual-') && 
                <p className="text-xs text-muted-foreground">Email of existing authenticated users cannot be changed here.</p>}
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
