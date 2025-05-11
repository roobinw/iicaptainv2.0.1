
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Icons } from "./icons";
import type { RefereeingAssignment, User } from "@/types";
import { useAuth } from "@/lib/auth";
import { getAllUsersByTeam } from "@/services/userService";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

const refereeingAssignmentSchema = z.object({
  date: z.date({ required_error: "Assignment date is required." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
  homeTeam: z.string().min(1, { message: "Home team name is required." }),
  awayTeam: z.string().min(1, { message: "Away team name is required." }),
  location: z.string().min(1, { message: "Location is required." }),
  assignedPlayerUids: z.array(z.string()).min(1, { message: "At least one player must be assigned." }),
  notes: z.string().optional(),
});

type RefereeingAssignmentFormValues = z.infer<typeof refereeingAssignmentSchema>;

interface AddRefereeingAssignmentFormProps {
  onSubmit: (data: Omit<RefereeingAssignment, "id" | "order">) => void;
  initialData?: RefereeingAssignment | null;
  onClose: () => void;
}

export function AddRefereeingAssignmentForm({ onSubmit, initialData, onClose }: AddRefereeingAssignmentFormProps) {
  const { user: currentUser, currentTeam } = useAuth();
  const [teamPlayers, setTeamPlayers] = useState<User[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  const form = useForm<RefereeingAssignmentFormValues>({
    resolver: zodResolver(refereeingAssignmentSchema),
    defaultValues: initialData ? {
      ...initialData,
      date: parseISO(initialData.date), // Convert date string back to Date object
      assignedPlayerUids: initialData.assignedPlayerUids || [],
    } : {
      homeTeam: "",
      awayTeam: "",
      time: "10:00", 
      location: "",
      assignedPlayerUids: [],
      notes: "",
    },
  });

  useEffect(() => {
    if (currentUser?.teamId) {
      setIsLoadingPlayers(true);
      getAllUsersByTeam(currentUser.teamId)
        .then(players => {
          setTeamPlayers(players.filter(p => p.role === 'player')); // Only list players
        })
        .catch(console.error)
        .finally(() => setIsLoadingPlayers(false));
    }
  }, [currentUser?.teamId]);

  const handleSubmit = (data: RefereeingAssignmentFormValues) => {
    onSubmit({
      ...data,
      date: format(data.date, "yyyy-MM-dd"),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <Icons.CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time (HH:MM)</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="homeTeam"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home Team</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Club Youth A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="awayTeam"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Away Team</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Opponent Youth B" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Club Pitch 3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assignedPlayerUids"
          render={() => (
            <FormItem>
              <FormLabel>Assign Player(s) to Referee</FormLabel>
              {isLoadingPlayers ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : teamPlayers.length > 0 ? (
                <ScrollArea className="h-32 w-full rounded-md border p-2">
                  {teamPlayers.map((player) => (
                    <FormField
                      key={player.uid}
                      control={form.control}
                      name="assignedPlayerUids"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={player.uid}
                            className="flex flex-row items-start space-x-3 space-y-0 py-2"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(player.uid)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), player.uid])
                                    : field.onChange(
                                        (field.value || []).filter(
                                          (value) => value !== player.uid
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              {player.name}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No players available in your team to assign.</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any specific instructions or details..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initialData ? "Save Changes" : "Add Assignment"}</Button>
        </div>
      </form>
    </Form>
  );
}
