
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Location } from "@/types";
import { LocationCard } from "./location-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

interface LocationListProps {
  locations: Location[];
  isLoading: boolean;
  onEditLocation: (location: Location) => void;
  onDeleteLocation: (locationId: string) => void;
  onAddLocation: () => void; // Callback to open the add dialog
  isAdmin: boolean;
}

export function LocationList({
  locations,
  isLoading,
  onEditLocation,
  onDeleteLocation,
  onAddLocation,
  isAdmin,
}: LocationListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>No Locations Found</CardTitle>
          <CardDescription>
            There are no locations saved for your team yet.
            {isAdmin && " Click 'Add Location' to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icons.MapPin className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              It looks a bit empty here.
            </p>
            {isAdmin && (
              <Button className="mt-4" onClick={onAddLocation}>
                <Icons.Add className="mr-2 h-4 w-4" /> Add First Location
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {locations.map((location) => (
        <LocationCard
          key={location.id}
          location={location}
          onEdit={onEditLocation}
          onDelete={onDeleteLocation}
        />
      ))}
    </div>
  );
}
