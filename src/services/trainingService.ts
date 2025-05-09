
'use server';

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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { format, parseISO } from 'date-fns';

// Convert Training data for Firestore storage
const toFirestoreTraining = (trainingData: Omit<Training, 'id'>): any => {
  const dateString = typeof trainingData.date === 'string' 
    ? trainingData.date 
    : format(trainingData.date instanceof Date ? trainingData.date : parseISO(trainingData.date), "yyyy-MM-dd");

  return {
    ...trainingData,
    date: dateString,
    // createdAt: serverTimestamp(),
    // updatedAt: serverTimestamp(),
  };
};

// Convert Firestore document to Training type
const fromFirestoreTraining = (docSnap: any): Training => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    // date: (data.date as Timestamp).toDate().toISOString().split('T')[0], // If date is Timestamp
  } as Training;
};

export const addTraining = async (trainingData: Omit<Training, 'id' | 'attendance'>): Promise<string> => {
  if (!db) throw new Error("Firestore not initialized");
  const newTrainingData = {
    ...trainingData,
    attendance: {}, // Initialize with empty attendance
  };
  const docRef = await addDoc(collection(db, 'trainings'), toFirestoreTraining(newTrainingData));
  return docRef.id;
};

export const getTrainings = async (): Promise<Training[]> => {
  if (!db) return [];
  const trainingsCol = collection(db, 'trainings');
  const q = query(trainingsCol, orderBy('date', 'desc'), orderBy('time', 'desc'));
  const trainingSnapshot = await getDocs(q);
  return trainingSnapshot.docs.map(fromFirestoreTraining);
};

export const getTrainingById = async (id: string): Promise<Training | null> => {
  if (!db) return null;
  const trainingDocRef = doc(db, 'trainings', id);
  const docSnap = await getDoc(trainingDocRef);
  return docSnap.exists() ? fromFirestoreTraining(docSnap) : null;
};

export const updateTraining = async (id: string, data: Partial<Omit<Training, 'id'>>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const trainingDocRef = doc(db, 'trainings', id);
  const updateData = {...data};
  if (data.date) {
    updateData.date = typeof data.date === 'string' 
      ? data.date 
      : format(data.date instanceof Date ? trainingData.date : parseISO(data.date as string), "yyyy-MM-dd");
  }
  await updateDoc(trainingDocRef, updateData);
};

export const deleteTraining = async (id: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const trainingDocRef = doc(db, 'trainings', id);
  await deleteDoc(trainingDocRef);
};

export const updateTrainingAttendance = async (
  trainingId: string,
  playerId: string,
  status: "present" | "absent" | "excused" | "unknown"
): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const trainingDocRef = doc(db, 'trainings', trainingId);
  const fieldPath = `attendance.${playerId}`;
  await updateDoc(trainingDocRef, {
    [fieldPath]: status,
  });
};

// Example function to reorder trainings if storing order in Firestore
// This requires an 'order' field in your Training type and Firestore documents.
export const updateTrainingsOrder = async (orderedTrainings: Pick<Training, 'id' | 'order'>[]): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const batch = writeBatch(db);
  orderedTrainings.forEach(training => {
    const trainingRef = doc(db, 'trainings', training.id);
    batch.update(trainingRef, { order: training.order });
  });
  await batch.commit();
};
