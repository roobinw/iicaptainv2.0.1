
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { User, UserRole } from "@/types";
import { Separator } from "@/components/ui/separator";

const memberSchemaBase = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).transform(value => value.toLowerCase()),
  role: z.enum(["admin", "member"] as [UserRole, ...UserRole[]], { required_error: "Role is required." }),
  isTrainingMember: z.boolean().optional(),
  isMatchMember: z.boolean().optional(),
  isTeamManager: z.boolean().optional(),
  isTrainer: z.boolean().optional(),
  isCoach: z.boolean().optional(),
});

// This will be used to conditionally require password
let initialDataForSchema: User | null = null;

const memberSchema = memberSchemaBase.extend({
  password: z.string().min(6, { message: "Password must be at least 6 characters." })
    .optional()
    .refine(val => initialDataForSchema ? true : !!val, { // Password required if new user
      message: "Password is required for new members.",
    }),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


interface AddMemberFormProps {
  onSubmit: (data: MemberFormValuesExtended) => void; 
  initialDataProp?: User | null;
  onClose: () => void;
}

export type MemberFormValuesExtended = z.infer<typeof memberSchema>;


export function AddMemberForm({ onSubmit, initialDataProp, onClose }: AddMemberFormProps) {
  initialDataForSchema = initialDataProp || null; 

  const form = useForm<MemberFormValuesExtended>({
    resolver: zodResolver(memberSchema),
    defaultValues: initialDataProp ? {
      name: initialDataProp.name,
      email: initialDataProp.email,
      role: initialDataProp.role,
      isTrainingMember: initialDataProp.isTrainingMember ?? false,
      isMatchMember: initialDataProp.isMatchMember ?? false,
      isTeamManager: initialDataProp.isTeamManager ?? false,
      isTrainer: initialDataProp.isTrainer ?? false,
      isCoach: initialDataProp.isCoach ?? false,
      password: "", 
      confirmPassword: "",
    } : {
      name: "",
      email: "",
      role: "member",
      isTrainingMember: true, // Default new members to be training members
      isMatchMember: true,   // Default new members to be match members
      isTeamManager: false,
      isTrainer: false,
      isCoach: false,
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (data: MemberFormValuesExtended) => {
    const dataToSubmit = { ...data };
    if (initialDataProp && !data.password) {
      delete dataToSubmit.password;
      delete dataToSubmit.confirmPassword;
    }
    onSubmit(dataToSubmit);
  };

  const booleanRoles: (keyof MemberFormValuesExtended)[] = ['isTrainingMember', 'isMatchMember', 'isTeamManager', 'isTrainer', 'isCoach'];
  const booleanRoleLabels: Record<string, string> = {
      isTrainingMember: "Participates in Trainings",
      isMatchMember: "Participates in Matches",
      isTeamManager: "Team Manager",
      isTrainer: "Trainer",
      isCoach: "Coach"
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
                  disabled={!!initialDataProp} 
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
              <FormLabel>Authorization Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select authorization role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>This role controls app permissions (e.g., editing events).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-6" />
        <FormLabel>Responsibilities / Participation</FormLabel>
        <FormDescription className="!mt-0 mb-3">
            Select the responsibilities for this member. This affects where they appear (e.g., training attendance).
        </FormDescription>
        <div className="space-y-3">
            {booleanRoles.map((roleKey) => (
                <FormField
                    key={roleKey}
                    control={form.control}
                    name={roleKey as 'isTrainingMember' | 'isMatchMember' | 'isTeamManager' | 'isTrainer' | 'isCoach'}
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm bg-secondary/30">
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        </FormControl>
                        <FormLabel className="font-normal text-sm !mt-0 cursor-pointer flex-1">
                            {booleanRoleLabels[roleKey]}
                        </FormLabel>
                    </FormItem>
                    )}
                />
            ))}
        </div>
        
        {!initialDataProp && (
          <>
            <Separator className="my-6" />
            <FormLabel>Account Credentials</FormLabel>
             <FormDescription className="!mt-0 mb-3">
                Set an initial password for the new member's account.
            </FormDescription>
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
        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initialDataProp ? "Save Changes" : "Add Member & Create Account"}</Button>
        </div>
      </form>
    </Form>
  );
}
