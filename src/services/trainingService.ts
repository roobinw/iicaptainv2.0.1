
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
  Timestamp, 
  getDoc,
  writeBatch,
  where, // Added for filtering by isArchived
} from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import type { SingleTrainingFormInput } from '@/components/bulk-add-training-form';
import type { EventArchiveFilter } from './matchService'; // Reuse filter type


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

const fromFirestoreTraining = (docSnap: any): Training => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    date: data.date instanceof Timestamp ? format(data.date.toDate(), "yyyy-MM-dd") : data.date,
    attendance: data.attendance || {}, 
    isArchived: data.isArchived || false, // Default to false
  } as Training;
};

export const addTraining = async (teamId: string, trainingData: Omit<Training, 'id' | 'attendance' | 'isArchived'>): Promise<string> => {
  const firestorePayload = {
    ...trainingData,
    date: trainingData.date, 
    attendance: {}, 
    isArchived: false, // Default new trainings to not archived
  };
  const trainingsColRef = getTrainingsCollectionRef(teamId);
  const docRef = await addDoc(trainingsColRef, firestorePayload);
  return docRef.id;
};

export const bulkAddTrainings = async (teamId: string, trainingsData: SingleTrainingFormInput[]): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for bulk adding trainings.");
  if (trainingsData.length === 0) return;

  const trainingsColRef = getTrainingsCollectionRef(teamId);
  const batch = writeBatch(db);

  trainingsData.forEach((training) => {
    const newDocRef = doc(trainingsColRef); 
    const firestorePayload = {
      ...training, 
      attendance: {},
      isArchived: false, // Default new trainings to not archived
    };
    batch.set(newDocRef, firestorePayload);
  });

  await batch.commit();
};


export const getTrainings = async (teamId: string, filter: EventArchiveFilter = "active"): Promise<Training[]> => {
  if (!teamId) return [];
  const trainingsColRef = getTrainingsCollectionRef(teamId);
  
  let q;
  const baseQueryConstraints = [orderBy('date', 'asc'), orderBy('time', 'asc')];

  if (filter === "active") {
    q = query(trainingsColRef, where('isArchived', '==', false), ...baseQueryConstraints);
  } else if (filter === "archived") {
    q = query(trainingsColRef, where('isArchived', '==', true), ...baseQueryConstraints);
  } else { // 'all'
    q = query(trainingsColRef, ...baseQueryConstraints);
  }

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
  const updateData: any = { ...data };

  if (data.date && typeof data.date !== 'string') {
    // Check if it's a Date object before formatting
    if (data.date instanceof Date) {
      console.warn("updateTraining received Date object for date, formatting to yyyy-MM-dd", data.date);
      updateData.date = format(data.date, "yyyy-MM-dd");
    } else {
      // If it's not a string and not a Date object, try parsing as ISO (might be from server like Timestamp.toDate().toISOString())
      try {
        updateData.date = format(parseISO(data.date as unknown as string), "yyyy-MM-dd");
      } catch (e) {
        console.error(`Date string "${data.date}" in updateTraining was not a valid ISO string. Cannot format. Error: ${e}`);
        // Decide how to handle: either throw error, or use as is if you trust the format, or skip update for date.
        // For now, let's skip updating date if format is unrecognized to prevent data corruption.
        delete updateData.date; 
      }
    }
  } else if (data.date && typeof data.date === 'string') {
     try {
        updateData.date = format(parseISO(data.date), "yyyy-MM-dd");
    } catch (e) {
        console.warn(`Date string "${data.date}" in updateTraining was not in a standard ISO format. Using as is. Error: ${e}`);
        updateData.date = data.date;
    }
  }
  
  await updateDoc(trainingDocRef, updateData);
};

export const deleteTraining = async (teamId: string, trainingId: string): Promise<void> => {
  const trainingDocRef = getTrainingDocRef(teamId, trainingId);
  await deleteDoc(trainingDocRef);
};

export const updateTrainingAttendance = async (
  teamId: string,
  trainingId: string,
  playerId: string, 
  status: "present" | "absent" | "excused" | "unknown"
): Promise<void> => {
  const trainingDocRef = getTrainingDocRef(teamId, trainingId);
  const fieldPath = `attendance.${playerId}`; 
  await updateDoc(trainingDocRef, {
    [fieldPath]: status,
  });
};

export const archiveTraining = async (teamId: string, trainingId: string): Promise<void> => {
  const trainingDocRef = getTrainingDocRef(teamId, trainingId);
  await updateDoc(trainingDocRef, { isArchived: true });
};

export const unarchiveTraining = async (teamId: string, trainingId: string): Promise<void> => {
  const trainingDocRef = getTrainingDocRef(teamId, trainingId);
  await updateDoc(trainingDocRef, { isArchived: false });
};
