
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RefereeingAssignment, User } from "@/types";
import { updateRefereeingAssignment } from "@/services/refereeingService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

const assignMembersSchema = z.object({ // Renamed schema
  assignedPlayerUids: z.array(z.string()), 
});

type AssignMembersFormValues = z.infer<typeof assignMembersSchema>; // Renamed type

interface AssignMembersFormProps { // Renamed interface
  assignment: RefereeingAssignment;
  teamMembers: User[];
  isLoadingMembers: boolean;
  onClose: () => void;
  onAssignSuccess: () => void;
}

export function AssignPlayersForm({ // Function name can remain if it's broadly about "players" of the game being refereed
  assignment,
  teamMembers,
  isLoadingMembers,
  onClose,
  onAssignSuccess,
}: AssignMembersFormProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const form = useForm<AssignMembersFormValues>({ // Use renamed type
    resolver: zodResolver(assignMembersSchema), // Use renamed schema
    defaultValues: {
      assignedPlayerUids: assignment.assignedPlayerUids || [],
    },
  });

  async function onSubmit(data: AssignMembersFormValues) { // Use renamed type
    if (!currentUser?.teamId || !assignment.id) {
      toast({
        title: "Error",
        description: "Team ID or Assignment ID is missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateRefereeingAssignment(currentUser.teamId, assignment.id, {
        assignedPlayerUids: data.assignedPlayerUids,
      });
      toast({
        title: "Assignment Updated",
        description: "Assigned members have been updated.", // Updated text
      });
      onAssignSuccess();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update assigned members.", // Updated text
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormItem>
          <FormLabel>Select Members to Assign</FormLabel>
          {isLoadingMembers ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3 rounded-md border p-3">
                  <Skeleton className="h-5 w-5 rounded-sm" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : teamMembers.length > 0 ? (
            <ScrollArea className="h-48 w-full rounded-md border p-2">
              {teamMembers.map((member) => (
                <FormField
                  key={member.uid}
                  control={form.control}
                  name="assignedPlayerUids"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 hover:bg-muted/50 rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(member.uid)}
                          onCheckedChange={(checked) => {
                            const currentUids = field.value || [];
                            return checked
                              ? field.onChange([...currentUids, member.uid])
                              : field.onChange(
                                  currentUids.filter(
                                    (uid) => uid !== member.uid
                                  )
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-sm cursor-pointer flex-1">
                        {member.name} ({member.role})
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground p-2">
              No team members found to assign.
            </p>
          )}
          <FormMessage />
        </FormItem>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Assignment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

