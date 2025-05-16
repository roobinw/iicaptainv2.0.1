
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { Icons } from "./icons";
import type { Match } from "@/types";
import { useEffect, useState } from "react"; // Added useEffect and useState
// Opponent service and type imports removed as opponents are now simple strings

const matchSchema = z.object({
  opponent: z.string().min(1, { message: "Opponent name is required." }),
  date: z.date({ required_error: "Match date is required." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
  location: z.string().min(1, { message: "Location is required." }),
});

type MatchFormValues = z.infer<typeof matchSchema>;

interface AddMatchFormProps {
  onSubmit: (data: Omit<Match, "id" | "attendance" | "isArchived">) => void;
  initialData?: Match | null;
  onClose: () => void;
}

export function AddMatchForm({ onSubmit, initialData, onClose }: AddMatchFormProps) {
  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: initialData ? {
      ...initialData,
      date: initialData.date ? (isValid(parseISO(initialData.date)) ? parseISO(initialData.date) : new Date()) : new Date(),
    } : {
      opponent: "",
      time: "14:00",
      location: "Home Ground",
      date: new Date(),
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        date: initialData.date ? (isValid(parseISO(initialData.date)) ? parseISO(initialData.date) : new Date()) : new Date(),
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: MatchFormValues) => {
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
          name="opponent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opponent</FormLabel>
              <FormControl>
                <Input placeholder="Rival FC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <Icons.CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" side="bottom" sideOffset={8}>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
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
                <Input type="time" placeholder="14:00" {...field} />
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
                <Input placeholder="Home Ground" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initialData ? "Save Changes" : "Add Match"}</Button>
        </div>
      </form>
    </Form>
  );
}
