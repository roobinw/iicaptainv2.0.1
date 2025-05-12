
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
  where, // Added for filtering by isArchived
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
    isArchived: data.isArchived || false, // Default to false
  } as Match;
};

export const addMatch = async (teamId: string, matchData: Omit<Match, 'id' | 'attendance' | 'isArchived'>): Promise<string> => {
  const firestorePayload = {
    ...matchData, 
    attendance: {}, 
    isArchived: false, // Default new matches to not archived
  };
  const matchesColRef = getMatchesCollectionRef(teamId);
  const docRef = await addDoc(matchesColRef, firestorePayload);
  return docRef.id;
};

export type EventArchiveFilter = "all" | "active" | "archived";

export const getMatches = async (teamId: string, filter: EventArchiveFilter = "active"): Promise<Match[]> => {
  if (!teamId) return [];
  const matchesColRef = getMatchesCollectionRef(teamId);
  
  let q;
  const baseQueryConstraints = [orderBy('date', 'asc'), orderBy('time', 'asc')];

  if (filter === "active") {
    q = query(matchesColRef, where('isArchived', '==', false), ...baseQueryConstraints);
  } else if (filter === "archived") {
    q = query(matchesColRef, where('isArchived', '==', true), ...baseQueryConstraints);
  } else { // 'all'
    q = query(matchesColRef, ...baseQueryConstraints);
  }
  
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

  if (data.date && typeof data.date !== 'string') {
    console.warn("updateMatch received non-string date, formatting to yyyy-MM-dd", data.date);
    updateData.date = format(parseISO(data.date), "yyyy-MM-dd");
  } else if (data.date && typeof data.date === 'string') {
    try {
        updateData.date = format(parseISO(data.date), "yyyy-MM-dd");
    } catch (e) {
        console.warn(`Date string "${data.date}" in updateMatch was not in a standard ISO format. Using as is. Error: ${e}`);
        updateData.date = data.date; 
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

export const archiveMatch = async (teamId: string, matchId: string): Promise<void> => {
  const matchDocRef = getMatchDocRef(teamId, matchId);
  await updateDoc(matchDocRef, { isArchived: true });
};

export const unarchiveMatch = async (teamId: string, matchId: string): Promise<void> => {
  const matchDocRef = getMatchDocRef(teamId, matchId);
  await updateDoc(matchDocRef, { isArchived: false });
};
