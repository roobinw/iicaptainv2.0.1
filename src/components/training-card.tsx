"use client";

import { format, parseISO } from "date-fns";
import { Icons } from "@/components/icons";
import type { Training, Match } from "@/types";
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
          <div className="text-xs sm:text-sm space-y-0.5"> {/* Responsive text size and spacing */}
            <div>
              {format(parseISO(currentTraining.date), "EEEE, MMM dd, yyyy")} at {currentTraining.time}
            </div>
            {currentTraining.description && 
              <div className="truncate"> {/* Truncate description if too long */}
                Note: {currentTraining.description}
              </div>
            }
          </div>
        );
      }}
      onEdit={onEdit ? (item) => onEdit(item as Training) : undefined} 
      onDelete={onDelete}
      dndListeners={dndListeners} // Pass down dndListeners
    />
  );
}
