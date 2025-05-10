"use client";

import { format, parseISO } from "date-fns";
import { Icons } from "@/components/icons";
import type { Training } from "@/types";
import { EventCardBase } from "./event-card-base";

interface TrainingCardProps {
  training: Training;
  onEdit?: (training: Training) => void;
  onDelete?: (trainingId: string) => void;
  dndListeners?: any; // For drag-and-drop handle
}

export function TrainingCard({ training, onEdit, onDelete, dndListeners }: TrainingCardProps) {
  return (
    <EventCardBase
      item={training}
      eventType="training"
      icon={<Icons.Trainings className="h-5 w-5 text-primary" />}
      titlePrefix="" 
      renderDetails={(itemDetails) => { 
        const currentTraining = itemDetails as Training;
        return (
          <>
            {format(parseISO(currentTraining.date), "EEEE, MMMM dd, yyyy")} at {currentTraining.time}
            {currentTraining.description && <><br />Note: {currentTraining.description}</>}
          </>
        );
      }}
      onEdit={onEdit} 
      onDelete={onDelete}
      dndListeners={dndListeners} // Pass down dndListeners
    />
  );
}
