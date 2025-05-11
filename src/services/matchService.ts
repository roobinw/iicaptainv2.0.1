
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

// toFirestoreMatch is not currently used, but kept for potential future use.
// It assumes matchData.date is already "yyyy-MM-dd" string.
const toFirestoreMatch = (matchData: Omit<Match, 'id'>): any => {
  const dateString = matchData.date; 
  
  return {
    ...matchData,
    date: dateString, 
  };
};

const fromFirestoreMatch = (docSnap: any): Match => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    attendance: data.attendance || {}, 
  } as Match;
};

export const addMatch = async (teamId: string, matchData: Omit<Match, 'id' | 'attendance' | 'order'>): Promise<string> => {
  // matchData.date comes from AddMatchForm, where it's already formatted to "yyyy-MM-dd" string
  const firestorePayload = {
    ...matchData, 
    attendance: {}, 
    order: (await getMatches(teamId)).length, 
  };
  const matchesColRef = getMatchesCollectionRef(teamId);
  const docRef = await addDoc(matchesColRef, firestorePayload);
  return docRef.id;
};

export const getMatches = async (teamId: string): Promise<Match[]> => {
  if (!teamId) return [];
  const matchesColRef = getMatchesCollectionRef(teamId);
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
  // The 'data' argument, when coming from handleUpdateMatch in matches/page.tsx,
  // already has its 'date' field formatted as a "yyyy-MM-dd" string.
  // The type Partial<Omit<Match, 'id'>> means data.date is string | undefined.
  // Therefore, no further date processing is needed here.
  await updateDoc(matchDocRef, data);
};

export const deleteMatch = async (teamId: string, matchId: string): Promise<void> => {
  const matchDocRef = getMatchDocRef(teamId, matchId);
  await deleteDoc(matchDocRef);
};

export const updateMatchAttendance = async (
  teamId: string,
  matchId: string,
  playerId: string, 
  status: "present" | "absent" | "excused" | "unknown"
): Promise<void> => {
  const matchDocRef = getMatchDocRef(teamId, matchId);
  const fieldPath = `attendance.${playerId}`; 
  await updateDoc(matchDocRef, {
    [fieldPath]: status,
  });
};

export const updateMatchesOrder = async (teamId: string, orderedMatches: Array<{ id: string; order: number }>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for updating matches order.");
  const batch = writeBatch(db);
  
  orderedMatches.forEach(match => {
    const matchRef = getMatchDocRef(teamId, match.id); 
    batch.update(matchRef, { order: match.order });
  });
  await batch.commit();
};
