"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  id: string;
  children: React.ReactNode; // Should be a single ReactElement that can accept dndListeners
  disabled?: boolean;
}

export function SortableItem(props: SortableItemProps) {
  const {
    attributes, // for the sortable node itself
    listeners,  // for the drag handle specifically
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id, disabled: props.disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  // The main div gets the setNodeRef and general attributes.
  // The listeners for dragging are passed to the child, which should apply them to its handle.
  return (
    <div ref={setNodeRef} style={style} {...attributes} className={cn(props.disabled && "cursor-default")}>
      {/* Pass listeners to the child component (e.g., MatchCard/TrainingCard) */}
      {/* Ensure children is a single ReactElement for cloneElement to work correctly and pass props */}
      {React.isValidElement(props.children) ? 
        React.cloneElement(props.children as React.ReactElement, { dndListeners: props.disabled ? undefined : listeners })
        : props.children
      }
    </div>
  );
}
