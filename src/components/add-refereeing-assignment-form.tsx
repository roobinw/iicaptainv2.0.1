
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Icons } from "./icons";
import type { RefereeingAssignment } from "@/types";


const refereeingAssignmentSchema = z.object({
  date: z.date({ required_error: "Assignment date is required." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
  homeTeam: z.string().min(1, { message: "Home team name is required." }).optional(), // Optional to handle existing data, but form makes it feel required
  notes: z.string().optional(),
});

type RefereeingAssignmentFormValues = z.infer<typeof refereeingAssignmentSchema>;

interface AddRefereeingAssignmentFormProps {
  onSubmit: (data: Omit<RefereeingAssignment, "id" | "assignedPlayerUids">) => void; 
  initialData?: RefereeingAssignment | null;
  onClose: () => void;
}

export function AddRefereeingAssignmentForm({ onSubmit, initialData, onClose }: AddRefereeingAssignmentFormProps) {
  const form = useForm<RefereeingAssignmentFormValues>({
    resolver: zodResolver(refereeingAssignmentSchema),
    defaultValues: initialData ? {
      date: parseISO(initialData.date),
      time: initialData.time,
      homeTeam: initialData.homeTeam || "",
      notes: initialData.notes || "",
    } : {
      time: "10:00", 
      homeTeam: "",
      notes: "",
    },
  });

  const handleSubmit = (data: RefereeingAssignmentFormValues) => {
    // Ensure assignedPlayerUids is not part of the submitted data from this form
    const { ...restData } = data; 
    onSubmit({
      ...restData,
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
                <Input placeholder="Name of the home team" {...field} />
              </FormControl>
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


