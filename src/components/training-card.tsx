"use client";

import { format, parseISO } from "date-fns";
import { Icons } from "@/components/icons";
import type { Training } from "@/types";
import { EventCardBase } from "./event-card-base";
import type { Dispatch, SetStateAction } from "react";

interface TrainingCardProps {
  training: Training;
  onEdit?: (training: Training) => void;
  onDelete?: (trainingId: string) => void;
  setForceUpdateList?: Dispatch<SetStateAction<number>>;
}

export function TrainingCard({ training, onEdit, onDelete, setForceUpdateList }: TrainingCardProps) {
  return (
    <EventCardBase
      item={training}
      eventType="training"
      icon={<Icons.Trainings className="h-5 w-5 text-primary" />}
      titlePrefix="" 
      renderDetails={(itemDetails) => { // Renamed item to itemDetails
        const currentTraining = itemDetails as Training;
        return (
          <>
            {format(parseISO(currentTraining.date), "EEEE, MMMM dd, yyyy")} at {currentTraining.time}
            {currentTraining.description && <><br />Note: {currentTraining.description}</>}
          </>
        );
      }}
      onEdit={onEdit} // Directly pass onEdit if its signature matches EventCardBase's expectation for a Training
      onDelete={onDelete} // Directly pass onDelete if its signature matches EventCardBase's expectation
      setForceUpdateList={setForceUpdateList}
    />
  );
}

