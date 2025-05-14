
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
import type { Location } from "@/types";
import { Icons } from "./icons";

const locationSchema = z.object({
  name: z.string().min(2, { message: "Location name must be at least 2 characters." }).max(100, { message: "Location name must be 100 characters or less." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }).max(200, { message: "Address must be 200 characters or less." }),
  notes: z.string().max(500, { message: "Notes must be 500 characters or less." }).optional(),
});

export type LocationFormValues = z.infer<typeof locationSchema>;

interface AddEditLocationFormProps {
  onSubmit: (data: LocationFormValues) => void;
  initialData?: Partial<Location> | null; // Making notes optional as well for initialData
  onClose: () => void;
  isSubmitting?: boolean;
}

export function AddEditLocationForm({ onSubmit, initialData, onClose, isSubmitting }: AddEditLocationFormProps) {
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      notes: initialData?.notes || "",
    },
  });

  const handleSubmit = (data: LocationFormValues) => {
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
              <FormLabel>Location Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Main Training Field" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Address</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 123 Victory Lane, Sportsville" {...field} disabled={isSubmitting} />
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
                <Textarea
                  placeholder="e.g., Parking available at the back. Use side entrance."
                  className="min-h-[100px]"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Icons.Dashboard className="animate-spin" /> : (initialData?.id ? "Save Changes" : "Add Location")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
