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
import { format, addWeeks } from "date-fns";
import { Icons } from "./icons";
import type { Training } from "@/types";

// Schema for a single base training session and the number of weeks it should repeat
const weeklyRepeatTrainingSchema = z.object({
  baseTraining: z.object({
    location: z.string().min(1, { message: "Location is required." }),
    date: z.date({ required_error: "Start date for training is required." }),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
    description: z.string().optional(),
  }),
  numberOfWeeks: z.coerce // Coerce to number, e.g. from string input
    .number({invalid_type_error: "Please enter a valid number."})
    .int({ message: "Number of weeks must be a whole number." })
    .min(0, "Number of additional weeks must be 0 or more.")
    .max(52, "Cannot add more than 52 additional weeks at once (1 year)."), 
});

// Type for the form values based on the new schema
type WeeklyRepeatTrainingFormValues = z.infer<typeof weeklyRepeatTrainingSchema>;

// This type defines the structure of a single training session expected by the onSubmit prop (and ultimately the service)
export type SingleTrainingFormInput = Omit<Training, "id" | "attendance" | "order">;

interface BulkAddTrainingFormProps {
  onSubmit: (data: SingleTrainingFormInput[]) => void;
  onClose: () => void;
}

export function BulkAddTrainingForm({ onSubmit, onClose }: BulkAddTrainingFormProps) {
  const form = useForm<WeeklyRepeatTrainingFormValues>({
    resolver: zodResolver(weeklyRepeatTrainingSchema),
    defaultValues: {
      baseTraining: { 
        location: "Training Pitch A", 
        // date: new Date(), // Let user pick
        time: "19:00", 
        description: "" 
      },
      numberOfWeeks: 4, // Default to creating 4 additional weekly trainings (5 total sessions)
    },
  });

  const handleSubmit = (data: WeeklyRepeatTrainingFormValues) => {
    const { baseTraining, numberOfWeeks } = data;
    const trainingsToCreate: SingleTrainingFormInput[] = [];

    // Add the initial training session
    trainingsToCreate.push({
      ...baseTraining,
      date: format(baseTraining.date, "yyyy-MM-dd"),
    });

    // Add subsequent weekly training sessions
    let currentDate = baseTraining.date;
    for (let i = 0; i < numberOfWeeks; i++) {
      currentDate = addWeeks(currentDate, 1);
      trainingsToCreate.push({
        location: baseTraining.location,
        date: format(currentDate, "yyyy-MM-dd"),
        time: baseTraining.time,
        description: baseTraining.description,
      });
    }
    onSubmit(trainingsToCreate);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-4 border rounded-md shadow-sm bg-card space-y-4">
          <h3 className="text-lg font-medium mb-3">Base Training Session Details</h3>
          <FormField
            control={form.control}
            name="baseTraining.location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Training Pitch A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="baseTraining.date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
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
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a start date</span>
                        )}
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
            name="baseTraining.time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time (HH:MM)</FormLabel>
                <FormControl>
                  <Input type="time" placeholder="19:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="baseTraining.description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Focus on drills, tactics, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="numberOfWeeks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Additional Weeks to Repeat</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 4" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                The training will be scheduled for the start date, plus this many subsequent weeks on the same day.
                Entering '0' will schedule only the initial training.
              </p>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Icons.Dashboard className="animate-spin" /> : "Schedule Trainings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
