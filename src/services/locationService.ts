
import { db } from '@/lib/firebase';
import type { Location } from '@/types'; // Timestamp type for interfaces is fine, but not for instanceof
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  Timestamp, // Import actual Timestamp class from Firestore for instanceof checks
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { format } from 'date-fns';

const getLocationsCollectionRef = (teamId: string) => {
  if (!db) {
    console.error("Firestore not initialized in getLocationsCollectionRef");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("Team ID is required for location operations.");
    throw new Error("Team ID is required for location operations.");
  }
  return collection(db, 'teams', teamId, 'locations');
};

const getLocationDocRef = (teamId: string, locationId: string) => {
  if (!db) {
    console.error("Firestore not initialized in getLocationDocRef");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("Team ID is required for location operations.");
    throw new Error("Team ID is required for location operations.");
  }
  if (!locationId) {
    console.error("Location ID is required.");
    throw new Error("Location ID is required.");
  }
  return doc(db, 'teams', teamId, 'locations', locationId);
};

const fromFirestoreLocation = (docSnap: QueryDocumentSnapshot<DocumentData>): Location => {
  const data = docSnap.data();
  // Check if data.createdAt is a Firestore Timestamp object before calling toDate()
  const createdAtValue = data.createdAt;
  let formattedCreatedAt: string | undefined = undefined;

  if (createdAtValue instanceof Timestamp) {
    formattedCreatedAt = format(createdAtValue.toDate(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  } else if (typeof createdAtValue === 'string') {
    // If it's already a string, use it as is (assuming it's in correct format or to be handled by UI)
    formattedCreatedAt = createdAtValue;
  }
  // If createdAtValue is undefined or any other type, formattedCreatedAt remains undefined

  return {
    id: docSnap.id,
    name: data.name,
    address: data.address,
    createdAt: formattedCreatedAt,
    notes: data.notes,
  } as Location; // Cast as Location, assuming name and address are always present
};

export const addLocation = async (
  teamId: string,
  locationData: Omit<Location, 'id' | 'createdAt'>
): Promise<string> => {
  const firestorePayload = {
    ...locationData,
    createdAt: serverTimestamp(),
  };
  const locationsColRef = getLocationsCollectionRef(teamId);
  const docRef = await addDoc(locationsColRef, firestorePayload);
  return docRef.id;
};

export const getLocationsByTeamId = async (teamId: string): Promise<Location[]> => {
  if (!teamId) return [];
  const locationsColRef = getLocationsCollectionRef(teamId);
  const q = query(locationsColRef, orderBy('name', 'asc'));
  const locationSnapshot = await getDocs(q);
  return locationSnapshot.docs.map(fromFirestoreLocation);
};

export const getLocationById = async (teamId: string, locationId: string): Promise<Location | null> => {
  if (!teamId || !locationId) return null;
  const locationDocRef = getLocationDocRef(teamId, locationId);
  const docSnap = await getDoc(locationDocRef);
  return docSnap.exists() ? fromFirestoreLocation(docSnap as QueryDocumentSnapshot<DocumentData>) : null;
};

export const updateLocation = async (
  teamId: string,
  locationId: string,
  data: Partial<Omit<Location, 'id' | 'createdAt'>>
): Promise<void> => {
  const locationDocRef = getLocationDocRef(teamId, locationId);
  await updateDoc(locationDocRef, data);
};

export const deleteLocation = async (teamId: string, locationId: string): Promise<void> => {
  const locationDocRef = getLocationDocRef(teamId, locationId);
  await deleteDoc(locationDocRef);
};
