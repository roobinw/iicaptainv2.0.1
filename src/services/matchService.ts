
// 'use server'; // Removed to run client-side

import { db } from '@/lib/firebase';
import type { Match } from '@/types';
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

const getMatchesCollectionRef = (teamId: string) => {
  if (!db) {
    console.error("Firestore not initialized in getMatchesCollectionRef");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("Team ID is required for match operations.");
    throw new Error("Team ID is required for match operations.");
  }
  return collection(db, 'teams', teamId, 'matches');
};

const getMatchDocRef = (teamId: string, matchId: string) => {
   if (!db) {
    console.error("Firestore not initialized in getMatchDocRef");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("Team ID is required for match operations.");
    throw new Error("Team ID is required for match operations.");
  }
  if (!matchId) {
    console.error("Match ID is required.");
    throw new Error("Match ID is required.");
  }
  return doc(db, 'teams', teamId, 'matches', matchId);
};

// Helper to convert Firestore Timestamp to ISO string or return undefined
const processTimestamp = (timestamp: Timestamp | undefined): string | undefined => {
  return timestamp ? timestamp.toDate().toISOString() : undefined;
};

const toFirestoreMatch = (matchData: Omit<Match, 'id'>): any => {
  // Ensure date is string in "yyyy-MM-dd"
  const dateString = typeof matchData.date === 'string' 
    ? matchData.date 
    : format(matchData.date instanceof Date ? matchData.date : parseISO(matchData.date as string), "yyyy-MM-dd");
  
  return {
    ...matchData,
    date: dateString, 
    // any other transformations if necessary, e.g. serverTimestamp for a created/updated field
  };
};

const fromFirestoreMatch = (docSnap: any): Match => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    // Ensure attendance is always an object, even if undefined in Firestore
    attendance: data.attendance || {}, 
  } as Match;
};

export const addMatch = async (teamId: string, matchData: Omit<Match, 'id' | 'attendance'>): Promise<string> => {
  const newMatchData = {
    ...matchData,
    attendance: {}, // Initialize attendance as empty object
    order: (await getMatches(teamId)).length, // Set initial order
  };
  const matchesColRef = getMatchesCollectionRef(teamId);
  const docRef = await addDoc(matchesColRef, toFirestoreMatch(newMatchData));
  return docRef.id;
};

export const getMatches = async (teamId: string): Promise<Match[]> => {
  if (!teamId) return [];
  const matchesColRef = getMatchesCollectionRef(teamId);
  // Default sort by order, then by date and time if order is not set or equal
  const q = query(matchesColRef, orderBy('order', 'asc'), orderBy('date', 'desc'), orderBy('time', 'desc'));
  const matchSnapshot = await getDocs(q);
  return matchSnapshot.docs.map(fromFirestoreMatch);
};

export const getMatchById = async (teamId: string, matchId: string): Promise<Match | null> => {
  if (!teamId || !matchId) return null;
  const matchDocRef = getMatchDocRef(teamId, matchId);
  const docSnap = await getDoc(matchDocRef);
  return docSnap.exists() ? fromFirestoreMatch(docSnap) : null;
};

export const updateMatch = async (teamId: string, matchId: string, data: Partial<Omit<Match, 'id'>>): Promise<void> => {
  const matchDocRef = getMatchDocRef(teamId, matchId);
  
  const updateData = {...data};
  // Ensure date is correctly formatted if present
  if (data.date) {
    updateData.date = typeof data.date === 'string' 
      ? data.date 
      : format(data.date instanceof Date ? data.date : parseISO(data.date as string), "yyyy-MM-dd");
  }
  // Remove id from data if it exists to prevent trying to update it
  if ('id' in updateData) delete (updateData as any).id;

  await updateDoc(matchDocRef, updateData);
};

export const deleteMatch = async (teamId: string, matchId: string): Promise<void> => {
  const matchDocRef = getMatchDocRef(teamId, matchId);
  await deleteDoc(matchDocRef);
};

export const updateMatchAttendance = async (
  teamId: string,
  matchId: string,
  playerId: string, // This should be Firebase UID of the player
  status: "present" | "absent" | "excused" | "unknown"
): Promise<void> => {
  const matchDocRef = getMatchDocRef(teamId, matchId);
  const fieldPath = `attendance.${playerId}`; // Use dot notation for map fields
  await updateDoc(matchDocRef, {
    [fieldPath]: status,
  });
};

export const updateMatchesOrder = async (teamId: string, orderedMatches: Array<{ id: string; order: number }>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for updating matches order.");
  const batch = writeBatch(db);
  
  orderedMatches.forEach(match => {
    const matchRef = getMatchDocRef(teamId, match.id); // Use helper for consistency
    batch.update(matchRef, { order: match.order });
  });
  await batch.commit();
};
