
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Added DialogTrigger
import { Icons } from "@/components/icons";
import { AddEditLocationForm, type LocationFormValues } from "@/components/add-edit-location-form";
import { LocationList } from "@/components/location-list";
import type { Location } from "@/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { addLocation, getLocationsByTeamId, updateLocation, deleteLocation } from "@/services/locationService";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationsSettingsPage() {
  const { user, isLoading: authLoading, currentTeam } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const fetchLocations = useCallback(async (teamId: string) => {
    setIsLoadingData(true);
    try {
      const fetchedLocations = await getLocationsByTeamId(teamId);
      setLocations(fetchedLocations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast({ title: "Error", description: "Could not fetch locations.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user?.teamId && currentTeam) {
      fetchLocations(user.teamId);
    } else if (!authLoading && (!user || !user.teamId || !currentTeam)) {
      setLocations([]);
      setIsLoadingData(false);
    }
  }, [authLoading, user, currentTeam, fetchLocations]);

  const handleOpenAddLocationDialog = () => {
    setEditingLocation(null);
    setIsLocationFormOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setIsLocationFormOpen(true);
  };

  const handleLocationFormSubmit = async (data: LocationFormValues) => {
    if (!user?.teamId) {
      toast({ title: "Error", description: "Team information is missing.", variant: "destructive" });
      return;
    }
    setIsSubmittingForm(true);
    try {
      if (editingLocation) {
        await updateLocation(user.teamId, editingLocation.id, data);
        toast({ title: "Location Updated", description: `"${data.name}" has been updated.` });
      } else {
        await addLocation(user.teamId, data);
        toast({ title: "Location Added", description: `"${data.name}" has been added.` });
      }
      fetchLocations(user.teamId);
      setIsLocationFormOpen(false);
      setEditingLocation(null);
    } catch (error: any) {
      toast({
        title: editingLocation ? "Error updating location" : "Error adding location",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!user?.teamId) {
      toast({ title: "Error", description: "Team information is missing.", variant: "destructive" });
      return;
    }
    // Confirmation is handled in LocationCard, but good to be safe
    // if (!window.confirm("Are you sure you want to delete this location?")) return;
    try {
      await deleteLocation(user.teamId, locationId);
      toast({ title: "Location Deleted", description: "The location has been removed.", variant: "destructive" });
      fetchLocations(user.teamId); // Refetch to update the list
    } catch (error: any) {
      toast({ title: "Error deleting location", description: error.message || "Could not delete location.", variant: "destructive" });
    }
  };

  const isAdmin = user?.role === "admin";

  if (authLoading || (isLoadingData && locations.length === 0 && !currentTeam)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Skeleton className="h-9 w-1/2" />
          {isAdmin && <Skeleton className="h-10 w-36" />}
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!user || !user.teamId || !currentTeam) {
    return <div className="flex h-full items-center justify-center"><p>Loading team data or redirecting...</p></div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Locations</h1>
          <p className="text-muted-foreground">
            Add, edit, or remove custom locations for {currentTeam.name}.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isLocationFormOpen} onOpenChange={(isOpen) => {
            setIsLocationFormOpen(isOpen);
            if (!isOpen) setEditingLocation(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAddLocationDialog}>
                <Icons.Add className="mr-2 h-4 w-4" /> Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[450px] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
                <DialogDescription>
                  {editingLocation ? `Update details for ${editingLocation.name}.` : "Fill in the details for the new location."}
                </DialogDescription>
              </DialogHeader>
              <AddEditLocationForm
                onSubmit={handleLocationFormSubmit}
                initialData={editingLocation}
                onClose={() => {
                  setIsLocationFormOpen(false);
                  setEditingLocation(null);
                }}
                isSubmitting={isSubmittingForm}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <LocationList
        locations={locations}
        isLoading={isLoadingData}
        onEditLocation={isAdmin ? handleEditLocation : () => {}}
        onDeleteLocation={isAdmin ? handleDeleteLocation : () => {}}
        onAddLocation={isAdmin ? handleOpenAddLocationDialog : () => {}}
        isAdmin={isAdmin}
      />
    </div>
  );
}
