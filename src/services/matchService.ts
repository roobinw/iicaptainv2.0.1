
'use server';

import { db } from '@/lib/firebase';
import type { Match } from '@/types'; // User type no longer needed here directly
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

const getMatchesCollectionRef = (teamId: string) => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for match operations.");
  return collection(db, 'teams', teamId, 'matches');
};

const getMatchDocRef = (teamId: string, matchId: string) => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for match operations.");
  if (!matchId) throw new Error("Match ID is required.");
  return doc(db, 'teams', teamId, 'matches', matchId);
};

const toFirestoreMatch = (matchData: Omit<Match, 'id'>): any => {
  const dateString = typeof matchData.date === 'string' 
    ? matchData.date 
    : format(matchData.date instanceof Date ? matchData.date : parseISO(matchData.date), "yyyy-MM-dd");
  
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
  } as Match;
};

export const addMatch = async (teamId: string, matchData: Omit<Match, 'id' | 'attendance'>): Promise<string> => {
  const newMatchData = {
    ...matchData,
    attendance: {}, 
  };
  const matchesColRef = getMatchesCollectionRef(teamId);
  const docRef = await addDoc(matchesColRef, toFirestoreMatch(newMatchData));
  return docRef.id;
};

export const getMatches = async (teamId: string): Promise<Match[]> => {
  if (!teamId) return [];
  const matchesColRef = getMatchesCollectionRef(teamId);
  const q = query(matchesColRef, orderBy('date', 'desc'), orderBy('time', 'desc'));
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
  if (data.date) {
    updateData.date = typeof data.date === 'string' 
      ? data.date 
      : format(data.date instanceof Date ? data.date : parseISO(data.date as string), "yyyy-MM-dd");
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
  playerId: string, // This should be Firebase UID
  status: "present" | "absent" | "excused" | "unknown"
): Promise<void> => {
  const matchDocRef = getMatchDocRef(teamId, matchId);
  const fieldPath = `attendance.${playerId}`;
  await updateDoc(matchDocRef, {
    [fieldPath]: status,
  });
};

export const updateMatchesOrder = async (teamId: string, orderedMatches: Pick<Match, 'id' | 'order'>[]): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for updating matches order.");
  const batch = writeBatch(db);
  orderedMatches.forEach(match => {
    // Path needs to include teamId
    const matchRef = doc(db, 'teams', teamId, 'matches', match.id);
    batch.update(matchRef, { order: match.order });
  });
  await batch.commit();
};
