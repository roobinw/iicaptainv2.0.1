
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

const fromFirestoreTraining = (docSnap: any): Training => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    date: data.date instanceof Timestamp ? format(data.date.toDate(), "yyyy-MM-dd") : data.date,
    attendance: data.attendance || {}, 
  } as Training;
};

export const addTraining = async (teamId: string, trainingData: Omit<Training, 'id' | 'attendance'>): Promise<string> => {
  // const currentTrainings = await getTrainings(teamId); // Not needed for order anymore
  const firestorePayload = {
    ...trainingData,
    date: trainingData.date, 
    attendance: {}, 
    // order: currentTrainings.length, // Order field removed
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
  // const currentTrainingsCount = (await getDocs(query(trainingsColRef))).size; // Not needed for order

  trainingsData.forEach((training, index) => {
    const newDocRef = doc(trainingsColRef); 
    const firestorePayload = {
      ...training, 
      attendance: {},
      // order: currentTrainingsCount + index, // Order field removed
    };
    batch.set(newDocRef, firestorePayload);
  });

  await batch.commit();
};


export const getTrainings = async (teamId: string): Promise<Training[]> => {
  if (!teamId) return [];
  const trainingsColRef = getTrainingsCollectionRef(teamId);
  // Sort by date ascending (soonest first), then by time ascending
  const q = query(trainingsColRef, orderBy('date', 'asc'), orderBy('time', 'asc'));
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
    console.warn("updateTraining received non-string date, formatting to yyyy-MM-dd", data.date);
    updateData.date = format(parseISO(data.date), "yyyy-MM-dd");
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

// updateTrainingsOrder function removed as DND is removed
// export const updateTrainingsOrder = async (teamId: string, orderedTrainings: Array<{ id: string; order: number }>): Promise<void> => { ... };

