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
  type Timestamp, // Ensure Timestamp is imported
  getDoc,
  writeBatch,
  where, 
} from 'firebase/firestore';
import { format, parseISO, isValid } from 'date-fns';
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
  let dateString = data.date;
  
  if (data.date && typeof data.date.toDate === 'function') { 
    dateString = format((data.date as Timestamp).toDate(), "yyyy-MM-dd");
  } else if (data.date instanceof Date) { 
    dateString = format(data.date, "yyyy-MM-dd");
  } else if (typeof data.date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    const parsed = parseISO(data.date);
    if (isValid(parsed)) {
      dateString = format(parsed, "yyyy-MM-dd");
    }
  }

  return {
    id: docSnap.id,
    ...data,
    date: dateString, 
    attendance: data.attendance || {}, 
    isArchived: data.isArchived || false, 
  } as Training;
};

export const addTraining = async (teamId: string, trainingData: Omit<Training, 'id' | 'attendance' | 'isArchived' | 'date'> & { date: string | Date }): Promise<string> => {
  let dateString: string;
  if (typeof trainingData.date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(trainingData.date)) {
        const parsed = parseISO(trainingData.date + "T00:00:00Z"); 
        if (isValid(parsed)) {
            dateString = trainingData.date;
        } else {
            console.error("Invalid date string format (not yyyy-MM-dd or not a valid date):", trainingData.date);
            throw new Error("Invalid date format. Please use YYYY-MM-DD.");
        }
    } else { 
        const parsedDate = parseISO(trainingData.date);
        if (isValid(parsedDate)) {
            dateString = format(parsedDate, "yyyy-MM-dd");
        } else {
            console.error("Invalid date string format (not ISO or yyyy-MM-dd):", trainingData.date);
            throw new Error("Invalid date format. Please use YYYY-MM-DD or a valid ISO string.");
        }
    }
  } else if (trainingData.date instanceof Date) {
    dateString = format(trainingData.date, "yyyy-MM-dd");
  } else {
    console.error("Invalid date type in addTraining:", trainingData.date);
    throw new Error("Invalid date type. Date must be a string or Date object.");
  }

  const firestorePayload = {
    ...trainingData,
    date: dateString, 
    attendance: {}, 
    isArchived: false, 
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
      isArchived: false, 
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
  } else { 
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

export const updateTraining = async (teamId: string, trainingId: string, data: Partial<Omit<Training, 'id' | 'date'> & { date?: string | Date | Timestamp | null }>): Promise<void> => {
  const trainingDocRef = getTrainingDocRef(teamId, trainingId);
  const updateData: { [key: string]: any } = {};

  const dateValue = data.date;

  if (dateValue === null || dateValue === undefined) {
    // No change to date
  } else if (typeof dateValue === 'string') {
    try {
      let parsedDate;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        parsedDate = parseISO(dateValue + "T00:00:00Z"); 
      } else {
        parsedDate = parseISO(dateValue);
      }
      if (isValid(parsedDate)) {
        updateData.date = format(parsedDate, "yyyy-MM-dd");
      } else {
        console.error(`Date string "${dateValue}" in updateTraining is not valid. TrainingId: ${trainingId}.`);
      }
    } catch (e) {
      console.error(`Error parsing date string "${dateValue}" in updateTraining. TrainingId: ${trainingId}. Error: ${e}`);
    }
  } else if (dateValue instanceof Date) {
    updateData.date = format(dateValue, "yyyy-MM-dd");
  } else if (typeof dateValue === 'object' && 'toDate' in dateValue && typeof (dateValue as Timestamp).toDate === 'function') {
    updateData.date = format((dateValue as Timestamp).toDate(), "yyyy-MM-dd");
  } else {
    console.error(`updateTraining received an unhandled type for date. TrainingId: ${trainingId}, Value:`, dateValue);
  }
  
  for (const key in data) {
    if (key !== 'date' && Object.prototype.hasOwnProperty.call(data, key)) {
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
