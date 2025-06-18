
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

const memberSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).transform(value => value.toLowerCase()),
  role: z.enum(["admin", "member"] as [UserRole, ...UserRole[]], { required_error: "Role is required." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(), // Optional for editing existing users
  confirmPassword: z.string().optional(), // Optional for editing existing users
}).refine((data) => {
  // Password confirmation is only required if a new password is being set (i.e., for new users)
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // If it's a new user (initialData is null), password is required
  if (!initialDataForSchema && !data.password) { // Changed initialData to initialDataForSchema
    return false;
  }
  return true;
}, {
  message: "Password is required for new members.",
  path: ["password"],
});


// Refined schema needs access to initialData, so we define it inside the component or pass initialData to a factory
let initialDataForSchema: User | null = null; // This will be set in the component props

interface AddMemberFormProps {
  onSubmit: (data: MemberFormValuesExtended) => void; 
  initialDataProp?: User | null; // Renamed to avoid conflict and make it clear it's a prop
  onClose: () => void;
}

// Extended form values to include password
export type MemberFormValuesExtended = z.infer<typeof memberSchema>;


export function AddMemberForm({ onSubmit, initialDataProp, onClose }: AddMemberFormProps) {
  initialDataForSchema = initialDataProp || null; // Set the global-like initialDataForSchema for the schema refinement

  const form = useForm<MemberFormValuesExtended>({
    resolver: zodResolver(memberSchema),
    defaultValues: initialDataProp ? {
      name: initialDataProp.name,
      email: initialDataProp.email,
      role: initialDataProp.role,
      password: "", // Passwords are not pre-filled for editing
      confirmPassword: "",
    } : {
      name: "",
      email: "",
      role: "member",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (data: MemberFormValuesExtended) => {
    // If editing, and password is not provided, don't include it in the submit data.
    if (initialDataProp && !data.password) {
      const { password, confirmPassword, ...restData } = data;
      onSubmit(restData as any); // Type assertion, as password fields are removed
    } else {
      onSubmit(data);
    }
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
                <Input 
                  type="email" 
                  placeholder="member@example.com" {...field} 
                  disabled={!!initialDataProp} // Disable email editing for existing users
                />
              </FormControl>
              {initialDataProp && 
                <p className="text-xs text-muted-foreground">Email cannot be changed for existing users.</p>}
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
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Conditionally render password fields only if it's a new member or if explicitly editing password */}
        {/* For simplicity, always show for new, hide for edit (password changes would be a separate flow) */}
        {!initialDataProp && (
          <>
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
          </>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initialDataProp ? "Save Changes" : "Add Member & Create Account"}</Button>
        </div>
      </form>
    </Form>
  );
}
