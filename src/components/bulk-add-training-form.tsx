
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Icons } from "./icons";
import type { Training } from "@/types";

const singleTrainingSchema = z.object({
  location: z.string().min(1, { message: "Location is required." }),
  date: z.date({ required_error: "Training date is required." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
  description: z.string().optional(),
});

const bulkTrainingSchema = z.object({
  trainings: z.array(singleTrainingSchema).min(1, "Please add at least one training session."),
});

type BulkTrainingFormValues = z.infer<typeof bulkTrainingSchema>;
export type SingleTrainingFormInput = Omit<Training, "id" | "attendance" | "order">;


interface BulkAddTrainingFormProps {
  onSubmit: (data: SingleTrainingFormInput[]) => void;
  onClose: () => void;
}

export function BulkAddTrainingForm({ onSubmit, onClose }: BulkAddTrainingFormProps) {
  const form = useForm<BulkTrainingFormValues>({
    resolver: zodResolver(bulkTrainingSchema),
    defaultValues: {
      trainings: [{ location: "Training Pitch A", date: new Date(), time: "19:00", description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "trainings",
  });

  const handleSubmit = (data: BulkTrainingFormValues) => {
    const formattedTrainings = data.trainings.map(t => ({
      ...t,
      date: format(t.date, "yyyy-MM-dd"), // Format date to string for Firestore
    }));
    onSubmit(formattedTrainings);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ScrollArea className="h-[400px] pr-3"> {/* Added pr-3 for scrollbar spacing */}
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md shadow-sm bg-card relative">
                <h3 className="text-lg font-medium mb-3">Training Session {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                    aria-label={`Remove training session ${index + 1}`}
                  >
                    <Icons.Delete className="h-4 w-4" />
                  </Button>
                )}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`trainings.${index}.location`}
                    render={({ field: currentField }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Training Pitch A" {...currentField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`trainings.${index}.date`}
                    render={({ field: currentField }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover modal={true}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !currentField.value && "text-muted-foreground"
                                )}
                              >
                                {currentField.value ? (
                                  format(currentField.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Icons.CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={currentField.value}
                              onSelect={currentField.onChange}
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
                    name={`trainings.${index}.time`}
                    render={({ field: currentField }) => (
                      <FormItem>
                        <FormLabel>Time (HH:MM)</FormLabel>
                        <FormControl>
                          <Input type="time" placeholder="19:00" {...currentField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`trainings.${index}.description`}
                    render={({ field: currentField }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Focus on drills, tactics, etc." {...currentField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ location: "Training Pitch A", date: new Date(), time: "19:00", description: "" })}
            className="w-full sm:w-auto"
          >
            <Icons.Add className="mr-2 h-4 w-4" /> Add Another Session
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">Cancel</Button>
            <Button type="submit" className="flex-1 sm:flex-none">
              {form.formState.isSubmitting ? <Icons.Dashboard className="animate-spin" /> : "Submit All Trainings"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
