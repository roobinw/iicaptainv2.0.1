
// 'use server'; // Removed to run client-side

import { db } from '@/lib/firebase';
import type { Training } from '@/types';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  type Timestamp, // Explicitly import Timestamp
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { format, parseISO } from 'date-fns';

const getTrainingsCollectionRef = (teamId: string) => {
  if (!db) {
    console.error("Firestore not initialized in getTrainingsCollectionRef");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("Team ID is required for training operations.");
    throw new Error("Team ID is required for training operations.");
  }
  return collection(db, 'teams', teamId, 'trainings');
};

const getTrainingDocRef = (teamId: string, trainingId: string) => {
  if (!db) {
    console.error("Firestore not initialized in getTrainingDocRef");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("Team ID is required for training operations.");
    throw new Error("Team ID is required for training operations.");
  }
  if (!trainingId) {
    console.error("Training ID is required.");
    throw new Error("Training ID is required.");
  }
  return doc(db, 'teams', teamId, 'trainings', trainingId);
};

// Helper to convert Firestore Timestamp to ISO string or return undefined
const processTimestamp = (timestamp: Timestamp | undefined): string | undefined => {
  return timestamp ? timestamp.toDate().toISOString() : undefined;
};

const toFirestoreTraining = (trainingData: Omit<Training, 'id'>): any => {
  // Assuming trainingData.date is already "yyyy-MM-dd" string as per Training type and form logic.
  // The forms (AddTrainingForm) are responsible for this formatting.
  const dateString = trainingData.date;

  return {
    ...trainingData,
    date: dateString,
  };
};

const fromFirestoreTraining = (docSnap: any): Training => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    attendance: data.attendance || {}, // Ensure attendance is always an object
  } as Training;
};

export const addTraining = async (teamId: string, trainingData: Omit<Training, 'id' | 'attendance'>): Promise<string> => {
  // trainingData.date comes from AddTrainingForm, where it's already formatted "yyyy-MM-dd"
  const firestorePayload = {
    ...trainingData,
    attendance: {}, // Initialize attendance as empty object
    order: (await getTrainings(teamId)).length, // Set initial order
  };
  const trainingsColRef = getTrainingsCollectionRef(teamId);
  // Pass firestorePayload directly as its date is already string
  const docRef = await addDoc(trainingsColRef, firestorePayload);
  return docRef.id;
};

export const getTrainings = async (teamId: string): Promise<Training[]> => {
  if (!teamId) return [];
  const trainingsColRef = getTrainingsCollectionRef(teamId);
  // Default sort by order, then by date and time if order is not set or equal
  const q = query(trainingsColRef, orderBy('order', 'asc'), orderBy('date', 'desc'), orderBy('time', 'desc'));
  const trainingSnapshot = await getDocs(q);
  return trainingSnapshot.docs.map(fromFirestoreTraining);
};

export const getTrainingById = async (teamId: string, trainingId: string): Promise<Training | null> => {
  if (!teamId || !trainingId) return null;
  const trainingDocRef = getTrainingDocRef(teamId, trainingId);
  const docSnap = await getDoc(trainingDocRef);
  return docSnap.exists() ? fromFirestoreTraining(docSnap) : null;
};

export const updateTraining = async (teamId: string, trainingId: string, data: Partial<Omit<Training, 'id'>>): Promise<void> => {
  const trainingDocRef = getTrainingDocRef(teamId, trainingId);
  
  const updateData = {...data};
  // Ensure date is correctly formatted if present and it's a Date object
  // If it's already a "yyyy-MM-dd" string (as expected from forms), it remains unchanged.
  if (data.date) {
    if (typeof data.date === 'string') {
        // Validate or re-format if necessary, but typically it's already "yyyy-MM-dd"
        updateData.date = data.date;
    } else if (data.date instanceof Date) {
        updateData.date = format(data.date, "yyyy-MM-dd");
    } else {
        updateData.date = format(parseISO(data.date as string), "yyyy-MM-dd"); // Fallback
    }
  }
  if ('id' in updateData) delete (updateData as any).id;

  await updateDoc(trainingDocRef, updateData);
};

export const deleteTraining = async (teamId: string, trainingId: string): Promise<void> => {
  const trainingDocRef = getTrainingDocRef(teamId, trainingId);
  await deleteDoc(trainingDocRef);
};

export const updateTrainingAttendance = async (
  teamId: string,
  trainingId: string,
  playerId: string, // Firebase UID of the player
  status: "present" | "absent" | "excused" | "unknown"
): Promise<void> => {
  const trainingDocRef = getTrainingDocRef(teamId, trainingId);
  const fieldPath = `attendance.${playerId}`; // Use dot notation
  await updateDoc(trainingDocRef, {
    [fieldPath]: status,
  });
};

export const updateTrainingsOrder = async (teamId: string, orderedTrainings: Array<{ id: string; order: number }>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for updating trainings order.");
  const batch = writeBatch(db);
  
  orderedTrainings.forEach(training => {
    const trainingRef = getTrainingDocRef(teamId, training.id);
    batch.update(trainingRef, { order: training.order });
  });
  await batch.commit();
};

