
"use client";

import { format, parseISO } from "date-fns";
import { Icons } from "@/components/icons";
import type { Training } from "@/types";
import { EventCardBase } from "./event-card-base";
import { useAuth } from "@/lib/auth";


interface TrainingCardProps {
  training: Training;
  onEdit?: (training: Training) => void;
  onDelete?: (trainingId: string) => void;
  onArchiveToggle?: (training: Training) => void; // New prop
}

export function TrainingCard({ training, onEdit, onDelete, onArchiveToggle }: TrainingCardProps) {
  const { currentTeam } = useAuth(); // currentTeam is not directly used in titlePrefix for trainings
  return (
    <EventCardBase
      item={training}
      eventType="training" 
      icon={<Icons.Trainings className="h-5 w-5 text-primary" />}
      // titlePrefix is not used for training, title is directly training.location
      renderDetails={(itemDetails) => { 
        const currentTraining = itemDetails as Training;
        return (
          <div className="text-xs sm:text-sm space-y-0.5 mt-1"> 
            <div className="truncate">
              {format(parseISO(currentTraining.date), "EEEE, MMM dd, yyyy")} at {currentTraining.time}
            </div>
            {currentTraining.description && 
              <div className="truncate"> 
                Note: {currentTraining.description}
              </div>
            }
          </div>
        );
      }}
      onEdit={onEdit ? (item) => onEdit(item as Training) : undefined}
      onDelete={onDelete}
      onArchiveToggle={onArchiveToggle ? () => onArchiveToggle(training) : undefined} // Pass to EventCardBase
    />
  );
}
