
"use client";

import { format, parseISO } from "date-fns";
import { Icons } from "@/components/icons";
import type { Training, Match } from "@/types";
import { EventCardBase } from "./event-card-base";
import { useAuth } from "@/lib/auth";


interface TrainingCardProps {
  training: Training;
  onEdit?: (training: Training) => void;
  onDelete?: (trainingId: string) => void;
  dndListeners?: any; 
}

export function TrainingCard({ training, onEdit, onDelete, dndListeners }: TrainingCardProps) {
  const { currentTeam } = useAuth();
  return (
    <EventCardBase
      item={training}
      eventType="training" // Explicitly set eventType
      icon={<Icons.Trainings className="h-5 w-5 text-primary" />}
      titlePrefix={currentTeam?.name || "Team"}
      renderDetails={(itemDetails) => { 
        const currentTraining = itemDetails as Training;
        return (
          <div className="text-xs sm:text-sm space-y-0.5 mt-1"> 
            <div>
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
      dndListeners={dndListeners}
    />
  );
}
