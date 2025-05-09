
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

const getTrainingsCollectionRef = (teamId: string) => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for training operations.");
  return collection(db, 'teams', teamId, 'trainings');
};

const getTrainingDocRef = (teamId: string, trainingId: string) => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for training operations.");
  if (!trainingId) throw new Error("Training ID is required.");
  return doc(db, 'teams', teamId, 'trainings', trainingId);
};


const toFirestoreTraining = (trainingData: Omit<Training, 'id'>): any => {
  const dateString = typeof trainingData.date === 'string' 
    ? trainingData.date 
    : format(trainingData.date instanceof Date ? trainingData.date : parseISO(trainingData.date), "yyyy-MM-dd");

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
  } as Training;
};

export const addTraining = async (teamId: string, trainingData: Omit<Training, 'id' | 'attendance'>): Promise<string> => {
  const newTrainingData = {
    ...trainingData,
    attendance: {}, 
  };
  const trainingsColRef = getTrainingsCollectionRef(teamId);
  const docRef = await addDoc(trainingsColRef, toFirestoreTraining(newTrainingData));
  return docRef.id;
};

export const getTrainings = async (teamId: string): Promise<Training[]> => {
  if (!teamId) return [];
  const trainingsColRef = getTrainingsCollectionRef(teamId);
  const q = query(trainingsColRef, orderBy('date', 'desc'), orderBy('time', 'desc'));
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
  if (data.date) {
    updateData.date = typeof data.date === 'string' 
      ? data.date 
      : format(data.date instanceof Date ? data.date : parseISO(data.date as string), "yyyy-MM-dd");
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
  playerId: string, // Firebase UID
  status: "present" | "absent" | "excused" | "unknown"
): Promise<void> => {
  const trainingDocRef = getTrainingDocRef(teamId, trainingId);
  const fieldPath = `attendance.${playerId}`;
  await updateDoc(trainingDocRef, {
    [fieldPath]: status,
  });
};

export const updateTrainingsOrder = async (teamId: string, orderedTrainings: Pick<Training, 'id' | 'order'>[]): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for updating trainings order.");
  const batch = writeBatch(db);
  orderedTrainings.forEach(training => {
    const trainingRef = doc(db, 'teams', teamId, 'trainings', training.id);
    batch.update(trainingRef, { order: training.order });
  });
  await batch.commit();
};
