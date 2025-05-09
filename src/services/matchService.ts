
'use server';

import { db } from '@/lib/firebase';
import type { Match, User } from '@/types';
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

// Convert Match data for Firestore storage
const toFirestoreMatch = (matchData: Omit<Match, 'id'>): any => {
  // Ensure date is a string in "yyyy-MM-dd" format
  const dateString = typeof matchData.date === 'string' 
    ? matchData.date 
    : format(matchData.date instanceof Date ? matchData.date : parseISO(matchData.date), "yyyy-MM-dd");
  
  return {
    ...matchData,
    date: dateString, 
    // Firebase Timestamps for created/updated times if needed
    // createdAt: serverTimestamp(), 
    // updatedAt: serverTimestamp(),
  };
};

// Convert Firestore document to Match type
const fromFirestoreMatch = (docSnap: any): Match => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    // If date was stored as Firebase Timestamp, convert it:
    // date: (data.date as Timestamp).toDate().toISOString().split('T')[0], 
  } as Match;
};

export const addMatch = async (matchData: Omit<Match, 'id' | 'attendance'>): Promise<string> => {
  if (!db) throw new Error("Firestore not initialized");
  const newMatchData = {
    ...matchData,
    attendance: {}, // Initialize with empty attendance
  };
  const docRef = await addDoc(collection(db, 'matches'), toFirestoreMatch(newMatchData));
  return docRef.id;
};

export const getMatches = async (): Promise<Match[]> => {
  if (!db) return [];
  const matchesCol = collection(db, 'matches');
  // Order by date, then time. Firestore might require a composite index for this.
  const q = query(matchesCol, orderBy('date', 'desc'), orderBy('time', 'desc'));
  const matchSnapshot = await getDocs(q);
  return matchSnapshot.docs.map(fromFirestoreMatch);
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  if (!db) return null;
  const matchDocRef = doc(db, 'matches', id);
  const docSnap = await getDoc(matchDocRef);
  return docSnap.exists() ? fromFirestoreMatch(docSnap) : null;
};

export const updateMatch = async (id: string, data: Partial<Omit<Match, 'id'>>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const matchDocRef = doc(db, 'matches', id);
  // Ensure date is correctly formatted if being updated
  const updateData = {...data};
  if (data.date) {
    updateData.date = typeof data.date === 'string' 
      ? data.date 
      : format(data.date instanceof Date ? data.date : parseISO(data.date as string), "yyyy-MM-dd");
  }
  await updateDoc(matchDocRef, updateData);
};

export const deleteMatch = async (id: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const matchDocRef = doc(db, 'matches', id);
  await deleteDoc(matchDocRef);
};

export const updateMatchAttendance = async (
  matchId: string,
  playerId: string,
  status: "present" | "absent" | "excused" | "unknown"
): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const matchDocRef = doc(db, 'matches', matchId);
  // Firestore requires dot notation for updating nested map fields
  const fieldPath = `attendance.${playerId}`;
  await updateDoc(matchDocRef, {
    [fieldPath]: status,
  });
};

// Example function to reorder matches if storing order in Firestore
// This requires an 'order' field in your Match type and Firestore documents.
export const updateMatchesOrder = async (orderedMatches: Pick<Match, 'id' | 'order'>[]): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const batch = writeBatch(db);
  orderedMatches.forEach(match => {
    const matchRef = doc(db, 'matches', match.id);
    batch.update(matchRef, { order: match.order });
  });
  await batch.commit();
};
