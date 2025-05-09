
"use client";

import { format, parseISO } from "date-fns";
import { Icons } from "@/components/icons";
import type { Training } from "@/types";
import { EventCardBase } from "./event-card-base";
import type { Dispatch, SetStateAction } from "react";

interface TrainingCardProps {
  training: Training;
  onEdit: (training: Training) => void;
  onDelete: (trainingId: string) => void;
  setForceUpdateList?: Dispatch<SetStateAction<number>>;
}

export function TrainingCard({ training, onEdit, onDelete, setForceUpdateList }: TrainingCardProps) {
  return (
    <EventCardBase
      item={training}
      eventType="training"
      icon={<Icons.Trainings className="h-5 w-5 text-primary" />}
      titlePrefix="" // Location is already the main part of title for training
      renderDetails={(item) => {
        const currentTraining = item as Training;
        return (
          <>
            {format(parseISO(currentTraining.date), "EEEE, MMMM dd, yyyy")} at {currentTraining.time}
            {currentTraining.description && <><br />Note: {currentTraining.description}</>}
          </>
        );
      }}
      onEdit={() => onEdit(training)}
      onDelete={() => onDelete(training.id)}
      setForceUpdateList={setForceUpdateList}
    />
  );
}
