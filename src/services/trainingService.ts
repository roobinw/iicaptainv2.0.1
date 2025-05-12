
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
// Import EventArchiveFilter from matchService
import type { EventArchiveFilter } from '@/services/matchService';


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
  const updateData: { [key: string]: any } = {};

  if (data.hasOwnProperty('date')) {
    const dateValue = data.date;
    if (typeof dateValue === 'string') {
        try {
            const parsed = parseISO(dateValue);
            updateData.date = format(parsed, "yyyy-MM-dd");
        } catch (e) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                updateData.date = dateValue;
            } else {
                console.error(`Date string "${dateValue}" in updateTraining is not valid. Date will not be updated. Error: ${e}`);
            }
        }
    } else if (dateValue instanceof Date) {
        updateData.date = format(dateValue, "yyyy-MM-dd");
    } else if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue && typeof (dateValue as Timestamp).toDate === 'function') {
        updateData.date = format((dateValue as Timestamp).toDate(), "yyyy-MM-dd");
    } else if (dateValue === null) {
        updateData.date = null;
    } else if (dateValue !== undefined) {
        console.error(`updateTraining received an unhandled date type: ${typeof dateValue}. Date will not be updated. Value:`, dateValue);
    }
  }

  for (const key in data) {
    if (key !== 'date' && data.hasOwnProperty(key)) {
      (updateData as any)[key] = (data as any)[key];
    }
  }
  
  if (Object.keys(updateData).length > 0) {
    await updateDoc(trainingDocRef, updateData);
  } else {
    console.warn("updateTraining called with no effective changes for training:", trainingId);
  }
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


