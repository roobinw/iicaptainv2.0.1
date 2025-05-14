
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import type { Location } from "@/types";
import { useAuth } from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LocationCardProps {
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (locationId: string) => void;
}

export function LocationCard({ location, onEdit, onDelete }: LocationCardProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Card className="shadow-lg hover:shadow-primary/10 transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Icons.MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">{location.name}</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm truncate">
              {location.address}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-2 pb-3">
        {location.notes && (
          <p className="text-xs text-muted-foreground break-words line-clamp-3">
            <strong>Notes:</strong> {location.notes}
          </p>
        )}
      </CardContent>
      {isAdmin && (
        <CardFooter className="border-t pt-3 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(location)} className="whitespace-nowrap">
            <Icons.Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="whitespace-nowrap">
                <Icons.Delete className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the location
                  <span className="font-semibold"> {location.name}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(location.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}
