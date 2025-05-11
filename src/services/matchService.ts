
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
  type Timestamp, 
  getDoc,
  // writeBatch // Removed as updateMatchesOrder is removed
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

const fromFirestoreMatch = (docSnap: any): Match => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    attendance: data.attendance || {}, 
  } as Match;
};

export const addMatch = async (teamId: string, matchData: Omit<Match, 'id' | 'attendance'>): Promise<string> => {
  const firestorePayload = {
    ...matchData, 
    attendance: {}, 
    // order: (await getMatches(teamId)).length, // Order field removed
  };
  const matchesColRef = getMatchesCollectionRef(teamId);
  const docRef = await addDoc(matchesColRef, firestorePayload);
  return docRef.id;
};

export const getMatches = async (teamId: string): Promise<Match[]> => {
  if (!teamId) return [];
  const matchesColRef = getMatchesCollectionRef(teamId);
  // Sort by date ascending (soonest first), then by time ascending
  const q = query(matchesColRef, orderBy('date', 'asc'), orderBy('time', 'asc'));
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
  const updateData: any = { ...data };

  // Ensure date is correctly formatted if it's a Date object
  if (data.date && typeof data.date !== 'string') {
    console.warn("updateMatch received non-string date, formatting to yyyy-MM-dd", data.date);
    updateData.date = format(parseISO(data.date), "yyyy-MM-dd");
  } else if (data.date && typeof data.date === 'string') {
    // Attempt to parse and reformat to ensure consistency, 
    // but catch errors if it's already in a non-standard string format not parseable by parseISO
    try {
        updateData.date = format(parseISO(data.date), "yyyy-MM-dd");
    } catch (e) {
        console.warn(`Date string "${data.date}" in updateMatch was not in a standard ISO format. Using as is. Error: ${e}`);
        updateData.date = data.date; // Use as is if parsing fails, assuming it's already yyyy-MM-dd
    }
  }
  
  await updateDoc(matchDocRef, updateData);
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

// updateMatchesOrder function removed as DND is removed
// export const updateMatchesOrder = async (teamId: string, orderedMatches: Array<{ id: string; order: number }>): Promise<void> => { ... }

