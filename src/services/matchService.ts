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
  where, 
} from 'firebase/firestore';
import { format, parseISO, isValid } from 'date-fns';

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
    isArchived: data.isArchived || false, 
  } as Match;
};

export const addMatch = async (teamId: string, matchData: Omit<Match, 'id' | 'attendance' | 'isArchived' | 'date'> & { date: string | Date }): Promise<string> => {
  let dateString: string;
  if (typeof matchData.date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(matchData.date)) {
        const parsed = parseISO(matchData.date + "T00:00:00Z"); 
        if (isValid(parsed)) {
            dateString = matchData.date;
        } else {
            console.error("Invalid date string format (not yyyy-MM-dd or not a valid date):", matchData.date);
            throw new Error("Invalid date format. Please use YYYY-MM-DD.");
        }
    } else { 
        const parsedDate = parseISO(matchData.date);
        if (isValid(parsedDate)) {
            dateString = format(parsedDate, "yyyy-MM-dd");
        } else {
            console.error("Invalid date string format (not ISO or yyyy-MM-dd):", matchData.date);
            throw new Error("Invalid date format. Please use YYYY-MM-DD or a valid ISO string.");
        }
    }
  } else if (matchData.date instanceof Date) {
    dateString = format(matchData.date, "yyyy-MM-dd");
  } else {
    console.error("Invalid date type in addMatch:", matchData.date);
    throw new Error("Invalid date type. Date must be a string or Date object.");
  }
  
  const firestorePayload = {
    ...matchData, 
    date: dateString,
    attendance: {}, 
    isArchived: false, 
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
  } else { 
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

export const updateMatch = async (teamId: string, matchId: string, data: Partial<Omit<Match, 'id' | 'date'> & { date?: string | Date | Timestamp | null }>): Promise<void> => {
  const matchDocRef = getMatchDocRef(teamId, matchId);
  const updateData: { [key: string]: any } = {};

  const dateValue = data.date;

  if (dateValue !== undefined && dateValue !== null) {
    if (typeof dateValue === 'string') {
      try {
        let parsedDate;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          parsedDate = parseISO(dateValue + "T00:00:00Z");
        } else {
          parsedDate = parseISO(dateValue);
        }
        if (isValid(parsedDate)) {
          updateData.date = format(parsedDate, "yyyy-MM-dd");
        } else {
          console.error(`Date string "${dateValue}" in updateMatch is not a valid date format. MatchId: ${matchId}. Date will not be updated.`);
        }
      } catch (e) {
        console.error(`Error parsing date string "${dateValue}" in updateMatch. MatchId: ${matchId}. Date will not be updated. Error: ${e}`);
      }
    } else if (typeof dateValue === 'object') {
        if (dateValue instanceof Date) {
            updateData.date = format(dateValue, "yyyy-MM-dd");
        } else if ('toDate' in dateValue && typeof (dateValue as Timestamp).toDate === 'function') {
            updateData.date = format((dateValue as Timestamp).toDate(), "yyyy-MM-dd");
        } else {
            console.error(`updateMatch received an unhandled object type for date. MatchId: ${matchId}, Value:`, dateValue);
        }
    } else {
      console.error(`updateMatch received an unexpected non-object, non-string date type. MatchId: ${matchId}, Value:`, dateValue, `Type: ${typeof dateValue}`);
    }
  }
  
  for (const key in data) {
    if (key !== 'date' && Object.prototype.hasOwnProperty.call(data, key)) {
      (updateData as any)[key] = (data as any)[key];
    }
  }

  if (Object.keys(updateData).length > 0) {
    await updateDoc(matchDocRef, updateData);
  } else {
    console.warn("updateMatch called with no effective changes for match:", matchId);
  }
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

