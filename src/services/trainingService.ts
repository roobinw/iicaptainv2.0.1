
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
  Timestamp, // Changed from 'type Timestamp'
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import type { SingleTrainingFormInput } from '@/components/bulk-add-training-form';


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
const processFirestoreTimestamp = (timestamp: Timestamp | undefined): string | undefined => {
  return timestamp ? timestamp.toDate().toISOString() : undefined;
};

const fromFirestoreTraining = (docSnap: any): Training => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    // Ensure date is a string; if it's a Timestamp, convert it.
    date: data.date instanceof Timestamp ? format(data.date.toDate(), "yyyy-MM-dd") : data.date,
    attendance: data.attendance || {}, 
  } as Training;
};

export const addTraining = async (teamId: string, trainingData: Omit<Training, 'id' | 'attendance' | 'order'>): Promise<string> => {
  const currentTrainings = await getTrainings(teamId);
  const firestorePayload = {
    ...trainingData,
    date: trainingData.date, // Already "yyyy-MM-dd" string
    attendance: {}, 
    order: currentTrainings.length, 
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
  const currentTrainingsCount = (await getDocs(query(trainingsColRef))).size;

  trainingsData.forEach((training, index) => {
    const newDocRef = doc(trainingsColRef); // Auto-generate ID
    const firestorePayload = {
      ...training, // date is already "yyyy-MM-dd" string from BulkAddTrainingForm
      attendance: {},
      order: currentTrainingsCount + index,
    };
    batch.set(newDocRef, firestorePayload);
  });

  await batch.commit();
};


export const getTrainings = async (teamId: string): Promise<Training[]> => {
  if (!teamId) return [];
  const trainingsColRef = getTrainingsCollectionRef(teamId);
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
  // `data` is expected to have `date` as a "yyyy-MM-dd" string if provided,
  // as it's formatted by the AddTrainingForm before this function is called.
  // The incorrect `instanceof Date` check has been removed.
  await updateDoc(trainingDocRef, data);
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

